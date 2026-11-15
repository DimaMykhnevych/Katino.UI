import { OrderSort } from '../../enums/order-sort';
import { OrderStatus } from '../../enums/order-status';
import { ReceiptState } from '../../enums/receipt-state';

export interface GetOrderRequest {
  search?: string;
  page: number;
  pageSize: number;
  orderStatuses: OrderStatus[];
  tagIds: string[];
  receiptStates: ReceiptState[];
  createdFrom: string | null;
  createdTo: string | null;
  sort: OrderSort;
}
