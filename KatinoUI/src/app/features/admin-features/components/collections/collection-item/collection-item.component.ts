import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Subject, EMPTY } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { Collection } from 'src/app/core/models/collection/collections';
import { CollectionProduct } from 'src/app/core/models/collection/collection-product';
import { Product } from 'src/app/core/models/product';
import { CollectionService } from 'src/app/features/admin-features/services/collection.service';
import { UIDialogService } from 'src/app/layout/dialogs/services/ui-dialog.service';

@Component({
  selector: 'app-collection-item',
  templateUrl: './collection-item.component.html',
  styleUrls: ['./collection-item.component.scss'],
})
export class CollectionItemComponent implements OnDestroy {
  @Input() set collection(val: Collection) {
    this._collection = val;
    this.pendingProducts = [...val.products];
    this.hasChanges = false;
  }
  get collection(): Collection {
    return this._collection;
  }

  @Output() collectionDeleted = new EventEmitter<string>();
  @Output() collectionUpdated = new EventEmitter<Collection>();

  public pendingProducts: CollectionProduct[] = [];
  public hasChanges = false;
  public isSaving = false;
  public isDeleting = false;

  private _collection!: Collection;
  private _destroy$ = new Subject<void>();

  constructor(
    private _collectionService: CollectionService,
    private _dialogService: UIDialogService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
  ) {}

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onProductSelected(product: Product): void {
    if (!this.pendingProducts.find((p) => p.id === product.id)) {
      this.pendingProducts = [
        ...this.pendingProducts,
        { id: product.id, name: product.name },
      ];
      this.hasChanges = true;
    }
  }

  public removeProduct(productId: string): void {
    this.pendingProducts = this.pendingProducts.filter(
      (p) => p.id !== productId,
    );
    this.hasChanges = true;
  }

  public onSave(): void {
    this.isSaving = true;
    this._collectionService
      .updateCollection({
        collectionId: this._collection.id,
        productIds: this.pendingProducts.map((p) => p.id),
      })
      .pipe(
        catchError(() => {
          this._toastr.error(
            this._t('collections.toastr.collectionUpdateFailed'),
          );
          return EMPTY;
        }),
        finalize(() => (this.isSaving = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((updated) => {
        this.hasChanges = false;
        this._collection = updated;
        this.pendingProducts = [...updated.products];
        this.collectionUpdated.emit(updated);
        this._toastr.success(this._t('collections.toastr.collectionUpdated'));
      });
  }

  public onCancel(): void {
    this.pendingProducts = [...this._collection.products];
    this.hasChanges = false;
  }

  public onDelete(): void {
    const dialogRef = this._dialogService.openConfirmationDialog({
      titleKey: 'collections.dialog.deleteTitle',
      contentKey: 'collections.dialog.deleteContent',
      contentParams: { name: this._collection.name },
      confirmButtonTextKey: 'common.delete',
      cancelButtonTextKey: 'common.cancel',
      type: 'danger',
      icon: 'delete',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this._destroy$))
      .subscribe((confirmed: string) => {
        if (confirmed !== 'true') {
          return;
        }
        this.isDeleting = true;
        this._collectionService
          .deleteCollection(this._collection.id)
          .pipe(
            catchError(() => {
              this._toastr.error(
                this._t('collections.toastr.collectionDeleteFailed'),
              );
              return EMPTY;
            }),
            finalize(() => (this.isDeleting = false)),
            takeUntil(this._destroy$),
          )
          .subscribe(() => {
            this.collectionDeleted.emit(this._collection.id);
            this._toastr.success(
              this._t('collections.toastr.collectionDeleted'),
            );
          });
      });
  }

  private _t(key: string): string {
    return this._translate.instant(key);
  }
}
