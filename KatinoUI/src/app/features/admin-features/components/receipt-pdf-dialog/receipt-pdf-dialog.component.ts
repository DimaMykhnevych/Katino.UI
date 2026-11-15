import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CheckboxReceiptKind } from 'src/app/core/enums/checkbox-receipt-kind';
import {
  downloadBlob,
  renderPdfPages,
} from 'src/app/core/helpers/pdf-render.helper';
import { ReceiptStateHelper } from 'src/app/core/helpers/receipt-state.helper';
import { OrderReceipt } from 'src/app/core/models/order/receipt/order-receipt';
import { OrderService } from 'src/app/features/common-services/order.service';

export interface ReceiptPdfDialogData {
  orderId: string;
  receipt: OrderReceipt;
  // One of receipt.pdfReceiptIds
  pdfReceiptId: string;
  // 0-based position in pdfReceiptIds and their count: a row with several PDFs shows "Чек N"
  index: number;
  total: number;
}

// Shows a receipt PDF as page images, the same way as the scan sheet preview
@Component({
  selector: 'app-receipt-pdf-dialog',
  templateUrl: './receipt-pdf-dialog.component.html',
  styleUrls: ['./receipt-pdf-dialog.component.scss'],
})
export class ReceiptPdfDialogComponent implements OnInit, OnDestroy {
  public readonly receipt: OrderReceipt;
  public pages: string[] = [];
  public blob: Blob | null = null;
  public receiptUrl: string | null = null;
  public isLinkCopied = false;
  public isLoading = true;
  public errorKey: string | null = null;

  private _destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: ReceiptPdfDialogData,
    private _orderService: OrderService,
  ) {
    this.receipt = _data.receipt;
  }

  public get isOneOfSeveral(): boolean {
    return this._data.total > 1;
  }

  public get receiptNumber(): number {
    return this._data.index + 1;
  }

  public get receiptTotal(): number {
    return this._data.total;
  }

  public get kindKey(): string {
    return `orders.receipt.kind.${CheckboxReceiptKind[this.receipt.kind]}`;
  }

  public ngOnInit(): void {
    this._orderService
      .getReceiptPdf(this._data.orderId, this._data.pdfReceiptId)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: ({ blob, receiptUrl }) => {
          this.blob = blob;
          this.receiptUrl = receiptUrl;
          renderPdfPages(blob)
            .then((pages) => {
              this.pages = pages;
              this.isLoading = false;
            })
            .catch(() => this.fail('orders.receipt.errors.pdfFailed'));
        },
        error: async (err: HttpErrorResponse) => {
          const code = await ReceiptStateHelper.getErrorCode(err);
          this.fail(ReceiptStateHelper.getPdfErrorKey(code));
        },
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onDownload(): void {
    if (!this.blob) return;
    downloadBlob(
      this.blob,
      // A row with several PDFs has several fiscal codes, so the file is named by the receipt itself
      `receipt-${
        this.isOneOfSeveral
          ? this._data.pdfReceiptId
          : (this.receipt.fiscalCode ?? this._data.pdfReceiptId)
      }.pdf`,
    );
  }

  // Same clipboard call as the TTN copy in the order details
  public onCopyLink(): void {
    if (!this.receiptUrl || !navigator?.clipboard?.writeText) return;
    navigator.clipboard.writeText(this.receiptUrl).then(() => {
      this.isLinkCopied = true;
      setTimeout(() => (this.isLinkCopied = false), 1500);
    });
  }

  private fail(errorKey: string): void {
    this.isLoading = false;
    this.errorKey = errorKey;
  }
}
