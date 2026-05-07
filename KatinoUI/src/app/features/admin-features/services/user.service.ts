import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ManageableUser } from 'src/app/core/models/manageable-user';
import { Sewer } from 'src/app/core/models/sewer';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private _http: HttpClient) {}

  public getSewers(): Observable<Sewer[]> {
    return this._http.get<Sewer[]>(`${AppSettings.apiHost}/User/sewers`);
  }

  public getManageableUsers(): Observable<ManageableUser[]> {
    return this._http.get<ManageableUser[]>(
      `${AppSettings.apiHost}/User/manageable`,
    );
  }

  public setActivation(userId: string, isActive: boolean): Observable<boolean> {
    return this._http.put<boolean>(
      `${AppSettings.apiHost}/User/${userId}/activation`,
      isActive,
    );
  }
}
