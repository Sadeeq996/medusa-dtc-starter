import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { Category } from '../../../categories/models/category.model';
import { CategoriesService } from '../../../categories/services/categories';

@Component({
  selector: 'app-categories-showcase',
  imports: [CommonModule, RouterLink, TranslateModule, CardModule, ButtonModule, SkeletonModule],
  templateUrl: './categories-showcase.html',
  styleUrl: './categories-showcase.scss'
})
export class CategoriesShowcase implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly router = inject(Router);
  
  categories = signal<Category[]>([]);
  loading = signal(true);
  
  ngOnInit() {
    this.loadCategories();
  }
  
  private loadCategories() {
    this.loading.set(true);
    
    // Load 6 featured categories for homepage
    this.categoriesService.getFeaturedCategories(6).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories.set([]);
        this.loading.set(false);
      }
    });
  }
  
  /**
   * Navigate to category details
   */
  navigateToCategory(category: Category): void {
    this.router.navigate(['/categories', category.slug]);
  }
}
