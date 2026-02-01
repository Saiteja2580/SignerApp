import { Component, inject, signal, effect, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { PdfStateService } from '../../../services/pdf-state.service';
import { PdfViewerComponent } from '../../../components/pdf-viewer/pdf-viewer.component';
import { SignatureBoxComponent } from '../../../components/signature-box/signature-box.component';

@Component({
    selector: 'app-upload-position',
    standalone: true,
    imports: [CommonModule, PdfViewerComponent, SignatureBoxComponent],
    templateUrl: './upload-position.component.html'
})
export class UploadPositionComponent {
    pdfState = inject(PdfStateService);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    currentPage = signal(1);
    totalPages = signal(1);

    // Computed signal for PDF source as Uint8Array (only re-computes when binary data changes)
    pdfSrc = computed(() => {
        const base64 = this.pdfState.getPdfData();
        if (!base64) return null;

        try {
            console.log('Converting base64 to Uint8Array...');
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            console.log('Conversion successful, bytes length:', bytes.length);
            return bytes;
        } catch (error) {
            console.error('Error converting PDF to byte array:', error);
            return null;
        }
    });

    // Viewport metadata from PDF viewer
    pdfViewport = signal<{ width: number, height: number, scale: number, pdfHeight: number } | null>(null);

    // Computed signals for UI positioning (pixels)
    uiBoxX = computed(() => {
        const viewport = this.pdfViewport();
        const pts = this.pdfState.signature().x;
        const result = viewport ? pts * viewport.scale : pts;
        console.log('UploadPosition uiBoxX:', { pts, scale: viewport?.scale, result });
        return result;
    });

    uiBoxY = computed(() => {
        const viewport = this.pdfViewport();
        const signature = this.pdfState.signature();
        if (!viewport) return signature.y;

        // pts -> px and flip Y: viewport_height - (y_pts * scale) - (height_pts * scale)
        const result = viewport.height - (signature.y * viewport.scale) - (signature.height * viewport.scale);
        console.log('UploadPosition uiBoxY:', {
            ptsY: signature.y,
            ptsHeight: signature.height,
            viewportHeight: viewport.height,
            scale: viewport.scale,
            result
        });
        return result;
    });

    uiBoxWidth = computed(() => {
        const viewport = this.pdfViewport();
        const pts = this.pdfState.signature().width;
        const result = viewport ? pts * viewport.scale : pts;
        console.log('UploadPosition uiBoxWidth:', { pts, scale: viewport?.scale, result });
        return result;
    });

    uiBoxHeight = computed(() => {
        const viewport = this.pdfViewport();
        const pts = this.pdfState.signature().height;
        const result = viewport ? pts * viewport.scale : pts;
        console.log('UploadPosition uiBoxHeight:', { pts, scale: viewport?.scale, result });
        return result;
    });

    constructor() {
        // Track state changes for debugging
        effect(() => {
            const state = this.pdfState.signature();
            console.log('PDF State changed:', {
                hasPdf: this.pdfState.hasPdf(),
                fileName: state.fileName,
                currentPage: this.currentPage()
            });
        });
    }

    ngOnInit() {
        // Restore current page from state
        if (this.pdfState.signature().pageNumber) {
            this.currentPage.set(this.pdfState.signature().pageNumber);
        }
        const totalPages = this.pdfState.signature().totalPages;
        if (totalPages) {
            this.totalPages.set(totalPages);
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            this.toastr.error('Please upload a PDF file', 'Invalid File Type');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.toastr.error('File size must be less than 10MB', 'File Too Large');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            console.log('PDF converted, base64 length:', base64.length);

            // We'll get total pages from PDF viewer after load
            this.pdfState.setPdfData(base64, file.name, 1);
            console.log('State after setPdfData:', this.pdfState.signature());

            this.toastr.success('PDF uploaded successfully', 'Success');
        };
        reader.onerror = () => {
            this.toastr.error('Failed to read PDF file', 'Error');
        };
        reader.readAsDataURL(file);
    }

    onPdfLoaded(pdf: any) {
        const pages = pdf._pdfInfo?.numPages || 1;

        // Only update if value actually changed to prevent infinite loop
        if (this.totalPages() !== pages) {
            console.log('Total pages changed:', pages);
            this.totalPages.set(pages);
            this.pdfState.updateAppearance({ totalPages: pages });
        }
    }

    onPageRendered(event: any) {
        const viewport = event.source.viewport;
        console.log('Viewport Captured:', {
            width: viewport.width,
            height: viewport.height,
            scale: viewport.scale,
            pdfHeight: viewport.viewBox[3]
        });

        this.pdfViewport.set({
            width: viewport.width,
            height: viewport.height,
            scale: viewport.scale,
            pdfHeight: viewport.viewBox[3]
        });
    }

    onPositionChanged(position: { x: number; y: number }) {
        const viewport = this.pdfViewport();
        if (!viewport) {
            console.warn('Cannot convert position: viewport not captured yet');
            return;
        }

        const scale = viewport.scale;

        // Convert Pixels (Top-Left) to PDF Points (Bottom-Left)
        // x_pts = x_px / scale
        // y_pts = (page_height_px - y_px - box_height_px) / scale

        const uiWidth = this.uiBoxWidth();
        const uiHeight = this.uiBoxHeight();

        const pdfX = position.x / scale;
        const pdfY = (viewport.height - position.y - uiHeight) / scale;

        console.log('Coordinate Conversion:', {
            from_ui: { x: position.x, y: position.y },
            to_pdf: { x: pdfX, y: pdfY },
            scale: scale,
            viewport_height: viewport.height
        });

        this.pdfState.updatePosition({
            x: Math.round(pdfX),
            y: Math.round(pdfY),
            width: Math.round(uiWidth / scale),
            height: Math.round(uiHeight / scale),
            pageNumber: this.currentPage()
        });
    }

    onSizeChanged(size: { width: number; height: number }) {
        const viewport = this.pdfViewport();
        if (!viewport) {
            console.warn('Cannot convert size: viewport not captured yet');
            return;
        }

        const scale = viewport.scale;
        const pdfWidth = size.width / scale;
        const pdfHeight = size.height / scale;

        console.log('Size Conversion:', {
            from_ui: size,
            to_pdf: { width: pdfWidth, height: pdfHeight },
            scale: scale
        });

        this.pdfState.updateAppearance({
            width: Math.round(pdfWidth),
            height: Math.round(pdfHeight)
        });
    }

    previousPage() {
        if (this.currentPage() > 1) {
            this.currentPage.update(page => page - 1);
            this.pdfState.updateAppearance({ pageNumber: this.currentPage() });
        }
    }

    nextPage() {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(page => page + 1);
            this.pdfState.updateAppearance({ pageNumber: this.currentPage() });
        }
    }

    goToCustomize() {
        if (!this.pdfState.hasPdf()) {
            this.toastr.warning('Please upload a PDF first', 'No PDF');
            return;
        }
        this.router.navigate(['/sign/customize']);
    }
}
