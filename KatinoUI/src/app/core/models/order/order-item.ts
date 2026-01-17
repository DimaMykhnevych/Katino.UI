import { OrderItemStatus } from '../../enums/order-item-status';
import { ProductVariantForOrder } from './product-variant-for-order';

export interface OrderItem {
  id: string;
  isCustomTailoring: boolean;
  comment: string;
  quantity: number;
  orderItemStatus: OrderItemStatus;
  quantityToProduce: number;

  productVariantId: string;
  orderId: string;
  productVariant: ProductVariantForOrder;
}
