import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { catchError, take } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { Order } from 'src/app/core/models/order/order';
import { OrderItem } from 'src/app/core/models/order/order-item';
import { OrderItemStatus } from 'src/app/core/enums/order-item-status';
import { OrderStatus } from 'src/app/core/enums/order-status';
import { DeliveryType } from 'src/app/core/enums/delivery-type';
import { PayerType } from 'src/app/core/enums/payer-type';
import { PaymentMethod } from 'src/app/core/enums/payment-method';
import { SaleType } from 'src/app/core/enums/sale-type';
import { OrderInternetDocStatus } from 'src/app/core/enums/order-internet-doc-status';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';
import { StyleClassHelper } from 'src/app/layout/helpers/style-class-helper';
import { TranslateService } from '@ngx-translate/core';
import { OrderTagType } from 'src/app/core/enums/order-tag-type';
import { ProductVariantQuantityChangeReason } from 'src/app/core/enums/product-variant-quantity-change-reason';
import { OrderTag } from 'src/app/core/models/order/order-tag';
import { ProductVariantRedistributionHistory } from 'src/app/core/models/order/product-variant-redistribution-history';
import { OrderTagService } from '../../services/order-tag.service';
import { OrderService } from 'src/app/features/common-services/order.service';
import { DialogService } from 'src/app/features/common-services/dialog.service';
import { TtnState } from 'src/app/core/enums/ttn-state';
import { TtnStateHelper } from 'src/app/core/helpers/ttn-state.helper';
import { TtnActionResult } from 'src/app/core/models/order/ttn-action-result';
import { CurrentUserService } from 'src/app/core/permission/services';
import { Roles } from 'src/app/core/models/roles';
import { UIDialogService } from 'src/app/layout/dialogs/services/ui-dialog.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ReceiptState } from 'src/app/core/enums/receipt-state';
import { ReceiptStateHelper } from 'src/app/core/helpers/receipt-state.helper';
import { ReceiptReturnInfo } from 'src/app/core/models/order/receipt/receipt-return-info';

export interface OrderItemRedistributionInfo {
  history: ProductVariantRedistributionHistory;
  isCurrentOrderSource: boolean;
  otherOrderId?: string;
  otherOrderTtn?: string;
  wentToStock: boolean;
}

@Component({
  selector: 'app-order-details-dialog',
  templateUrl: './order-details-dialog.component.html',
  styleUrls: ['./order-details-dialog.component.scss'],
})
export class OrderDetailsDialogComponent implements OnInit {
  public readonly DeliveryType = DeliveryType;
  public readonly OrderItemStatus = OrderItemStatus;
  public readonly OrderTagType = OrderTagType;

