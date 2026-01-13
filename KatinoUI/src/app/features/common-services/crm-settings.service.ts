import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AddCrmSettingsCommand } from 'src/app/core/models/crm-settings/add-crm-settings-command';
import { UpdateCrmSettingsCommand } from 'src/app/core/models/crm-settings/update-crm-settings-command';
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

  public createCrmSettings(
    addSettings: AddCrmSettingsCommand
  ): Observable<boolean> {
    return this._http.post<boolean>(
      `${AppSettings.apiHost}/CrmUserSettings`,
      addSettings
    );
  }

  public updateCrmSettings(
    updateSettings: UpdateCrmSettingsCommand
  ): Observable<boolean> {
    return this._http.put<boolean>(
      `${AppSettings.apiHost}/CrmUserSettings`,
      updateSettings
    );
  }

  public deleteCrmSettings(id: string): Observable<boolean> {
    return this._http.delete<boolean>(
      `${AppSettings.apiHost}/CrmUserSettings/${id}`
    );
  }
}
