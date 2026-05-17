export interface VendorAdmin {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
}

export interface Vendor {
    id: string;
    handle: string;
    name: string;
    logo?: string | null;
    admins?: VendorAdmin[];
    description?: string;
    rating?: number;
    productCount?: number;
}
