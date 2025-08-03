export class RouteConstants {
  static insufficientRightsRedirection = '/login';
  static unauthorizedRedirection = `/login`;
  static successLoginAdmin = '/inventory';
  static successLoginUser = '/dashboard';
  static alreadySignedInAdminWhenOnLoginPage = '/inventory';
  static alreadySignedInUserWhenOnLoginPage = '/dashboard';
  static logoutButtonClickRedirection = '/login';
  static navbarBrandClickAdmin = '/inventory';
}
