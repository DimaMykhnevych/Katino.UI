import { Category } from 'src/app/core/models/category';

export interface AddEditCategoryData {
  category: Category | null;
  isAdding: boolean;
}
