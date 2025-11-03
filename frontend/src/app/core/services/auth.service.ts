import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface TokenVerifyResponse {
  code: string;
  detail: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiUrl = 'http://localhost:8000/api';
  
  // Storage keys - using constants for better maintainability
  private readonly tokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';

  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  /**
   * Realiza login do usuário
   */
  login(username: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { username, password };
    const headers = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<LoginResponse>(`${this.apiUrl}/token/`, body, { headers, withCredentials: false }).pipe(
      tap((response) => {
        this.setTokens(response.access, response.refresh);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError((error: HttpErrorResponse) => {
        return this.handleError(error);
      })
    );
  }

  /**
   * Registra um novo usuário
   */
  register(
    username: string,
    email: string,
    firstName: string,
    lastName: string,
    password: string
  ): Observable<RegisterResponse> {
    const body: RegisterRequest = {
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      password
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<RegisterResponse>(`${this.apiUrl}/register/`, body, { headers, withCredentials: false }).pipe(
      catchError((error: HttpErrorResponse) => {
        return this.handleRegisterError(error);
      })
    );
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    this.clearTokens();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Obtém o token de acesso atual
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Obtém o refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Verifica se o token é válido
   */
  verifyToken(): Observable<TokenVerifyResponse> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    const body = { token };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<TokenVerifyResponse>(`${this.apiUrl}/token/verify/`, body, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.logout();
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Atualiza o token de acesso usando o refresh token
   */
  refreshAccessToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const body = { refresh: refreshToken };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<LoginResponse>(`${this.apiUrl}/token/refresh/`, body, { headers }).pipe(
      tap((response) => {
        this.setTokens(response.access, refreshToken);
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.logout();
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Obtém headers HTTP com autenticação
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      return new HttpHeaders();
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Verifica se o token não expirou (decodificação básica)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Converte para milliseconds
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro desconhecido';

    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      if (error.status === 401) {
        // Verifica se há mensagem específica do backend
        if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.error?.non_field_errors && Array.isArray(error.error.non_field_errors)) {
          errorMessage = error.error.non_field_errors[0];
        } else {
          errorMessage = 'Usuário ou senha incorretos. Verifique suas credenciais.';
        }
      } else if (error.status === 0) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else if (error.error?.non_field_errors && Array.isArray(error.error.non_field_errors)) {
        errorMessage = error.error.non_field_errors[0];
      } else {
        errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  private handleRegisterError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro ao criar conta';

    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      if (error.status === 400) {
        // Erro de validação
        const errors = error.error;
        const errorMessages: string[] = [];

        if (errors.username) {
          errorMessages.push(Array.isArray(errors.username) ? errors.username[0] : errors.username);
        }
        if (errors.email) {
          errorMessages.push(Array.isArray(errors.email) ? errors.email[0] : errors.email);
        }
        if (errors.password) {
          errorMessages.push(Array.isArray(errors.password) ? errors.password[0] : errors.password);
        }
        if (errors.first_name) {
          errorMessages.push(Array.isArray(errors.first_name) ? errors.first_name[0] : errors.first_name);
        }
        if (errors.last_name) {
          errorMessages.push(Array.isArray(errors.last_name) ? errors.last_name[0] : errors.last_name);
        }
        if (errors.non_field_errors) {
          errorMessages.push(Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors);
        }

        errorMessage = errorMessages.length > 0 ? errorMessages.join('. ') : 'Dados inválidos. Verifique os campos preenchidos.';
      } else if (error.status === 0) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else {
        errorMessage = `Erro ${error.status}: ${error.message || 'Erro ao criar conta'}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}

