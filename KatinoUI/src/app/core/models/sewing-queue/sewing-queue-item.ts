import { ProductVariant } from '../product-variant';

export interface SewingQueueItem {
  productVariantId: string;
  quantityToProduce: number;
  isCustomTailoring: boolean;
  isIncomingReturn: boolean;
  sendUntil?: Date;
  comment: string;
  orderItemId?: string;
  productVariant: ProductVariant;
}
