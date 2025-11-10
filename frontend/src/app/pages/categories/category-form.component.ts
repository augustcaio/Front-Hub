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
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  CategoryService,
  CategoryCreateRequest,
} from '../../core/services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    MessageModule,
    InputTextareaModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './category-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  readonly categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(1000)]],
  });

  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isEditMode = false;
  categoryId: number | null = null;

  get name() {
    return this.categoryForm.get('name');
  }

  get description() {
    return this.categoryForm.get('description');
  }

  ngOnInit(): void {
    // Verifica se está em modo de edição
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.categoryId = parseInt(id, 10);
      this.loadCategory(this.categoryId);
    }
  }

  loadCategory(id: number): void {
    this.loading = true;
    this.categoryService.getCategory(id).subscribe({
      next: (category) => {
        this.categoryForm.patchValue({
          name: category.name,
          description: category.description || '',
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message || this.translate.instant('categories.loadError');
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched(this.categoryForm);
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.categoryForm.value;
    const categoryData: CategoryCreateRequest = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || null,
    };

    if (this.isEditMode && this.categoryId) {
      // Atualizar categoria existente
      this.categoryService.updateCategory(this.categoryId, categoryData).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = this.translate.instant('categories.updateSuccess');
          this.cdr.markForCheck();
          setTimeout(() => {
            this.router.navigate(['/categories']);
          }, 1500);
        },
        error: (error: Error) => {
          this.loading = false;
          this.errorMessage = error.message || this.translate.instant('categories.updateError');
          this.cdr.markForCheck();
        },
      });
    } else {
      // Criar nova categoria
      this.categoryService.createCategory(categoryData).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = this.translate.instant('categories.createSuccess');
          this.cdr.markForCheck();
          setTimeout(() => {
            this.router.navigate(['/categories']);
          }, 1500);
        },
        error: (error: Error) => {
          this.loading = false;
          this.errorMessage = error.message || this.translate.instant('categories.createError');
          this.cdr.markForCheck();
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/categories']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

