import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'pt-BR' | 'en-US';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly translateService = inject(TranslateService);

  private readonly supportedLanguages: Language[] = ['pt-BR', 'en-US'];
  private readonly defaultLanguage: Language = 'pt-BR';

  constructor() {
    // Initialize with saved language or default
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    const language = savedLanguage && this.supportedLanguages.includes(savedLanguage)
      ? savedLanguage
      : this.defaultLanguage;
    
    this.translateService.setDefaultLang(this.defaultLanguage);
    this.translateService.use(language);
  }

  getCurrentLanguage(): Language {
    return this.translateService.currentLang as Language || this.defaultLanguage;
  }

  setLanguage(language: Language): void {
    if (this.supportedLanguages.includes(language)) {
      this.translateService.use(language);
      localStorage.setItem('preferred-language', language);
    }
  }

  getSupportedLanguages(): Language[] {
    return [...this.supportedLanguages];
  }

  getLanguageDisplayName(language: Language): string {
    const names: Record<Language, string> = {
      'pt-BR': 'Português (Brasil)',
      'en-US': 'English (US)'
    };
    return names[language] || language;
  }
}

