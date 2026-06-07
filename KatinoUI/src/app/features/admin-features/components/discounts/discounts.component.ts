import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, EMPTY } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { DiscountResponse } from 'src/app/core/models/discount/discount-response';
import { Roles } from 'src/app/core/models/roles';
import { CurrentUserService } from 'src/app/core/permission/services';
import { DiscountService } from 'src/app/features/admin-features/services/discount.service';
import { DialogService } from 'src/app/features/common-services/dialog.service';

@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.component.html',
  styleUrls: ['./discounts.component.scss'],
})
export class DiscountsComponent implements OnInit, OnDestroy {
  public discounts: DiscountResponse[] = [];
  public isLoading = false;

  private _destroy$ = new Subject<void>();

  constructor(
    private _discountService: DiscountService,
    private _dialogService: DialogService,
    private _currentUserService: CurrentUserService,
  ) {}

  public get canManage(): boolean {
    const role = this._currentUserService.userInfo?.role || '';
    return role === Roles.Admin || role === Roles.Owner;
  }

  public ngOnInit(): void {
    this.loadDiscounts();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onAddDiscount(): void {
    const dialogRef = this._dialogService.openAddEditDiscountDialog({
      discount: null,
      isAdding: true,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this._destroy$))
      .subscribe((discount?: DiscountResponse | null) => {
        if (discount) {
          this.discounts = [discount, ...this.discounts];
        }
      });
  }

  public onDiscountDeleted(discountId: string): void {
    this.discounts = this.discounts.filter((d) => d.id !== discountId);
  }

  public onDiscountUpdated(updated: DiscountResponse): void {
    const idx = this.discounts.findIndex((d) => d.id === updated.id);
    if (idx !== -1) {
      this.discounts = [
        ...this.discounts.slice(0, idx),
        updated,
        ...this.discounts.slice(idx + 1),
      ];
    }
  }

  public trackById(_: number, item: DiscountResponse): string {
    return item.id;
  }

  private loadDiscounts(): void {
    this.isLoading = true;
    this._discountService
      .getDiscounts()
      .pipe(
        catchError(() => EMPTY),
        finalize(() => (this.isLoading = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((discounts) => {
        this.discounts = discounts;
      });
  }
}
