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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CategoryService, Category } from '../../core/services/category.service';
import { formatDateTime } from '../../core/utils/date.utils';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    ProgressSpinnerModule,
    InputTextModule,
    PaginatorModule,
    CardModule,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './categories-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesListComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  loading = true;
  error: string | null = null;
  categories: Category[] = [];
  totalRecords = 0;
  first = 0;
  rows = 20;

  searchText = '';

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        let filteredCategories = categories;

        // Filtrar por busca
        if (this.searchText.trim()) {
          const searchLower = this.searchText.toLowerCase().trim();
          filteredCategories = filteredCategories.filter(
            (category) =>
              category.name.toLowerCase().includes(searchLower) ||
              (category.description && category.description.toLowerCase().includes(searchLower))
          );
        }

        this.categories = filteredCategories;
        this.totalRecords = filteredCategories.length;
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

  onSearch(): void {
    this.first = 0; // Reset paginação
    this.loadCategories();
  }

  clearSearch(): void {
    this.searchText = '';
    this.onSearch();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.first = event.first;
    this.rows = event.rows;
    this.cdr.markForCheck();
  }

  formatDate(dateString: string): string {
    return formatDateTime(dateString);
  }

  getCurrentPageReportTemplate(): string {
    return this.translate.instant('categories.showingCategories');
  }

  refresh(): void {
    this.loadCategories();
  }

  confirmDelete(category: Category): void {
    this.confirmationService.confirm({
      message: this.translate.instant('categories.deleteConfirmMessage', { name: category.name }),
      header: this.translate.instant('categories.deleteConfirm'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteCategory(category.id);
      },
    });
  }

  deleteCategory(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('categories.deleteSuccess'),
          detail: this.translate.instant('categories.categoryDeleted'),
        });
        this.loadCategories();
      },
      error: (error: Error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('categories.deleteError'),
          detail: error.message || this.translate.instant('common.error'),
        });
        this.cdr.markForCheck();
      },
    });
  }
}

