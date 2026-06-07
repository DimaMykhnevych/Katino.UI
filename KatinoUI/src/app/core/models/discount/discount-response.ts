import { DiscountType } from '../../enums/discount-type';
import { DiscountValueType } from '../../enums/discount-value-type';
import { CollectionProduct } from '../collection/collection-product';
import { DiscountCollection } from './discount-collection';

export interface DiscountResponse {
  id: string;
  name: string;
  type: DiscountType;
  valueType: DiscountValueType;
  value: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  products: CollectionProduct[];
  collections: DiscountCollection[];
  bundleProducts: CollectionProduct[];
}
