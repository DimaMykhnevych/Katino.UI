import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { convertToHttpParams } from 'src/app/core/http/request/http-params.util';
import { GetTopSellingProductsRequest } from 'src/app/core/models/statistics/top-products/get-top-selling-products-request';
import { GetTopSellingProductsResponse } from 'src/app/core/models/statistics/top-products/get-top-selling-products-response';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  constructor(private _http: HttpClient) {}

  public getTopSellingProducts(
    request: GetTopSellingProductsRequest,
  ): Observable<GetTopSellingProductsResponse> {
    const httpParams: HttpParams =
      convertToHttpParams<GetTopSellingProductsRequest>(request);
    return this._http.get<GetTopSellingProductsResponse>(
      `${AppSettings.apiHost}/Statistics/top-selling-products`,
      {
        params: httpParams,
      },
    );
  }
}
