import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="modal-overlay" (click)="onCancel()">
            <div class="modal-container" (click)="$event.stopPropagation()">
                <div class="modal-header" [class]="type">
                    <h3 class="modal-title">{{ title }}</h3>
                </div>
                
                <div class="modal-body">
                    <p>{{ message }}</p>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-cancel" (click)="onCancel()">
                        {{ cancelLabel }}
                    </button>
                    <button type="button" class="btn-confirm" [class]="type" (click)="onConfirm()">
                        {{ confirmLabel }}
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.2s ease-out;
        }

        .modal-container {
            background: #ffffff;
            border-radius: 16px;
            width: 90%;
            max-width: 440px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow: hidden;
            border: 1px solid #f1f5f9;
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-header {
            padding: 2rem 1.5rem 0.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
            letter-spacing: -0.025em;
        }

        .modal-body {
            padding: 0.5rem 2rem 2rem;
            text-align: center;
            color: #475569;
            font-size: 0.9375rem;
            line-height: 1.6;
        }

        .modal-footer {
            padding: 1.25rem 1.5rem;
            background: #f8fafc;
            display: flex;
            gap: 1rem;
            border-top: 1px solid #f1f5f9;
        }

        .modal-footer button {
            flex: 1;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
        }

        .btn-cancel {
            background: white;
            border: 1px solid #e2e8f0 !important;
            color: #64748b;
        }

        .btn-cancel:hover {
            background: #f1f5f9;
            border-color: #cbd5e1 !important;
            color: #475569;
        }

        .btn-confirm.danger {
            background: #dc2626;
            color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);
        }

        .btn-confirm.danger:hover {
            background: #b91c1c;
            transform: translateY(-1px);
        }

        .btn-confirm.info {
            background: #4f46e5;
            color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }

        .btn-confirm.info:hover {
            background: #4338ca;
            transform: translateY(-1px);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(16px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
    `]
})
export class ConfirmModalComponent {
    @Input() title = 'Confirm';
    @Input() message = 'Are you sure you want to proceed?';
    @Input() confirmLabel = 'Confirm';
    @Input() cancelLabel = 'Cancel';
    @Input() type: 'danger' | 'info' = 'info';

    @Output() confirm = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    onConfirm() {
        this.confirm.emit();
    }

    onCancel() {
        this.cancel.emit();
    }
}
