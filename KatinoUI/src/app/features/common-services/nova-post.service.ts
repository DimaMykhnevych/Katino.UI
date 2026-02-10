import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { convertToHttpParams } from 'src/app/core/http/request/http-params.util';
import { CurrentSyncStatus } from 'src/app/core/models/nova-post/current-sync-status';
import { GetNpCitiesResponse } from 'src/app/core/models/nova-post/get-np-cities-response';
import { GetSyncRecords } from 'src/app/core/models/nova-post/get-sync-records';
import { NpContactPerson } from 'src/app/core/models/nova-post/np-contact-person';
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
      },
    );
  }

  public getSenderContactPersons(): Observable<NpContactPerson[]> {
    return this._http.get<NpContactPerson[]>(
      `${AppSettings.apiHost}/NovaPost/sender/contact-persons`,
    );
  }

  public getNpContactPersons(phone: string): Observable<NpContactPerson[]> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('phone', phone);
    return this._http.get<NpContactPerson[]>(
      `${AppSettings.apiHost}/NovaPost/contact-persons`,
      {
        params: httpParams,
      },
    );
  }

  public getNpWarehouses(
    request: SearchNpWarehouses,
  ): Observable<NpWarehouse[]> {
    const httpParams: HttpParams =
      convertToHttpParams<SearchNpWarehouses>(request);
    return this._http.get<NpWarehouse[]>(
      `${AppSettings.apiHost}/NpWarehouse/search`,
      {
        params: httpParams,
      },
    );
  }

  public getCurrentSyncStatus(): Observable<CurrentSyncStatus> {
    return this._http.get<CurrentSyncStatus>(
      `${AppSettings.apiHost}/NovaPoshtaSync/status`,
    );
  }

  public triggerSync(): Observable<void> {
    return this._http.post<void>(
      `${AppSettings.apiHost}/NovaPoshtaSync/trigger`,
      null,
    );
  }

  public getSyncHistory(limit: number): Observable<GetSyncRecords> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('limit', limit);
    return this._http.get<GetSyncRecords>(
      `${AppSettings.apiHost}/NovaPoshtaSync/history`,
      {
        params: httpParams,
      },
    );
  }
}
