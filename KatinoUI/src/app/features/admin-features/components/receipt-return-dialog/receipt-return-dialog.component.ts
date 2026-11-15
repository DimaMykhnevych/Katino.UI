import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ReceiptReturnInfo } from 'src/app/core/models/order/receipt/receipt-return-info';
import { OrderService } from 'src/app/features/common-services/order.service';

export interface ReceiptReturnDialogData {
  orderId: string;
  info: ReceiptReturnInfo;
}

// Closes with true when the order should be reloaded (the return was accepted, or the order changed meanwhile)
@Component({
  selector: 'app-receipt-return-dialog',
  templateUrl: './receipt-return-dialog.component.html',
  styleUrls: ['./receipt-return-dialog.component.scss'],
})
export class ReceiptReturnDialogComponent {
  public readonly info: ReceiptReturnInfo;
  public readonly showGuarantee: boolean;
  public readonly guarantee: FormControl;
  public isSubmitting = false;
  // A server rejection shown under the guarantee input
  public serverErrorKey: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: ReceiptReturnDialogData,
    private _ref: MatDialogRef<ReceiptReturnDialogComponent, boolean>,
    private _orderService: OrderService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
  ) {
    this.info = _data.info;
    this.showGuarantee = this.info.maxGuaranteeAmount > 0;
    this.guarantee = new FormControl(this.info.defaultGuaranteeAmount, [
      Validators.required,
      Validators.min(0),
      Validators.max(this.info.maxGuaranteeAmount),
      // At most 2 decimals; the input is type="number", so the value is a number
      Validators.pattern(/^\d+(\.\d{1,2})?$/),
    ]);
    this.guarantee.valueChanges.subscribe(() => (this.serverErrorKey = null));
  }

  public get guaranteeValue(): number {
    if (!this.showGuarantee) return 0;
    const value = Number(this.guarantee.value);
    return isNaN(value) ? 0 : value;
  }

  public get refundToClient(): number {
    const value =
      this.info.returnAmount - this.info.remainderAmount - this.guaranteeValue;
    return Math.round(value * 100) / 100;
  }

  public get canSubmit(): boolean {
    return !this.isSubmitting && (!this.showGuarantee || this.guarantee.valid);
  }

  public onSubmit(): void {
    if (!this.canSubmit) return;

    this.isSubmitting = true;
    this.serverErrorKey = null;
    const guaranteeAmount = this.showGuarantee ? this.guaranteeValue : null;

    this._orderService
      .returnReceipt(this._data.orderId, guaranteeAmount)
      .subscribe({
        next: () => {
          this._toastr.success(
            this._translate.instant('orders.receipt.returnAccepted'),
          );
          this._ref.close(true);
        },
        error: (err: HttpErrorResponse) => this.onError(err),
      });
  }

  public onCancel(): void {
    this._ref.close(false);
  }

  private onError(err: HttpErrorResponse): void {
    this.isSubmitting = false;
    const code: string | undefined = err?.error?.error;

    if (err?.status === 400) {
      // guaranteeTooLarge, or model validation (negative or more than 2 decimals)
      this.serverErrorKey =
        code === 'guaranteeTooLarge'
          ? 'orders.receipt.errors.guaranteeTooLarge'
          : 'orders.receipt.errors.invalidGuarantee';
      return;
    }

    if (err?.status === 404 || err?.status === 409) {
      this._toastr.warning(
        this._translate.instant(
          code === 'receiptTaskNotFound'
            ? 'orders.receipt.errors.receiptTaskNotFound'
            : 'orders.receipt.errors.notAwaitingReturn',
        ),
      );
      this._ref.close(true);
      return;
    }

    this._toastr.error(
      this._translate.instant('orders.receipt.errors.returnFailed'),
    );
  }
}
