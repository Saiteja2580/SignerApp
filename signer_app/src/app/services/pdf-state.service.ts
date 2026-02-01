import { Injectable, signal } from '@angular/core';
import { SignatureData, SignatureBox } from '../models/signature.model';

@Injectable({
    providedIn: 'root'
})
export class PdfStateService {
    private readonly STORAGE_KEY = 'pdf_signature_state';

    private signatureData = signal<SignatureData>(
        this.loadFromSession() || this.getDefaultState()
    );

    // Memory-only storage for large binary data (prevents QuotaExceededError and improves security)
    private originalPdfData = signal<string | null>(null);
    private signedPdfResult = signal<string | null>(null);
    private signatureImageResult = signal<string | null>(null);

    readonly signature = this.signatureData.asReadonly();

    constructor() {
        // Auto-save on browser close
        window.addEventListener('beforeunload', () => {
            this.saveToSession();
        });
    }

    updatePosition(box: SignatureBox) {
        this.signatureData.update(state => ({
            ...state,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            pageNumber: box.pageNumber
        }));
        this.saveToSession();
    }

    updateAppearance(appearance: Partial<SignatureData>) {
        this.signatureData.update(state => ({ ...state, ...appearance }));
        this.saveToSession();
    }

    updateSigningDetails(details: Partial<SignatureData>) {
        this.signatureData.update(state => ({ ...state, ...details }));
        this.saveToSession();
    }

    setPdfData(base64: string, fileName: string, totalPages: number) {
        this.signatureData.update(state => ({
            ...state,
            fileName,
            totalPages
        }));
        this.originalPdfData.set(base64);
        this.saveToSession();
    }

    getPdfData(): string | null {
        return this.originalPdfData();
    }

    setSignedPdf(base64: string) {
        this.signedPdfResult.set(base64);
    }

    getSignedPdf(): string | null {
        return this.signedPdfResult();
    }

    setSignatureImage(base64: string | null) {
        this.signatureImageResult.set(base64);
        // Ensure metadata reflects that an image is being used
        this.signatureData.update(state => ({
            ...state,
            signatureImage: undefined // Keep out of persisted state
        }));
    }

    getSignatureImage(): string | null {
        return this.signatureImageResult();
    }

    reset() {
        sessionStorage.removeItem(this.STORAGE_KEY);
        this.signatureData.set(this.getDefaultState());
        this.originalPdfData.set(null);
        this.signedPdfResult.set(null);
        this.signatureImageResult.set(null);
    }

    hasPdf(): boolean {
        return !!this.originalPdfData();
    }

    private saveToSession() {
        try {
            // Strip large binary data before saving to sessionStorage
            const stateToSave = { ...this.signatureData() };
            delete stateToSave.base64Pdf;
            delete stateToSave.signatureImage;

            sessionStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(stateToSave)
            );
        } catch (error) {
            console.error('Failed to save to sessionStorage (metadata):', error);
        }
    }

    private loadFromSession(): SignatureData | null {
        try {
            const data = sessionStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from sessionStorage:', error);
            return null;
        }
    }

    private getDefaultState(): SignatureData {
        return {
            pageNumber: 1,
            x: 100,
            y: 100,
            width: 200,
            height: 80,
            borderColor: '#000000',
            fontSize: 10,
            fontStyle: 'normal',
            fontColor: '#000000',
            role: '',
            reason: '',
            location: '',
            base64Pdf: undefined,
            fileName: undefined,
            totalPages: undefined,
            signatureImage: undefined,
            signatureText: undefined,
            signatureFont: undefined
        };
    }
}
