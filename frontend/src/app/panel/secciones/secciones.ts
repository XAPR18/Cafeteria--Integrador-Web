import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Producto, Seccion } from '../../core/modelos';
import { mensajeDeError } from '../../core/textos';
import { AvisosService } from '../../compartido/avisos';
import { ConfirmacionService } from '../../compartido/confirmacion';
import { ErrorCampoComponent } from '../../compartido/error-campo';
import { ModalComponent } from '../../compartido/modal';
import { slugValido, textoOpcional } from '../../compartido/validadores';

@Component({
  selector: 'app-secciones',
  imports: [ReactiveFormsModule, ModalComponent, ErrorCampoComponent],
  styleUrl: '../panel.css',
  template: `
    <div class="encabezado">
      <div><h1>Secciones</h1><p>Categorías de la carta. Una sección inactiva oculta sus productos al público.</p></div>
      <button type="button" class="btn btn--oro" (click)="abrir('nueva')"><i class="fa-solid fa-plus"></i> Nueva sección</button>
    </div>

    <div class="tarjeta">
      @if (cargando()) {
        <div style="padding: 1.25rem; display: grid; gap: .6rem">@for (i of [1,2,3,4]; track i) { <div class="esqueleto" style="height: 48px"></div> }</div>
      } @else if (error(); as e) {
        <div style="padding: 1.25rem"><div class="alerta alerta--error"><i class="fa-solid fa-circle-exclamation"></i>{{ e }}</div></div>
      } @else if (secciones().length === 0) {
        <div class="vacio"><i class="fa-solid fa-layer-group"></i><h3>Aún no hay secciones</h3><p>Crea la primera para empezar a cargar productos.</p></div>
      } @else {
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Sección</th><th>Slug</th><th>Productos</th><th>Estado</th><th class="acciones">Acciones</th></tr></thead>
            <tbody>
              @for (s of secciones(); track s.id) {
                <tr>
                  <td class="nombre-celda"><strong>{{ s.nombre }}</strong><small>{{ s.descripcion || 'Sin descripción' }}</small></td>
                  <td><code>{{ s.slug }}</code></td>
                  <td class="num">{{ conteo().get(s.id) ?? 0 }}</td>
                  <td><span class="insignia" [class.insignia--ok]="s.activa" [class.insignia--neutro]="!s.activa">{{ s.activa ? 'Visible' : 'Oculta' }}</span></td>
                  <td class="acciones">
                    <button type="button" class="btn-icono" (click)="abrir(s)" title="Editar" [attr.aria-label]="'Editar ' + s.nombre"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="btn-icono btn-icono--peligro" (click)="eliminar(s)" title="Eliminar" [attr.aria-label]="'Eliminar ' + s.nombre"><i class="fa-regular fa-trash-can"></i></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (editando(); as e) {
      <app-modal [titulo]="e === 'nueva' ? 'Nueva sección' : 'Editar sección'" (cerrar)="editando.set(null)">
        <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
          <div class="modal__cuerpo">
            @if (errorForm(); as err) { <div class="alerta alerta--error"><i class="fa-solid fa-circle-exclamation"></i>{{ err }}</div> }
            <div class="campo">
              <label for="nombre">Nombre</label>
              <input id="nombre" class="control" formControlName="nombre" maxlength="60" (input)="sugerirSlug()" placeholder="Ej. Bebidas frías">
              <app-error-campo [control]="form.controls.nombre" nombre="El nombre" />
            </div>
            <div class="campo">
              <label for="slug">Slug (identificador en la web)</label>
              <input id="slug" class="control" formControlName="slug" maxlength="40" (input)="slugTocado = true" placeholder="bebidas-frias">
              <span class="ayuda">Minúsculas, números y guiones. Se genera solo a partir del nombre.</span>
              <app-error-campo [control]="form.controls.slug" nombre="El slug" />
            </div>
            <div class="campo">
              <label for="descripcion">Descripción <span class="texto-tenue">(opcional)</span></label>
              <textarea id="descripcion" class="control" formControlName="descripcion" maxlength="200"></textarea>
              <app-error-campo [control]="form.controls.descripcion" nombre="La descripción" />
            </div>
            <label class="interruptor"><input type="checkbox" formControlName="activa"> Visible en la carta pública</label>
          </div>
          <div class="modal__pie">
            <button type="button" class="btn btn--fantasma" (click)="editando.set(null)">Cancelar</button>
            <button type="submit" class="btn btn--oscuro" [disabled]="guardando()">@if (guardando()) { <span class="girando"></span> } Guardar sección</button>
          </div>
        </form>
      </app-modal>
    }
  `,
  styles: `code { font-size: .82rem; padding: .15rem .45rem; border-radius: 6px; background: var(--neutro-bg); }`,
})
export class SeccionesPagina {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);

  protected readonly secciones = signal<Seccion[]>([]);
  private readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly conteo = computed(() => {
    const m = new Map<number, number>();
    for (const p of this.productos()) m.set(p.seccionId, (m.get(p.seccionId) ?? 0) + 1);
    return m;
  });

  protected readonly editando = signal<Seccion | 'nueva' | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected slugTocado = false;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    slug: ['', [Validators.required, Validators.maxLength(40), slugValido]],
    descripcion: ['', Validators.maxLength(200)],
    activa: [true],
  });

  constructor() { this.cargar(); }

  private cargar() {
    forkJoin([this.api.secciones.listar(), this.api.productos.listar()]).subscribe({
      next: ([s, p]) => { this.secciones.set(s); this.productos.set(p); this.cargando.set(false); },
      error: e => { this.error.set(mensajeDeError(e)); this.cargando.set(false); },
    });
  }

  protected abrir(s: Seccion | 'nueva') {
    this.errorForm.set(null);
    this.slugTocado = s !== 'nueva';
    this.form.reset(s === 'nueva' ? { nombre: '', slug: '', descripcion: '', activa: true }
      : { nombre: s.nombre, slug: s.slug, descripcion: s.descripcion ?? '', activa: s.activa });
    this.editando.set(s);
  }

  /** "Cafés de la Casa" -> "cafes-de-la-casa" */
  protected sugerirSlug() {
    if (this.slugTocado) return;
    const slug = this.form.controls.nombre.value.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    this.form.controls.slug.setValue(slug);
  }

  protected guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const datos = { nombre: v.nombre.trim(), slug: v.slug.trim(), descripcion: textoOpcional(v.descripcion), activa: v.activa };
    const actual = this.editando();
    this.guardando.set(true);
    this.errorForm.set(null);
    const peticion = actual === 'nueva' || actual === null ? this.api.secciones.crear(datos) : this.api.secciones.actualizar(actual.id, datos);
    peticion.subscribe({
      next: s => {
        this.secciones.update(l => actual === 'nueva' ? [...l, s] : l.map(x => x.id === s.id ? s : x));
        this.avisos.ok(`Sección “${s.nombre}” guardada.`);
        this.editando.set(null);
        this.guardando.set(false);
      },
      error: e => { this.errorForm.set(mensajeDeError(e)); this.guardando.set(false); },
    });
  }

  protected async eliminar(s: Seccion) {
    if ((this.conteo().get(s.id) ?? 0) > 0) {
      this.avisos.error('La sección tiene productos. Muévelos a otra sección u ocúltala en lugar de eliminarla.');
      return;
    }
    if (!await this.confirmacion.preguntar(`¿Eliminar “${s.nombre}”?`, 'Esta acción no se puede deshacer.', { aceptar: 'Eliminar', peligro: true })) return;
    this.api.secciones.eliminar(s.id).subscribe({
      next: () => { this.secciones.update(l => l.filter(x => x.id !== s.id)); this.avisos.ok('Sección eliminada.'); },
      error: e => this.avisos.error(mensajeDeError(e)),
    });
  }
}
