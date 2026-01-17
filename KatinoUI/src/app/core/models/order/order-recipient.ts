import { NpContactPerson } from '../nova-post/np-contact-person';

export interface OrderRecipient {
  id: string;
  instUrl: string;
  createdDate: Date;
  npContactPersonId: string;

  npContactPerson: NpContactPerson;
}
