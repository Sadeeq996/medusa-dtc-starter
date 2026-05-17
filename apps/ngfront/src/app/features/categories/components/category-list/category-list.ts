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
import { CategoriesService } from '../../services/categories';
import { Category, CategoryQueryParams } from '../../models/category.model';

/**
 * CategoryList Component
 * Main category listing page with pagination and search
 * Follows the exact same pattern as ProductListComponent
 */
@Component({
  selector: 'app-category-list',
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
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss'
})
export class CategoryListComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly router = inject(Router);

  // Component state
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string>('');
  readonly totalCategories = signal(0);
  readonly currentPage = signal(1);
  readonly itemsPerPage = signal(30);

  // Search
  readonly searchQuery = signal('');

  // Computed properties
  readonly totalPages = computed(() => 
    Math.ceil(this.totalCategories() / this.itemsPerPage())
  );

  readonly hasCategories = computed(() => this.categories().length > 0);
  readonly isFirstPage = computed(() => this.currentPage() === 1);
  readonly isLastPage = computed(() => this.currentPage() >= this.totalPages());

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Load categories from API
   */
  loadCategories(): void {
    this.loading.set(true);
    this.error.set('');

    const params: CategoryQueryParams = {
      page: this.currentPage(),
      limit: this.itemsPerPage()
    };

    // Add search query if provided
    if (this.searchQuery()) {
      params.keyword = this.searchQuery();
    }

    this.categoriesService.getCategories(params).subscribe({
      next: (response) => {
        this.categories.set(response.data);
        this.totalCategories.set(response.results);
        this.loading.set(false);

        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error) => {
        this.error.set(error?.message || 'Failed to load categories. Please try again.');
        this.loading.set(false);
        console.error('Categories loading error:', error);
      }
    });
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: any): void {
    const newPage = event.page + 1; // PrimeNG paginator is 0-based
    
    if (newPage !== this.currentPage()) {
      this.currentPage.set(newPage);
      this.loadCategories();
    }
  }

  /**
   * Handle search
   */
  onSearch(query: string): void {
    const trimmedQuery = query.trim();
    if (trimmedQuery !== this.searchQuery()) {
      this.searchQuery.set(trimmedQuery);
      this.currentPage.set(1);
      this.loadCategories();
    }
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadCategories();
  }

  /**
   * Navigate to category details
   */
  navigateToCategory(category: Category): void {
    this.router.navigate(['/categories', category.slug]);
  }

  /**
   * Retry loading categories
   */
  retryLoading(): void {
    this.loadCategories();
  }

  /**
   * Generate skeleton items for loading state
   */
  generateSkeletonItems(): number[] {
    return Array(12).fill(0).map((_, i) => i);
  }
}
