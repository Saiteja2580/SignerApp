import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { DocumentService, SignedDocument } from '../../services/document.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ConfirmModalComponent],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
    private authService = inject(AuthService);
    private docService = inject(DocumentService);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    protected Math = Math;

    currentUser$ = this.authService.currentUser$;

    // Backend base URL for constructing full URLs
    apiBaseUrl = this.authService.apiBaseUrl;

    loading = signal(false);
    error = signal<string | null>(null);

    // Pagination & Search state
    searchQuery = signal('');
    currentPage = signal(1); // 1-based for UI
    pageSize = 5;
    totalItems = signal(0);
    totalPages = signal(0);
    itemsOnPage = signal(0);

    // Filtered documents for display (from backend)
    paginatedDocuments = signal<SignedDocument[]>([]);

    // Modal state
    showDeleteModal = signal(false);
    documentToDelete = signal<SignedDocument | null>(null);

    pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

    // Derived stats
    totalSize = computed(() => {
        try {
            const total = this.paginatedDocuments().reduce((acc, doc) => acc + (doc.fileSizeBytes || 0), 0);
            return this.docService.formatFileSize(total);
        } catch (e) {
            return '0 Bytes';
        }
    });

    lastSignDate = computed(() => {
        if (this.paginatedDocuments().length === 0) return 'No activity';
        try {
            const last = this.paginatedDocuments()[0];
            return new Date(last.signedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return 'Unknown';
        }
    });

    ngOnInit(): void {
        console.log('Dashboard initialized, starting to load documents...');
        this.loadDocuments();
    }

    loadDocuments(): void {
        this.loading.set(true);
        this.error.set(null);

        // Backend expects 0-based page index
        const pageIndex = this.currentPage() - 1;

        this.docService.getDocuments(pageIndex, this.pageSize, this.searchQuery()).subscribe({
            next: (res) => {
                console.log('Dashboard received paginated documents:', res.data);
                this.paginatedDocuments.set(res.data.content || []);
                this.totalItems.set(res.data.totalItems);
                this.totalPages.set(res.data.totalPages);
                this.itemsOnPage.set(res.data.itemsOnPage);

                // If it's the first load and we don't have total docs for stats, fetch a snippet or logic
                // For "Total Documents" stat, totalItems works well
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Dashboard load error:', err);
                const msg = err.error?.message || 'Failed to connect to document service';
                this.error.set(msg);
                this.toastr.error(msg, 'Error');
                this.loading.set(false);
            }
        });
    }

    onSearch(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.searchQuery.set(query);
        this.currentPage.set(1); // Reset to first page on search
        this.loadDocuments();
    }

    setPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
            this.loadDocuments();
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
            this.loadDocuments();
        }
    }

    prevPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
            this.loadDocuments();
        }
    }

    triggerDelete(doc: SignedDocument): void {
        this.documentToDelete.set(doc);
        this.showDeleteModal.set(true);
    }

    cancelDelete(): void {
        this.showDeleteModal.set(false);
        this.documentToDelete.set(null);
    }

    confirmDelete(): void {
        const doc = this.documentToDelete();
        if (!doc) return;

        const id = doc.id;
        this.docService.deleteDocument(id).subscribe({
            next: () => {
                this.toastr.success('Document removed');

                // If we're on a page > 1 and this was the last item on this page,
                // go back one page.
                if (this.currentPage() > 1 && this.paginatedDocuments().length === 1) {
                    this.currentPage.update(p => p - 1);
                }

                this.loadDocuments(); // Re-fetch to get correct ordering and "flow-up" items
                this.cancelDelete();
            },
            error: (err) => {
                console.error('Delete error:', err);
                this.toastr.error('Could not delete document');
                this.cancelDelete();
            }
        });
    }

    formatSize(bytes: number): string {
        return this.docService.formatFileSize(bytes);
    }

    /**
     * Constructs full URL by combining backend base URL with relative path
     */
    getFullUrl(relativePath: string): string {
        return `${this.apiBaseUrl}${relativePath}`;
    }

    onLogout(): void {
        this.authService.logout().subscribe({
            next: () => this.router.navigate(['/layout/login']),
            error: () => this.router.navigate(['/layout/login'])
        });
    }
}
