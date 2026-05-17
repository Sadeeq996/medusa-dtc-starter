import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TranslateModule } from '@ngx-translate/core';

import { MarketplaceService } from '../../services/marketplace';
import { Vendor } from '../../models/vendor.model';

@Component({
    selector: 'app-vendor-list',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, TranslateModule],
    templateUrl: './vendor-list.html',
    styleUrls: ['./vendor-list.scss']
})
export class VendorListComponent implements OnInit {
    private readonly marketplaceService = inject(MarketplaceService);
    private readonly router = inject(Router);

    vendors: Vendor[] = [];
    loading = false;

    ngOnInit(): void {
        this.loading = true;
        this.marketplaceService.getVendors().subscribe(vendors => {
            this.vendors = vendors;
            this.loading = false;
        });
    }

    navigateToVendor(handle: string): void {
        this.router.navigate(['/marketplace/vendors', handle]);
    }
}
