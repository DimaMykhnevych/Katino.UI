import { SaleType } from 'src/app/core/enums/sale-type';
import { OrderPricingRequest } from './order-pricing-request';

export interface PreviewOrderCostRequest {
  items: OrderPricingRequest[];
  saleType: SaleType;
}
