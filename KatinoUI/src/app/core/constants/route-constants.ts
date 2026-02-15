export class RouteConstants {
  static insufficientRightsRedirection = '/login';
  static unauthorizedRedirection = `/login`;

  static logoutButtonClickRedirection = '/login';

  // Admin
  static successLoginAdmin = '/inventory';
  static alreadySignedInAdminWhenOnLoginPage = '/inventory';
  static navbarBrandClickAdmin = '/inventory';

  // Sewer
  static successLoginSewer = '/sewing-queue';
  static alreadySignedInSewerWhenOnLoginPage = '/sewing-queue';
  static navbarBrandClickSewer = '/sewing-queue';

  // User
  static successLoginUser = '/dashboard';
  static alreadySignedInUserWhenOnLoginPage = '/dashboard';
}
