import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { MenuItem } from 'primeng/api';

// Feature Imports
import { BrandsService } from '../../services/brands';
import { Brand } from '../../models/brand.model';
import { ProductsService } from '../../../products/services/products';
import { Product } from '../../../products/models/product.model';
import { ProductCard } from '../../../../shared/components/product-card/product-card';

/**
 * BrandDetails Component
 * Displays brand information and products from that brand
 * Follows the exact same pattern as CategoryDetailsComponent
 */
@Component({
  selector: 'app-brand-details',
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
  templateUrl: './brand-details.html',
  styleUrl: './brand-details.scss'
})
export class BrandDetailsComponent implements OnInit, OnDestroy {
  private readonly brandsService = inject(BrandsService);
  private readonly productsService = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Component state
  readonly brand = signal<Brand | null>(null);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string>('');

  // Computed properties
  readonly hasBrand = computed(() => !!this.brand());
  readonly hasProducts = computed(() => this.products().length > 0);
  readonly breadcrumbItems = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [];

    if (this.brand()) {
      items.push({ label: this.brand()!.name });
    }

    return items;
  });

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const slug = params['slug'];
        if (slug) {
          this.loadBrandDetails(slug);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load brand details and products
   */
  private loadBrandDetails(slug: string): void {
    this.loading.set(true);
    this.error.set('');

    // Load brand by slug
    this.brandsService.getBrandBySlug(slug).subscribe({
      next: (brand) => {
        if (brand) {
          this.brand.set(brand);
          this.loadBrandProducts(brand._id);
        } else {
          this.error.set('Brand not found');
          this.loading.set(false);
        }
      },
      error: (error) => {
        this.error.set(error?.message || 'Failed to load brand details');
        this.loading.set(false);
        console.error('Brand details load error:', error);
      }
    });
  }

  /**
   * Load products for this brand
   */
  private loadBrandProducts(brandId: string): void {
    this.productsService.getProductsByBrand(brandId, { limit: 8 }).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Products load error:', error);
        // Don't show error for products, just log it
        this.loading.set(false);
      }
    });
  }

  /**
   * View all products for this brand
   */
  viewAllProducts(): void {
    if (this.brand()) {
      this.router.navigate(['/products'], {
        queryParams: { brand: this.brand()!._id }
      });
    }
  }

  /**
   * Retry loading brand details
   */
  retry(): void {
    const slug = this.route.snapshot.params['slug'];
    if (slug) {
      this.loadBrandDetails(slug);
    }
  }
}
