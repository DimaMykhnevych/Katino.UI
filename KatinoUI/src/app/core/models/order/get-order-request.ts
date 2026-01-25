import { OrderStatus } from '../../enums/order-status';

export interface GetOrderRequest {
  search?: string;
  page: number;
  pageSize: number;
  orderStatuses: OrderStatus[];
}
