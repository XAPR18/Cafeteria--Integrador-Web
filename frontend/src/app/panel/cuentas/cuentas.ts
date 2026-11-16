import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Perfil, Rol } from '../../core/modelos';
import { ROLES, mensajeDeError } from '../../core/textos';
import { AvisosService } from '../../compartido/avisos';
import { ConfirmacionService } from '../../compartido/confirmacion';
import { ErrorCampoComponent } from '../../compartido/error-campo';
import { ModalComponent } from '../../compartido/modal';
import { maximo72Bytes } from '../../compartido/validadores';

@Component({
  selector: 'app-cuentas',
  imports: [ReactiveFormsModule, FormsModule, ModalComponent, ErrorCampoComponent],
  styleUrl: '../panel.css',
  template: `
    <div class="encabezado">
      <div><h1>Cuentas y permisos</h1><p>Accesos del equipo y clientes registrados.</p></div>
      <button type="button" class="btn btn--oro" (click)="abrir()"><i class="fa-solid fa-user-plus"></i> Crear acceso</button>
    </div>

    <div class="kpis">
      @for (r of roles; track r) {
        <div class="tarjeta kpi"><div class="kpi__icono"><i class="fa-solid" [class]="'fa-solid ' + iconos[r]"></i></div>
          <div><strong class="num">{{ contar(r) }}</strong><span>{{ ROLES[r] }}{{ contar(r) === 1 ? '' : 's' }}</span></div></div>
      }
    </div>

    <div class="tarjeta">
      <div class="herramientas">
        <label class="con-icono buscar"><i class="fa-solid fa-magnifying-glass"></i>
          <input class="control" type="search" placeholder="Buscar por nombre o correo…" [ngModel]="texto()" (ngModelChange)="texto.set($event)" aria-label="Buscar cuenta">
        </label>
        <div class="segmentado">
          <button type="button" [class.activo]="filtroRol() === null" (click)="filtroRol.set(null)">Todas</button>
          @for (r of roles; track r) { <button type="button" [class.activo]="filtroRol() === r" (click)="filtroRol.set(r)">{{ ROLES[r] }}</button> }
        </div>
      </div>

      @if (cargando()) {
        <div style="padding: 1.25rem; display: grid; gap: .6rem">@for (i of [1,2,3]; track i) { <div class="esqueleto" style="height: 48px"></div> }</div>
      } @else if (error(); as e) {
        <div style="padding: 1.25rem"><div class="alerta alerta--error"><i class="fa-solid fa-circle-exclamation"></i>{{ e }}</div></div>
      } @else {
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acceso</th><th class="acciones"></th></tr></thead>
            <tbody>
              @for (c of visibles(); track c.id) {
                <tr>
                  <td><strong>{{ c.nombre }}</strong>@if (c.email === miCorreo()) { <span class="texto-tenue"> (tú)</span> }</td>
                  <td>{{ c.email }}@if (c.rol === 'CLIENTE') { <span class="insignia" [class.insignia--ok]="c.verificado" [class.insignia--aviso]="!c.verificado" style="margin-left:.4rem">{{ c.verificado ? 'Verificado' : 'Sin verificar' }}</span> }@if (c.telefono) { <small class="texto-tenue" style="display:block">{{ c.telefono }}</small> }</td>
                  <td><span class="insignia" [class.insignia--oro]="c.rol === 'ADMIN'" [class.insignia--info]="c.rol === 'EMPLEADO'" [class.insignia--neutro]="c.rol === 'CLIENTE'">{{ ROLES[c.rol] }}</span></td>
                  <td><span class="insignia" [class.insignia--ok]="c.activa" [class.insignia--error]="!c.activa">{{ c.activa ? 'Activo' : 'Bloqueado' }}</span></td>
                  <td class="acciones">
                    @if (c.email !== miCorreo()) {
                      <button type="button" class="btn btn--sm" [class.btn--borde]="c.activa" [class.btn--oscuro]="!c.activa" (click)="alternar(c)" [disabled]="procesando() === c.id">
                        {{ c.activa ? 'Bloquear acceso' : 'Reactivar' }}
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5"><div class="vacio">No hay cuentas con ese filtro.</div></td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (abierto()) {
      <app-modal titulo="Crear acceso para el equipo" (cerrar)="abierto.set(false)">
        <form [formGroup]="form" (ngSubmit)="crear()" novalidate>
          <div class="modal__cuerpo">
            <p class="texto-suave">Los clientes se registran solos desde la web. Aquí creas cuentas del personal.</p>
            @if (errorForm(); as err) { <div class="alerta alerta--error"><i class="fa-solid fa-circle-exclamation"></i>{{ err }}</div> }
            <div class="campo">
              <label for="nombre">Nombre completo</label>
              <input id="nombre" class="control" formControlName="nombre" maxlength="80">
              <app-error-campo [control]="form.controls.nombre" nombre="El nombre" />
            </div>
            <div class="campo">
              <label for="email">Correo</label>
              <input id="email" class="control" type="email" formControlName="email" maxlength="160">
              <app-error-campo [control]="form.controls.email" nombre="El correo" />
            </div>
            <div class="campo">
              <label for="clave">Contraseña inicial</label>
              <input id="clave" class="control" type="password" formControlName="clave" autocomplete="new-password">
              <span class="ayuda">Mínimo 12 caracteres. Compártela en persona; no por chat.</span>
              <app-error-campo [control]="form.controls.clave" nombre="La contraseña" />
            </div>
            <div class="campo">
              <span class="etiqueta">Permisos</span>
              <div class="segmentado">
                <button type="button" [class.activo]="form.controls.rol.value === 'EMPLEADO'" (click)="form.controls.rol.setValue('EMPLEADO')">Empleado: reservas y sala</button>
                <button type="button" [class.activo]="form.controls.rol.value === 'ADMIN'" (click)="form.controls.rol.setValue('ADMIN')">Administrador: todo</button>
              </div>
            </div>
          </div>
          <div class="modal__pie">
            <button type="button" class="btn btn--fantasma" (click)="abierto.set(false)">Cancelar</button>
            <button type="submit" class="btn btn--oscuro" [disabled]="guardando()">@if (guardando()) { <span class="girando"></span> } Crear acceso</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class CuentasPagina {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly auth = inject(AuthService);
  protected readonly ROLES = ROLES;
  protected readonly roles: Rol[] = ['ADMIN', 'EMPLEADO', 'CLIENTE'];
  protected readonly iconos: Record<Rol, string> = { ADMIN: 'fa-user-shield', EMPLEADO: 'fa-user-tie', CLIENTE: 'fa-user' };
  protected readonly miCorreo = computed(() => this.auth.usuario()?.email);

  protected readonly cuentas = signal<Perfil[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly procesando = signal<number | null>(null);
  protected readonly texto = signal('');
  protected readonly filtroRol = signal<Rol | null>(null);
  protected readonly visibles = computed(() => {
    const q = this.texto().toLowerCase().trim();
    return this.cuentas().filter(c => (this.filtroRol() === null || c.rol === this.filtroRol())
      && (!q || `${c.nombre} ${c.email}`.toLowerCase().includes(q)));
  });

  protected readonly abierto = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    clave: ['', [Validators.required, Validators.minLength(12), maximo72Bytes]],
    rol: ['EMPLEADO' as 'ADMIN' | 'EMPLEADO', Validators.required],
  });

  constructor() {
    this.api.cuentas.listar().subscribe({
      next: c => { this.cuentas.set(c); this.cargando.set(false); },
      error: e => { this.error.set(mensajeDeError(e)); this.cargando.set(false); },
    });
  }

  protected contar(r: Rol) { return this.cuentas().filter(c => c.rol === r).length; }

  protected abrir() {
    this.form.reset({ nombre: '', email: '', clave: '', rol: 'EMPLEADO' });
    this.errorForm.set(null);
    this.abierto.set(true);
  }

  protected crear() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.errorForm.set(null);
    this.api.cuentas.crear({ ...v, nombre: v.nombre.trim(), email: v.email.trim() }).subscribe({
      next: c => { this.cuentas.update(l => [...l, c]); this.avisos.ok(`Acceso creado para ${c.nombre}.`); this.abierto.set(false); this.guardando.set(false); },
      error: e => { this.errorForm.set(mensajeDeError(e)); this.guardando.set(false); },
    });
  }

  protected async alternar(c: Perfil) {
    if (c.activa && !await this.confirmacion.preguntar(`¿Bloquear el acceso de ${c.nombre}?`,
      'No podrá iniciar sesión y su sesión actual se cerrará de inmediato. Puedes reactivarlo cuando quieras.', { aceptar: 'Bloquear', peligro: true })) return;
    this.procesando.set(c.id);
    this.api.cuentas.cambiarEstado(c.id, !c.activa).subscribe({
      next: act => { this.cuentas.update(l => l.map(x => x.id === act.id ? act : x)); this.procesando.set(null);
        this.avisos.ok(act.activa ? `${act.nombre} puede volver a ingresar.` : `Acceso de ${act.nombre} bloqueado.`); },
      error: e => { this.avisos.error(mensajeDeError(e)); this.procesando.set(null); },
    });
  }
}
