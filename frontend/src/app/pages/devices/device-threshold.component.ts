import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeviceService, Threshold, ThresholdListResponse } from '../../core/services/device.service';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-device-threshold',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, InputNumberModule, DropdownModule, ButtonModule],
  templateUrl: './device-threshold.component.html'
})
export class DeviceThresholdComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly deviceService = inject(DeviceService);
  private readonly fb = inject(FormBuilder);

  publicId = '';
  loading: boolean = true;
  error: string | null = null;
  thresholds: Threshold[] = [];
  metrics: { label: string; value: string }[] = [];

  form = this.fb.group({
    metric_name: ['', [Validators.required, Validators.minLength(2)]],
    min_limit: [null as unknown as number, [Validators.required]],
    max_limit: [null as unknown as number, [Validators.required]],
    is_active: [true]
  });

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('public_id') || '';
    this.fetchThresholds();
    this.tryLoadMetrics();
  }

  fetchThresholds(): void {
    this.loading = true;
    this.error = null;
    this.deviceService.getDeviceThresholds(this.publicId).subscribe({
      next: (response) => {
        const list = Array.isArray(response) ? response : response.results;
        this.thresholds = list;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Falha ao carregar limites';
        this.loading = false;
      }
    });
  }

  onDelete(threshold: Threshold): void {
    if (!confirm('Confirma excluir este limite?')) return;
    this.deviceService.deleteDeviceThreshold(this.publicId, threshold.id).subscribe({
      next: () => this.fetchThresholds(),
      error: (err) => this.error = err.message || 'Falha ao excluir limite'
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = {
      metric_name: this.form.value.metric_name as string,
      min_limit: String(this.form.value.min_limit ?? ''),
      max_limit: String(this.form.value.max_limit ?? ''),
      is_active: !!this.form.value.is_active
    };
    this.deviceService.createDeviceThreshold(this.publicId, payload).subscribe({
      next: () => {
        this.form.reset({ metric_name: '', min_limit: null as any, max_limit: null as any, is_active: true });
        this.fetchThresholds();
      },
      error: (err) => this.error = err.message || 'Falha ao criar limite'
    });
  }

  private tryLoadMetrics(): void {
    // Tenta obter métricas via lista paginada para achar o deviceId
    this.deviceService.getDevices().subscribe({
      next: (resp) => {
        const device = resp.results.find(d => d.public_id === this.publicId);
        if (device) {
          this.deviceService.getDeviceMetrics(device.id).subscribe({
            next: (r) => {
              this.metrics = (r.metrics || []).map(m => ({ label: m, value: m }));
            },
            error: () => {
              this.metrics = [];
            }
          });
        }
      },
      error: () => {
        this.metrics = [];
      }
    });
  }
}


