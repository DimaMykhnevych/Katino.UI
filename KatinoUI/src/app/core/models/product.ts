import { Category } from './category';

export interface Product {
  id: string;
  name: string;
  costPrice: number;
  wholesalePrice: number;
  dropPrice: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  category: Category;
}
