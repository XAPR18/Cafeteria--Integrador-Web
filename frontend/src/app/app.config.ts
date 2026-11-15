import { provideHttpClient, withFetch, withInterceptors, withNoXsrfProtection } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './core/auth.service';
import { csrfInterceptor } from './core/csrf.interceptor';
import { sesionInterceptor } from './core/seguridad';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(
      withFetch(),
      // El CSRF lo maneja csrfInterceptor (Spring rota el token y Angular no sabría pedir uno nuevo).
      withNoXsrfProtection(),
      withInterceptors([csrfInterceptor, sesionInterceptor]),
    ),
    provideAppInitializer(() => inject(AuthService).iniciar()),
  ],
};
