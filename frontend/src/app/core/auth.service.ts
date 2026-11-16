import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Perfil, Rol } from './modelos';

/**
 * Sesión del usuario. El JWT vive en la cookie HttpOnly CAFE_TOKEN: JavaScript nunca lo lee,
 * así que un script inyectado no puede robarlo. Aquí solo guardamos el perfil público.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly usuario = signal<Perfil | null>(null);
  readonly autenticado = computed(() => this.usuario() !== null);
  readonly rol = computed<Rol | null>(() => this.usuario()?.rol ?? null);

  /** Se ejecuta al arrancar: obtiene el token CSRF (cookie XSRF-TOKEN) y la sesión actual. */
  async iniciar(): Promise<void> {
    try {
      await firstValueFrom(this.http.get('/api/auth/csrf'));
    } catch { /* sin servidor: la app muestra el error al primer pedido */ }
    try {
      const perfil = await firstValueFrom(this.http.get<Perfil | null>('/api/auth/sesion'));
      this.usuario.set(perfil ?? null);
    } catch {
      // Cookie vencida o inválida: se borra para que no estorbe en las páginas públicas.
      this.usuario.set(null);
      await firstValueFrom(this.http.post('/api/auth/logout', {})).catch(() => undefined);
    }
  }

  async login(email: string, clave: string): Promise<Perfil> {
    const perfil = await firstValueFrom(this.http.post<Perfil>('/api/auth/login', { email, clave }));
    this.usuario.set(perfil);
    return perfil;
  }

  async registrar(nombre: string, email: string, clave: string, telefono: string | null): Promise<Perfil> {
    await firstValueFrom(this.http.post<Perfil>('/api/auth/registro', { nombre, email, clave, telefono }));
    return this.login(email, clave);
  }

  /** Confirma el correo con el código de 6 dígitos que llegó a la bandeja de entrada. */
  async verificar(codigo: string): Promise<Perfil> {
    const perfil = await firstValueFrom(this.http.post<Perfil>('/api/auth/verificacion', { codigo }));
    this.usuario.set(perfil);
    return perfil;
  }

  reenviarCodigo(): Promise<unknown> {
    return firstValueFrom(this.http.post('/api/auth/verificacion/reenviar', {}));
  }

  /** Cliente que aún no confirmó su correo: puede navegar, pero no reservar. */
  readonly pendienteDeVerificar = computed(() => this.usuario()?.rol === 'CLIENTE' && !this.usuario()?.verificado);

  async salir(): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/logout', {})).catch(() => undefined);
    this.usuario.set(null);
    await this.router.navigateByUrl('/');
  }

  /** Llamado por el interceptor cuando la API responde 401 en una ruta privada. */
  sesionExpirada(): void {
    if (!this.usuario()) return;
    this.usuario.set(null);
    void this.router.navigate(['/login'], { queryParams: { volver: this.router.url, expirada: 1 } });
  }

  inicioSegunRol(rol: Rol | null = this.rol()): string {
    if (rol === 'ADMIN') return '/admin';
    if (rol === 'EMPLEADO') return '/empleado';
    return '/mi-cuenta';
  }
}
