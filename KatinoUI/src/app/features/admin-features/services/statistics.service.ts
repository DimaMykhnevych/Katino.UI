import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { convertToHttpParams } from 'src/app/core/http/request/http-params.util';
import { GetSewingStatisticsRequest } from 'src/app/core/models/statistics/sewed-amount/get-sewing-statistics-request';
import { GetSewingStatisticsResponse } from 'src/app/core/models/statistics/sewed-amount/get-sewing-statistics-response';
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

  public getSewingStatistics(
    request: GetSewingStatisticsRequest,
  ): Observable<GetSewingStatisticsResponse> {
    const httpParams: HttpParams =
      convertToHttpParams<GetSewingStatisticsRequest>(request);
    return this._http.get<GetSewingStatisticsResponse>(
      `${AppSettings.apiHost}/Statistics/sewing-statistics`,
      {
        params: httpParams,
      },
    );
  }
}
