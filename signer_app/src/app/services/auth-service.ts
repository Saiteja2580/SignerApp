import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/env.development';
import { LoginRequest, RegisterRequest, RegisterResponse, ApiResponse, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  private apiUrl = environment.apiUrl;

  // State management
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  get apiBaseUrl(): string {
    return this.apiUrl;
  }

  get isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.apiUrl}/api/user/login`,
      credentials
    ).pipe(
      tap(response => {
        console.log('Login successful, setting auth state for:', credentials.username);
        this.toastr.success(response.message, 'Success');
        this.setAuthState(credentials.username);
      }),
      catchError(error => {
        const message = error.error?.message || 'Login failed';
        this.toastr.error(message, 'Error');
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<ApiResponse<RegisterResponse>> {
    return this.http.post<ApiResponse<RegisterResponse>>(
      `${this.apiUrl}/api/user/register`,
      userData
    ).pipe(
      tap(response => {
        this.toastr.success(response.message, 'Success');
      }),
      catchError(error => {
        const message = error.error?.message || 'Registration failed';
        this.toastr.error(message, 'Error');
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify current session
   * @param silent - If true, suppresses toaster notifications
   */
  verify(silent: boolean = false): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(
      `${this.apiUrl}/api/user/verify`
    ).pipe(
      tap(response => {
        if (!silent) {
          console.log('Verify successful, user:', response.data);
        }
        this.setAuthState(response.data);
      }),
      catchError(error => {
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<ApiResponse<null>> {
    return this.http.get<ApiResponse<null>>(
      `${this.apiUrl}/api/user/logout`
    ).pipe(
      tap(response => {
        this.toastr.info(response.message, 'Logged Out');
        this.clearAuthState();
      }),
      catchError(error => {
        const message = error.error?.message || 'Logout failed';
        this.toastr.error(message, 'Error');
        this.clearAuthState(); // Clear state anyway
        return throwError(() => error);
      })
    );
  }

  /**
   * Set authentication state
   */
  private setAuthState(username: string): void {
    console.log('Setting auth state - isLoggedIn:', true, 'username:', username);
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next({ username });
  }

  /**
   * Clear authentication state
   */
  private clearAuthState(): void {
    console.log('Clearing auth state - isLoggedIn:', false);
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }
}
