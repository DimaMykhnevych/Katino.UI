import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateManualExpense } from 'src/app/core/models/finance-entry/create-manual-expense';
import { FinanceExpense } from 'src/app/core/models/finance-entry/finance-expense';
import { UpdateManualExpenseCommand } from 'src/app/core/models/finance-entry/update-manual-expense';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class FinanceExpenseService {
  constructor(private _http: HttpClient) {}

  public getFinanceExpenses(year?: number): Observable<FinanceExpense[]> {
    let httpParams = new HttpParams();
    if (year) {
      httpParams = httpParams.append('year', year);
    }

    return this._http.get<FinanceExpense[]>(
      `${AppSettings.apiHost}/FinanceExpense`,
      {
        params: httpParams,
      },
    );
  }

  public addFinanceExpense(command: CreateManualExpense): Observable<boolean> {
    return this._http.post<boolean>(
      `${AppSettings.apiHost}/FinanceExpense`,
      command,
    );
  }

  public updateFinanceExpense(
    command: UpdateManualExpenseCommand,
  ): Observable<boolean> {
    return this._http.put<boolean>(
      `${AppSettings.apiHost}/FinanceExpense`,
      command,
    );
  }

  public deleteFinanceExpense(id: string): Observable<boolean> {
    return this._http.delete<boolean>(
      `${AppSettings.apiHost}/FinanceExpense/${id}`,
    );
  }
}
