import { ProductVariant } from 'src/app/core/models/product-variant';

export interface AddEditProductVariantData {
  productVariant: ProductVariant | null;
  isAdding: boolean;
}
