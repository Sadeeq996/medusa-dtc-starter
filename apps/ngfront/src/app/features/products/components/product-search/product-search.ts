import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// PrimeNG Components
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DrawerModule } from 'primeng/drawer';

// Feature Imports
import { ProductsService } from '../../services/products';
import { Product, ProductQueryParams, ProductFilters } from '../../models/product.model';
import { ProductCard } from '../../../../shared/components/product-card/product-card';
import { SEARCH_SORT_OPTIONS } from '../../constants/product-sort-options.const';

/**
 * ProductSearch Component
 * Advanced product search with filters, sorting, and suggestions
 */
@Component({
  selector: 'app-product-search',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    // PrimeNG
    AutoCompleteModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    SliderModule,
    CheckboxModule,
    PaginatorModule,
    SkeletonModule,
    MessageModule,
    CardModule,
    ChipModule,
    DrawerModule,
    // Shared
    ProductCard
  ],
  templateUrl: './product-search.html',
  styleUrl: './product-search.scss'
})
export class ProductSearchComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly translateService = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();

  // Component state
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string>('');
  readonly totalProducts = signal(0);
  readonly currentPage = signal(1);
  readonly itemsPerPage = signal(30);

  // Search state
  readonly searchQuery = signal('');
  readonly searchControl = new FormControl('');
  readonly suggestions = signal<string[]>([]);
  readonly recentSearches = signal<string[]>([]);
  readonly showFilters = signal(false);

  // Filter state
  readonly filters = signal<ProductFilters>({
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 10000 },
    rating: 0,
    inStock: false,
    onSale: false
  });

  // Track current language to make sort options reactive
  readonly currentLang = signal('en');

  // Sort options - translated dynamically and reactively
  readonly sortBy = signal('relevance');
  readonly sortOptions = computed(() => {
    // Include currentLang in the computed to create reactive dependency
    const lang = this.currentLang();
    return SEARCH_SORT_OPTIONS.map(option => ({
      label: this.translateService.instant(option.labelKey),
      value: option.value
    }));
  });

  // Pagination options
  readonly rowsPerPageOptions = signal([15, 30, 50, 100]);

  // Filter options (will be populated from API)
  readonly categoryOptions = signal<{label: string, value: string}[]>([]);
  readonly brandOptions = signal<{label: string, value: string}[]>([]);

  // Computed properties
  readonly totalPages = computed(() => 
    Math.ceil(this.totalProducts() / this.itemsPerPage())
  );

  readonly hasProducts = computed(() => this.products().length > 0);
  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return f.categories.length > 0 || 
           f.brands.length > 0 || 
           f.rating > 0 || 
           f.inStock || 
           f.onSale ||
           f.priceRange.min > 0 || 
           f.priceRange.max < 10000;
  });

  readonly activeFiltersCount = computed(() => {
    const f = this.filters();
    let count = 0;
    if (f.categories.length > 0) count++;
    if (f.brands.length > 0) count++;
    if (f.rating > 0) count++;
    if (f.inStock) count++;
    if (f.onSale) count++;
    if (f.priceRange.min > 0 || f.priceRange.max < 10000) count++;
    return count;
  });

  ngOnInit(): void {
    this.initializeFromRoute();
    this.setupSearchControl();
    this.loadRecentSearches();
    this.performSearch();
    
    // Subscribe to language changes to update sort options
    this.translateService.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.currentLang.set(event.lang);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize from route parameters
   */
  private initializeFromRoute(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['q']) {
        this.searchQuery.set(params['q']);
        this.searchControl.setValue(params['q'], { emitEvent: false });
      }
      if (params['page']) {
        this.currentPage.set(+params['page']);
      }
      if (params['sort']) {
        this.sortBy.set(params['sort']);
      }
      if (params['limit']) {
        const limit = +params['limit'];
        if (this.rowsPerPageOptions().includes(limit)) {
          this.itemsPerPage.set(limit);
        }
      }
      // TODO: Load other filters from params
    });
  }

  /**
   * Setup search control with debounce
   */
  private setupSearchControl(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        if (value !== this.searchQuery()) {
          this.searchQuery.set(value || '');
          this.currentPage.set(1);
          this.updateRoute();
          this.performSearch();
        }
      });
  }

  /**
   * Load recent searches from localStorage
   */
  private loadRecentSearches(): void {
    try {
      const recent = JSON.parse(localStorage.getItem('recent-searches') || '[]');
      this.recentSearches.set(recent.slice(0, 5)); // Keep only last 5
    } catch {
      this.recentSearches.set([]);
    }
  }

  /**
   * Save search to recent searches
   */
  private saveToRecentSearches(query: string): void {
    if (!query.trim()) return;
    
    const recent = this.recentSearches();
    const filtered = recent.filter(s => s !== query);
    const updated = [query, ...filtered].slice(0, 5);
    
    this.recentSearches.set(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  }

  /**
   * Perform search with current parameters
   */
  performSearch(): void {
    const query = this.searchQuery().trim();
    if (!query) {
      this.products.set([]);
      this.totalProducts.set(0);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const params: ProductQueryParams = {
      keyword: query,
      page: this.currentPage(),
      limit: this.itemsPerPage(),
      sort: this.sortBy() === 'relevance' ? undefined : this.sortBy()
    };

    // Apply filters
    const f = this.filters();
    if (f.categories.length > 0) {
      params['category[in]'] = f.categories;
    }
    if (f.brands.length > 0) {
      params.brand = f.brands[0]; // API supports single brand
    }
    if (f.priceRange.min > 0) {
      params['price[gte]'] = f.priceRange.min;
    }
    if (f.priceRange.max < 10000) {
      params['price[lte]'] = f.priceRange.max;
    }

    this.productsService.searchProducts(query, params).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.totalProducts.set(response.results);
        this.loading.set(false);
        this.saveToRecentSearches(query);
        
        // Scroll to top on new search
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error) => {
        this.error.set(error?.message || 'Search failed. Please try again.');
        this.loading.set(false);
        console.error('Search error:', error);
      }
    });
  }

  /**
   * Handle search suggestions
   */
  onSearchSuggestion(event: any): void {
    const query = event.query.toLowerCase();
    // Simple mock suggestions - in real app, use API
    const mockSuggestions = [
      'laptop', 'phone', 'headphones', 'camera', 'watch',
      'shoes', 'shirt', 'dress', 'bag', 'perfume'
    ];
    
    this.suggestions.set(
      mockSuggestions.filter(s => s.includes(query))
    );
  }

  /**
   * Handle suggestion selection
   */
  onSuggestionSelect(event: any): void {
    const suggestion = event?.value || event || '';
    this.searchQuery.set(suggestion);
    this.currentPage.set(1);
    this.updateRoute();
    this.performSearch();
  }

  /**
   * Use recent search
   */
  useRecentSearch(query: string): void {
    this.searchControl.setValue(query);
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.updateRoute();
    this.performSearch();
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    this.recentSearches.set([]);
    localStorage.removeItem('recent-searches');
  }

  /**
   * Toggle filters sidebar
   */
  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  /**
   * Update filters
   */
  updateFilters(newFilters: Partial<ProductFilters>): void {
    this.filters.update(current => ({ ...current, ...newFilters }));
    this.currentPage.set(1);
    this.updateRoute();
    this.performSearch();
  }

  /**
   * Remove a category filter
   */
  removeCategory(category: string): void {
    this.updateFilters({ 
      categories: this.filters().categories.filter(c => c !== category) 
    });
  }

  /**
   * Remove a brand filter
   */
  removeBrand(brand: string): void {
    this.updateFilters({ 
      brands: this.filters().brands.filter(b => b !== brand) 
    });
  }

  /**
   * Handle rating filter change
   */
  onRatingChange(rating: number, checked: boolean): void {
    this.updateFilters({ rating: checked ? rating : 0 });
  }

  /**
   * Handle in stock filter change
   */
  onInStockChange(checked: boolean): void {
    this.updateFilters({ inStock: checked });
  }

  /**
   * Handle on sale filter change
   */
  onSaleChange(checked: boolean): void {
    this.updateFilters({ onSale: checked });
  }

  /**
   * Handle price range change
   */
  onPriceRangeChange(event: any): void {
    // Extract values from slider event
    let priceRange;
    if (event && typeof event === 'object' && 'values' in event) {
      priceRange = { min: event.values[0], max: event.values[1] };
    } else if (event && typeof event === 'object' && 'value' in event) {
      priceRange = { min: event.value[0], max: event.value[1] };
    } else if (Array.isArray(event)) {
      priceRange = { min: event[0], max: event[1] };
    } else {
      priceRange = { min: 0, max: 10000 };
    }
    this.updateFilters({ priceRange });
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters.set({
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 10000 },
      rating: 0,
      inStock: false,
      onSale: false
    });
    this.currentPage.set(1);
    this.updateRoute();
    this.performSearch();
  }

  /**
   * Handle sort change
   */
  onSortChange(event: any): void {
    const sortValue = event?.value || event || '';
    this.sortBy.set(sortValue);
    this.currentPage.set(1);
    this.updateRoute();
    this.performSearch();
  }

  /**
   * Handle pagination
   */
  onPageChange(event: any): void {
    const newPage = event.page + 1;
    const newRows = event.rows;
    
    // Update page if changed
    if (newPage !== this.currentPage()) {
      this.currentPage.set(newPage);
    }
    
    // Update rows per page if changed
    if (newRows !== this.itemsPerPage()) {
      this.itemsPerPage.set(newRows);
      this.currentPage.set(1); // Reset to first page when changing page size
    }
    
    this.updateRoute();
    this.performSearch();
  }

  /**
   * Update route with current state
   */
  private updateRoute(): void {
    const queryParams: any = {};
    
    if (this.searchQuery()) {
      queryParams.q = this.searchQuery();
    }
    if (this.currentPage() > 1) {
      queryParams.page = this.currentPage();
    }
    if (this.sortBy() !== 'relevance') {
      queryParams.sort = this.sortBy();
    }
    if (this.itemsPerPage() !== 30) { // Only add if different from default
      queryParams.limit = this.itemsPerPage();
    }
    // TODO: Add filter params

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'replace'
    });
  }

  /**
   * Generate skeleton items
   */
  generateSkeletonItems(): number[] {
    return Array(12).fill(0).map((_, i) => i);
  }
}
