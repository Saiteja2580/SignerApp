import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm!: FormGroup;
  // Use signal for better change detection control and to avoid NG0100
  isLoading = signal(false);

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Login attempt started...');
      this.isLoading.set(true);

      const credentials = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: () => {
          console.log('Login success in component, navigating to dashboard');
          // We don't set isLoading back to false here because we want 
          // to keep the button disabled while navigating
          this.router.navigate(['/dashboard']).then(success => {
            if (!success) {
              console.error('Navigation to dashboard failed');
              this.isLoading.set(false);
            }
          });
        },
        error: (err) => {
          console.error('Login error in component:', err);
          // Set to false only on error
          this.isLoading.set(false);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
