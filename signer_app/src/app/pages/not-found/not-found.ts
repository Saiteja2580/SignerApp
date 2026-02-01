import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-not-found',
    imports: [RouterModule],
    templateUrl: './not-found.html',
    styleUrl: './not-found.css',
})
export class NotFound {
    private router = inject(Router);

    goHome(): void {
        this.router.navigate(['/']);
    }
}
