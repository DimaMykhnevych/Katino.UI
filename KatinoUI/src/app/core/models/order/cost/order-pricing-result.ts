import { ItemPricingResult } from './item-pricing-result';

export interface OrderPricingResult {
  baseTotal: number;
  totalDiscount: number;
  finalTotal: number;
  itemResults: ItemPricingResult[];
}
