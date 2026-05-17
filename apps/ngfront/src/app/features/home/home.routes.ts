import { Routes } from '@angular/router';

export const homeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home-page/home-page').then(m => m.HomePage)
  }
];
