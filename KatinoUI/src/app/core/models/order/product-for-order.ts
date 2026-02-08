import { Category } from '../category';

export interface ProductForOrder {
  name: string;
  category: Category;
  costPrice: number;
  wholesalePrice: number;
  dropPrice: number;
  price: number;
}
