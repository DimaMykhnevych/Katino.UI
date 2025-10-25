import { ProductStatus } from 'src/app/core/enums/product-status';
import { AddProductVariantMeasurement } from './add-product-variant-measurement';

export interface AddProductVariant {
  productId: string;
  sizeId: string;
  status: ProductStatus;
  colorId: string;
  quantityInStock: number;
  quantityDropSold: number;
  quantityRegularSold: number;
  isDrop: boolean;
  article: string;
  createdAt: Date;
  updatedAt: Date;
  measurements: AddProductVariantMeasurement[];
}
