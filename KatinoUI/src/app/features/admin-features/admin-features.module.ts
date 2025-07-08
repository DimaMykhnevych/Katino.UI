import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/layout/material';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CoreModule } from 'src/app/core/core.module';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

@NgModule({
  declarations: [LoginComponent, AdminDashboardComponent],
  imports: [
    CommonModule,
    MaterialModule,
    CoreModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
})
export class AdminFeaturesModule {}
