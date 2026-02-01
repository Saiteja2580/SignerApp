import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // If already logged in locally, allow navigation immediately
    // This avoids redundant server calls on every transition
    if (authService.isLoggedIn) {
        return of(true);
    }

    // Otherwise, verify with server
    return authService.verify(true).pipe(
        map(() => true),
        catchError(() => {
            router.navigate(['/layout/login'], { queryParams: { returnUrl: state.url } });
            return of(false);
        })
    );
};
