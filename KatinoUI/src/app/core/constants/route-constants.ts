export class RouteConstants {
  static insufficientRightsRedirection = '/login';
  static unauthorizedRedirection = `/login`;
  static successLoginAdmin = '/admin-dashboard';
  static successLoginUser = '/dashboard';
  static alreadySignedInAdminWhenOnLoginPage = '/admin-dashboard';
  static alreadySignedInUserWhenOnLoginPage = '/dashboard';
}
