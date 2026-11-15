import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Producto, Seccion } from '../../core/modelos';
import { SOLES, mensajeDeError } from '../../core/textos';
import { AvisosService } from '../../compartido/avisos';
import { ConfirmacionService } from '../../compartido/confirmacion';
import { ErrorCampoComponent } from '../../compartido/error-campo';
import { ModalComponent } from '../../compartido/modal';
import { dosDecimales, textoOpcional } from '../../compartido/validadores';

const IMAGENES = Array.from({ length: 8 }, (_, i) => `/Image/Producto ${i + 1}.jpg`);

@Component({
  selector: 'app-productos',
  imports: [ReactiveFormsModule, FormsModule, ModalComponent, ErrorCampoComponent],
  styleUrl: '../panel.css',
  templateUrl: './productos.html',
  styles: `
    .galeria { display: grid; grid-template-columns: repeat(8, 1fr); gap: .4rem; }
    .galeria button { aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 2px solid transparent; }
    .galeria button.activo { border-color: var(--oro-2); box-shadow: 0 0 0 3px rgba(212,173,112,.3); }
    .galeria img { width: 100%; height: 100%; object-fit: cover; }
    @media (max-width: 560px) { .galeria { grid-template-columns: repeat(4, 1fr); } }
    .vista { display: flex; gap: 1rem; align-items: center; padding: .8rem; border-radius: 12px; background: var(--crema-2); border: 1px solid var(--linea); }
    .vista img { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; background: var(--neutro-bg); }
    .precio-celda { font-weight: 600; }
    .prefijo { position: relative; }
    .prefijo span { position: absolute; left: .85rem; top: 50%; transform: translateY(-50%); color: var(--tinta-suave); font-weight: 600; }
    .prefijo .control { padding-left: 2.4rem; }
  `,
})
export class ProductosPagina {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  protected readonly imagenes = IMAGENES;
  protected readonly soles = (n: number) => SOLES.format(n);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly secciones = signal<Seccion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly texto = signal('');
  protected readonly filtroSeccion = signal<number | null>(null);
  protected readonly procesando = signal<number | null>(null);

  protected readonly visibles = computed(() => {
    const q = this.texto().toLowerCase().trim();
    return this.productos().filter(p =>
      (this.filtroSeccion() === null || p.seccionId === this.filtroSeccion())
      && (!q || `${p.nombre} ${p.etiqueta ?? ''}`.toLowerCase().includes(q)));
  });
  protected readonly kpis = computed(() => {
    const l = this.productos();
    const precios = l.map(p => p.precio);
    return {
      total: l.length,
      disponibles: l.filter(p => p.disponible).length,
      promedio: l.length ? precios.reduce((a, b) => a + b, 0) / l.length : 0,
    };
  });

  // ---- formulario
  protected readonly editando = signal<Producto | 'nuevo' | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: ['', Validators.maxLength(250)],
    precio: [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(9999.99), dosDecimales]],
    seccionId: [null as number | null, Validators.required],
    disponible: [true],
    imagenUrl: ['', Validators.maxLength(300)],
    etiqueta: ['', Validators.maxLength(30)],
  });
  protected readonly imagenActual = toSignal(this.form.controls.imagenUrl.valueChanges, { initialValue: '' });

  constructor() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    forkJoin([this.api.productos.listar(), this.api.secciones.listar()]).subscribe({
      next: ([p, s]) => { this.productos.set(p); this.secciones.set(s); this.cargando.set(false); },
      error: e => { this.error.set(mensajeDeError(e)); this.cargando.set(false); },
    });
  }

  protected abrir(p: Producto | 'nuevo') {
    this.errorForm.set(null);
    this.form.reset(p === 'nuevo'
      ? { nombre: '', descripcion: '', precio: null, seccionId: this.filtroSeccion() ?? this.secciones()[0]?.id ?? null, disponible: true, imagenUrl: IMAGENES[0], etiqueta: '' }
      : { nombre: p.nombre, descripcion: p.descripcion ?? '', precio: p.precio, seccionId: p.seccionId, disponible: p.disponible, imagenUrl: p.imagenUrl ?? '', etiqueta: p.etiqueta ?? '' });
    this.editando.set(p);
  }

  protected guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const datos = {
      nombre: v.nombre!.trim(), descripcion: textoOpcional(v.descripcion), precio: Number(v.precio),
      seccionId: v.seccionId!, disponible: !!v.disponible, imagenUrl: textoOpcional(v.imagenUrl),
      etiqueta: textoOpcional(v.etiqueta)?.toUpperCase() ?? null,
    };
    const actual = this.editando();
    this.guardando.set(true);
    this.errorForm.set(null);
    const peticion = actual === 'nuevo' || actual === null ? this.api.productos.crear(datos) : this.api.productos.actualizar(actual.id, datos);
    peticion.subscribe({
      next: p => {
        this.productos.update(l => actual === 'nuevo' ? [...l, p] : l.map(x => x.id === p.id ? p : x));
        this.avisos.ok(`“${p.nombre}” guardado.`);
        this.editando.set(null);
        this.guardando.set(false);
      },
      error: e => { this.errorForm.set(mensajeDeError(e)); this.guardando.set(false); },
    });
  }

  /** Cambia "disponible hoy" sin abrir el formulario. */
  protected alternarDisponible(p: Producto) {
    this.procesando.set(p.id);
    const { id, seccionNombre, seccionSlug, ...resto } = p;
    this.api.productos.actualizar(id, { ...resto, disponible: !p.disponible }).subscribe({
      next: act => { this.productos.update(l => l.map(x => x.id === act.id ? act : x)); this.procesando.set(null); },
      error: e => { this.avisos.error(mensajeDeError(e)); this.procesando.set(null); },
    });
  }

  protected async eliminar(p: Producto) {
    if (!await this.confirmacion.preguntar(`¿Eliminar “${p.nombre}”?`,
      'Desaparecerá de la carta pública. Si solo se agotó hoy, mejor márcalo como no disponible.', { aceptar: 'Eliminar', peligro: true })) return;
    this.api.productos.eliminar(p.id).subscribe({
      next: () => { this.productos.update(l => l.filter(x => x.id !== p.id)); this.avisos.ok('Producto eliminado.'); },
      error: e => this.avisos.error(mensajeDeError(e)),
    });
  }
}
