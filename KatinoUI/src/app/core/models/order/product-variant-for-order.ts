import { ProductStatus } from '../../enums/product-status';
import { Color } from '../color';
import { Size } from '../size';
import { ProductForOrder } from './product-for-order';

export interface ProductVariantForOrder {
  id: string;
  status: ProductStatus;
  article: string;
  color: Color;
  product: ProductForOrder;
  size: Size;
}
