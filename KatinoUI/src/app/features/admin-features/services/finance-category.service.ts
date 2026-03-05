import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FinanceCategoryType } from 'src/app/core/enums/finance-category-type';
import { FinanceCategory } from 'src/app/core/models/financeCategory/finance-category';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class FinanceCategoryService {
  constructor(private _http: HttpClient) {}

  public getExpenseCategories(): Observable<FinanceCategory[]> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append(
      'FinanceCategoryType',
      FinanceCategoryType.expense,
    );

    return this._http.get<FinanceCategory[]>(
      `${AppSettings.apiHost}/FinanceCategory`,
      {
        params: httpParams,
      },
    );
  }

  public addExpenseCategory(name: string): Observable<FinanceCategory> {
    return this._http.post<FinanceCategory>(
      `${AppSettings.apiHost}/FinanceCategory`,
      { financeCategoryType: FinanceCategoryType.expense, name: name },
    );
  }

  public hideExpenseCategory(id: string): Observable<boolean> {
    return this._http.post<boolean>(
      `${AppSettings.apiHost}/FinanceCategory/${id}/hide`,
      {},
    );
  }
}
