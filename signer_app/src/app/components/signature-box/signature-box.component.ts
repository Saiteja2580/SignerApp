import { Component, input, output, ElementRef, viewChild, AfterViewInit, signal, computed, effect } from '@angular/core';
import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-signature-box',
  standalone: true,
  imports: [CdkDrag],
  template: `
    <div
      #dragBox
      cdkDrag
      [cdkDragBoundary]="boundary()"
      (cdkDragEnded)="onDragEnd($event)"
      [style.width.px]="currentWidth()"
      [style.height.px]="currentHeight()"
      class="signature-box border-2 border-dashed border-indigo-500 bg-indigo-50 bg-opacity-30 cursor-move flex items-center justify-center rounded">
      <span class="text-indigo-600 font-medium pointer-events-none" [style.font-size.px]="dynamicFontSize()">
        Drag to Position
      </span>

      <!-- Resize handle (bottom-right corner) -->
      <div
        class="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-indigo-500 rounded-tl cursor-se-resize"
        (mousedown)="startResize($event)"
        (touchstart)="startResize($event)">
      </div>
    </div>
  `,
  styles: [`
    .signature-box {
      position: absolute;
      user-select: none;
    }
    .resize-handle {
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    .resize-handle:hover {
      opacity: 1;
    }
  `]
})
export class SignatureBoxComponent implements AfterViewInit {
  x = input<number>(100);
  y = input<number>(100);
  width = input<number>(200);
  height = input<number>(80);
  boundary = input<string>('.pdf-viewer-container');

  positionChanged = output<{ x: number; y: number }>();
  sizeChanged = output<{ width: number; height: number }>();

  dragBox = viewChild<ElementRef>('dragBox');

  // Internal state for resizing
  private resizing = signal(false);
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;

  currentWidth = signal(200);
  currentHeight = signal(80);

  dynamicFontSize = computed(() => {
    const h = this.currentHeight();
    return Math.max(8, Math.min(14, h * 0.15));
  });

  constructor() {
    // Reactively sync inputs with internal signals
    // This ensures the box updates when parent computed signals change
    effect(() => {
      const w = this.width();
      const h = this.height();
      // Only update if not currently resizing (to avoid fighting with resize)
      if (!this.resizing()) {
        this.currentWidth.set(w);
        this.currentHeight.set(h);
      }
    });
  }

  ngAfterViewInit() {
    // Set initial position
    const element = this.dragBox()?.nativeElement;
    if (element) {
      element.style.left = `${this.x()}px`;
      element.style.top = `${this.y()}px`;
    }
  }

  onDragEnd(event: CdkDragEnd) {
    const element = event.source.element.nativeElement;
    const rect = element.getBoundingClientRect();
    const parent = element.offsetParent?.getBoundingClientRect();

    if (parent) {
      const x = rect.left - parent.left;
      const y = rect.top - parent.top;
      this.positionChanged.emit({ x, y });
    }
  }

  startResize(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.resizing.set(true);

    const pos = this.getEventPosition(event);
    this.startX = pos.x;
    this.startY = pos.y;
    this.startWidth = this.currentWidth();
    this.startHeight = this.currentHeight();

    // Add global listeners
    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);
    document.addEventListener('touchmove', this.onResize);
    document.addEventListener('touchend', this.stopResize);
  }

  private onResize = (event: MouseEvent | TouchEvent) => {
    if (!this.resizing()) return;

    const pos = this.getEventPosition(event);
    const deltaX = pos.x - this.startX;
    const deltaY = pos.y - this.startY;

    const newWidth = Math.max(100, this.startWidth + deltaX);
    const newHeight = Math.max(40, this.startHeight + deltaY);

    this.currentWidth.set(newWidth);
    this.currentHeight.set(newHeight);
  };

  private stopResize = () => {
    if (!this.resizing()) return;
    this.resizing.set(false);

    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
    document.removeEventListener('touchmove', this.onResize);
    document.removeEventListener('touchend', this.stopResize);

    // Emit final size
    this.sizeChanged.emit({
      width: this.currentWidth(),
      height: this.currentHeight()
    });
  };

  private getEventPosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if (event instanceof MouseEvent) {
      return { x: event.clientX, y: event.clientY };
    } else {
      const touch = event.touches[0] || event.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
  }
}
