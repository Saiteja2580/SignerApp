import {
    Component,
    ElementRef,
    ViewChild,
    AfterViewInit,
    Output,
    EventEmitter,
    Input,
    OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-signature-pad',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="signature-pad-container">
            <canvas
                #signatureCanvas
                class="signature-canvas"
                [style.width.px]="width"
                [style.height.px]="height"
                (mousedown)="startDrawing($event)"
                (mousemove)="draw($event)"
                (mouseup)="stopDrawing()"
                (mouseleave)="stopDrawing()"
                (touchstart)="startDrawingTouch($event)"
                (touchmove)="drawTouch($event)"
                (touchend)="stopDrawing()"
            ></canvas>
            
            <div class="controls">
                <button type="button" (click)="clear()" class="btn-control" title="Clear">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
                <button type="button" (click)="undo()" class="btn-control" title="Undo" [disabled]="!canUndo">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                    </svg>
                </button>
            </div>
            
            <!-- Internal color options hidden when managed externally -->
            <div class="color-options" *ngIf="!externalColor">
                <button 
                    *ngFor="let color of colors" 
                    type="button"
                    (click)="setColor(color)" 
                    class="color-btn"
                    [class.active]="strokeColor === color"
                    [style.background-color]="color"
                    [title]="color"
                ></button>
            </div>
        </div>
    `,
    styles: [`
        .signature-pad-container {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .signature-canvas {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            background: white;
            cursor: crosshair;
            touch-action: none;
        }
        
        .signature-canvas:hover {
            border-color: #6366f1;
        }
        
        .controls {
            display: flex;
            gap: 0.5rem;
        }
        
        .btn-control {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        
        .btn-control:hover:not(:disabled) {
            background: #f3f4f6;
            color: #374151;
        }
        
        .btn-control:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
    @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

    @Input() width = 300;
    @Input() height = 150;
    @Input() strokeWidth = 2;

    @Input() set color(value: string) {
        if (value && value !== this.strokeColor) {
            this.strokeColor = value;
            this.externalColor = true;
            if (this.ctx) {
                this.ctx.strokeStyle = value;
            }
        }
    }

    @Output() signatureChange = new EventEmitter<string | null>();

    externalColor = false;
    colors = ['#000000', '#1e40af', '#047857', '#7c2d12'];
    strokeColor = '#000000';

    private ctx!: CanvasRenderingContext2D;
    private isDrawing = false;
    private history: ImageData[] = [];
    private lastX = 0;
    private lastY = 0;

    get canUndo(): boolean {
        return this.history.length > 0;
    }

    ngAfterViewInit(): void {
        this.initCanvas();
    }

    ngOnDestroy(): void {
        this.history = [];
    }

    private initCanvas(): void {
        const canvas = this.canvasRef.nativeElement;
        canvas.width = this.width;
        canvas.height = this.height;

        this.ctx = canvas.getContext('2d')!;
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.strokeWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.clear();
    }

    startDrawing(event: MouseEvent): void {
        this.saveState();
        this.isDrawing = true;
        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        this.lastX = event.clientX - rect.left;
        this.lastY = event.clientY - rect.top;
    }

    startDrawingTouch(event: TouchEvent): void {
        event.preventDefault();
        this.saveState();
        this.isDrawing = true;
        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        const touch = event.touches[0];
        this.lastX = touch.clientX - rect.left;
        this.lastY = touch.clientY - rect.top;
    }

    draw(event: MouseEvent): void {
        if (!this.isDrawing) return;

        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.drawLine(this.lastX, this.lastY, x, y);
        this.lastX = x;
        this.lastY = y;
    }

    drawTouch(event: TouchEvent): void {
        event.preventDefault();
        if (!this.isDrawing) return;

        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        const touch = event.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.drawLine(this.lastX, this.lastY, x, y);
        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing(): void {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.emitSignature();
        }
    }

    private drawLine(x1: number, y1: number, x2: number, y2: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    private saveState(): void {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        this.history.push(imageData);
        // Limit history to last 20 states
        if (this.history.length > 20) {
            this.history.shift();
        }
    }

    clear(): void {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.history = [];
        this.signatureChange.emit(null);
    }

    undo(): void {
        if (this.history.length > 0) {
            const previousState = this.history.pop()!;
            this.ctx.putImageData(previousState, 0, 0);
            this.emitSignature();
        }
    }

    setColor(color: string): void {
        this.strokeColor = color;
        this.ctx.strokeStyle = color;
    }

    private emitSignature(): void {
        if (this.isEmpty()) {
            this.signatureChange.emit(null);
        } else {
            // Emit as full data URL (standard for frontend)
            const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
            this.signatureChange.emit(dataUrl);
        }
    }

    private isEmpty(): boolean {
        const canvas = this.canvasRef.nativeElement;
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        const blankCtx = blank.getContext('2d')!;
        blankCtx.fillStyle = 'white';
        blankCtx.fillRect(0, 0, blank.width, blank.height);
        return canvas.toDataURL() === blank.toDataURL();
    }

    /**
     * Get signature as base64 PNG (for external access)
     */
    getSignatureBase64(): string | null {
        if (this.isEmpty()) return null;
        const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
        return dataUrl.replace(/^data:image\/png;base64,/, '');
    }
}
