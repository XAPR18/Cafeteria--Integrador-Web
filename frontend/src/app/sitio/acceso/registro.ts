import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/textos';
import { ErrorCampoComponent } from '../../compartido/error-campo';
import { coincideCon, maximo72Bytes } from '../../compartido/validadores';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, ErrorCampoComponent],
  styleUrl: './acceso.css',
  template: `
    <div class="acceso">
      <aside class="acceso__arte">
        <span class="eyebrow">La vecindad de Catorce</span>
        <h2>Sé parte de la vecindad.</h2>
        <p>Con tu cuenta reservas mesa en segundos y llevas el control de tus visitas.</p>
        <ul>
          <li><i class="fa-solid fa-check"></i> Gratis y sin publicidad</li>
          <li><i class="fa-solid fa-check"></i> Cancela tus reservas cuando quieras</li>
          <li><i class="fa-solid fa-check"></i> Tu contraseña se guarda cifrada</li>
        </ul>
      </aside>

      <div class="acceso__form">
        <form class="acceso__caja" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <h1>Crear cuenta</h1>
          <p class="sub">Solo te tomará un minuto.</p>

          @if (error(); as e) {
            <div class="alerta alerta--error" role="alert"><i class="fa-solid fa-circle-exclamation"></i>{{ e }}</div>
          }

          <div class="campo">
            <label for="nombre">Nombre completo</label>
            <input id="nombre" class="control" formControlName="nombre" autocomplete="name" placeholder="Ej. María Torres">
            <app-error-campo [control]="form.controls.nombre" nombre="El nombre" />
          </div>
          <div class="campo">
            <label for="email">Correo electrónico</label>
            <input id="email" class="control" type="email" formControlName="email" autocomplete="email" placeholder="tu@correo.com">
            <span class="ayuda"><i class="fa-solid fa-envelope-circle-check"></i> Usa un correo real: te enviaremos un código para activar tu cuenta.</span>
            <app-error-campo [control]="form.controls.email" nombre="El correo" />
          </div>
          <div class="campo">
            <label for="telefono">Celular <span class="texto-tenue">(opcional)</span></label>
            <div class="con-icono"><i class="fa-solid fa-mobile-screen"></i>
              <input id="telefono" class="control" type="tel" formControlName="telefono" autocomplete="tel" placeholder="987 654 321">
            </div>
            <span class="ayuda">Para contactarte si hay un cambio en tu reserva.</span>
            <app-error-campo [control]="form.controls.telefono" nombre="El celular" />
          </div>
          <div class="campo">
            <label for="clave">Contraseña</label>
            <input id="clave" class="control" type="password" formControlName="clave" autocomplete="new-password">
            <div class="fuerza" aria-hidden="true"><span [style.width.%]="fuerza().pct" [style.background]="fuerza().color"></span></div>
            <span class="ayuda">Mínimo 12 caracteres. {{ fuerza().texto }}</span>
            <app-error-campo [control]="form.controls.clave" nombre="La contraseña" />
          </div>
          <div class="campo">
            <label for="confirmar">Repite la contraseña</label>
            <input id="confirmar" class="control" type="password" formControlName="confirmar" autocomplete="new-password">
            <app-error-campo [control]="form.controls.confirmar" nombre="La confirmación" />
          </div>

          <button type="submit" class="btn btn--oscuro btn--bloque" [disabled]="enviando()">
            @if (enviando()) { <span class="girando"></span> Creando tu cuenta… } @else { Crear mi cuenta }
          </button>
          <p class="pie-form">¿Ya tienes cuenta? <a routerLink="/login" [queryParams]="volver() ? { volver: volver() } : {}">Ingresa aquí</a></p>
        </form>
      </div>
    </div>
  `,
})
export class RegistroPagina {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly volver = input<string>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    telefono: ['', Validators.pattern(/^(\+?51)?[\s-]?9\d{2}[\s-]?\d{3}[\s-]?\d{3}$/)],
    clave: ['', [Validators.required, Validators.minLength(12), maximo72Bytes]],
    confirmar: ['', [Validators.required, coincideCon('clave')]],
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly clave = toSignal(this.form.controls.clave.valueChanges, { initialValue: '' });
  protected readonly fuerza = computed(() => {
    const c = this.clave();
    let puntos = 0;
    if (c.length >= 12) puntos++;
    if (c.length >= 16) puntos++;
    if (/[A-Z]/.test(c) && /[a-z]/.test(c)) puntos++;
    if (/\d/.test(c)) puntos++;
    if (/[^A-Za-z0-9]/.test(c)) puntos++;
    const niveles = [
      { texto: '', color: 'transparent' }, { texto: 'Débil.', color: '#b3392f' }, { texto: 'Aceptable.', color: '#a86b12' },
      { texto: 'Buena.', color: '#b98b45' }, { texto: 'Fuerte.', color: '#2f7d4f' }, { texto: 'Muy fuerte.', color: '#2f7d4f' },
    ];
    return { pct: (puntos / 5) * 100, ...niveles[puntos] };
  });

  constructor() {
    // Si cambia la contraseña, se vuelve a comprobar que la confirmación coincida.
    this.form.controls.clave.valueChanges.subscribe(() => this.form.controls.confirmar.updateValueAndValidity({ emitEvent: false }));
  }

  async enviar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.enviando.set(true);
    this.error.set(null);
    try {
      const { nombre, email, clave, telefono } = this.form.getRawValue();
      await this.auth.registrar(nombre.trim(), email.trim(), clave, telefono.trim() || null);
      // Antes de reservar hay que confirmar el correo con el código que acabamos de enviar.
      await this.router.navigate(['/verificar'], { queryParams: { volver: this.volver() || '/reservar' } });
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
