import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { PdfStateService } from '../../../services/pdf-state.service';
import { SignatureService } from '../../../services/signature.service';
import { PdfViewerComponent } from '../../../components/pdf-viewer/pdf-viewer.component';
import { SignatureSelectorComponent, SignatureData as SelectorData } from '../../../components/signature-selector/signature-selector.component';
import { SignatureRequest } from '../../../models/signature.model';

@Component({
    selector: 'app-customize',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, PdfViewerComponent, SignatureSelectorComponent],
    templateUrl: './customize.component.html'
})
export class CustomizeComponent implements OnInit {
    pdfState = inject(PdfStateService);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private signatureService = inject(SignatureService);
    private toastr = inject(ToastrService);

    customizeForm!: FormGroup;
    isLoading = signal(false);
    signedPdfBase64 = signal<string>('');
    selectedSignature = signal<SelectorData | null>(null);

    // Computed signal for PDF source as Uint8Array (only re-computes when binary data changes)
    pdfSrc = computed(() => {
        const base64 = this.pdfState.getPdfData();
        if (!base64) return null;

        try {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        } catch (error) {
            console.error('Error converting PDF in Customize:', error);
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
        console.log('Customize uiBoxX:', { pts, scale: viewport?.scale, result });
        return result;
    });

    uiBoxY = computed(() => {
        const viewport = this.pdfViewport();
        const signature = this.pdfState.signature();
        if (!viewport) return signature.y;
        const result = viewport.height - (signature.y * viewport.scale) - (signature.height * viewport.scale);
        console.log('Customize uiBoxY:', {
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
        console.log('Customize uiBoxWidth:', { pts, scale: viewport?.scale, result });
        return result;
    });

    uiBoxHeight = computed(() => {
        const viewport = this.pdfViewport();
        const pts = this.pdfState.signature().height;
        const result = viewport ? pts * viewport.scale : pts;
        console.log('Customize uiBoxHeight:', { pts, scale: viewport?.scale, result });
        return result;
    });

    ngOnInit() {
        // Check if PDF exists
        if (!this.pdfState.hasPdf()) {
            this.toastr.warning('Please upload a PDF first', 'No PDF');
            this.router.navigate(['/sign']);
            return;
        }

        // Initialize form with values from state
        const state = this.pdfState.signature();
        this.customizeForm = this.fb.group({
            role: [state.role, [Validators.required, Validators.minLength(2)]],
            reason: [state.reason, [Validators.required, Validators.minLength(2)]],
            location: [state.location, [Validators.required, Validators.minLength(2)]],
            fontSize: [state.fontSize, [Validators.required, Validators.min(8), Validators.max(20)]],
            borderColor: [state.borderColor, Validators.required],
            fontColor: [state.fontColor, Validators.required]
        });

        // Auto-save form changes to state
        this.customizeForm.valueChanges.subscribe(values => {
            this.pdfState.updateSigningDetails(values);
            this.pdfState.updateAppearance(values);
        });
    }

    onPageRendered(event: any) {
        const viewport = event.source.viewport;
        console.log('Customize Page: Viewport Captured:', {
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

    onSignatureChange(data: SelectorData) {
        console.log('Signature selector changed:', data);
        this.selectedSignature.set(data);

        // Update state with image data in secure memory
        if (data.mode === 'type' && data.textData) {
            this.pdfState.setSignatureImage(data.textData.base64);
            this.pdfState.updateSigningDetails({
                signatureText: data.textData.text,
                signatureFont: data.textData.font
            });
        } else if (data.base64Image) {
            this.pdfState.setSignatureImage(data.base64Image);
            this.pdfState.updateSigningDetails({ signatureText: undefined, signatureFont: undefined });
        } else {
            this.pdfState.setSignatureImage(null);
            this.pdfState.updateSigningDetails({ signatureText: undefined, signatureFont: undefined });
        }
    }

    goBack() {
        // Save current form values before navigating
        this.pdfState.updateSigningDetails(this.customizeForm.value);
        this.router.navigate(['/sign']);
    }

    async signDocument() {
        if (this.customizeForm.invalid) {
            this.customizeForm.markAllAsTouched();
            this.toastr.warning('Please fill in all required fields', 'Validation Error');
            return;
        }

        const signature = this.selectedSignature();
        if (!signature) {
            this.toastr.warning('Please select a signature style', 'Signature Required');
            return;
        }

        if (signature.mode !== 'standard' && !signature.base64Image && !signature.textData) {
            this.toastr.warning('Please create or upload a signature first', 'Signature Required');
            return;
        }

        this.isLoading.set(true);

        try {
            // Update state with final form values
            this.pdfState.updateSigningDetails(this.customizeForm.value);

            const state = this.pdfState.signature();

            const pdfData = this.pdfState.getPdfData();
            if (!pdfData) {
                this.toastr.error('PDF data lost. Please re-upload.', 'Error');
                return;
            }

            // Prepare request matching backend DTO
            const request: SignatureRequest = {
                pageNumber: state.pageNumber,
                x: state.x,
                y: state.y,
                width: state.width,
                height: state.height,
                borderColor: this.customizeForm.value.borderColor,
                fontSize: this.customizeForm.value.fontSize,
                fontStyle: state.fontStyle,
                fontColor: this.customizeForm.value.fontColor,
                role: this.customizeForm.value.role,
                reason: this.customizeForm.value.reason,
                location: this.customizeForm.value.location,
                base64Pdf: pdfData,
                // Retrieve actual graphical signature from secure memory
                signatureImage: this.pdfState.getSignatureImage() || undefined,
                // Metadata for the typed signature (if applicable)
                signatureText: state.signatureText,
                signatureFont: state.signatureFont
            };

            // Call backend API
            const response = await firstValueFrom(
                this.signatureService.signPdf(request)
            );

            // Store signed PDF in memory (service signal) for success page
            this.pdfState.setSignedPdf(response.data);

            // Navigate to success page
            this.router.navigate(['/sign/success']);

        } catch (error: any) {
            console.error('Signing error:', error);
            this.toastr.error(error.message || 'Failed to sign PDF', 'Error');
        } finally {
            this.isLoading.set(false);
        }
    }
}
