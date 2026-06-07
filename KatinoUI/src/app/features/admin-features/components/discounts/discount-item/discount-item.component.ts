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
import { DiscountResponse } from 'src/app/core/models/discount/discount-response';
import { DiscountType } from 'src/app/core/enums/discount-type';
import { DiscountValueType } from 'src/app/core/enums/discount-value-type';
import { DiscountService } from 'src/app/features/admin-features/services/discount.service';
import { DialogService } from 'src/app/features/common-services/dialog.service';
import { UIDialogService } from 'src/app/layout/dialogs/services/ui-dialog.service';

@Component({
  selector: 'app-discount-item',
  templateUrl: './discount-item.component.html',
  styleUrls: ['./discount-item.component.scss'],
})
export class DiscountItemComponent implements OnDestroy {
  @Input() discount!: DiscountResponse;
  @Input() canManage = false;

  @Output() discountDeleted = new EventEmitter<string>();
  @Output() discountUpdated = new EventEmitter<DiscountResponse>();

  public isDeleting = false;
  public isTogglingActive = false;

  public readonly discountType = DiscountType;
  public readonly discountValueType = DiscountValueType;

  private _destroy$ = new Subject<void>();

  constructor(
    private _discountService: DiscountService,
    private _dialogService: DialogService,
    private _uiDialogService: UIDialogService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
  ) {}

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public get typeKey(): string {
    switch (this.discount.type) {
      case DiscountType.productSpecific:
        return 'discounts.type.productSpecific';
      case DiscountType.collection:
        return 'discounts.type.collection';
      case DiscountType.global:
        return 'discounts.type.global';
      case DiscountType.bundle:
        return 'discounts.type.bundle';
      default:
        return '';
    }
  }

  public get valueText(): string {
    return this.discount.valueType === DiscountValueType.percentage
      ? `${this.discount.value}%`
      : `${this.discount.value} ₴`;
  }

  public onEdit(): void {
    const dialogRef = this._dialogService.openAddEditDiscountDialog({
      discount: this.discount,
      isAdding: false,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this._destroy$))
      .subscribe((updated?: DiscountResponse | null) => {
        if (updated) {
          this.discount = updated;
          this.discountUpdated.emit(updated);
        }
      });
  }

  public onToggleActive(): void {
    const nextState = !this.discount.isActive;
    this.isTogglingActive = true;
    this._discountService
      .setDiscountActive({ id: this.discount.id, isActive: nextState })
      .pipe(
        catchError(() => {
          this._toastr.error(this._t('discounts.toastr.discountStatusFailed'));
          return EMPTY;
        }),
        finalize(() => (this.isTogglingActive = false)),
        takeUntil(this._destroy$),
      )
      .subscribe(() => {
        this.discount = { ...this.discount, isActive: nextState };
        this.discountUpdated.emit(this.discount);
        this._toastr.success(
          nextState
            ? this._t('discounts.toastr.discountActivated')
            : this._t('discounts.toastr.discountDeactivated'),
        );
      });
  }

  public onDelete(): void {
    const dialogRef = this._uiDialogService.openConfirmationDialog({
      titleKey: 'discounts.dialog.deleteTitle',
      contentKey: 'discounts.dialog.deleteContent',
      contentParams: { name: this.discount.name },
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
        this._discountService
          .deleteDiscount(this.discount.id)
          .pipe(
            catchError(() => {
              this._toastr.error(
                this._t('discounts.toastr.discountDeleteFailed'),
              );
              return EMPTY;
            }),
            finalize(() => (this.isDeleting = false)),
            takeUntil(this._destroy$),
          )
          .subscribe(() => {
            this.discountDeleted.emit(this.discount.id);
            this._toastr.success(this._t('discounts.toastr.discountDeleted'));
          });
      });
  }

  private _t(key: string): string {
    return this._translate.instant(key);
  }
}
