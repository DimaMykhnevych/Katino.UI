import { OrderTagType } from '../../enums/order-tag-type';

export interface OrderTag {
  id: string;
  type: OrderTagType;
  canBeDeleted: boolean;
}
