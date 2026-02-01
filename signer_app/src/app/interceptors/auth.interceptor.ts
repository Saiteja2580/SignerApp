import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Clone the request and add withCredentials to include cookies
    const clonedRequest = req.clone({
        withCredentials: true
    });

    return next(clonedRequest);
};
