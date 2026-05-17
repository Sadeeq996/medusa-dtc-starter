import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TranslateModule } from '@ngx-translate/core';

import { MarketplaceService } from '../../services/marketplace';
import { Vendor } from '../../models/vendor.model';

@Component({
    selector: 'app-vendor-details',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, CardModule, TranslateModule],
    templateUrl: './vendor-details.html',
    styleUrls: ['./vendor-details.scss']
})
export class VendorDetailsComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly marketplaceService = inject(MarketplaceService);

    vendor?: Vendor;
    loading = false;

    ngOnInit(): void {
        this.loading = true;
        const handle = this.route.snapshot.params['handle'];

        if (handle) {
            this.marketplaceService.getVendorByHandle(handle).subscribe(vendor => {
                this.vendor = vendor;
                this.loading = false;
            });
        } else {
            this.loading = false;
        }
    }
}
