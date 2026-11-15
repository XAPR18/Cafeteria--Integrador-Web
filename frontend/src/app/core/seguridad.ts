import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Rol } from './modelos';

const RUTAS_PUBLICAS = ['/api/auth/', '/api/catalogo/'];

/** Si una ruta privada responde 401 la sesión venció: se avisa y se envía al login. */
export const sesionInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401
          && !RUTAS_PUBLICAS.some(r => req.url.startsWith(r))) {
        auth.sesionExpirada();
      }
      return throwError(() => error);
    }),
  );
};

/** Protege rutas del frontend por rol. El backend vuelve a validar cada petición: esto solo es experiencia de usuario. */
export function requiereRol(...roles: Rol[]): CanActivateFn {
  return (_ruta, estado) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const rol = auth.rol();
    if (!rol) return router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
    if (roles.includes(rol)) return true;
    return router.createUrlTree([auth.inicioSegunRol(rol)]);
  };
}

/** Login y registro no tienen sentido con sesión iniciada. */
export const soloVisitantes: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? inject(Router).createUrlTree([auth.inicioSegunRol()]) : true;
};
