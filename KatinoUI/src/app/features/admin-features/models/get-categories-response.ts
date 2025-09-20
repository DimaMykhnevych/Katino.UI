import { Category } from 'src/app/core/models/category';

export interface GetCategoriesResponse {
  categories: Category[];
  resultsAmount: number;
}
