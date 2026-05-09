import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { ProductStatus } from 'src/app/core/enums/product-status';
import { ProductVariant } from 'src/app/core/models/product-variant';
import { ProductVariantService } from 'src/app/features/admin-features/services/product-variant.service';

@Component({
  selector: 'app-product-variant-autocomplete',
  templateUrl: './product-variant-autocomplete.component.html',
  styleUrls: ['./product-variant-autocomplete.component.scss'],
})
export class ProductVariantAutocompleteComponent implements OnInit, OnDestroy {
  @Input() label = '';
  @Input() showStatus = false;

  @Output() productSelected = new EventEmitter<ProductVariant>();

  public searchCtrl = new FormControl('');
  public productVariants: ProductVariant[] = [];
  public isSearching = false;

  private readonly PAGE_SIZE = 1000;
  private _destroy$ = new Subject<void>();

  constructor(private _pvService: ProductVariantService) {}

  public ngOnInit(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((v) => typeof v === 'string' && v.length >= 2),
        switchMap((value: string) => {
          this.isSearching = true;
          return this._pvService
            .getProductVariants({
              productName: value,
              page: 1,
              pageSize: this.PAGE_SIZE,
            })
            .pipe(
              catchError(() => of({ productVariants: [], resultsAmount: 0 })),
              finalize(() => (this.isSearching = false)),
            );
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((resp) => {
        this.productVariants = resp.productVariants;
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public displayFn = (pv: ProductVariant): string =>
    pv ? `${pv.product?.name} • ${pv.color?.name} • ${pv.size?.name}` : '';

  public onOptionSelected(pv: ProductVariant): void {
    this.productSelected.emit(pv);
    this.searchCtrl.setValue('', { emitEvent: false });
    this.productVariants = [];
  }

  public getStatusClass(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.inStock:
        return 'inStock';
      case ProductStatus.onOrder:
        return 'onOrder';
      case ProductStatus.discontinued:
        return 'discontinued';
      default:
        return '';
    }
  }
}
