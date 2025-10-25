export interface ConfirmationDialogInfo {
  titleKey: string;
  contentKey: string;
  contentParams?: any;
  confirmButtonTextKey?: string;
  cancelButtonTextKey?: string;
  type?: 'warning' | 'danger' | 'info';
  icon?: string;
}
