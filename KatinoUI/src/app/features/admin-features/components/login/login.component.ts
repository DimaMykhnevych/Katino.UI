import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  AuthForm,
  AuthResponse,
  AuthService,
  UserInfo,
} from 'src/app/core/auth';
import { LoginErrorCodes } from 'src/app/core/auth/enums/login-errors-code.enum';
import { RouteConstants } from 'src/app/core/constants/route-constants';
import { Roles } from 'src/app/core/models/roles';
import { CurrentUserService } from 'src/app/core/permission/services';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public form: FormGroup = this._builder.group({});
  public authResponse: AuthResponse | undefined;
  public isLoggingIn: boolean = false;

  constructor(
    private _builder: FormBuilder,
    private _auth: AuthService,
    private _router: Router,
    private _currentUserService: CurrentUserService
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
    if (this._auth.isAuthenticated()) {
      const isCurrentUserAdmin =
        this._currentUserService.userInfo.role === Roles.Admin;
      if (isCurrentUserAdmin) {
        this._router.navigate([
          RouteConstants.alreadySignedInAdminWhenOnLoginPage,
        ]);
      } else {
        this._router.navigate([
          RouteConstants.alreadySignedInUserWhenOnLoginPage,
        ]);
      }
    }
  }

  public onLoginButtonClick(): void {
    this.login(this.form.value);
  }

  public isInvalidCredentials(): boolean {
    return (
      this.authResponse?.loginErrorCode ===
      LoginErrorCodes.InvalidUsernameOrPassword
    );
  }

  public isEmailConfirmationRequired(): boolean {
    return (
      this.authResponse?.loginErrorCode ===
      LoginErrorCodes.EmailConfirmationRequired
    );
  }

  private login(value: AuthForm): void {
    this.isLoggingIn = true;
    this._auth.authorize(value).subscribe((authResponse: AuthResponse) => {
      this.isLoggingIn = false;
      if (authResponse.isAuthorized) {
        this.defineRedirectRoute(authResponse.userInfo);
      } else {
        this.authResponse = authResponse;
      }
    });
  }

  private defineRedirectRoute(userInfo: UserInfo): void {
    switch (userInfo.role) {
      case Roles.Admin:
        this._router.navigate([RouteConstants.successLoginAdmin]);
        break;
      default:
        this._router.navigate([RouteConstants.successLoginUser]);
    }
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      userName: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });
  }

  get userName() {
    return this.form.get('userName');
  }
  get password() {
    return this.form.get('password');
  }
}
