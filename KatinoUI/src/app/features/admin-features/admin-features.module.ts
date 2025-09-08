import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/layout/material';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CoreModule } from 'src/app/core/core.module';
import { LoginComponent } from './components/login/login.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { SpinnerModule } from 'src/app/layout/spinner/spinner.module';

@NgModule({
  declarations: [LoginComponent, InventoryComponent],
  imports: [
    CommonModule,
    MaterialModule,
    CoreModule,
    TranslateModule,
    ReactiveFormsModule,
    SpinnerModule,
  ],
})
export class AdminFeaturesModule {}
