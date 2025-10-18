import { ProductStatus } from '../enums/product-status';

export class StatusConstants {
  static allProductStatuses: ProductStatus[] = [
    ProductStatus.inStock,
    ProductStatus.onOrder,
    ProductStatus.discontinued,
  ];
}
