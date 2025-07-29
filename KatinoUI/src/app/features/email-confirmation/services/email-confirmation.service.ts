import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmEmailModel } from 'src/app/core/models/confirm-email';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class EmailConfirmationService {
  constructor(private _http: HttpClient) {}

  public confirmEmail(
    confirmModel: ConfirmEmailModel
  ): Observable<ConfirmEmailModel> {
    return this._http.post<ConfirmEmailModel>(
      `${AppSettings.apiHost}/user/confirmEmail`,
      confirmModel
    );
  }
}
