import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './auth-service';
import { SignatureRequest } from '../models/signature.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({
    providedIn: 'root'
})
export class SignatureService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private toastr = inject(ToastrService);

    signPdf(request: SignatureRequest): Observable<ApiResponse<string>> {
        return this.http.post<ApiResponse<string>>(
            `${this.authService.apiBaseUrl}/api/signature/sign`,
            request
        ).pipe(
            tap(response => {
                this.toastr.success(response.message, 'Success');
            }),
            catchError(error => {
                const message = error.error?.message || 'Failed to sign PDF';
                this.toastr.error(message, 'Error');
                return throwError(() => new Error(message));
            })
        );
    }
}