  public showDetailsClicked: boolean = false;
  public redistributionHistory: ProductVariantRedistributionHistory[] = [];
  public ttnBusy = false;
  public receiptBusy = false;
  // The dialog opens with the order the caller had (e.g. from an older list load) and greys it out until the fresh one arrives
  public isRefreshing = true;
  // Bumped after every receipt action so the receipts list reloads
  public receiptsRefreshKey = 0;
  public receiptsCount = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public order: Order,
    private _ref: MatDialogRef<OrderDetailsDialogComponent>,
    private _customTranslate: CustomTranslateService,
    private _t: TranslateService,
    private _orderTagService: OrderTagService,
    private _toastr: ToastrService,
    private _orderService: OrderService,
    private _dialogService: DialogService,
    private _userService: CurrentUserService,
    private _uiDialogService: UIDialogService,
  ) {}

  public get ttnState(): TtnState {
    return TtnStateHelper.getState(this.order);
  }

  public get ttnBadgeTextKey(): string | null {
    return TtnStateHelper.getBadgeTextKey(this.ttnState);
  }

  public get ttnBadgeClass(): string {
    return TtnStateHelper.getBadgeClass(this.ttnState);
  }

  public get canRefreshTtn(): boolean {
    return TtnStateHelper.isInProgress(this.ttnState);
  }

  public get canRetryTtn(): boolean {
    return (
      this.canManageTtn &&
      (this.ttnState === TtnState.failed || this.ttnState === TtnState.unknown)
    );
  }

  public get canCreateTtn(): boolean {
    return this.canManageTtn && this.ttnState === TtnState.awaitingPayment;
  }

  public get hasReceipt(): boolean {
    return ReceiptStateHelper.hasReceipt(this.order.receiptState);
  }

  public get receiptLabelKey(): string {
    return ReceiptStateHelper.getLabelKey(this.order.receiptState!);
  }

  public get receiptBadgeClass(): string {
    return ReceiptStateHelper.getBadgeClass(this.order.receiptState!);
  }

  public get isReceiptFailed(): boolean {
    return this.order.receiptState === ReceiptState.failed;
  }

  public get canRetryReceipt(): boolean {
    return (
      this.canManageTtn && ReceiptStateHelper.canRetry(this.order.receiptState)
    );
  }

  public get canReturnReceipt(): boolean {
    return (
      this.canManageTtn &&
      ReceiptStateHelper.isAwaitingReturn(this.order.receiptState)
    );
  }

  private get canManageTtn(): boolean {
    const role = this._userService.userInfo.role;
    return (
      role === Roles.Admin ||
      role === Roles.DirectManager ||
      role === Roles.Owner
    );
  }

  public ngOnInit(): void {
    this.reloadOrder();

    this._orderService
      .getRedistributionHistory(this.order.id)
      .pipe(
        catchError(() => of([] as ProductVariantRedistributionHistory[])),
        take(1),
      )
      .subscribe((history) => {
        this.redistributionHistory = history ?? [];
      });
  }

  public onRefreshTtn(): void {
    this.ttnBusy = true;
    this.reloadOrder();
  }

  public onRetryTtn(): void {
    this.runTtnAction(this._orderService.retryTtn(this.order.id));
  }

  public onCreateTtn(): void {
    this._uiDialogService
      .openConfirmationDialog({
        titleKey: 'orders.ttn.create',
        contentKey: 'orders.ttn.createConfirm',
        confirmButtonTextKey: 'orders.ttn.create',
        cancelButtonTextKey: 'common.cancel',
        type: 'warning',
      })
      .afterClosed()
      .subscribe((confirmed: string) => {
        if (confirmed === 'true') {
          this.runTtnAction(this._orderService.createTtn(this.order.id));
        }
      });
  }

  public onRetryReceipt(): void {
    if (this.receiptBusy) return;

    this.receiptBusy = true;
    this._orderService
      .retryReceipt(this.order.id)
      .pipe(take(1))
      .subscribe({
        next: () => this.reloadAfterReceiptAction(),
        error: (err: HttpErrorResponse) => {
          const code: string | undefined = err?.error?.error;
          const key =
            code === 'receiptTaskNotFound' || code === 'notRetryable'
              ? `orders.receipt.errors.${code}`
              : 'orders.receipt.errors.retryFailed';
          if (err?.status === 404 || err?.status === 409) {
            this._toastr.warning(this._t.instant(key));
          } else {
            this._toastr.error(this._t.instant(key));
          }
          this.reloadAfterReceiptAction();
        },
      });
  }

  public onReturnReceipt(): void {
    if (this.receiptBusy) return;

    this.receiptBusy = true;
    this._orderService
      .getReceiptReturnInfo(this.order.id)
      .pipe(take(1))
      .subscribe({
        next: (info: ReceiptReturnInfo) => {
          this.receiptBusy = false;
          this._dialogService
            .openReceiptReturnDialog({ orderId: this.order.id, info })
            .afterClosed()
            .subscribe((changed) => {
              if (changed) {
                this.receiptBusy = true;
                this.reloadAfterReceiptAction();
              }
            });
        },
        error: (err: HttpErrorResponse) => {
          // 404: the order no longer awaits a return
          this._toastr.warning(
            this._t.instant(
              err?.status === 404
                ? 'orders.receipt.errors.notAwaitingReturn'
                : 'orders.receipt.errors.returnInfoFailed',
            ),
          );
          this.reloadAfterReceiptAction();
        },
      });
  }

  public close(): void {
    this._ref.close();
  }

  public getItemStatusTextKey(status: OrderItemStatus): string {
    return this._customTranslate.getItemStatusTextKey(status);
  }

  public getItemBadgeClass(status: OrderItemStatus): string {
    return StyleClassHelper.getItemBadgeClass(status);
  }

  public getOrderStatusTextKey(s: OrderStatus): string {
    return this._customTranslate.getOrderStatusTextKey(s);
  }

  public getOrderStatusBadgeClass(s: OrderStatus): string {
    return StyleClassHelper.getOrderStatusBadgeClass(s);
  }

  public getSaleTypeBadgeClass(saleType: SaleType): string {
    return StyleClassHelper.getSaleTypeBadgeClass(saleType);
  }

  public copy(text?: string): void {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
  }

  public trackById(_: number, x: { id: string }) {
    return x.id;
  }

  public getPayerTypeTextKey(v: PayerType): string {
    return this._customTranslate.getPayerTypeTextKey(v);
  }

  public getPaymentMethodTextKey(v: PaymentMethod): string {
    return this._customTranslate.getPaymentMethodTextKey(v);
  }

  public getSaleTypeTextKey(v: SaleType): string {
    return this._customTranslate.getSaleTypeTextKey(v);
  }

  public getNpStatusTextKey(v: OrderInternetDocStatus): string {
    return this._customTranslate.getNpStatusTextKey(v);
  }

  public getOrderTagTextKey(type: OrderTagType): string {
    return this._customTranslate.getOrderTagTextKey(type);
  }

  public onDetachTag(tag: OrderTag): void {
    this.order.tags = this.order.tags.filter((t) => t.id !== tag.id);
    this._orderTagService
      .detachOrderTag(this.order.id, tag.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this._toastr.success(
            this._t.instant('orders.toastr.tagDetached'),
          );
        },
        error: () => {
          this.order.tags = [...this.order.tags, tag];
          this._toastr.error(
            this._t.instant('orders.toastr.tagDetachFailed'),
          );
        },
      });
  }

  public getUpdateDetailsText(updateDetails: string): string {
    return this.showDetailsClicked
      ? updateDetails
        ? updateDetails
        : '-'
      : this._t.instant('orders.details.showUpdateDetails');
  }

  public getRedistributionInfoForItem(
    it: OrderItem,
  ): OrderItemRedistributionInfo[] {
    return this.redistributionHistory
      .filter((h) => this.matchesOrderItem(h, it))
      .map((h) => this.toRedistributionInfo(h));
  }

  public getRedistributionReasonTextKey(
    reason: ProductVariantQuantityChangeReason,
  ): string {
    return this._customTranslate.getRedistributionReasonTextKey(reason);
  }

  public onOpenOtherOrder(orderId: string): void {
    this._orderService
      .getOrderById(orderId)
      .pipe(
        catchError(() => of(null)),
        take(1),
      )
      .subscribe((otherOrder) => {
        if (!otherOrder) {
          this._toastr.error(
            this._t.instant('orders.toastr.redistributionOrderNotFound'),
          );
          return;
        }
        this._dialogService.openOrderDetailsDialog(otherOrder);
      });
  }

  public trackByRedistributionId(
    _: number,
    info: OrderItemRedistributionInfo,
  ): string {
    return info.history.id;
  }

  private runTtnAction(action$: Observable<TtnActionResult>): void {
    this.ttnBusy = true;
    action$.pipe(take(1)).subscribe({
      next: () => this.reloadOrder(),
      error: (err: HttpErrorResponse) => {
        if (err?.status === 409) {
          this._toastr.warning(this._t.instant('orders.ttn.stateChanged'));
          this.reloadOrder();
          return;
        }
        this.ttnBusy = false;
        this._toastr.error(
          this._t.instant(
            err?.status === 404
              ? 'orders.toastr.redistributionOrderNotFound'
              : 'orders.ttn.actionFailed',
          ),
        );
      },
    });
  }

  private reloadAfterReceiptAction(): void {
    this.receiptsRefreshKey++;
    this.reloadOrder();
  }

  private reloadOrder(): void {
    this._orderService
      .getOrderById(this.order.id)
      .pipe(
        catchError(() => of(null)),
        take(1),
      )
      .subscribe((fresh) => {
        this.ttnBusy = false;
        this.receiptBusy = false;
        this.isRefreshing = false;
        if (fresh) {
          Object.assign(this.order, fresh);
        }
      });
  }

  private matchesOrderItem(
    h: ProductVariantRedistributionHistory,
    it: OrderItem,
  ): boolean {
    if (h.targetOrderId === this.order.id) {
      return h.targetOrderItemId === it.id;
    }
    if (h.sourceOrderId === this.order.id) {
      return h.sourceOrderItemId
        ? h.sourceOrderItemId === it.id
        : h.productVariantId === it.productVariantId;
    }
    return false;
  }

  private toRedistributionInfo(
    h: ProductVariantRedistributionHistory,
  ): OrderItemRedistributionInfo {
    const isCurrentOrderSource = h.sourceOrderId === this.order.id;
    const otherOrderId = isCurrentOrderSource
      ? h.targetOrderId
      : h.sourceOrderId;
    const otherOrderTtn = isCurrentOrderSource
      ? h.targetOrderTtn
      : h.sourceOrderTtn;

    return {
      history: h,
      isCurrentOrderSource,
      otherOrderId,
      otherOrderTtn,
      wentToStock: isCurrentOrderSource && !otherOrderId && !otherOrderTtn,
    };
  }
}
