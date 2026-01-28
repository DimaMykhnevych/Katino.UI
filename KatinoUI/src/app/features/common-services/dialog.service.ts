import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddEditProductVariantData } from '../admin-features/models/add-edit-product-variant-data';
import { AddProductVariantDialogComponent } from '../admin-features/components/add-product-variant-dialog/add-product-variant-dialog.component';
import { AddEditProductData } from '../admin-features/models/add-edit-product-data';
import { AddEditProductDialogComponent } from '../admin-features/components/add-edit-product-dialog/add-edit-product-dialog.component';
import { AddEditCategoryData } from '../admin-features/models/add-edit-category-data';
import { AddEditCategoryDialogComponent } from '../admin-features/components/add-edit-category-dialog/add-edit-category-dialog.component';
import { AddSizeDialogComponent } from '../admin-features/components/add-size-dialog/add-size-dialog.component';
import { AddEditColorData } from '../admin-features/models/add-edit-color-data';
import { AddEditColorDialogComponent } from '../admin-features/components/add-edit-color-dialog/add-edit-color-dialog.component';
import { Order } from 'src/app/core/models/order/order';
import { OrderDetailsDialogComponent } from '../admin-features/components/order-details-dialog/order-details-dialog.component';
import { AddEditOrderDialogComponent } from '../admin-features/components/add-edit-order-dialog/add-edit-order-dialog.component';
import { AddEditOrderData } from '../admin-features/models/order/add-edit-order-data';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  public openAddEditProductVariantDialog(
    data: AddEditProductVariantData,
  ): MatDialogRef<AddProductVariantDialogComponent> {
    return this.dialog.open(AddProductVariantDialogComponent, {
      width: '800px',
      disableClose: true,
      data: data,
    });
  }

  public openAddEditProductDialog(
    data: AddEditProductData,
  ): MatDialogRef<AddEditProductDialogComponent> {
    return this.dialog.open(AddEditProductDialogComponent, {
      width: '750px',
      disableClose: true,
      data: data,
    });
  }

  public openAddEditCategoryDialog(
    data: AddEditCategoryData,
  ): MatDialogRef<AddEditCategoryDialogComponent> {
    return this.dialog.open(AddEditCategoryDialogComponent, {
      width: '300px',
      disableClose: true,
      data: data,
    });
  }

  public openAddSizeDialog(): MatDialogRef<AddSizeDialogComponent> {
    return this.dialog.open(AddSizeDialogComponent, {
      width: '300px',
      disableClose: true,
    });
  }

  public openAddEditColorDialog(
    data: AddEditColorData,
  ): MatDialogRef<AddEditColorDialogComponent> {
    return this.dialog.open(AddEditColorDialogComponent, {
      width: '300px',
      disableClose: true,
      data: data,
    });
  }

  public openOrderDetailsDialog(
    data: Order,
  ): MatDialogRef<OrderDetailsDialogComponent> {
    return this.dialog.open(OrderDetailsDialogComponent, {
      width: '850px',
      disableClose: false,
      autoFocus: false,
      data: data,
    });
  }

  public openAddEditOrderDialog(
    data: AddEditOrderData,
  ): MatDialogRef<AddEditOrderDialogComponent> {
    return this.dialog.open(AddEditOrderDialogComponent, {
      width: '800px',
      disableClose: true,
      data: data,
    });
  }
}
