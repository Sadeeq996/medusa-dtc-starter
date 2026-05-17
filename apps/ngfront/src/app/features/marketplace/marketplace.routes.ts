import { Routes } from '@angular/router';

export const marketplaceRoutes: Routes = [
    {
        path: '',
        redirectTo: 'vendors',
        pathMatch: 'full'
    },
    {
        path: 'vendors',
        loadComponent: () => import('./components/vendor-list/vendor-list').then(m => m.VendorListComponent),
        title: 'Marketplace - Sellpadi',
        data: {
            description: 'Browse marketplace vendors and storefronts',
            keywords: 'marketplace, vendors, multivendor, Sellpadi'
        }
    },
    {
        path: 'vendors/:handle',
        loadComponent: () => import('./components/vendor-details/vendor-details').then(m => m.VendorDetailsComponent),
        title: 'Vendor Storefront - Sellpadi',
        data: {
            description: 'View a vendor storefront and product collection',
            keywords: 'vendor storefront, marketplace vendor, vendor products, Sellpadi'
        }
    },
    {
        path: 'admin/dashboard',
        loadComponent: () => import('./components/vendor-admin-dashboard/vendor-admin-dashboard').then(m => m.VendorAdminDashboardComponent),
        title: 'Vendor Admin Dashboard - Sellpadi',
        data: {
            description: 'Vendor admin dashboard for marketplace operations',
            keywords: 'vendor admin, marketplace dashboard, vendor orders, vendor products, Sellpadi'
        }
    }
];
