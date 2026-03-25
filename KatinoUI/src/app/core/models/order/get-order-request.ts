import { OrderSort } from '../../enums/order-sort';
import { OrderStatus } from '../../enums/order-status';

export interface GetOrderRequest {
  search?: string;
  page: number;
  pageSize: number;
  orderStatuses: OrderStatus[];
  createdFrom: string | null;
  createdTo: string | null;
  sort: OrderSort;
}
