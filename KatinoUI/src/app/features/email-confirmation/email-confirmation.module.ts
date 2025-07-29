import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationScreenComponent } from './confirmation-screen/confirmation-screen.component';
import { MaterialModule } from 'src/app/layout/material';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [ConfirmationScreenComponent],
  imports: [CommonModule, MaterialModule, AppRoutingModule, TranslateModule],
})
export class EmailConfirmationModule {}
