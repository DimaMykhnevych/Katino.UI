import { ProductVariantQuantityChangeReason } from '../../enums/product-variant-quantity-change-reason';

export interface ProductVariantRedistributionHistory {
  id: string;
  productVariantId: string;
  productVariantArticle: string;
  quantity: number;
  reason: ProductVariantQuantityChangeReason;

  sourceOrderId?: string;
  sourceOrderItemId?: string;
  sourceOrderTtn?: string;

  targetOrderId?: string;
  targetOrderItemId?: string;
  targetOrderTtn?: string;

  createdAtUtc: Date;
}
