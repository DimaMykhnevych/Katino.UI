// The worker is copied to assets by angular.json
const PDF_WORKER_SRC = 'assets/pdfjs/pdf.worker.min.js';

// Rendered above screen resolution so barcodes and QR codes stay sharp
const MIN_RENDER_SCALE = 2;

// Renders every page of a PDF to a PNG data URL: mobile browsers can't show a PDF inside a page
export async function renderPdfPages(blob: Blob): Promise<string[]> {
  // pdf.js is loaded lazily so it doesn't grow the main bundle
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

  const data = new Uint8Array(await blob.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const scale = Math.max(MIN_RENDER_SCALE, window.devicePixelRatio || 1);
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: canvas.getContext('2d')!, viewport })
        .promise;
      pages.push(canvas.toDataURL('image/png'));
    }
  } finally {
    pdf.destroy();
  }

  return pages;
}

// Starts a browser download of a blob
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // Revoked on the next tick so the browser has started the download
  setTimeout(() => URL.revokeObjectURL(url));
}
