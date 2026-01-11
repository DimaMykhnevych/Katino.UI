import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrmUserSettings } from 'src/app/core/models/crm-user-settings';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class CrmSettingsService {
  constructor(private _http: HttpClient) {}

  public getCrmSettings(): Observable<CrmUserSettings> {
    return this._http.get<CrmUserSettings>(
      `${AppSettings.apiHost}/CrmUserSettings`
    );
  }
}
