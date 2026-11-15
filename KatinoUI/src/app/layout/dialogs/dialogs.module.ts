import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [ConfirmationDialogComponent],
  imports: [CommonModule, MaterialModule, TranslateModule, FormsModule],
})
export class DialogsModule {}
