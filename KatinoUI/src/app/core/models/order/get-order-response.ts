import { Order } from './order';

export interface GetOrderResponse {
  orders: Order[];
  resultsAmount: number;
}
