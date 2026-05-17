import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface HomeData {
  heroSlides: HeroSlide[];
  featuredCategories: Category[];
  featuredProducts: Product[];
}

export interface HeroSlide {
  id: number;
  title: string;
  description: string;
  image: string;
  primaryAction: { label: string; action: string };
  secondaryAction: { label: string; action: string };
}

export interface Category {
  id: number;
  name: string;
  image: string;
  itemCount: number;
  slug: string;
}

export interface Product {
  id: string;
  title: string;
  brand?: string;
  category?: string;
  price: number;
  priceAfterDiscount?: number;
  imageCover: string;
  ratingsAverage?: number;
  ratingsQuantity?: number;
  sold?: number;
  quantity?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  /**
   * Get home page data including hero slides, categories, and featured products
   */
  getHomeData(): Observable<HomeData> {
    // TODO: Replace with actual API calls
    const homeData: HomeData = {
      heroSlides: [
        {
          id: 1,
          title: 'Fresh Products Daily',
          description: 'Discover our premium collection of fresh products delivered right to your doorstep with guaranteed quality and freshness.',
          image: 'https://via.placeholder.com/600x400/22c55e/ffffff?text=Fresh+Products',
          primaryAction: { label: 'Shop Now', action: 'shop' },
          secondaryAction: { label: 'Learn More', action: 'learn' }
        },
        {
          id: 2,
          title: 'Electronics & Tech',
          description: 'Explore the latest in technology and electronics with competitive prices and warranty coverage on all products.',
          image: 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Electronics',
          primaryAction: { label: 'Browse Tech', action: 'tech' },
          secondaryAction: { label: 'View Deals', action: 'deals' }
        },
        {
          id: 3,
          title: 'Fashion & Style',
          description: 'Stay trendy with our curated fashion collection featuring the latest styles for men, women, and children.',
          image: 'https://via.placeholder.com/600x400/ec4899/ffffff?text=Fashion',
          primaryAction: { label: 'Explore Fashion', action: 'fashion' },
          secondaryAction: { label: 'New Arrivals', action: 'new' }
        }
      ],
      featuredCategories: [
        { id: 1, name: 'Electronics', image: 'https://via.placeholder.com/200x150/3b82f6/ffffff?text=Electronics', itemCount: 1250, slug: 'electronics' },
        { id: 2, name: 'Mobiles', image: 'https://via.placeholder.com/200x150/ef4444/ffffff?text=Mobiles', itemCount: 890, slug: 'mobiles' },
        { id: 3, name: "Men's Fashion", image: 'https://via.placeholder.com/200x150/8b5cf6/ffffff?text=Men', itemCount: 2100, slug: 'mens-fashion' },
        { id: 4, name: "Women's Fashion", image: 'https://via.placeholder.com/200x150/ec4899/ffffff?text=Women', itemCount: 3200, slug: 'womens-fashion' },
        { id: 5, name: 'Home & Living', image: 'https://via.placeholder.com/200x150/f59e0b/ffffff?text=Home', itemCount: 1800, slug: 'home-living' },
        { id: 6, name: 'Beauty & Health', image: 'https://via.placeholder.com/200x150/10b981/ffffff?text=Beauty', itemCount: 750, slug: 'beauty-health' }
      ],
      featuredProducts: [
        {
          id: '1',
          title: 'Archer VR300 Wi-Fi Router',
          brand: 'Electronics',
          price: 1699,
          imageCover: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Router',
          ratingsAverage: 4.5,
          ratingsQuantity: 128,
          sold: 450
        },
        {
          id: '2',
          title: 'PIXMA G3420 All-in-One Printer',
          brand: 'Electronics',
          price: 5999,
          priceAfterDiscount: 4999,
          imageCover: 'https://via.placeholder.com/300x300/10b981/ffffff?text=Printer',
          ratingsAverage: 4.5,
          ratingsQuantity: 89,
          sold: 320
        }
        // More products can be added here
      ]
    };

    return of(homeData);
  }

  /**
   * Get featured categories for the homepage
   */
  getFeaturedCategories(): Observable<Category[]> {
    // TODO: Replace with actual API call to /categories?limit=8
    return this.getHomeData().pipe(
      map(data => data.featuredCategories)
    );
  }

  /**
   * Get featured products for the homepage
   */
  getFeaturedProducts(): Observable<Product[]> {
    // TODO: Replace with actual API call to /products?limit=12&sort=-ratingsAverage
    return this.getHomeData().pipe(
      map(data => data.featuredProducts)
    );
  }

  /**
   * Get hero slides for the homepage
   */
  getHeroSlides(): Observable<HeroSlide[]> {
    // TODO: This might come from a CMS or be configured in admin panel
    return this.getHomeData().pipe(
      map(data => data.heroSlides)
    );
  }
}
