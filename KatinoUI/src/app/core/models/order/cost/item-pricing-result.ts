import { DiscountType } from 'src/app/core/enums/discount-type';

export interface ItemPricingResult {
  productVariantId: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  discountAmount: number;
  finalLineTotal: number;
  discountId: string;
  appliedDiscountType: DiscountType;
}
