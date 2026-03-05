export interface CreateManualExpense {
  entryDate: Date;
  amount: number;
  comment: string;
  categoryId: string;
}
