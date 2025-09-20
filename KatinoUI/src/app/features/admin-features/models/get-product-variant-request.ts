import { ProductStatus } from 'src/app/core/enums/product-status';

export interface GetProductVariantRequest {
  productName?: string;
  categoryId?: string;
  productStatus?: ProductStatus;
}
