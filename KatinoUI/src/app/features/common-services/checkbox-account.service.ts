import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AddCheckboxAccount } from 'src/app/core/models/checkbox/add-checkbox-account';
import { CheckboxAccount } from 'src/app/core/models/checkbox/checkbox-account';
import { UpdateCheckboxAccount } from 'src/app/core/models/checkbox/update-checkbox-account';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class CheckboxAccountService {
  constructor(private _http: HttpClient) {}

  public getAccounts(): Observable<CheckboxAccount[]> {
    return this._http.get<CheckboxAccount[]>(
      `${AppSettings.apiHost}/CheckboxAccount`,
    );
  }

  public addAccount(account: AddCheckboxAccount): Observable<CheckboxAccount> {
    return this._http.post<CheckboxAccount>(
      `${AppSettings.apiHost}/CheckboxAccount`,
      account,
    );
  }

  public updateAccount(
    id: string,
    account: UpdateCheckboxAccount,
  ): Observable<CheckboxAccount> {
    return this._http.put<CheckboxAccount>(
      `${AppSettings.apiHost}/CheckboxAccount/${id}`,
      account,
    );
  }

  public deactivateAccount(id: string): Observable<void> {
    return this._http.post<void>(
      `${AppSettings.apiHost}/CheckboxAccount/${id}/deactivate`,
      null,
    );
  }
}
