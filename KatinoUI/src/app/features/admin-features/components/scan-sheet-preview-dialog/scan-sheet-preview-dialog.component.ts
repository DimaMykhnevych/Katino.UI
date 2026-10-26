import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ScanSheetGroupResult } from 'src/app/core/models/nova-post/scan-sheet-result';
import { NovaPostService } from 'src/app/features/common-services/nova-post.service';

// The worker is copied to assets by angular.json
const PDF_WORKER_SRC = 'assets/pdfjs/pdf.worker.min.js';

// Rendered above screen resolution so the barcode stays sharp for the scanner
const MIN_RENDER_SCALE = 2;

interface ScanSheetPreview {
  group: ScanSheetGroupResult;
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

  private _destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) groups: ScanSheetGroupResult[],
    private _novaPostService: NovaPostService,
  ) {
    this.sheets = groups.map((group) => ({
      group,
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

    const url = URL.createObjectURL(sheet.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan-sheet-${sheet.group.scanSheetNumber ?? sheet.group.scanSheetRef}.pdf`;
    link.click();
    // Revoked on the next tick so the browser has started the download
    setTimeout(() => URL.revokeObjectURL(url));
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  // The PDF is fetched through the backend because NP's print URL contains the API key
  private loadSheet(sheet: ScanSheetPreview): void {
    this._novaPostService
      .getScanSheetPdf(sheet.group.npApiKeyId!, sheet.group.scanSheetRef!)
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
        this.renderPages(sheet, blob)
          .then(() => (sheet.isLoading = false))
          .catch(() => this.markFailed(sheet));
      });
  }

  // Pages are rendered to images because mobile browsers can't show a PDF inside a page
  private async renderPages(sheet: ScanSheetPreview, blob: Blob): Promise<void> {
    // pdf.js is loaded lazily so it doesn't grow the main bundle
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

    const data = new Uint8Array(await blob.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const scale = Math.max(MIN_RENDER_SCALE, window.devicePixelRatio || 1);

    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
        sheet.pages.push(canvas.toDataURL('image/png'));
      }
    } finally {
      pdf.destroy();
    }
  }

  private markFailed(sheet: ScanSheetPreview): void {
    sheet.isLoading = false;
    sheet.failed = true;
  }
}
