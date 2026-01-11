import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/layout/material';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CoreModule } from 'src/app/core/core.module';
import { LoginComponent } from './components/login/login.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { SpinnerModule } from 'src/app/layout/spinner/spinner.module';
import { AddProductVariantDialogComponent } from './components/add-product-variant-dialog/add-product-variant-dialog.component';
import { AddEditProductDialogComponent } from './components/add-edit-product-dialog/add-edit-product-dialog.component';
import { AddEditCategoryDialogComponent } from './components/add-edit-category-dialog/add-edit-category-dialog.component';
import { AddSizeDialogComponent } from './components/add-size-dialog/add-size-dialog.component';
import { AddEditColorDialogComponent } from './components/add-edit-color-dialog/add-edit-color-dialog.component';
import { DialogsModule } from 'src/app/layout/dialogs/dialogs.module';
import { OrdersComponent } from './components/orders/orders.component';
import { CrmSettingsComponent } from './components/crm-settings/crm-settings.component';
import { CommonComponentsModule } from 'src/app/features/common-components/common-components.module';

@NgModule({
  declarations: [
    LoginComponent,
    InventoryComponent,
    AddProductVariantDialogComponent,
    AddEditProductDialogComponent,
    AddEditCategoryDialogComponent,
    AddSizeDialogComponent,
    AddEditColorDialogComponent,
    OrdersComponent,
    CrmSettingsComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    CoreModule,
    TranslateModule,
    ReactiveFormsModule,
    SpinnerModule,
    DialogsModule,
    CommonComponentsModule,
  ],
})
export class AdminFeaturesModule {}
