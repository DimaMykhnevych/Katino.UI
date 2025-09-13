import { ProductVariant } from 'src/app/core/models/product-variant';

export interface GroupedProductVariant extends ProductVariant {
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  groupSize?: number;
  showProductInfo?: boolean;
}
