import { CollectionProduct } from './collection-product';

export interface Collection {
  id: string;
  name: string;
  description: string;
  products: CollectionProduct[];
}
