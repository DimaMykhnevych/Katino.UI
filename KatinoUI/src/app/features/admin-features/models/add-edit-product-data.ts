import { Product } from 'src/app/core/models/product';

export interface AddEditProductData {
  product: Product | null;
  isAdding: boolean;
}
