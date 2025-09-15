import { ProductStatus } from '../enums/product-status';
import { Color } from './color';
import { GetProductVariantMeasurement } from './get-product-variant-measurement';
import { Product } from './product';
import { Size } from './size';

export interface ProductVariant {
  id: string;
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
  color: Color;
  product: Product;
  size: Size;
  measurements: GetProductVariantMeasurement[];
  totalSold: number;
  availableQuantity: number;
}
