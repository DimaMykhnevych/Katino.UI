import { Product } from 'src/app/core/models/product';

export interface GetProductsResponse {
  products: Product[];
  resultsAmount: number;
}
