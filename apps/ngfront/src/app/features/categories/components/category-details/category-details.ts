import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

// Feature Imports
import { CategoriesService } from '../../services/categories';
import { Category, SubCategory } from '../../models/category.model';
import { ProductsService } from '../../../products/services/products';
import { Product } from '../../../products/models/product.model';
import { ProductCard } from '../../../../shared/components/product-card/product-card';

/**
 * CategoryDetails Component
 * Individual category view with subcategories and products
 * Follows the exact same pattern as ProductDetailsComponent
 */
@Component({
  selector: 'app-category-details',
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    // PrimeNG
    ButtonModule,
    SkeletonModule,
    MessageModule,
    BreadcrumbModule,
    CardModule,
    DividerModule,
    // Shared
    ProductCard
  ],
  templateUrl: './category-details.html',
  styleUrl: './category-details.scss'
})
export class CategoryDetailsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);
  private readonly destroy$ = new Subject<void>();

  // Component state
  readonly category = signal<Category | null>(null);
  readonly subcategories = signal<SubCategory[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly productsLoading = signal(false);
  readonly error = signal<string>('');

  // Computed properties
  readonly breadcrumbItems = computed(() => {
    const cat = this.category();
    if (!cat) return [];

    return [
      { label: cat.name }
    ];
  });

  readonly hasSubcategories = computed(() => this.subcategories().length > 0);
  readonly hasProducts = computed(() => this.products().length > 0);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const slug = params.get('slug');
        if (slug) {
          this.loadCategoryBySlug(slug);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load category by slug
   */
  private loadCategoryBySlug(slug: string): void {
    this.loading.set(true);
    this.error.set('');

    // First get all categories and find by slug
    this.categoriesService.getCategories({ limit: 100 }).subscribe({
      next: (response) => {
        const category = response.data.find(cat => cat.slug === slug);
        if (category) {
          this.category.set(category);
          this.loadCategoryDetails(category._id);
        } else {
          this.error.set('Category not found');
          this.loading.set(false);
        }
      },
      error: (error) => {
        this.error.set(error?.message || 'Failed to load category');
        this.loading.set(false);
        console.error('Category loading error:', error);
      }
    });
  }

  /**
   * Load category details (subcategories and products)
   */
  private loadCategoryDetails(categoryId: string): void {
    forkJoin({
      subcategories: this.categoriesService.getCategorySubcategories(categoryId),
      products: this.productsService.getProductsByCategory(categoryId, { limit: 8 })
    }).subscribe({
      next: ({ subcategories, products }) => {
        this.subcategories.set(subcategories);
        this.products.set(products.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Category details loading error:', error);
        this.loading.set(false);
        // Don't show error, just show empty states
      }
    });
  }

  /**
   * Navigate to subcategory products
   */
  navigateToSubcategory(subcategory: SubCategory): void {
    // Navigate to products filtered by subcategory
    this.router.navigate(['/products/list'], {
      queryParams: { subcategory: subcategory._id }
    });
  }

  /**
   * View all products in this category
   */
  viewAllProducts(): void {
    const cat = this.category();
    if (cat) {
      this.router.navigate(['/products/list'], {
        queryParams: { 'category[in]': cat._id }
      });
    }
  }

  /**
   * Retry loading category
   */
  retryLoading(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadCategoryBySlug(slug);
    }
  }

  /**
   * Generate skeleton items
   */
  generateSkeletonItems(): number[] {
    return Array(8).fill(0).map((_, i) => i);
  }
}
