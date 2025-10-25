import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogInfo } from '../models/confirmation-dialog-info';

@Injectable({
  providedIn: 'root',
})
export class UIDialogService {
  constructor(private dialog: MatDialog) {}

  public openConfirmationDialog(
    data: ConfirmationDialogInfo
  ): MatDialogRef<ConfirmationDialogComponent> {
    return this.dialog.open(ConfirmationDialogComponent, {
      width: '390px',
      disableClose: false,
      data: data,
    });
  }
}
