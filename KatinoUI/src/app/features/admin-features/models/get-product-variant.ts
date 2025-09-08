import { ProductVariant } from 'src/app/core/models/product-variant';

export interface GetProductVariant {
  productVariants: ProductVariant[];
  resultsAmount: number;
}
