import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
}

export type CategoryUpdateRequest = Partial<CategoryCreateRequest>;

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8000/api';
  private readonly categoriesEndpoint = `${this.apiUrl}/categories/`;

  /**
   * Lista todas as categorias
   */
  getCategories(): Observable<Category[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Category[]>(this.categoriesEndpoint, { headers }).pipe(
      map((response) => {
        // DRF pode retornar array direto ou objeto paginado
        if (Array.isArray(response)) {
          return response;
        }
        // Se for paginado, retornar results
        return (response as { results?: Category[] }).results || [];
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Busca uma categoria específica por ID
   */
  getCategory(id: number): Observable<Category> {
    const headers = this.getAuthHeaders();
    return this.http.get<Category>(`${this.categoriesEndpoint}${id}/`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Cria uma nova categoria
   */
  createCategory(category: CategoryCreateRequest): Observable<Category> {
    const headers = this.getAuthHeaders();
    return this.http.post<Category>(this.categoriesEndpoint, category, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Atualiza uma categoria existente
   */
  updateCategory(id: number, category: CategoryUpdateRequest): Observable<Category> {
    const headers = this.getAuthHeaders();
    return this.http.put<Category>(`${this.categoriesEndpoint}${id}/`, category, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Atualiza parcialmente uma categoria existente
   */
  patchCategory(id: number, category: CategoryUpdateRequest): Observable<Category> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Category>(`${this.categoriesEndpoint}${id}/`, category, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Exclui uma categoria
   */
  deleteCategory(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.categoriesEndpoint}${id}/`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Obtém os headers de autenticação
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Trata erros HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro ao processar a requisição';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Não autorizado. Verifique suas credenciais.';
      } else if (error.status === 0) {
        errorMessage = 'Não foi possível conectar ao servidor.';
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else if (error.error?.name) {
        // Erro de validação do backend
        errorMessage = error.error.name[0] || errorMessage;
      } else {
        errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}

