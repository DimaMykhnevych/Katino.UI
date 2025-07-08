import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateChild,
} from '@angular/router';
import { CurrentUserService } from '../../permission/services';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthGuard implements CanActivateChild, CanActivate {
  constructor(
    private _authService: AuthService,
    private _router: Router,
    private _currentUserService: CurrentUserService
  ) {}

  public canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this._canActivate(route, state);
  }

  public canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this._canActivate(route, state);
  }

  private _canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // TODO double-check the home routes
    const isAuthorized = this._authService.isAuthenticated();
    if (!isAuthorized) {
      this._router.navigate(['/home']);

      return false;
    }
    const currentUser = this._currentUserService.userInfo;
    if (route.data.roles && route.data.roles.indexOf(currentUser.role) === -1) {
      this._router.navigate(['/home']);
      return false;
    }
    return true;
  }
}
