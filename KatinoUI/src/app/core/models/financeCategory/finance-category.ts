import { FinanceCategoryType } from '../../enums/finance-category-type';

export interface FinanceCategory {
  id: string;
  type: FinanceCategoryType;
  name: string;
  isActive: boolean;
}
