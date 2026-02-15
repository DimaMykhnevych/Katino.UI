import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/core/auth';
import { RouteConstants } from 'src/app/core/constants/route-constants';
import { Roles } from 'src/app/core/models/roles';
import { CurrentUserService } from 'src/app/core/permission/services';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  public userName: string | undefined = '';
  public userRole: string | undefined = '';
  constructor(
    private _authService: AuthService,
    private router: Router,
    private _userService: CurrentUserService,
    private _translate: TranslateService,
  ) {}

  public get currentLanguage(): string | null {
    return localStorage.getItem('language');
  }

  public ngOnInit(): void {
    const currentUserInfo = this._userService.userInfo;
    this.userName = currentUserInfo.userName;
    this.userRole = currentUserInfo.role;
  }

  public OnLogOutButtonCLick(): void {
    this._authService.unauthorize();
    this.router.navigate([RouteConstants.logoutButtonClickRedirection]);
  }

  public onLanguageClick(language: string): void {
    localStorage.setItem('language', language);
    this._translate.setDefaultLang(language);
    this._translate.use(language);
  }

  public getUserRoleText(): string {
    switch (this.userRole) {
      case Roles.Admin:
        return this._translate.instant('roles.admin');
      case Roles.Sewer:
        return this._translate.instant('roles.sewer');
      default:
        return this._translate.instant('roles.user');
    }
  }

  public getNavbarBrandClickLink(): string {
    switch (this.userRole) {
      case Roles.Admin:
        return RouteConstants.navbarBrandClickAdmin;
      case Roles.Sewer:
        return RouteConstants.navbarBrandClickSewer;
      default:
        return '#';
    }
  }
}
