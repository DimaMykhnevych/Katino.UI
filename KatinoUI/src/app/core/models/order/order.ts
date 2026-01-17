import { DeliveryType } from '../../enums/delivery-type';
import { OrderInternetDocStatus } from '../../enums/order-internet-doc-status';
import { OrderManualStatus } from '../../enums/order-manual-status';
import { OrderReadinessStatus } from '../../enums/order-readiness-status';
import { PayerType } from '../../enums/payer-type';
import { PaymentMethod } from '../../enums/payment-method';
import { SaleType } from '../../enums/sale-type';
import { NpCityResponse } from '../nova-post/np-city-response';
import { NpContactPerson } from '../nova-post/np-contact-person';
import { NpWarehouse } from '../nova-post/np-warehouse';
import { OrderAddressInfo } from './order-address-info';
import { OrderItem } from './order-item';
import { OrderNpOptionsSeat } from './order-np-options-seat';
import { OrderRecipient } from './order-recipient';

export interface Order {
  id: string;
  senderNpWarehouseId: string;
  recipientNpWarehouseId?: string;
  senderNpCityId: string;
  recipientNpCityId?: string;
  senderContactPersonId: string;
  orderRecipientId: string;
  payerType: PayerType;
  paymentMethod: PaymentMethod;
  saleType: SaleType;
  creationDateTime: Date;
  sendUntilDate: Date;
  weight: number;
  deliveryType: DeliveryType;
  seatsAmount: number;
  description: string;
  cost: number;
  afterpaymentOnGoodsCost?: number;
  internetDocumentCreationAttempted: boolean;
  internetDocumentRef: string;
  internetDocumentIntDocNumber: string;
  orderReadinessStatus: OrderReadinessStatus;
  orderInternetDocStatus: OrderInternetDocStatus;
  orderManualStatus: OrderManualStatus;

  orderItems: OrderItem[];
  orderNpOptionsSeats: OrderNpOptionsSeat[];

  senderNpWarehouse: NpWarehouse;
  rcipientNpWarehouse: NpWarehouse;
  senderNpCity: NpCityResponse;
  recipientNpCity: NpCityResponse;
  senderContactPerson: NpContactPerson;
  orderRecipient: OrderRecipient;
  addressInfo: OrderAddressInfo;
}
