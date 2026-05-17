import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG Components
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

// Feature Imports
import { BrandsService } from '../../services/brands';
import { Brand, BrandQueryParams } from '../../models/brand.model';

/**
 * BrandList Component
 * Main brand listing page with pagination and search
 * Follows the exact same pattern as CategoryListComponent
 */
@Component({
  selector: 'app-brand-list',
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    // PrimeNG
    PaginatorModule,
    SkeletonModule,
    MessageModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './brand-list.html',
  styleUrl: './brand-list.scss'
})
export class BrandListComponent implements OnInit {
  private readonly brandsService = inject(BrandsService);
  private readonly router = inject(Router);

  // Component state
  readonly brands = signal<Brand[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string>('');
  readonly totalBrands = signal(0);
  readonly currentPage = signal(1);
  readonly itemsPerPage = signal(30);

  // Search state
  readonly searchQuery = signal('');

  // Computed properties
  readonly totalPages = computed(() => 
    Math.ceil(this.totalBrands() / this.itemsPerPage())
  );

  readonly hasBrands = computed(() => this.brands().length > 0);
  readonly isFirstPage = computed(() => this.currentPage() === 1);
  readonly isLastPage = computed(() => this.currentPage() >= this.totalPages());

  ngOnInit(): void {
    this.loadBrands();
  }

  /**
   * Load brands from API
   */
  loadBrands(): void {
    this.loading.set(true);
    this.error.set('');

    const params: BrandQueryParams = {
      page: this.currentPage(),
      limit: this.itemsPerPage()
    };

    // Add search query if provided
    if (this.searchQuery()) {
      params.keyword = this.searchQuery();
    }

    this.brandsService.getAllBrands(params).subscribe({
      next: (response) => {
        this.brands.set(response.data);
        this.totalBrands.set(response.results);
        this.loading.set(false);

        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error) => {
        this.error.set(error?.message || 'Failed to load brands. Please try again.');
        this.loading.set(false);
        console.error('Brands load error:', error);
      }
    });
  }

  /**
   * Handle page change
   */
  onPageChange(event: any): void {
    this.currentPage.set(event.page + 1); // PrimeNG uses 0-based pages
    this.loadBrands();
  }

  /**
   * Handle search input
   */
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1); // Reset to first page on search
    this.loadBrands();
  }

  /**
   * Clear search and reload
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadBrands();
  }

  /**
   * Navigate to brand details
   */
  navigateToBrand(brand: Brand): void {
    this.router.navigate(['/brands', brand.slug]);
  }

  /**
   * Retry loading brands
   */
  retry(): void {
    this.loadBrands();
  }
}
