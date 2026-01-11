import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { convertToHttpParams } from 'src/app/core/http/request/http-params.util';
import { GetNpCitiesResponse } from 'src/app/core/models/nova-post/get-np-cities-response';
import { NpWarehouse } from 'src/app/core/models/nova-post/np-warehouse';
import { SearchNpWarehouses } from 'src/app/core/models/nova-post/search-np-warehouses';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class NovaPostService {
  constructor(private _http: HttpClient) {}

  public getNpCities(cityName: string): Observable<GetNpCitiesResponse> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('cityName', cityName);
    return this._http.get<GetNpCitiesResponse>(
      `${AppSettings.apiHost}/NovaPost/cities/search`,
      {
        params: httpParams,
      }
    );
  }

  public getNpWarehouses(
    request: SearchNpWarehouses
  ): Observable<NpWarehouse[]> {
    const httpParams: HttpParams =
      convertToHttpParams<SearchNpWarehouses>(request);
    return this._http.get<NpWarehouse[]>(
      `${AppSettings.apiHost}/NpWarehouse/search`,
      {
        params: httpParams,
      }
    );
  }
}
