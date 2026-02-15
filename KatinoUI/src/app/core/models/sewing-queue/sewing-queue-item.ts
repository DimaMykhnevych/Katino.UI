import { ProductVariant } from '../product-variant';

export interface SewingQueueItem {
  productVariantId: string;
  quantityToProduce: number;
  isCustomTailoring: boolean;
  comment: string;
  orderItemId?: string;
  productVariant: ProductVariant;
}
