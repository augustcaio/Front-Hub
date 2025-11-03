import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DeviceService, Device, DeviceListResponse } from '../../core/services/device.service';
import { getDeviceStatusSeverity, getDeviceStatusLabel } from '../../core/utils/device.utils';
import { formatDateTime } from '../../core/utils/date.utils';

interface StatusOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    InputTextModule,
    DropdownModule,
    PaginatorModule,
    CardModule,
    ToolbarModule,
  ],
  templateUrl: './devices-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesListComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  loading = true;
  error: string | null = null;
  devices: Device[] = [];
  totalRecords = 0;
  first = 0;
  rows = 20;

  searchText = '';
  selectedStatus: string | null = null;

  statusOptions: StatusOption[] = [];

  ngOnInit(): void {
    this.updateStatusOptions();
    this.translate.onLangChange.subscribe(() => {
      this.updateStatusOptions();
      this.cdr.markForCheck();
    });
    this.loadDevices();
  }

  private updateStatusOptions(): void {
    this.statusOptions = [
      { label: this.translate.instant('devices.all'), value: null },
      { label: this.translate.instant('devices.statusOptions.active'), value: 'active' },
      { label: this.translate.instant('devices.statusOptions.inactive'), value: 'inactive' },
      { label: this.translate.instant('devices.statusOptions.maintenance'), value: 'maintenance' },
      { label: this.translate.instant('devices.statusOptions.error'), value: 'error' },
    ];
  }

  loadDevices(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.deviceService.getDevices().subscribe({
      next: (response: DeviceListResponse) => {
        let filteredDevices = response.results;

        // Filtrar por status
        if (this.selectedStatus) {
          filteredDevices = filteredDevices.filter(
            (device) => device.status === this.selectedStatus
          );
        }

        // Filtrar por busca
        if (this.searchText.trim()) {
          const searchLower = this.searchText.toLowerCase().trim();
          filteredDevices = filteredDevices.filter(
            (device) =>
              device.name.toLowerCase().includes(searchLower) ||
              device.public_id.toLowerCase().includes(searchLower) ||
              (device.description && device.description.toLowerCase().includes(searchLower))
          );
        }

        this.devices = filteredDevices;
        this.totalRecords = filteredDevices.length;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.error = error.message || this.translate.instant('common.error');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onStatusChange(): void {
    this.first = 0; // Reset paginação
    this.loadDevices();
  }

  onSearch(): void {
    this.first = 0; // Reset paginação
    this.loadDevices();
  }

  clearSearch(): void {
    this.searchText = '';
    this.onSearch();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.first = event.first;
    this.rows = event.rows;
    // Paginação local já está implementada via filtros
    this.cdr.markForCheck();
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warning' | 'info' {
    return getDeviceStatusSeverity(status);
  }

  getStatusLabel(status: string): string {
    return getDeviceStatusLabel(status);
  }

  formatDate(dateString: string): string {
    return formatDateTime(dateString);
  }

  getCurrentPageReportTemplate(): string {
    return this.translate.instant('devices.showingDevices');
  }

  refresh(): void {
    this.loadDevices();
  }
}
