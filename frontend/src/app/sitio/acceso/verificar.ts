import { Component, DestroyRef, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/textos';
import { AvisosService } from '../../compartido/avisos';

const ESPERA_REENVIO = 60;

/** Paso obligatorio para los clientes nuevos: escribir el código de 6 dígitos que llegó a su correo. */
@Component({
  selector: 'app-verificar',
  imports: [RouterLink],
  styleUrl: './acceso.css',
  template: `
    <div class="acceso">
      <aside class="acceso__arte">
        <span class="eyebrow">Un paso más</span>
        <h2>Revisa tu correo y confirma que eres tú.</h2>
        <p>Así protegemos tu cuenta y nos aseguramos de que los avisos de tus reservas lleguen a ti.</p>
        <ul>
          <li><i class="fa-solid fa-envelope-open-text"></i> Revisa también "Spam" o "Promociones"</li>
          <li><i class="fa-solid fa-clock"></i> El código vence en 15 minutos</li>
          <li><i class="fa-solid fa-shield-halved"></i> Nunca te lo pediremos por teléfono</li>
        </ul>
      </aside>

      <div class="acceso__form">
        <form class="acceso__caja" (submit)="$event.preventDefault(); enviar()" novalidate>
          @if (auth.usuario()?.verificado) {
            <div class="exito centro">
              <div class="exito__icono"><i class="fa-solid fa-check"></i></div>
              <h1>¡Correo verificado!</h1>
              <p class="sub">Tu cuenta está activa. Ya puedes reservar mesa.</p>
              <a [routerLink]="destino()" class="btn btn--oscuro btn--bloque">Continuar</a>
            </div>
          } @else {
            <div class="sobre"><i class="fa-solid fa-envelope-circle-check"></i></div>
            <h1>Verifica tu correo</h1>
            <p class="sub">Enviamos un código de 6 dígitos a <strong>{{ auth.usuario()?.email }}</strong>.</p>

            @if (error(); as e) {
              <div class="alerta alerta--error" role="alert"><i class="fa-solid fa-circle-exclamation"></i>{{ e }}</div>
            }

            <label class="visualmente-oculto" for="codigo">Código de 6 dígitos</label>
            <div class="codigo-caja">
              <input id="codigo" #campo class="codigo num" inputmode="numeric" autocomplete="one-time-code" maxlength="6"
                     placeholder="······" [value]="codigo()" (input)="escribir($event)" autofocus>
            </div>

            <button type="submit" class="btn btn--oscuro btn--bloque" [disabled]="!completo() || enviando()">
              @if (enviando()) { <span class="girando"></span> Verificando… } @else { Verificar y activar mi cuenta }
            </button>

            <p class="pie-form">
              ¿No te llegó?
              @if (espera() > 0) {
                <span>Puedes pedir otro en <strong class="num">{{ espera() }} s</strong></span>
              } @else {
                <button type="button" class="enlace" (click)="reenviar()" [disabled]="reenviando()">Enviar un código nuevo</button>
              }
            </p>
          }
        </form>
      </div>
    </div>
  `,
  styles: `
    .sobre { width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; background: var(--oro-claro); color: #7a5520; font-size: 1.7rem; }
    .codigo-caja { position: relative; }
    .codigo { width: 100%; height: 64px; border: 1.5px solid var(--linea-fuerte); border-radius: 14px; background: var(--papel);
      text-align: center; font: 700 2rem "Courier New", monospace; letter-spacing: .6em; padding-left: .6em; color: var(--tinta); }
    .codigo::placeholder { color: var(--linea-fuerte); }
    .codigo:focus { outline: none; border-color: var(--oro-2); box-shadow: 0 0 0 4px rgba(212,173,112,.22); }
    .enlace { color: var(--oro-2); font-weight: 600; }
    .enlace:hover { text-decoration: underline; }
    .exito { display: grid; gap: 1rem; justify-items: center; }
    .exito__icono { width: 68px; height: 68px; border-radius: 50%; display: grid; place-items: center; background: var(--ok-bg); color: var(--ok); font-size: 1.8rem; }
  `,
})
export class VerificarPagina {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);
  readonly volver = input<string>();

  protected readonly codigo = signal('');
  protected readonly completo = computed(() => /^\d{6}$/.test(this.codigo()));
  protected readonly enviando = signal(false);
  protected readonly reenviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly espera = signal(ESPERA_REENVIO);
  protected readonly destino = computed(() => {
    const v = this.volver();
    return v?.startsWith('/') && !v.startsWith('//') ? v : '/reservar';
  });
  private readonly campo = viewChild<ElementRef<HTMLInputElement>>('campo');

  constructor() {
    const reloj = setInterval(() => this.espera.update(s => Math.max(0, s - 1)), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));
  }

  /** Acepta tecleo, pegado ("Código: 395 285") y autocompletar: se queda solo con los dígitos. */
  protected escribir(ev: Event) {
    const campo = ev.target as HTMLInputElement;
    const limpio = campo.value.replace(/\D/g, '').slice(0, 6);
    campo.value = limpio;
    this.codigo.set(limpio);
    if (this.completo()) void this.enviar();
  }

  protected async enviar() {
    if (!this.completo() || this.enviando()) return;
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.auth.verificar(this.codigo());
      this.avisos.ok('¡Listo! Tu correo quedó verificado.');
      await this.router.navigateByUrl(this.destino());
    } catch (e) {
      this.error.set(mensajeDeError(e));
      this.codigo.set('');
      const campo = this.campo()?.nativeElement;
      if (campo) { campo.value = ''; campo.focus(); }
    } finally {
      this.enviando.set(false);
    }
  }

  protected async reenviar() {
    this.reenviando.set(true);
    this.error.set(null);
    try {
      await this.auth.reenviarCodigo();
      this.avisos.info('Te enviamos un código nuevo. Revisa tu correo.');
      this.espera.set(ESPERA_REENVIO);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.reenviando.set(false);
    }
  }
}
