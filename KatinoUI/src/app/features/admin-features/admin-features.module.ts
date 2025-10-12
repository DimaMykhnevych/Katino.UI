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

@NgModule({
  declarations: [
    LoginComponent,
    InventoryComponent,
    AddProductVariantDialogComponent,
    AddEditProductDialogComponent,
    AddEditCategoryDialogComponent,
  ],
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
