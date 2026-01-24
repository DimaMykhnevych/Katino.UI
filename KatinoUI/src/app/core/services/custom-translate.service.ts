import { Injectable } from '@angular/core';
import { TranslateEnum } from './models/translate-enum';
import { ProductStatus } from '../enums/product-status';
import { OrderStatus } from '../enums/order-status';
import { SaleType } from '../enums/sale-type';
import { OrderItemStatus } from '../enums/order-item-status';
import { PayerType } from '../enums/payer-type';
import { PaymentMethod } from '../enums/payment-method';
import { OrderInternetDocStatus } from '../enums/order-internet-doc-status';

@Injectable({
  providedIn: 'root',
})
export class CustomTranslateService {
  private dictionary: TranslateEnum[] = [
    {
      enum: ProductStatus[ProductStatus.inStock],
      en: 'In stock',
      ua: 'В наявності',
      ru: 'В наличии',
    },
    {
      enum: ProductStatus[ProductStatus.onOrder],
      en: 'On order',
      ua: 'Під замовлення',
      ru: 'Под заказ',
    },
    {
      enum: ProductStatus[ProductStatus.discontinued],
      en: 'Discontinued',
      ua: 'Не відшивається',
      ru: 'Не отшивается',
    },
  ];

  public translateProductStatus(statusName: string): string {
    const currentLanguage = localStorage.getItem('language') || 'en';
    const neededObject = this.dictionary.find(
      (item) => item.enum === statusName,
    );
    if (neededObject) {
      return neededObject[currentLanguage as keyof TranslateEnum];
    }
    return '';
  }

  public getOrderStatusTextKey(s: OrderStatus): string {
    switch (s) {
      case OrderStatus.none:
        return 'orders.orderStatus.none';

      case OrderStatus.inProgress:
        return 'orders.orderStatus.inProgress';
      case OrderStatus.readyToShip:
        return 'orders.orderStatus.readyToShip';
      case OrderStatus.packed:
        return 'orders.orderStatus.packed';

      case OrderStatus.created:
        return 'orders.orderStatus.created';
      case OrderStatus.deleted:
        return 'orders.orderStatus.deleted';
      case OrderStatus.notFound:
        return 'orders.orderStatus.notFound';
      case OrderStatus.inTheCityInterregional:
        return 'orders.orderStatus.inTheCityInterregional';
      case OrderStatus.onTheWayToCity:
        return 'orders.orderStatus.onTheWayToCity';
      case OrderStatus.onTheWayToDepartment:
        return 'orders.orderStatus.onTheWayToDepartment';
      case OrderStatus.arrived:
        return 'orders.orderStatus.arrived';
      case OrderStatus.arrivedPostomat:
        return 'orders.orderStatus.arrivedPostomat';
      case OrderStatus.received:
        return 'orders.orderStatus.received';
      case OrderStatus.receivedRemittancePending:
        return 'orders.orderStatus.receivedRemittancePending';
      case OrderStatus.receivedRemittanceCompleted:
        return 'orders.orderStatus.receivedRemittanceCompleted';
      case OrderStatus.npCompletingOrder:
        return 'orders.orderStatus.npCompletingOrder';
      case OrderStatus.inTheCityWithinTheCity:
        return 'orders.orderStatus.inTheCityWithinTheCity';
      case OrderStatus.onTheWayToReceiver:
        return 'orders.orderStatus.onTheWayToReceiver';
      case OrderStatus.rejectionBySender:
        return 'orders.orderStatus.rejectionBySender';
      case OrderStatus.rejection:
        return 'orders.orderStatus.rejection';
      case OrderStatus.addressChanged:
        return 'orders.orderStatus.addressChanged';
      case OrderStatus.storageStopped:
        return 'orders.orderStatus.storageStopped';
      case OrderStatus.receivedAndReturnCreated:
        return 'orders.orderStatus.receivedAndReturnCreated';
      case OrderStatus.receiverNotAnswering:
        return 'orders.orderStatus.receiverNotAnswering';
      case OrderStatus.deliveryDateChangedByReceiver:
        return 'orders.orderStatus.deliveryDateChangedByReceiver';

      case OrderStatus.refusal:
        return 'orders.orderStatus.refusal';
      case OrderStatus.exchange:
        return 'orders.orderStatus.exchange';

      default:
        return 'orders.orderStatus.none';
    }
  }

