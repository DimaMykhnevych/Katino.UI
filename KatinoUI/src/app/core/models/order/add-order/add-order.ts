import { DeliveryType } from 'src/app/core/enums/delivery-type';
import { PayerType } from 'src/app/core/enums/payer-type';
import { PaymentMethod } from 'src/app/core/enums/payment-method';
import { SaleType } from 'src/app/core/enums/sale-type';
import { AddOrderItem } from './add-order-item';
import { AddOrderNpOptionsSeat } from './add-order-np-options-seat';
import { NpCityResponse } from '../../nova-post/np-city-response';
import { NpContactPerson } from '../../nova-post/np-contact-person';
import { AddOrderRecipient } from './add-order-recipient';
import { AddOrderAddressInfo } from './add-order-address-info';

export interface AddOrder {
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

  orderItems: AddOrderItem[];
  orderNpOptionsSeats: AddOrderNpOptionsSeat[];

  senderNpCity: NpCityResponse;
  recipientNpCity?: NpCityResponse;
  senderContactPerson: NpContactPerson;
  orderRecipient: AddOrderRecipient;
  addressInfo: AddOrderAddressInfo;
}
