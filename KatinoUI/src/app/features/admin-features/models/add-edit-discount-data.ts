import { DiscountResponse } from 'src/app/core/models/discount/discount-response';

export interface AddEditDiscountData {
  discount: DiscountResponse | null;
  isAdding: boolean;
}
