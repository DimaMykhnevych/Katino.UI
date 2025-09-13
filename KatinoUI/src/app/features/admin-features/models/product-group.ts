import { Product } from 'src/app/core/models/product';
import { ProductVariant } from 'src/app/core/models/product-variant';

export interface ProductGroup {
  product: Product;
  variants: ProductVariant[];
  variantCount: number;
}
