import { OrderStatus } from '../../enums/order-status';

export interface SetManualOrderStatus {
  orderId: string;
  orderManualStatus: OrderStatus;
}
