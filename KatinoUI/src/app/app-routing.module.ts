import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/admin-features/components/login/login.component';
import { AdminDashboardComponent } from './features/admin-features/components/admin-dashboard/admin-dashboard.component';
import { AuthGuard } from './core/auth';
import { Roles } from './core/models/roles';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: {
      roles: [Roles.Admin],
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
