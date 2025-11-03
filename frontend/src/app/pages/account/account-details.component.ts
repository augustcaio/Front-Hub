import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/services/auth.service';

interface UserInfo {
  username: string;
  email?: string;
  userId?: number;
  exp?: number;
}

@Component({
  selector: 'app-account-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    MessageModule
  ],
  templateUrl: './account-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountDetailsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  error: string | null = null;
  userInfo: UserInfo | null = null;

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const token = this.authService.getToken();
      if (!token) {
        this.error = 'Token não encontrado';
        this.loading = false;
        this.cdr.markForCheck();
        return;
      }

      // Decodifica o token JWT para obter informações do usuário
      const payload = this.decodeJwtToken(token);
      this.userInfo = {
        username: payload.username || 'Usuário',
        email: payload.email,
        userId: payload.user_id,
        exp: payload.exp
      };

      this.loading = false;
      this.cdr.markForCheck();
    } catch (error) {
      this.error = 'Erro ao decodificar token';
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private decodeJwtToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  getExpirationDate(exp?: number): string {
    if (!exp) return 'N/A';
    const date = new Date(exp * 1000);
    return date.toLocaleString('pt-BR');
  }

  formatDate(dateString: string | number | Date): string {
    const date = typeof dateString === 'string' || typeof dateString === 'number' 
      ? new Date(dateString) 
      : dateString;
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onLogout(): void {
    this.authService.logout();
  }
}

