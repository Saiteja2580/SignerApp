import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthService } from './auth-service';

export interface SignedDocument {
    id: string;
    originalFileName: string;
    pageNumber: number;
    signerRole: string;
    signerLocation: string;
    signerReason: string;
    fileSizeBytes: number;
    signedAt: string;
    downloadUrl: string;
    previewUrl: string;
}

export interface PageResponse<T> {
    content: T[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    itemsOnPage: number;
}

export interface ResponseWrapper<T> {
    status: string;
    message: string;
    data: T;
    timestamp: string;
}

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private get apiUrl() {
        return `${this.authService.apiBaseUrl}/api/documents`;
    }

    /**
     * Get list of signed documents for the current user with pagination and search.
     */
    getDocuments(page: number = 0, size: number = 10, search?: string): Observable<ResponseWrapper<PageResponse<SignedDocument>>> {
        let params = `?page=${page}&size=${size}`;
        if (search) {
            params += `&search=${encodeURIComponent(search)}`;
        }

        console.log('Fetching documents from:', this.apiUrl + params);
        return this.http.get<ResponseWrapper<PageResponse<SignedDocument>>>(this.apiUrl + params).pipe(
            tap(res => console.log('Documents fetched successfully:', res.data.itemsOnPage)),
            catchError(err => {
                console.error('Failed to fetch documents:', err);
                return throwError(() => err);
            })
        );
    }

    /**
     * Get a specific document's metadata.
     */
    getDocument(id: string): Observable<ResponseWrapper<SignedDocument>> {
        return this.http.get<ResponseWrapper<SignedDocument>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Delete a signed document.
     */
    deleteDocument(id: string): Observable<ResponseWrapper<null>> {
        return this.http.delete<ResponseWrapper<null>>(`${this.apiUrl}/${id}`);
    }

    /**
     * Get document count.
     */
    getDocumentCount(): Observable<ResponseWrapper<number>> {
        return this.http.get<ResponseWrapper<number>>(`${this.apiUrl}/count`);
    }

    /**
     * Formats file size in bytes into human readable string.
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
