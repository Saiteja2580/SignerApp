import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Layout } from './pages/layout/layout';
import { Register } from './pages/register/register';
import { NotFound } from './pages/not-found/not-found';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/dashboard/dashboard')
            .then(m => m.Dashboard)
    },
    {
        path: 'layout',
        component: Layout,
        children: [
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            },
            {
                path: 'login',
                component: Login,
                canActivate: [guestGuard]
            },
            {
                path: 'register',
                component: Register,
                canActivate: [guestGuard]
            }
        ]
    },
    {
        path: 'sign',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/sign/upload-position/upload-position.component')
                    .then(m => m.UploadPositionComponent)
            },
            {
                path: 'customize',
                loadComponent: () => import('./pages/sign/customize/customize.component')
                    .then(m => m.CustomizeComponent)
            },
            {
                path: 'success',
                loadComponent: () => import('./pages/sign/success/success.component')
                    .then(m => m.SuccessComponent)
            }
        ]
    },
    {
        path: '**',
        component: NotFound
    }
];

