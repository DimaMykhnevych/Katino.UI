import { OrderItemStatus } from 'src/app/core/enums/order-item-status';
import { OrderStatus } from 'src/app/core/enums/order-status';
import { SaleType } from 'src/app/core/enums/sale-type';

export class StyleClassHelper {
  public static getItemBadgeClass(status: OrderItemStatus): string {
    return status === OrderItemStatus.ready
      ? 'badge--success'
      : 'badge--progress';
  }

  public static getOrderStatusBadgeClass(s: OrderStatus): string {
    switch (s) {
      case OrderStatus.readyToShip:
      case OrderStatus.received:
      case OrderStatus.receivedRemittanceCompleted:
      case OrderStatus.packed:
        return 'badge--success';

      case OrderStatus.inProgress:
      case OrderStatus.onTheWayToCity:
      case OrderStatus.onTheWayToDepartment:
      case OrderStatus.onTheWayToReceiver:
      case OrderStatus.inTheCityInterregional:
      case OrderStatus.inTheCityWithinTheCity:
      case OrderStatus.arrived:
      case OrderStatus.arrivedPostomat:
      case OrderStatus.receivedRemittancePending:
      case OrderStatus.npCompletingOrder:
        return 'badge--progress';

      case OrderStatus.refusal:
      case OrderStatus.rejection:
      case OrderStatus.rejectionBySender:
      case OrderStatus.deleted:
      case OrderStatus.notFound:
      case OrderStatus.storageStopped:
      case OrderStatus.receiverNotAnswering:
        return 'badge--fail';

      case OrderStatus.exchange:
      case OrderStatus.addressChanged:
      case OrderStatus.receivedAndReturnCreated:
      case OrderStatus.deliveryDateChangedByReceiver:
        return 'badge--blue';

      case OrderStatus.none:
      default:
        return 'badge--neutral';
    }
  }

  public static getSaleTypeBadgeClass(saleType: SaleType): string {
    switch (saleType) {
      case SaleType.retail:
        return 'badge--neutral';
      case SaleType.drop:
        return 'badge--purple';
      case SaleType.wholesale:
        return 'badge--blue';
      default:
        return 'badge--neutral';
    }
  }
}
