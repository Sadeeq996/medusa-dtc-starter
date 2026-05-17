import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-vendor-admin-dashboard',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, TranslateModule],
    templateUrl: './vendor-admin-dashboard.html',
    styleUrls: ['./vendor-admin-dashboard.scss']
})
export class VendorAdminDashboardComponent { }