  public getSaleTypeTextKey(saleType: SaleType): string {
    switch (saleType) {
      case SaleType.retail:
        return 'orders.saleType.retail';
      case SaleType.drop:
        return 'orders.saleType.drop';
      case SaleType.wholesale:
        return 'orders.saleType.wholesale';
      default:
        return 'orders.saleType.retail';
    }
  }

  public getItemStatusTextKey(status: OrderItemStatus): string {
    return status === OrderItemStatus.ready
      ? 'orders.itemStatus.ready'
      : 'orders.itemStatus.forSewing';
  }

  public getPayerTypeTextKey(v: PayerType): string {
    switch (v) {
      case PayerType.sender:
        return 'orders.payerType.sender';
      case PayerType.recipient:
        return 'orders.payerType.recipient';
      case PayerType.thirdPerson:
        return 'orders.payerType.thirdPerson';
      default:
        return 'orders.payerType.sender';
    }
  }

  public getPaymentMethodTextKey(v: PaymentMethod): string {
    switch (v) {
      case PaymentMethod.cash:
        return 'orders.paymentMethod.cash';
      case PaymentMethod.nonCash:
        return 'orders.paymentMethod.nonCash';
      default:
        return 'orders.paymentMethod.cash';
    }
  }

  public getNpStatusTextKey(v: OrderInternetDocStatus): string {
    switch (v) {
      case OrderInternetDocStatus.notProcessed:
        return 'orders.npStatus.notProcessed';
      case OrderInternetDocStatus.created:
        return 'orders.npStatus.created';
      case OrderInternetDocStatus.deleted:
        return 'orders.npStatus.deleted';
      case OrderInternetDocStatus.notFound:
        return 'orders.npStatus.notFound';
      case OrderInternetDocStatus.inTheCityInterregional:
        return 'orders.npStatus.inTheCityInterregional';
      case OrderInternetDocStatus.onTheWayToCity:
        return 'orders.npStatus.onTheWayToCity';
      case OrderInternetDocStatus.onTheWayToDepartment:
        return 'orders.npStatus.onTheWayToDepartment';
      case OrderInternetDocStatus.arrived:
        return 'orders.npStatus.arrived';
      case OrderInternetDocStatus.arrivedPostomat:
        return 'orders.npStatus.arrivedPostomat';
      case OrderInternetDocStatus.received:
        return 'orders.npStatus.received';
      case OrderInternetDocStatus.receivedRemittancePending:
        return 'orders.npStatus.receivedRemittancePending';
      case OrderInternetDocStatus.receivedRemittanceCompleted:
        return 'orders.npStatus.receivedRemittanceCompleted';
      case OrderInternetDocStatus.npCompletingOrder:
        return 'orders.npStatus.npCompletingOrder';

      case OrderInternetDocStatus.inTheCityWithinTheCity:
        return 'orders.npStatus.inTheCityWithinTheCity';
      case OrderInternetDocStatus.onTheWayToReceiver:
        return 'orders.npStatus.onTheWayToReceiver';

      case OrderInternetDocStatus.rejectionBySender:
        return 'orders.npStatus.rejectionBySender';
      case OrderInternetDocStatus.rejection:
        return 'orders.npStatus.rejection';
      case OrderInternetDocStatus.addressChanged:
        return 'orders.npStatus.addressChanged';
      case OrderInternetDocStatus.storageStopped:
        return 'orders.npStatus.storageStopped';
      case OrderInternetDocStatus.receivedAndReturnCreated:
        return 'orders.npStatus.receivedAndReturnCreated';
      case OrderInternetDocStatus.receiverNotAnswering:
        return 'orders.npStatus.receiverNotAnswering';
      case OrderInternetDocStatus.deliveryDateChangedByReceiver:
        return 'orders.npStatus.deliveryDateChangedByReceiver';

      default:
        return 'orders.npStatus.notProcessed';
    }
  }
}
