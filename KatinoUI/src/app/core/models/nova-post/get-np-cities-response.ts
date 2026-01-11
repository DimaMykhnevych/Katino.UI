import { NpCityResponse } from './np-city-response';

export interface GetNpCitiesResponse {
  totalCount: number;
  addresses: NpCityResponse[];
}
