import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

// Home Feature Components
import { HeroSection } from '../hero-section/hero-section';
import { CategoriesShowcase } from '../categories-showcase/categories-showcase';
import { FeaturedProducts } from '../featured-products/featured-products';

@Component({
  selector: 'app-home-page',
  imports: [
    CommonModule, 
    TranslateModule, 
    HeroSection, 
    CategoriesShowcase, 
    FeaturedProducts
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage {
  // Main home page component that composes all home feature sections
  // Following the BRD structure: Hero → Categories → Products
}
