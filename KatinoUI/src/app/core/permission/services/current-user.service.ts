import { Injectable } from '@angular/core';
import { UserInfo } from '../../auth';
import { Subject } from 'rxjs';
import { Roles } from '../../models/roles';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserService {
  public userInfoChanged: Subject<UserInfo> = new Subject();

  private _userInfo: UserInfo;

  constructor() {
    this._userInfo = {};
  }

  public get userInfo(): UserInfo {
    return JSON.parse(localStorage.getItem('currentUserInfo') || '');
  }

  public set userInfo(info: UserInfo) {
    this._userInfo = info;
    localStorage.removeItem('currentUserInfo');
    localStorage.setItem('currentUserInfo', JSON.stringify(this._userInfo));
    this.userInfoChanged.next(this._userInfo);
  }

  public get isAdmin(): boolean {
    return this._userInfo.role == Roles.Admin;
  }
}
