import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Components
import { GalleriaModule } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { RatingModule } from 'primeng/rating';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CarouselModule } from 'primeng/carousel';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';

// Feature Imports
import { ProductsService } from '../../services/products';
import { Product, ProductDetails } from '../../models/product.model';
import { ProductCard } from '../../../../shared/components/product-card/product-card';
import { CartStore } from '../../../cart/store/cart.store';

interface GalleryImage {
  itemImageSrc: string;
  thumbnailImageSrc: string;
  alt: string;
}

/**
 * ProductDetails Component
 * Individual product view with image gallery, details, and related products
 */
@Component({
  selector: 'app-product-details',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    // PrimeNG
    GalleriaModule,
    ButtonModule,
    BadgeModule,
    RatingModule,
    DividerModule,
    SkeletonModule,
    MessageModule,
    BreadcrumbModule,
    CarouselModule,
    CardModule,
    ChipModule,
    // Shared
    ProductCard
  ],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss'
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly cartStore = inject(CartStore);
  private readonly destroy$ = new Subject<void>();

  // Component state
  readonly product = signal<ProductDetails | null>(null);
  readonly relatedProducts = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly relatedLoading = signal(false);
  readonly error = signal<string>('');
  readonly quantity = signal(1);

  // Computed properties
  readonly galleryImages = computed(() => {
    const prod = this.product();
    if (!prod) return [];

    const images: GalleryImage[] = [];
    
    // Add main image
    images.push({
      itemImageSrc: prod.imageCover,
      thumbnailImageSrc: prod.imageCover,
      alt: prod.title
    });

    // Add additional images
    prod.images?.forEach((image, index) => {
      images.push({
        itemImageSrc: image,
        thumbnailImageSrc: image,
        alt: `${prod.title} - Image ${index + 2}`
      });
    });

    return images;
  });

  readonly breadcrumbItems = computed(() => {
    const prod = this.product();
    if (!prod) return [];

    return [
      { label: 'Home', routerLink: '/' },
      { label: 'Products', routerLink: '/products' },
      { label: prod.category.name, routerLink: `/categories/${prod.category.slug}` },
      { label: prod.title }
    ];
  });

  readonly currentPrice = computed(() => {
    const prod = this.product();
    if (!prod) return 0;
    return this.productsService.getCurrentPrice(prod);
  });

  readonly isOnSale = computed(() => {
    const prod = this.product();
    return prod ? this.productsService.isProductOnSale(prod) : false;
  });

  readonly discountPercentage = computed(() => {
    const prod = this.product();
    return prod ? this.productsService.calculateDiscountPercentage(prod) : 0;
  });

  readonly isInStock = computed(() => {
    const prod = this.product();
    return prod ? this.productsService.isProductInStock(prod) : false;
  });

  readonly maxQuantity = computed(() => {
    const prod = this.product();
    return prod ? Math.min(prod.quantity, 10) : 1; // Limit to 10 or available stock
  });

  readonly canAddToCart = computed(() => {
    return this.isInStock() && this.quantity() > 0 && this.quantity() <= this.maxQuantity() && !this.isAddingToCart();
  });

  // Cart-related computed properties
  readonly isInCart = computed(() => {
    const product = this.product();
    if (!product) return false;
    return this.cartStore.isProductInCart()(product._id);
  });

  readonly cartQuantity = computed(() => {
    const product = this.product();
    if (!product) return 0;
    return this.cartStore.getProductQuantity()(product._id);
  });

  // ✅ FIXED: Use per-product loading state instead of global
  readonly isAddingToCart = computed(() => {
    const product = this.product();
    if (!product) return false;
    return this.cartStore.isProductLoading()(product._id);
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.loadProductById(id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load product by ID
   */
  private loadProductById(id: string): void {
    this.loading.set(true);
    this.error.set('');

    this.productsService.getProductDetails(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        this.loadRelatedProducts(product);
      },
      error: (error) => {
        this.error.set(error?.message || 'Product not found');
        this.loading.set(false);
        console.error('Product loading error:', error);
      }
    });
  }

  /**
   * Load related products
   * Fetch 8 products to provide variety and make carousel dynamic
   */
  private loadRelatedProducts(product: Product): void {
    this.relatedLoading.set(true);
    
    this.productsService.getRelatedProducts(product, 8).subscribe({
      next: (products) => {
        this.relatedProducts.set(products);
        this.relatedLoading.set(false);
      },
      error: (error) => {
        console.error('Related products loading error:', error);
        this.relatedLoading.set(false);
      }
    });
  }

  /**
   * Increase quantity
   */
  increaseQuantity(): void {
    const current = this.quantity();
    const max = this.maxQuantity();
    if (current < max) {
      this.quantity.set(current + 1);
    }
  }

  /**
   * Decrease quantity
   */
  decreaseQuantity(): void {
    const current = this.quantity();
    if (current > 1) {
      this.quantity.set(current - 1);
    }
  }

  /**
   * Add to cart using CartStore
   */
  addToCart(): void {
    const prod = this.product();
    if (!prod || !this.canAddToCart()) return;

    // Use CartStore to add product to cart
    this.cartStore.addToCart({ 
      product: prod, 
      quantity: this.quantity() 
    });
  }

  /**
   * Add to wishlist
   */
  addToWishlist(): void {
    const prod = this.product();
    if (!prod) return;

    // TODO: Implement add to wishlist functionality
    console.log('Adding to wishlist:', prod._id);
  }

  /**
   * Navigate to category
   */
  navigateToCategory(): void {
    const prod = this.product();
    if (prod?.category) {
      this.router.navigate(['/categories', prod.category.slug]);
    }
  }

  /**
   * Navigate to brand
   */
  navigateToBrand(): void {
    const prod = this.product();
    if (prod?.brand) {
      this.router.navigate(['/brands', prod.brand.slug]);
    }
  }

  /**
   * Retry loading product
   */
  retryLoading(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProductById(id);
    }
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return this.productsService.formatPrice(price);
  }

  /**
   * Get rating display text
   */
  getRatingDisplay(): string {
    const prod = this.product();
    if (!prod) return '';
    
    const { rating, count } = this.productsService.getProductRatingDisplay(prod);
    return `${rating} ${count}`;
  }
}
