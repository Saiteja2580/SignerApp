import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { map, catchError, of } from 'rxjs';

export const guestGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('Guest guard - checking authentication for:', state.url);

    // Check authentication by calling verify endpoint (silent mode)
    return authService.verify(true).pipe(
        map(() => {
            // User is authenticated, redirect to sign page
            console.log('User is authenticated, redirecting to sign page');
            router.navigateByUrl('/sign');
            return false;
        }),
        catchError(() => {
            // User is not authenticated, allow access to login/register
            console.log('User is not authenticated, allowing access to:', state.url);
            return of(true);
        })
    );
};
