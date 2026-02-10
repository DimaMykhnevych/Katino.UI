import { DeliveryType } from 'src/app/core/enums/delivery-type';
import { PayerType } from 'src/app/core/enums/payer-type';
import { PaymentMethod } from 'src/app/core/enums/payment-method';
import { SaleType } from 'src/app/core/enums/sale-type';
import { UpdateOrderItem } from './update-order-item';
import { NpCityResponse } from '../../nova-post/np-city-response';
import { NpContactPerson } from '../../nova-post/np-contact-person';
import { AddOrderNpOptionsSeat } from '../add-order/add-order-np-options-seat';
import { AddOrderRecipient } from '../add-order/add-order-recipient';
import { UpdateOrderAddressInfo } from './update-order-address-info';

export interface UpdateOrder {
  id: string;
  senderNpWarehouseId: string;
  recipientNpWarehouseId?: string;
  payerType: PayerType;
  paymentMethod: PaymentMethod;
  saleType: SaleType;
  sendUntilDate: Date;
  weight: number;
  deliveryType: DeliveryType;
  seatsAmount: number;
  description: string;
  cost: number;
  afterpaymentOnGoodsCost?: number;

  orderItems: UpdateOrderItem[];
  orderNpOptionsSeats: AddOrderNpOptionsSeat[];

  senderNpCity: NpCityResponse;
  recipientNpCity?: NpCityResponse;
  senderContactPerson: NpContactPerson;
  orderRecipient: AddOrderRecipient;
  addressInfo: UpdateOrderAddressInfo | null;
}
