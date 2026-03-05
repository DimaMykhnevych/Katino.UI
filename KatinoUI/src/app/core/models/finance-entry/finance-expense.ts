export interface FinanceExpense {
  id: string;
  entryDate: Date;
  amount: number;
  comment: string;

  categoryId: string;
  categoryName: string;

  isLocked: boolean;
}
