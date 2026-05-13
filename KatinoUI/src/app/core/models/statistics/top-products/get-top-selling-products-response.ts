import { TopSellingProduct } from './top-selling-product';

export interface GetTopSellingProductsResponse {
  products: TopSellingProduct[];
  resultsAmount: number;
}
