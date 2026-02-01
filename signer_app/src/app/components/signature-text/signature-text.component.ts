import { Component, Output, EventEmitter, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FontOption {
    name: string;
    family: string;
    url: string;
}

@Component({
    selector: 'app-signature-text',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="signature-text-container">
            <input 
                type="text" 
                [(ngModel)]="signatureText" 
                (ngModelChange)="onTextChange()"
                placeholder="Type your signature..."
                class="signature-input"
                [style.font-family]="selectedFont.family"
            />
            
            <div class="font-options">
                <button 
                    *ngFor="let font of fonts" 
                    type="button"
                    (click)="selectFont(font)"
                    class="font-btn"
                    [class.active]="selectedFont.name === font.name"
                    [style.font-family]="font.family"
                >
                    {{ font.name }}
                </button>
            </div>
            
            <div class="preview-box" *ngIf="signatureText">
                <label class="preview-label">Preview</label>
                <div 
                    class="preview-signature"
                    [style.font-family]="selectedFont.family"
                    [style.color]="fontColor"
                >
                    {{ signatureText }}
                </div>
            </div>
            
            <!-- Internal color options hidden when managed externally -->
            <div class="color-options" *ngIf="!externalColor">
                <button 
                    *ngFor="let color of colors" 
                    type="button"
                    (click)="setColor(color)" 
                    class="color-btn"
                    [class.active]="fontColor === color"
                    [style.background-color]="color"
                    [title]="color"
                ></button>
            </div>

            <!-- Hidden canvas for image generation -->
            <canvas #hiddenCanvas style="visibility: hidden; position: absolute; left: -9999px;"></canvas>
        </div>
    `,
    styles: [`
        .signature-text-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .signature-input {
            width: 100%;
            padding: 0.75rem;
            font-size: 1.5rem;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            background: white;
            outline: none;
            transition: border-color 0.15s ease;
        }
        
        .signature-input:focus {
            border-color: #6366f1;
        }
        
        .font-options {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .font-btn {
            padding: 0.5rem 1rem;
            font-size: 1rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        
        .font-btn:hover {
            background: #f3f4f6;
        }
        
        .font-btn.active {
            border-color: #6366f1;
            background: #eef2ff;
            color: #4f46e5;
        }
        
        .preview-box {
            padding: 1rem;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }
        
        .preview-label {
            display: block;
            font-size: 0.75rem;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }
        
        .preview-signature {
            font-size: 2rem;
            text-align: center;
            padding: 1rem;
        }
        
        .color-options {
            display: flex;
            gap: 0.5rem;
        }
        
        .color-btn {
            width: 24px;
            height: 24px;
            border: 2px solid transparent;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        
        .color-btn:hover {
            transform: scale(1.1);
        }
        
        .color-btn.active {
            border-color: #374151;
            box-shadow: 0 0 0 2px white, 0 0 0 4px #6366f1;
        }
    `]
})
export class SignatureTextComponent implements OnInit {
    @ViewChild('hiddenCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    @Input() initialText = '';
    @Input() set color(value: string) {
        if (value && value !== this.fontColor) {
            this.fontColor = value;
            this.externalColor = true;
            this.emitChange();
        }
    }
    @Output() signatureChange = new EventEmitter<{ text: string; font: string; color: string; base64: string } | null>();

    externalColor = false;

    fonts: FontOption[] = [
        { name: 'Elegant', family: "'Great Vibes', cursive", url: '' },
        { name: 'Script', family: "'Dancing Script', cursive", url: '' },
        { name: 'Classic', family: "'Allura', cursive", url: '' },
        { name: 'Casual', family: "'Pacifico', cursive", url: '' }
    ];

    colors = ['#000000', '#1e40af', '#047857', '#7c2d12'];

    signatureText = '';
    selectedFont = this.fonts[0];
    fontColor = '#000000';

    ngOnInit() {
        if (this.initialText) {
            this.signatureText = this.initialText;
        }
    }

    selectFont(font: FontOption): void {
        console.log('Selecting font:', font.name);
        this.selectedFont = font;
        this.emitChange();
    }

    setColor(color: string): void {
        this.fontColor = color;
        this.emitChange();
    }

    onTextChange(): void {
        this.emitChange();
    }

    private generateImage(): string {
        const canvas = this.canvasRef.nativeElement;
        const ctx = canvas.getContext('2d')!;

        // Setup canvas size
        canvas.width = 400;
        canvas.height = 150;

        // Clear with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Setup font
        // Extract font name from family string (e.g. "'Great Vibes', cursive" -> "Great Vibes")
        const fontName = this.selectedFont.family.split(',')[0].replace(/'/g, '');
        ctx.font = `60px ${fontName}`;
        ctx.fillStyle = this.fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw text
        ctx.fillText(this.signatureText, canvas.width / 2, canvas.height / 2);

        // Return as full data URL (standard for frontend)
        return canvas.toDataURL('image/png');
    }

    private emitChange(): void {
        console.log('Emitting signature change. Text:', this.signatureText, 'Font:', this.selectedFont.name);
        if (this.signatureText.trim()) {
            try {
                const base64 = this.generateImage();
                this.signatureChange.emit({
                    text: this.signatureText,
                    font: this.selectedFont.family,
                    color: this.fontColor,
                    base64: base64
                });
            } catch (err) {
                console.error('Failed to generate signature image:', err);
                // Fallback to emitting without image if generation fails
                this.signatureChange.emit({
                    text: this.signatureText,
                    font: this.selectedFont.family,
                    color: this.fontColor,
                    base64: ''
                });
            }
        } else {
            this.signatureChange.emit(null);
        }
    }
}
