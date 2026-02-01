import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { PdfStateService } from '../../../services/pdf-state.service';
import { PdfViewerComponent } from '../../../components/pdf-viewer/pdf-viewer.component';

@Component({
    selector: 'app-success',
    standalone: true,
    imports: [CommonModule, PdfViewerComponent],
    templateUrl: './success.component.html'
})
export class SuccessComponent implements OnInit {
    private router = inject(Router);
    private toastr = inject(ToastrService);
    private pdfState = inject(PdfStateService);

    signedPdfBase64 = signal<string>('');
    fileName = signal<string>('signed.pdf');
    showPreview = signal(false);

    ngOnInit() {
        // Retrieve signed PDF from memory (PdfStateService)
        const signedPdf = this.pdfState.getSignedPdf();
        const filename = this.pdfState.signature().fileName;

        if (!signedPdf) {
            this.toastr.warning('No signed PDF found in memory', 'Warning');
            this.router.navigate(['/sign']);
            return;
        }

        this.signedPdfBase64.set(signedPdf);
        this.fileName.set(filename || 'signed.pdf');
    }

    togglePreview() {
        this.showPreview.update(show => !show);
    }

    downloadPdf() {
        try {
            const base64 = this.signedPdfBase64();

            // Convert base64 to blob
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `signed_${this.fileName()}`;
            link.click();

            // Cleanup
            window.URL.revokeObjectURL(url);

            this.toastr.success('PDF downloaded successfully', 'Success');
        } catch (error) {
            console.error('Download error:', error);
            this.toastr.error('Failed to download PDF', 'Error');
        }
    }

    signAnother() {
        this.clearSession();
        this.router.navigate(['/sign']);
        this.toastr.info('Ready to sign a new document', 'Info');
    }

    goToDashboard() {
        this.clearSession();
        this.router.navigate(['/dashboard']);
    }

    private clearSession() {
        this.pdfState.reset();
    }
}
