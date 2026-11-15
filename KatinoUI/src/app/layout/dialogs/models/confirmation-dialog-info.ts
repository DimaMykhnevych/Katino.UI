export interface ConfirmationDialogInfo {
  titleKey: string;
  contentKey: string;
  contentParams?: any;
  confirmButtonTextKey?: string;
  cancelButtonTextKey?: string;
  type?: 'warning' | 'danger' | 'info';
  icon?: string;
  // Optional checkbox under the content; its state is read back from checkboxChecked after the dialog closes
  checkboxLabelKey?: string;
  checkboxChecked?: boolean;
}
