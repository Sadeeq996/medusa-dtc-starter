import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastModule } from 'primeng/toast';
import { ScrollTopModule } from 'primeng/scrolltop';

import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

/**
 * Main application layout wrapper
 * Handles navigation loading states and global UI structure
 */
@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    ToastModule,
    ScrollTopModule,
    Header,
    Footer,
    LoadingSpinner
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  private router = inject(Router);
  
  /** Navigation state - true during route transitions */
  readonly isNavigating = signal(false);

  constructor() {
    // Monitor router events for loading state
    // Subscription automatically cleaned up on component destroy
    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.isNavigating.set(true);
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          // Brief delay prevents loading flash on instant navigation
          setTimeout(() => this.isNavigating.set(false), 100);
        }
      });
  }
}
