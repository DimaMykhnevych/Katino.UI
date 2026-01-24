import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Order } from 'src/app/core/models/order/order';
import { OrderItemStatus } from 'src/app/core/enums/order-item-status';
import { OrderStatus } from 'src/app/core/enums/order-status';
import { DeliveryType } from 'src/app/core/enums/delivery-type';
import { PayerType } from 'src/app/core/enums/payer-type';
import { PaymentMethod } from 'src/app/core/enums/payment-method';
import { SaleType } from 'src/app/core/enums/sale-type';
import { OrderInternetDocStatus } from 'src/app/core/enums/order-internet-doc-status';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';
import { StyleClassHelper } from 'src/app/layout/helpers/style-class-helper';

@Component({
  selector: 'app-order-details-dialog',
  templateUrl: './order-details-dialog.component.html',
  styleUrls: ['./order-details-dialog.component.scss'],
})
export class OrderDetailsDialogComponent {
  public readonly DeliveryType = DeliveryType;
  public readonly OrderItemStatus = OrderItemStatus;

  constructor(
    @Inject(MAT_DIALOG_DATA) public order: Order,
    private _ref: MatDialogRef<OrderDetailsDialogComponent>,
    private _customTranslate: CustomTranslateService,
  ) {}

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
}
