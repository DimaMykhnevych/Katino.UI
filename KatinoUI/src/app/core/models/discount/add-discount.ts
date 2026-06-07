import { DiscountType } from '../../enums/discount-type';
import { DiscountValueType } from '../../enums/discount-value-type';

export interface AddDiscount {
  name: string;
  type: DiscountType;
  valueType: DiscountValueType;
  value: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  productIds: string[];
  collectionIds: string[];
  bundleProductIds: string[];
}
