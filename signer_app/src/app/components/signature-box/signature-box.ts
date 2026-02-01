import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignatureBox, SignatureConfig } from '../../models/pdf.model';

@Component({
    selector: 'app-signature-box',
    imports: [CommonModule],
    templateUrl: './signature-box.html',
    styleUrl: './signature-box.css',
})
export class SignatureBoxComponent implements AfterViewInit {
    @Input() box!: SignatureBox;
    @Input() containerWidth: number = 0;
    @Input() containerHeight: number = 0;
    @Output() boxChanged = new EventEmitter<SignatureBox>();

    

    @ViewChild('signatureBox') signatureBoxRef!: ElementRef;

    private isDragging = false;
    private isResizing = false;
    private resizeHandle: string = '';
    private startX = 0;
    private startY = 0;
    private startBoxX = 0;
    private startBoxY = 0;
    private startBoxWidth = 0;
    private startBoxHeight = 0;

    ngAfterViewInit() {
        // Ensure box has default config if not provided
        if (!this.box.config) {
            this.box.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig(): SignatureConfig {
        return {
            borderColor: '#4F46E5',
            borderWidth: 2,
            borderStyle: 'dashed',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fontSize: 12,
            fontColor: '#1F2937',
            showDetails: true
        };
    }

    onMouseDown(event: MouseEvent, handle?: string) {
        event.preventDefault();
        event.stopPropagation();

        this.startX = event.clientX;
        this.startY = event.clientY;
        this.startBoxX = this.box.x;
        this.startBoxY = this.box.y;
        this.startBoxWidth = this.box.width;
        this.startBoxHeight = this.box.height;

        if (handle) {
            this.isResizing = true;
            this.resizeHandle = handle;
        } else {
            this.isDragging = true;
        }

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    onMouseMove = (event: MouseEvent) => {
        if (!this.isDragging && !this.isResizing) return;

        const deltaX = event.clientX - this.startX;
        const deltaY = event.clientY - this.startY;

        if (this.isDragging) {
            // Dragging - move the box
            let newX = this.startBoxX + deltaX;
            let newY = this.startBoxY + deltaY;

            // Constrain within container
            newX = Math.max(0, Math.min(newX, this.containerWidth - this.box.width));
            newY = Math.max(0, Math.min(newY, this.containerHeight - this.box.height));

            this.box.x = newX;
            this.box.y = newY;
        } else if (this.isResizing) {
            // Resizing - adjust width/height based on handle
            this.handleResize(deltaX, deltaY);
        }

        this.boxChanged.emit(this.box);
    };

    onMouseUp = () => {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = '';
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    };

    handleResize(deltaX: number, deltaY: number) {
        const minWidth = 100;
        const minHeight = 60;

        switch (this.resizeHandle) {
            case 'nw': // Top-left
                const newXNW = this.startBoxX + deltaX;
                const newYNW = this.startBoxY + deltaY;
                const newWidthNW = this.startBoxWidth - deltaX;
                const newHeightNW = this.startBoxHeight - deltaY;

                if (newWidthNW >= minWidth && newXNW >= 0) {
                    this.box.x = newXNW;
                    this.box.width = newWidthNW;
                }
                if (newHeightNW >= minHeight && newYNW >= 0) {
                    this.box.y = newYNW;
                    this.box.height = newHeightNW;
                }
                break;

            case 'ne': // Top-right
                const newYNE = this.startBoxY + deltaY;
                const newWidthNE = this.startBoxWidth + deltaX;
                const newHeightNE = this.startBoxHeight - deltaY;

                if (newWidthNE >= minWidth && (this.box.x + newWidthNE) <= this.containerWidth) {
                    this.box.width = newWidthNE;
                }
                if (newHeightNE >= minHeight && newYNE >= 0) {
                    this.box.y = newYNE;
                    this.box.height = newHeightNE;
                }
                break;

            case 'sw': // Bottom-left
                const newXSW = this.startBoxX + deltaX;
                const newWidthSW = this.startBoxWidth - deltaX;
                const newHeightSW = this.startBoxHeight + deltaY;

                if (newWidthSW >= minWidth && newXSW >= 0) {
                    this.box.x = newXSW;
                    this.box.width = newWidthSW;
                }
                if (newHeightSW >= minHeight && (this.box.y + newHeightSW) <= this.containerHeight) {
                    this.box.height = newHeightSW;
                }
                break;

            case 'se': // Bottom-right
                const newWidthSE = this.startBoxWidth + deltaX;
                const newHeightSE = this.startBoxHeight + deltaY;

                if (newWidthSE >= minWidth && (this.box.x + newWidthSE) <= this.containerWidth) {
                    this.box.width = newWidthSE;
                }
                if (newHeightSE >= minHeight && (this.box.y + newHeightSE) <= this.containerHeight) {
                    this.box.height = newHeightSE;
                }
                break;
        }

        // Dynamic Font Scaling: scale font based on box height (approx 15% of height)
        if (this.box.config) {
            this.box.config.fontSize = Math.max(8, Math.min(32, Math.floor(this.box.height * 0.15)));
        }
    }

    getBoxStyle() {
        return {
            position: 'absolute',
            left: `${this.box.x}px`,
            top: `${this.box.y}px`,
            width: `${this.box.width}px`,
            height: `${this.box.height}px`,
            border: `${this.box.config.borderWidth}px ${this.box.config.borderStyle} ${this.box.config.borderColor}`,
            backgroundColor: this.box.config.backgroundColor,
            cursor: 'move',
            userSelect: 'none'
        };
    }

    getTextStyle() {
        return {
            fontSize: `${this.box.config.fontSize}px`,
            color: this.box.config.fontColor
        };
    }

    getCurrentDate(): string {
        return new Date().toLocaleDateString();
    }

    ngOnDestroy() {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }
}
