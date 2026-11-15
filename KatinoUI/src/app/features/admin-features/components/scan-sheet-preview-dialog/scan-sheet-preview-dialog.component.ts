import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import {
  ScanSheetList,
  ScanSheetListItem,
} from 'src/app/core/models/nova-post/scan-sheet-list';
import { NovaPostService } from 'src/app/features/common-services/nova-post.service';
import {
  downloadBlob,
  renderPdfPages,
} from 'src/app/core/helpers/pdf-render.helper';

interface ScanSheetPreview {
  item: ScanSheetListItem;
  pages: string[];
  isLoading: boolean;
  failed: boolean;
  blob: Blob | null;
}

@Component({
  selector: 'app-scan-sheet-preview-dialog',
  templateUrl: './scan-sheet-preview-dialog.component.html',
  styleUrls: ['./scan-sheet-preview-dialog.component.scss'],
})
export class ScanSheetPreviewDialogComponent implements OnInit, OnDestroy {
  public sheets: ScanSheetPreview[];
  public hasErrors: boolean;

  private _destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) data: ScanSheetList,
    private _novaPostService: NovaPostService,
  ) {
    this.hasErrors = data.hasErrors;
    this.sheets = data.scanSheets.map((item) => ({
      item,
      pages: [],
      isLoading: true,
      failed: false,
      blob: null,
    }));
  }

  public ngOnInit(): void {
    this.sheets.forEach((sheet) => this.loadSheet(sheet));
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onDownload(sheet: ScanSheetPreview): void {
    if (!sheet.blob) return;

    downloadBlob(
      sheet.blob,
      `scan-sheet-${sheet.item.scanSheetNumber ?? sheet.item.scanSheetRef}.pdf`,
    );
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  // The PDF is fetched through the backend because NP's print URL contains the API key
  private loadSheet(sheet: ScanSheetPreview): void {
    this._novaPostService
      .getScanSheetPdf(sheet.item.npApiKeyId, sheet.item.scanSheetRef)
      .pipe(
        catchError(() => of(null)),
        takeUntil(this._destroy$),
      )
      .subscribe((blob: Blob | null) => {
        if (!blob) {
          this.markFailed(sheet);
          return;
        }

        sheet.blob = blob;
        renderPdfPages(blob)
          .then((pages) => {
            sheet.pages = pages;
            sheet.isLoading = false;
          })
          .catch(() => this.markFailed(sheet));
      });
  }

  private markFailed(sheet: ScanSheetPreview): void {
    sheet.isLoading = false;
    sheet.failed = true;
  }
}
