export interface ManageableUser {
  userId?: string;
  userName?: string;
  role?: string;
  email?: string;
  registryDate?: Date;
  isActive: boolean;
}
