import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';

const METODOS_SEGUROS = ['GET', 'HEAD', 'OPTIONS'];

function leerCookie(nombre: string): string | null {
  const par = document.cookie.split('; ').find(c => c.startsWith(nombre + '='));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
}

/**
 * Protección CSRF con Spring Security (cookie XSRF-TOKEN + cabecera X-XSRF-TOKEN).
 * Spring rota el token cuando cambia la autenticación y borra la cookie; por eso, si falta,
 * se pide uno nuevo a /api/auth/csrf antes de enviar, y ante un 403 se reintenta una vez con token fresco.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (METODOS_SEGUROS.includes(req.method) || !req.url.startsWith('/api/')) return next(req);

  // HttpBackend salta los interceptores: evita un bucle al pedir el token.
  const directo = new HttpClient(inject(HttpBackend));
  const tokenNuevo = (): Observable<string> =>
    directo.get<{ token: string }>('/api/auth/csrf', { withCredentials: true }).pipe(map(r => r.token));
  const conToken = (r: HttpRequest<unknown>, token: string) => r.clone({ setHeaders: { 'X-XSRF-TOKEN': token } });

  const actual = leerCookie('XSRF-TOKEN');
  const primero = actual ? next(conToken(req, actual)) : tokenNuevo().pipe(switchMap(t => next(conToken(req, t))));

  return primero.pipe(
    catchError((e: unknown) => e instanceof HttpErrorResponse && e.status === 403
      ? tokenNuevo().pipe(switchMap(t => next(conToken(req, t))))
      : throwError(() => e)),
  );
};
