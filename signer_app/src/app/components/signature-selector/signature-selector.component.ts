import { Component, Output, EventEmitter, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignaturePadComponent } from '../signature-pad/signature-pad.component';
import { SignatureTextComponent } from '../signature-text/signature-text.component';
import { SignatureUploadComponent } from '../signature-upload/signature-upload.component';

export type SignatureMode = 'standard' | 'draw' | 'type' | 'upload';

export interface SignatureData {
    mode: SignatureMode;
    base64Image?: string | null;
    textData?: { text: string; font: string; color: string; base64: string } | null;
}

@Component({
    selector: 'app-signature-selector',
    standalone: true,
    imports: [
        CommonModule,
        SignaturePadComponent,
        SignatureTextComponent,
        SignatureUploadComponent
    ],
    template: `
        <div class="signature-selector">
            <!-- Mode Tabs -->
            <div class="mode-tabs">
                <button 
                    type="button"
                    *ngFor="let tab of tabs" 
                    (click)="setMode(tab.mode)"
                    class="tab-btn"
                    [class.active]="currentMode() === tab.mode"
                >
                    <span [innerHTML]="tab.icon"></span>
                    {{ tab.label }}
                </button>
            </div>
            
            <!-- Content based on mode -->
            <div class="mode-content">
                @switch (currentMode()) {
                    @case ('draw') {
                        <app-signature-pad 
                            [width]="280" 
                            [height]="120"
                            [color]="fontColor"
                            (signatureChange)="onDrawSignature($event)"
                        />
                    }
                    @case ('type') {
                        <app-signature-text 
                            [color]="fontColor"
                            (signatureChange)="onTypeSignature($event)"
                        />
                    }
                    @case ('upload') {
                        <app-signature-upload 
                            (signatureChange)="onUploadSignature($event)"
                        />
                    }
                    @case ('standard') {
                        <div class="standard-mode">
                            <p>You have selected the standard signature mode. Only your signature details (Role, Reason, Location, and Date) will be displayed on the document.</p>
                        </div>
                    }
                }
            </div>
        </div>
    `,
    styles: [`
        .signature-selector {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .mode-tabs {
            display: flex;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .tab-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem;
            border: none;
            background: white;
            color: #6b7280;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        
        .tab-btn:not(:last-child) {
            border-right: 1px solid #e5e7eb;
        }
        
        .tab-btn:hover {
            background: #f9fafb;
        }
        
        .tab-btn.active {
            background: #4f46e5;
            color: white;
        }
        
        .mode-content {
            min-height: 150px;
        }

        .standard-mode {
            padding: 2rem;
            text-align: center;
            background: #f8fafc;
            border: 1px dashed #e2e8f0;
            border-radius: 8px;
            color: #64748b;
            font-size: 0.875rem;
            line-height: 1.5;
        }
    `]
})
export class SignatureSelectorComponent {
    @Input() fontColor = '#000000';
    @Output() signatureChange = new EventEmitter<SignatureData>();

    currentMode = signal<SignatureMode>('standard');

    tabs = [
        {
            mode: 'standard' as SignatureMode,
            label: 'Standard',
            icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>'
        },
        {
            mode: 'draw' as SignatureMode,
            label: 'Draw',
            icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>'
        },
        {
            mode: 'type' as SignatureMode,
            label: 'Type',
            icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>'
        },
        {
            mode: 'upload' as SignatureMode,
            label: 'Upload',
            icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>'
        }
    ];

    private currentSignatureData: SignatureData = { mode: 'standard' };

    ngOnInit(): void {
        this.emitChange();
    }

    setMode(mode: SignatureMode): void {
        this.currentMode.set(mode);
        this.currentSignatureData = { mode };
        this.emitChange();
    }

    onDrawSignature(base64: string | null): void {
        this.currentSignatureData = {
            mode: 'draw',
            base64Image: base64
        };
        this.emitChange();
    }

    onTypeSignature(data: { text: string; font: string; color: string; base64: string } | null): void {
        this.currentSignatureData = {
            mode: 'type',
            textData: data
        };
        this.emitChange();
    }

    onUploadSignature(base64: string | null): void {
        this.currentSignatureData = {
            mode: 'upload',
            base64Image: base64
        };
        this.emitChange();
    }

    private emitChange(): void {
        this.signatureChange.emit(this.currentSignatureData);
    }
}
