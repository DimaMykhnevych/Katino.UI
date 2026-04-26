import { ProductStatus } from '../enums/product-status';
import { SewingQueueVisibility } from '../enums/sewing-queue-visibility';
import { Color } from './color';
import { GetProductVariantMeasurement } from './get-product-variant-measurement';
import { Product } from './product';
import { ProductPhoto } from './product-photo';
import { Sewer } from './sewer';
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
  photos: ProductPhoto[];
  sewingQueueVisibility: SewingQueueVisibility;
  sewers: Sewer[];
}
