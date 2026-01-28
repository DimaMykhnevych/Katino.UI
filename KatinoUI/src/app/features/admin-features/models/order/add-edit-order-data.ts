import { Order } from 'src/app/core/models/order/order';

export interface AddEditOrderData {
  order: Order | null;
  isAdding: boolean;
}
