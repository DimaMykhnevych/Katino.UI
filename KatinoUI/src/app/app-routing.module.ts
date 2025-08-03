import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/admin-features/components/login/login.component';
import { InventoryComponent } from './features/admin-features/components/inventory/inventory.component';
import { AuthGuard } from './core/auth';
import { Roles } from './core/models/roles';
import { ConfirmationScreenComponent } from './features/email-confirmation/confirmation-screen/confirmation-screen.component';
import { SidenavComponent } from './layout/sidenav/sidenav.component';

const routes: Routes = [
  {
    path: '',
    component: SidenavComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'inventory',
        component: InventoryComponent,
        data: {
          roles: [Roles.Admin],
        },
      },
    ],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'emailConfirmation',
    component: ConfirmationScreenComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
