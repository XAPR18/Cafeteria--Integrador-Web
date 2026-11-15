import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/textos';
import { ErrorCampoComponent } from '../../compartido/error-campo';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ErrorCampoComponent],
  styleUrl: './acceso.css',
  template: `
    <div class="acceso">
      <aside class="acceso__arte">
        <span class="eyebrow">Bienvenido de vuelta</span>
        <h2>Tu mesa de siempre te está esperando.</h2>
        <p>Ingresa para reservar, revisar tus visitas o, si eres parte del equipo, abrir tu panel.</p>
        <ul>
          <li><i class="fa-solid fa-check"></i> Reservas confirmadas al instante</li>
          <li><i class="fa-solid fa-check"></i> Historial de tus visitas</li>
          <li><i class="fa-solid fa-check"></i> Acceso del personal al panel</li>
        </ul>
      </aside>

      <div class="acceso__form">
        <form class="acceso__caja" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <h1>Ingresar</h1>
          <p class="sub">Usa el correo con el que te registraste.</p>

          @if (expirada()) {
            <div class="alerta alerta--aviso"><i class="fa-solid fa-clock"></i> Tu sesión expiró. Vuelve a ingresar para continuar.</div>
          }
          @if (error(); as e) {
            <div class="alerta alerta--error" role="alert"><i class="fa-solid fa-circle-exclamation"></i>{{ e }}</div>
          }

          <div class="campo">
            <label for="email">Correo electrónico</label>
            <div class="con-icono"><i class="fa-regular fa-envelope"></i>
              <input id="email" class="control" type="email" formControlName="email" autocomplete="email" placeholder="tu@correo.com">
            </div>
            <app-error-campo [control]="form.controls.email" nombre="El correo" />
          </div>

          <div class="campo">
            <label for="clave">Contraseña</label>
            <div class="con-icono relativo"><i class="fa-solid fa-lock"></i>
              <input id="clave" class="control" [type]="verClave() ? 'text' : 'password'" formControlName="clave" autocomplete="current-password">
              <button type="button" class="btn-icono ojo" (click)="verClave.set(!verClave())" [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                <i class="fa-regular" [class.fa-eye]="!verClave()" [class.fa-eye-slash]="verClave()"></i>
              </button>
            </div>
            <app-error-campo [control]="form.controls.clave" nombre="La contraseña" />
          </div>

          <button type="submit" class="btn btn--oscuro btn--bloque" [disabled]="enviando()">
            @if (enviando()) { <span class="girando"></span> Ingresando… } @else { Ingresar }
          </button>
          <p class="pie-form">¿Aún no tienes cuenta? <a routerLink="/registro" [queryParams]="volver() ? { volver: volver() } : {}">Crea una gratis</a></p>
        </form>
      </div>
    </div>
  `,
})
export class LoginPagina {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Parámetros de la URL (?volver=/reservar&expirada=1) enlazados por withComponentInputBinding. */
  readonly volver = input<string>();
  readonly expirada = input<string>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    clave: ['', Validators.required],
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verClave = signal(false);

  async enviar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.enviando.set(true);
    this.error.set(null);
    try {
      const { email, clave } = this.form.getRawValue();
      const perfil = await this.auth.login(email.trim(), clave);
      const destino = this.volver();
      const puedeVolver = destino?.startsWith('/') && !destino.startsWith('//')
        && (perfil.rol !== 'CLIENTE' || !destino.startsWith('/admin') && !destino.startsWith('/empleado'));
      await this.router.navigateByUrl(puedeVolver ? destino! : this.auth.inicioSegunRol(perfil.rol));
    } catch (e) {
      this.error.set(mensajeDeError(e).replace('Credenciales incorrectas', 'Correo o contraseña incorrectos.'));
    } finally {
      this.enviando.set(false);
    }
  }
}
