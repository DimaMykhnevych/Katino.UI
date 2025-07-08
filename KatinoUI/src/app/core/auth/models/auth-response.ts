import { LoginErrorCodes } from '../enums/login-errors-code.enum';
import { UserInfo } from './user-info';

export interface AuthResponse {
  isAuthorized: boolean;
  token: string;
  userInfo: UserInfo;
  loginErrorCode: LoginErrorCodes;
}
