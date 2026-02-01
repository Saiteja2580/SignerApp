import { Component, input, output, effect, ElementRef, viewChild, AfterViewInit } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [],
  template: `
    <div class="pdf-viewer-container bg-white border border-gray-200 rounded-lg relative">
      <canvas #pdfCanvas class="block w-full"></canvas>

      @if (isLoading) {
        <div class="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-50">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .pdf-viewer-container {
      width: 100%;
    }
    canvas {
      display: block;
      width: 100%;
      height: auto;
    }
  `]
})
export class PdfViewerComponent implements AfterViewInit {
  isLoading = true;

  pdfSrc = input.required<any>();
  currentPage = input<number>(1);
  zoom = input<number>(1.5);

  pdfLoaded = output<any>();
  pageRendered = output<any>();
  pdfError = output<any>();

  pdfCanvas = viewChild<ElementRef>('pdfCanvas');

  private pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  private currentRenderedPage = 0;

  constructor() {
    // Effect to reload PDF when source changes
    effect(() => {
      const src = this.pdfSrc();
      if (src) {
        this.loadPdf(src);
      }
    });

    // Effect to re-render when page changes
    effect(() => {
      const page = this.currentPage();
      if (this.pdfDoc && page !== this.currentRenderedPage) {
        this.renderPage(page);
      }
    });
  }

  ngAfterViewInit() {
    // Initial load will be triggered by the effect
  }

  private async loadPdf(src: any) {
    this.isLoading = true;

    try {
      let loadingTask: pdfjsLib.PDFDocumentLoadingTask;

      if (src instanceof Uint8Array) {
        loadingTask = pdfjsLib.getDocument({ data: src });
      } else if (typeof src === 'string') {
        if (src.startsWith('data:application/pdf;base64,')) {
          const base64 = src.replace('data:application/pdf;base64,', '');
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else {
          loadingTask = pdfjsLib.getDocument(src);
        }
      } else {
        loadingTask = pdfjsLib.getDocument({ data: src });
      }

      this.pdfDoc = await loadingTask.promise;
      console.log('PDF Viewer: Loaded successfully', { numPages: this.pdfDoc.numPages });

      this.pdfLoaded.emit({ _pdfInfo: { numPages: this.pdfDoc.numPages } });
      await this.renderPage(this.currentPage());
    } catch (error) {
      console.error('PDF Viewer: Error loading PDF', error);
      this.isLoading = false;
      this.pdfError.emit(error);
    }
  }

  private async renderPage(pageNum: number) {
    if (!this.pdfDoc) return;

    const canvas = this.pdfCanvas()?.nativeElement;
    if (!canvas) return;

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: this.zoom() });

      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      this.currentRenderedPage = pageNum;
      this.isLoading = false;

      // PDF.js viewBox is [minX, minY, maxX, maxY] (bounds format)
      // ng2-pdf-viewer expected [0, 0, width, height] where viewBox[3] is page height
      const pdfWidth = viewport.viewBox[2] - viewport.viewBox[0];
      const pdfHeight = viewport.viewBox[3] - viewport.viewBox[1];

      // CRITICAL: Get the ACTUAL displayed size of the canvas after CSS scaling
      // The canvas has CSS "width: 100%" which scales it to fit the container
      // The signature box is positioned using screen pixels, so we need the displayed size
      const displayedRect = canvas.getBoundingClientRect();
      const displayedWidth = displayedRect.width;
      const displayedHeight = displayedRect.height;

      // Calculate the effective scale: displayed pixels per PDF point
      const effectiveScale = displayedWidth / pdfWidth;

      console.log('PDF Viewer: Page rendered', {
        pageNumber: pageNum,
        canvasInternalWidth: viewport.width,
        canvasInternalHeight: viewport.height,
        displayedWidth: displayedWidth,
        displayedHeight: displayedHeight,
        effectiveScale: effectiveScale,
        pdfPageWidth: pdfWidth,
        pdfPageHeight: pdfHeight
      });

      // Emit pageRendered with the DISPLAYED dimensions (what the user sees)
      // This ensures the coordinate conversion uses the correct scale
      this.pageRendered.emit({
        pageNumber: pageNum,
        source: {
          viewport: {
            width: displayedWidth,      // Displayed pixel width (after CSS scaling)
            height: displayedHeight,    // Displayed pixel height (after CSS scaling)
            scale: effectiveScale,      // Effective scale: displayed pixels / PDF points
            viewBox: [0, 0, pdfWidth, pdfHeight]  // [0, 0, pageWidth, pageHeight] in PDF points
          }
        }
      });
    } catch (error) {
      console.error('PDF Viewer: Error rendering page', error);
      this.isLoading = false;
      this.pdfError.emit(error);
    }
  }
}
