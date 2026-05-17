import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api';
import { VENDOR_ENDPOINTS } from '../../../core/constants/api-endpoints.const';
import { Vendor } from '../models/vendor.model';

@Injectable({
    providedIn: 'root'
})
export class MarketplaceService {
    private readonly api = inject(ApiService);

    /**
     * Fetches marketplace vendors from the backend marketplace module.
     */
    getVendors(): Observable<Vendor[]> {
        return this.api.get<Vendor[] | { vendors: Vendor[] }>(VENDOR_ENDPOINTS.GET_ALL)
            .pipe(
                map(response => Array.isArray(response) ? response : response.vendors ?? [])
            );
    }

    /**
     * Fetches a single vendor by handle from the backend marketplace module.
     */
    getVendorByHandle(handle: string): Observable<Vendor | undefined> {
        return this.api.get<Vendor | { vendor: Vendor }>(VENDOR_ENDPOINTS.GET_BY_HANDLE(handle))
            .pipe(
                map(response => {
                    if (!response) {
                        return undefined;
                    }

                    return 'vendor' in response ? response.vendor : response;
                })
            );
    }
}
