import { FinanceCategoryType } from '../../enums/finance-category-type';

export interface AddFinanceCategory {
  type: FinanceCategoryType;
  name: string;
}
