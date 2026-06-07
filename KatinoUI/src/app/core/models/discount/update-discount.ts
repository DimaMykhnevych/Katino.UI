import { DiscountValueType } from '../../enums/discount-value-type';

export interface UpdateDiscount {
  id: string;
  name: string;
  valueType: DiscountValueType;
  value: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  productIds: string[];
  collectionIds: string[];
  bundleProductIds: string[];
}
