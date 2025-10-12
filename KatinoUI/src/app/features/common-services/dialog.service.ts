import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddEditProductVariantData } from '../admin-features/models/add-edit-product-variant-data';
import { AddProductVariantDialogComponent } from '../admin-features/components/add-product-variant-dialog/add-product-variant-dialog.component';
import { AddEditProductData } from '../admin-features/models/add-edit-product-data';
import { AddEditProductDialogComponent } from '../admin-features/components/add-edit-product-dialog/add-edit-product-dialog.component';
import { AddEditCategoryData } from '../admin-features/models/add-edit-category-data';
import { AddEditCategoryDialogComponent } from '../admin-features/components/add-edit-category-dialog/add-edit-category-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  public openAddEditProductVariantDialog(
    data: AddEditProductVariantData
  ): MatDialogRef<AddProductVariantDialogComponent> {
    return this.dialog.open(AddProductVariantDialogComponent, {
      width: '800px',
      disableClose: true,
      data: data,
    });
  }

  public openAddEditProductDialog(
    data: AddEditProductData
  ): MatDialogRef<AddEditProductDialogComponent> {
    return this.dialog.open(AddEditProductDialogComponent, {
      width: '750px',
      disableClose: true,
      data: data,
    });
  }

  public openAddEditCategoryDialog(
    data: AddEditCategoryData
  ): MatDialogRef<AddEditCategoryDialogComponent> {
    return this.dialog.open(AddEditCategoryDialogComponent, {
      width: '300px',
      disableClose: true,
      data: data,
    });
  }
}
