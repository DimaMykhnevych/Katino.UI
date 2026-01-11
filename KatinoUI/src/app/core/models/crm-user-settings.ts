import { NpCityResponse } from './nova-post/np-city-response';
import { NpWarehouse } from './nova-post/np-warehouse';

export interface CrmUserSettings {
  id: string;
  npCity: NpCityResponse;
  npWarehouse: NpWarehouse;
}
