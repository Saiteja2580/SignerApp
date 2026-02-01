import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-signature-upload',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="signature-upload-container">
            <input 
                type="file" 
                #fileInput 
                (change)="onFileSelected($event)" 
                accept="image/png,image/jpeg,image/jpg"
                class="hidden"
            />
            
            <div 
                *ngIf="!previewUrl" 
                class="upload-area"
                (click)="fileInput.click()"
                (dragover)="onDragOver($event)"
                (drop)="onDrop($event)"
            >
                <svg class="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-sm text-gray-600 font-medium">Click or drag to upload signature</p>
                <p class="text-xs text-gray-400 mt-1">PNG or JPEG, max 2MB</p>
            </div>
            
            <div *ngIf="previewUrl" class="preview-area">
                <img [src]="previewUrl" alt="Signature preview" class="preview-image" />
                <button type="button" (click)="removeImage()" class="remove-btn" title="Remove">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <p *ngIf="error" class="error-message">{{ error }}</p>
        </div>
    `,
    styles: [`
        .signature-upload-container {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .hidden {
            display: none;
        }
        
        .upload-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        
        .upload-area:hover {
            border-color: #6366f1;
            background: #fafafa;
        }
        
        .preview-area {
            position: relative;
            display: inline-block;
            padding: 1rem;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }
        
        .preview-image {
            max-width: 280px;
            max-height: 120px;
            object-fit: contain;
        }
        
        .remove-btn {
            position: absolute;
            top: -8px;
            right: -8px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 50%;
            background: #ef4444;
            color: white;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        
        .remove-btn:hover {
            background: #dc2626;
            transform: scale(1.1);
        }
        
        .error-message {
            font-size: 0.875rem;
            color: #ef4444;
        }
    `]
})
export class SignatureUploadComponent {
    @Output() signatureChange = new EventEmitter<string | null>();

    previewUrl: string | null = null;
    error: string | null = null;

    private readonly MAX_SIZE = 2 * 1024 * 1024; // 2MB

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.processFile(input.files[0]);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
            this.processFile(event.dataTransfer.files[0]);
        }
    }

    private processFile(file: File): void {
        this.error = null;

        // Validate type
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            this.error = 'Please upload a PNG or JPEG image';
            return;
        }

        // Validate size
        if (file.size > this.MAX_SIZE) {
            this.error = 'File must be less than 2MB';
            return;
        }

        // Read and emit
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            this.previewUrl = dataUrl;

            // Emit full data URL (standard for frontend)
            this.signatureChange.emit(dataUrl);
        };
        reader.onerror = () => {
            this.error = 'Failed to read file';
        };
        reader.readAsDataURL(file);
    }

    removeImage(): void {
        this.previewUrl = null;
        this.error = null;
        this.signatureChange.emit(null);
    }
}
