import { Component, signal, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-hero-section',
  imports: [CommonModule, RouterLink, TranslateModule, CarouselModule, ButtonModule, CardModule],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss'
})
export class HeroSection implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private resizeListener?: () => void;
  
  readonly mobileView = signal(false);
  
  // Hero slides with translation keys
  readonly heroSlides = [
    {
      id: 1,
      titleKey: 'HOME.HERO.SLIDE_1_TITLE',
      descriptionKey: 'HOME.HERO.SLIDE_1_DESCRIPTION',
      image: 'images/Fresh-Products.jpg',
      primaryAction: { 
        labelKey: 'HOME.HERO.SLIDE_1_PRIMARY_ACTION', 
        action: 'shop' 
      },
      secondaryAction: { 
        labelKey: 'HOME.HERO.SLIDE_1_SECONDARY_ACTION', 
        action: 'learn' 
      }
    },
    {
      id: 2,
      titleKey: 'HOME.HERO.SLIDE_2_TITLE',
      descriptionKey: 'HOME.HERO.SLIDE_2_DESCRIPTION',
      image: 'images/Electronics.jpg',
      primaryAction: { 
        labelKey: 'HOME.HERO.SLIDE_2_PRIMARY_ACTION', 
        action: 'tech' 
      },
      secondaryAction: { 
        labelKey: 'HOME.HERO.SLIDE_2_SECONDARY_ACTION', 
        action: 'deals' 
      }
    },
    {
      id: 3,
      titleKey: 'HOME.HERO.SLIDE_3_TITLE',
      descriptionKey: 'HOME.HERO.SLIDE_3_DESCRIPTION',
      image: 'images/Fashion.jpg',
      primaryAction: { 
        labelKey: 'HOME.HERO.SLIDE_3_PRIMARY_ACTION', 
        action: 'fashion' 
      },
      secondaryAction: { 
        labelKey: 'HOME.HERO.SLIDE_3_SECONDARY_ACTION', 
        action: 'new' 
      }
    }
  ];
  
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobileView();
      this.resizeListener = () => this.checkMobileView();
      window.addEventListener('resize', this.resizeListener);
    }
  }
  
  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId) && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }
  
  private checkMobileView() {
    this.mobileView.set(window.innerWidth < 768);
  }
  
  isMobile(): boolean {
    return this.mobileView();
  }
}

