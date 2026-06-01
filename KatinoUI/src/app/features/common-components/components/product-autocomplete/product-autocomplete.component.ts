import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
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
import { Product } from 'src/app/core/models/product';
import { ProductService } from 'src/app/features/admin-features/services/product.service';

@Component({
  selector: 'app-product-autocomplete',
  templateUrl: './product-autocomplete.component.html',
  styleUrls: ['./product-autocomplete.component.scss'],
})
export class ProductAutocompleteComponent implements OnInit, OnDestroy {
  @Input() label = '';

  @Output() productSelected = new EventEmitter<Product>();

  public searchCtrl = new FormControl('');
  public products: Product[] = [];
  public isSearching = false;

  private _destroy$ = new Subject<void>();

  constructor(private _productService: ProductService) {}

  public ngOnInit(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((v) => typeof v === 'string' && v.length >= 2),
        switchMap((value: string) => {
          this.isSearching = true;
          return this._productService.getProducts(value).pipe(
            catchError(() => of({ products: [], resultsAmount: 0 })),
            finalize(() => (this.isSearching = false)),
          );
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((resp) => {
        this.products = resp.products;
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  public displayFn = (p: Product): string => (p ? p.name : '');

  public onFocus(): void {
    if (this.products.length === 0 && !this.isSearching) {
      this.isSearching = true;
      this._productService
        .getProducts()
        .pipe(
          catchError(() => of({ products: [], resultsAmount: 0 })),
          finalize(() => (this.isSearching = false)),
          takeUntil(this._destroy$),
        )
        .subscribe((resp) => {
          this.products = resp.products;
        });
    }
  }

  public onOptionSelected(p: Product): void {
    this.productSelected.emit(p);
    this.searchCtrl.setValue('', { emitEvent: false });
    this.products = [];
    this.searchInput.nativeElement.blur();
  }
}
