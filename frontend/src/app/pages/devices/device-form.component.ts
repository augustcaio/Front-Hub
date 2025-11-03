import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  DeviceService,
  Device,
  DeviceCreateRequest,
  Category,
} from '../../core/services/device.service';

interface StatusOption {
  label: string;
  value: 'active' | 'inactive' | 'maintenance' | 'error';
}

@Component({
  selector: 'app-device-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    CardModule,
    MessageModule,
    InputTextareaModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './device-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceFormComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly deviceForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    category: [null],
    status: ['inactive', [Validators.required]],
    description: ['', [Validators.maxLength(1000)]],
  });

  loading = false;
  loadingCategories = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isEditMode = false;
  deviceId: number | null = null;
  categories: Category[] = [];

  statusOptions: StatusOption[] = [
    { label: 'Ativo', value: 'active' },
    { label: 'Inativo', value: 'inactive' },
    { label: 'Manutenção', value: 'maintenance' },
    { label: 'Erro', value: 'error' },
  ];

  get name() {
    return this.deviceForm.get('name');
  }

  get category() {
    return this.deviceForm.get('category');
  }

  get status() {
    return this.deviceForm.get('status');
  }

  get description() {
    return this.deviceForm.get('description');
  }

  ngOnInit(): void {
    this.loadCategories();
    
    // Verifica se está em modo de edição
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.deviceId = parseInt(id, 10);
      this.loadDevice(this.deviceId);
    }
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.deviceService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadingCategories = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingCategories = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadDevice(id: number): void {
    this.loading = true;
    this.deviceService.getDevice(id).subscribe({
      next: (device) => {
        this.deviceForm.patchValue({
          name: device.name,
          category: device.category,
          status: device.status,
          description: device.description || '',
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Erro ao carregar dispositivo';
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    if (this.deviceForm.invalid) {
      this.markFormGroupTouched(this.deviceForm);
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.deviceForm.value;
    const deviceData: DeviceCreateRequest = {
      name: formValue.name.trim(),
      category: formValue.category || null,
      status: formValue.status,
      description: formValue.description?.trim() || null,
    };

    if (this.isEditMode && this.deviceId) {
      // Atualizar dispositivo existente
      this.deviceService.updateDevice(this.deviceId, deviceData).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Dispositivo atualizado com sucesso!';
          this.cdr.markForCheck();
          setTimeout(() => {
            this.router.navigate(['/devices']);
          }, 1500);
        },
        error: (error: Error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Erro ao atualizar dispositivo';
          this.cdr.markForCheck();
        },
      });
    } else {
      // Criar novo dispositivo
      this.deviceService.createDevice(deviceData).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Dispositivo criado com sucesso!';
          this.cdr.markForCheck();
          setTimeout(() => {
            this.router.navigate(['/devices']);
          }, 1500);
        },
        error: (error: Error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Erro ao criar dispositivo';
          this.cdr.markForCheck();
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/devices']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

