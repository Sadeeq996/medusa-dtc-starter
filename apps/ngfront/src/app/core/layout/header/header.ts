import { Component, inject, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MenubarModule } from 'primeng/menubar';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Subscription, combineLatest } from 'rxjs';
import { I18nService } from '../../services/i18n';
import { ThemeService, ThemePreset, THEME_PRESETS } from '../../services/theme';
import { AuthService } from '../../../features/auth/services/auth';
import { CartStore } from '../../../features/cart/store/cart.store';
import { WishlistStore } from '../../../features/wishlist/store/wishlist.store';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterModule, MenubarModule, ToolbarModule, MenuModule, ButtonModule, DrawerModule, AvatarModule, RippleModule, TooltipModule, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header implements OnInit, OnDestroy {
  private readonly i18nService = inject(I18nService);
  private readonly themeService = inject(ThemeService);
  private readonly translateService = inject(TranslateService);
  private readonly authService = inject(AuthService);
  private readonly cartStore = inject(CartStore);
  private readonly wishlistStore = inject(WishlistStore);
  private translationSubscription?: Subscription;
  private authSubscription?: Subscription;
  
  readonly drawerVisible = signal(false);
  
  readonly isAuthenticated = toSignal(this.authService.isAuthenticated$, { initialValue: false });
  readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  readonly currentUserName = computed(() => this.currentUser()?.name ?? null);
  
  readonly currentLanguage = this.i18nService.currentLanguage;
  readonly isDarkMode = this.themeService.isDarkMode;
  
  // Badge counts for Cart and Wishlist
  readonly cartBadgeCount = computed(() => this.cartStore.badgeCount());
  readonly wishlistBadgeCount = computed(() => this.wishlistStore.badgeCount());
  
  // Theme preset management
  readonly availableThemePresets = THEME_PRESETS;
  readonly currentThemePreset = this.themeService.currentPreset;
  readonly currentPresetConfig = this.themeService.currentPresetConfig;
  
  // Theme preset menu items for mobile
  readonly themePresetMenuItems = computed<MenuItem[]>(() => 
    this.availableThemePresets.map(preset => ({
      label: preset.name,
      icon: preset.icon,
      command: () => this.onThemePresetChange(preset.value)
    }))
  );
  
  // ✅ MINIMAL CHANGE: Only the parts that need reactivity
  // Store translations in a signal for reactive menu items
  private readonly translationStrings = signal({
    home: '',
    products: '',
    categories: '',
    brands: '',
    cart: '',
    wishlist: '',
    orders: '',
    viewProfile: '',
    addresses: '',
    settings: '',
    logout: ''
  });
  
  // ✅ REFACTORED: Extract common menu items to reduce duplication
  // Returns readonly array to prevent accidental mutations
  private getBaseMenuItems(t: ReturnType<typeof this.translationStrings>): readonly MenuItem[] {
    return [
      {
        label: t.home,
        icon: PrimeIcons.HOME,
        routerLink: '/'
      },
      {
        label: t.products,
        icon: PrimeIcons.SHOPPING_BAG,
        routerLink: '/products'
      },
      {
        label: t.categories,
        icon: PrimeIcons.LIST,
        routerLink: '/categories'
      },
      {
        label: t.brands,
        icon: PrimeIcons.BOOKMARK,
        routerLink: '/brands'
      }
    ];
  }
  
  // ✅ Desktop menu items (Cart & Wishlist moved to action buttons)
  readonly menuItems = computed<MenuItem[]>(() => {
    const t = this.translationStrings();
    const authenticated = this.isAuthenticated();
    
    // Clone base items to maintain immutability
    const items = [...this.getBaseMenuItems(t)];
    
    // Add Orders as direct link for authenticated users
    if (authenticated) {
      items.push({
        label: t.orders,
        icon: PrimeIcons.BOX,
        routerLink: '/profile/orders'
      });
    }
    
    return items;
  });
  
  // ✅ Mobile drawer menu items (includes Cart & Wishlist)
  readonly mobileMenuItems = computed<MenuItem[]>(() => {
    const t = this.translationStrings();
    const authenticated = this.isAuthenticated();
    
    // Clone base items to maintain immutability
    const items = [...this.getBaseMenuItems(t)];
    
    // Add Cart & Wishlist for mobile (using computed badge counts)
    items.push(
      {
        label: t.wishlist,
        icon: PrimeIcons.HEART,
        routerLink: '/wishlist',
        badge: this.wishlistBadgeCount()
      },
      {
        label: t.cart,
        icon: PrimeIcons.SHOPPING_CART,
        routerLink: '/cart',
        badge: this.cartBadgeCount()
      }
    );
    
    // Add Orders for authenticated users
    if (authenticated) {
      items.push({
        label: t.orders,
        icon: PrimeIcons.BOX,
        routerLink: '/profile/orders'
      });
    }
    
    return items;
  });

  // User dropdown menu items (Profile, Addresses, Settings, Logout)
  // Note: Orders is in main menu, not in dropdown
  readonly userMenuItems = computed<MenuItem[]>(() => {
    const t = this.translationStrings();
    
    return [
      {
        label: t.viewProfile,
        icon: PrimeIcons.USER,
        routerLink: '/profile'
      },
      {
        separator: true
      },
      {
        label: t.addresses,
        icon: PrimeIcons.MAP_MARKER,
        routerLink: '/profile/addresses'
      },
      {
        label: t.settings,
        icon: PrimeIcons.COG,
        routerLink: '/profile/settings'
      },
      {
        separator: true
      },
      {
        label: t.logout,
        icon: PrimeIcons.SIGN_OUT,
        command: () => this.logout()
      }
    ];
  });

  ngOnInit(): void {
    // Watch for authentication changes and update cart & wishlist accordingly
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      this.cartStore.onAuthenticationChange(isAuthenticated);
      this.wishlistStore.onAuthenticationChange(isAuthenticated);
    });
    
    // ✅ Keep translation observable - it works fine and changes rarely
    // Only update the signal when translations change
    this.translationSubscription = combineLatest([
      this.translateService.stream('NAVIGATION.HOME'),
      this.translateService.stream('NAVIGATION.PRODUCTS'),
      this.translateService.stream('NAVIGATION.CATEGORIES'),
      this.translateService.stream('NAVIGATION.BRANDS'),
      this.translateService.stream('NAVIGATION.CART'),
      this.translateService.stream('NAVIGATION.WISHLIST'),
      this.translateService.stream('NAVIGATION.ORDERS'),
      this.translateService.stream('NAVIGATION.VIEW_PROFILE'),
      this.translateService.stream('NAVIGATION.ADDRESSES'),
      this.translateService.stream('NAVIGATION.SETTINGS'),
      this.translateService.stream('NAVIGATION.LOGOUT')
    ]).subscribe(([home, products, categories, brands, cart, wishlist, orders, viewProfile, addresses, settings, logout]) => {
      // Update translation signal - menuItems computed will auto-update
      this.translationStrings.set({ home, products, categories, brands, cart, wishlist, orders, viewProfile, addresses, settings, logout });
    });
  }

  ngOnDestroy(): void {
    this.translationSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  /**
   * Toggle language between English and Arabic
   */
  toggleLanguage(): void {
    this.i18nService.toggleLanguage();
  }

  /**
   * Toggle theme between light and dark
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Change theme preset
   */
  onThemePresetChange(preset: ThemePreset): void {
    this.themeService.setPreset(preset);
  }

  /**
   * Get preset description by theme name
   */
  getPresetDescription(themeName: string): string {
    const preset = this.availableThemePresets.find(p => p.name === themeName);
    return preset ? `${preset.primaryColor} • ${preset.description}` : '';
  }

  /**
   * Check if given theme name is the current theme
   */
  isCurrentTheme(themeName: string): boolean {
    const preset = this.availableThemePresets.find(p => p.name === themeName);
    return preset ? preset.value === this.currentThemePreset() : false;
  }

  /**
   * Handle user logout
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.authService.navigateToLogin();
  }

  /**
   * Navigate to register page
   */
  navigateToRegister(): void {
    this.authService.navigateToRegister();
  }

  /**
   * Open mobile navigation drawer
   */
  openDrawer(): void {
    this.drawerVisible.set(true);
  }

  /**
   * Close mobile navigation drawer
   */
  closeDrawer(): void {
    this.drawerVisible.set(false);
  }

  /**
   * Handle menu item click in drawer
   */
  handleDrawerMenuItemClick(item: MenuItem): void {
    if (item.command) {
      item.command({ originalEvent: new Event('click'), item });
    }
    this.closeDrawer();
  }
}