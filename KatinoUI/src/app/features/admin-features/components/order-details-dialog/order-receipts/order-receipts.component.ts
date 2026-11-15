import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { CheckboxReceiptKind } from 'src/app/core/enums/checkbox-receipt-kind';
import { CheckboxReceiptStatus } from 'src/app/core/enums/checkbox-receipt-status';
import { ReceiptStateHelper } from 'src/app/core/helpers/receipt-state.helper';
import { OrderReceipt } from 'src/app/core/models/order/receipt/order-receipt';
import { OrderService } from 'src/app/features/common-services/order.service';
import { DialogService } from 'src/app/features/common-services/dialog.service';
import { downloadBlob } from 'src/app/core/helpers/pdf-render.helper';

// The fiscal receipts issued for an order. Reloads whenever refreshKey changes.
@Component({
  selector: 'app-order-receipts',
  templateUrl: './order-receipts.component.html',
  styleUrls: ['./order-receipts.component.scss'],
})
export class OrderReceiptsComponent implements OnChanges, OnDestroy {
  @Input() public orderId!: string;
  @Input() public refreshKey = 0;
  // Emits the number of receipts after each load, so the parent can hide an empty section
  @Output() public loaded = new EventEmitter<number>();

  public receipts: OrderReceipt[] = [];
  public isLoading = false;
  public downloadingId: string | null = null;

  private _destroy$ = new Subject<void>();

  constructor(
    private _orderService: OrderService,
    private _dialogService: DialogService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
  ) {}

  public ngOnChanges(_: SimpleChanges): void {
    this.loadReceipts();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public getKindKey(kind: CheckboxReceiptKind): string {
    return `orders.receipt.kind.${CheckboxReceiptKind[kind]}`;
  }

  public getStatusKey(status: CheckboxReceiptStatus): string {
    return `orders.receipt.status.${CheckboxReceiptStatus[status]}`;
  }

  public getStatusBadgeClass(status: CheckboxReceiptStatus): string {
    switch (status) {
      case CheckboxReceiptStatus.done:
        return 'badge--success';
      case CheckboxReceiptStatus.failed:
        return 'badge--fail';
      case CheckboxReceiptStatus.pending:
      case CheckboxReceiptStatus.processing:
        return 'badge--progress';
      default:
        return 'badge--neutral';
    }
  }

  public getPdfIds(receipt: OrderReceipt): string[] {
    return receipt.pdfReceiptIds ?? [];
  }

  // A chain return can list several codes, ", "-separated: one per line
  public getFiscalCodes(receipt: OrderReceipt): string[] {
    return (receipt.fiscalCode ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }

  // The row click opens the only PDF; a row with several PDFs has a button per receipt instead
  public onRowClick(receipt: OrderReceipt): void {
    const ids = this.getPdfIds(receipt);
    if (ids.length === 1) this.onOpenPdf(receipt, 0);
  }

  // Opens the PDF in a dialog, like the scan sheets
  public onOpenPdf(receipt: OrderReceipt, index: number, event?: MouseEvent): void {
    event?.stopPropagation();
    const ids = this.getPdfIds(receipt);
    if (!ids[index]) return;
    this._dialogService.openReceiptPdfDialog({
      orderId: this.orderId,
      receipt,
      pdfReceiptId: ids[index],
      index,
      total: ids.length,
    });
  }

  // Same as the scan sheet download: the PDF goes through the backend as a blob
  public onDownloadPdf(receipt: OrderReceipt, event: MouseEvent): void {
    // The row click opens the preview dialog
    event.stopPropagation();
    const pdfReceiptId = this.getPdfIds(receipt)[0];
    if (this.downloadingId || !pdfReceiptId) return;

    this.downloadingId = receipt.id;
    this._orderService
      .getReceiptPdf(this.orderId, pdfReceiptId)
      .pipe(
        finalize(() => (this.downloadingId = null)),
        takeUntil(this._destroy$),
      )
      .subscribe({
        next: ({ blob }) =>
          downloadBlob(blob, `receipt-${receipt.fiscalCode ?? receipt.id}.pdf`),
        error: async (err: HttpErrorResponse) => {
          const code = await ReceiptStateHelper.getErrorCode(err);
          this._toastr.error(
            this._translate.instant(ReceiptStateHelper.getPdfErrorKey(code)),
          );
        },
      });
  }

  private loadReceipts(): void {
    if (!this.orderId) return;

    this.isLoading = true;
    this._orderService
      .getReceipts(this.orderId)
      .pipe(
        catchError(() => {
          this._toastr.error(
            this._translate.instant('orders.receipt.errors.listFailed'),
          );
          return of([] as OrderReceipt[]);
        }),
        finalize(() => (this.isLoading = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((receipts) => {
        this.receipts = receipts ?? [];
        this.loaded.emit(this.receipts.length);
      });
  }
}
