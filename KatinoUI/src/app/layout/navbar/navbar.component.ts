import { Component, OnInit } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/core/auth';
import { RouteConstants } from 'src/app/core/constants/route-constants';
import { Roles } from 'src/app/core/models/roles';
import { CurrentUserService } from 'src/app/core/permission/services';
import { EventPeriodService } from 'src/app/core/services/event-period.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  public userName: string | undefined = '';
  public userRole: string | undefined = '';
  public showBirthdayLogo = false;

  constructor(
    private _authService: AuthService,
    private router: Router,
    private _userService: CurrentUserService,
    private _translate: TranslateService,
    private _dateAdapter: DateAdapter<Date>,
    private _eventPeriod: EventPeriodService,
  ) {}

  public get currentLanguage(): string | null {
    return localStorage.getItem('language');
  }

  public ngOnInit(): void {
    const currentUserInfo = this._userService.userInfo;
    this.userName = currentUserInfo.userName;
    this.userRole = currentUserInfo.role;
    this.showBirthdayLogo = this._eventPeriod.isBirthdayPeriod();
  }

  public OnLogOutButtonCLick(): void {
    this._authService.unauthorize();
    this.router.navigate([RouteConstants.logoutButtonClickRedirection]);
  }

  public onLanguageClick(language: string): void {
    localStorage.setItem('language', language);
    this._translate.setDefaultLang(language);
    this._translate.use(language);

    if (language === 'ua') {
      this._dateAdapter.setLocale('uk-UA');
      return;
    }

    if (language === 'en') {
      this._dateAdapter.setLocale('en-GB');
      return;
    }
  }

  public getUserRoleText(): string {
    switch (this.userRole) {
      case Roles.Admin:
        return this._translate.instant('roles.admin');
      case Roles.Owner:
        return this._translate.instant('roles.owner');
      case Roles.Sewer:
        return this._translate.instant('roles.sewer');
      case Roles.DirectManager:
        return this._translate.instant('roles.directManager');
      default:
        return this._translate.instant('roles.user');
    }
  }

  public getNavbarBrandClickLink(): string {
    switch (this.userRole) {
      case Roles.Admin:
        return RouteConstants.navbarBrandClickAdmin;
      case Roles.Owner:
        return RouteConstants.navbarBrandClickOwner;
      case Roles.Sewer:
        return RouteConstants.navbarBrandClickSewer;
      case Roles.DirectManager:
        return RouteConstants.navbarBrandClickDirectManager;
      default:
        return '#';
    }
  }
}
