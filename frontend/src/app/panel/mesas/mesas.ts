import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { EstadoMesa, Mesa, Reserva, TipoMesa, ZonaMesa } from '../../core/modelos';
import { ESTADOS_MESA, TIPOS, ZONAS, fechaIso, mensajeDeError } from '../../core/textos';
import { AvisosService } from '../../compartido/avisos';
import { ConfirmacionService } from '../../compartido/confirmacion';
import { ErrorCampoComponent } from '../../compartido/error-campo';
import { ModalComponent } from '../../compartido/modal';

@Component({
  selector: 'app-mesas',
  imports: [ReactiveFormsModule, ModalComponent, ErrorCampoComponent],
  styleUrl: '../panel.css',
  templateUrl: './mesas.html',
  styles: `
    .zona { margin-bottom: 1.75rem; }
    .zona h2 { font-size: 1.15rem; display: flex; align-items: center; gap: .5rem; margin-bottom: .8rem; }
    .zona h2 small { font-family: var(--sans); font-size: .8rem; font-weight: 500; color: var(--tinta-tenue); }
    .mapa { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .mesa { padding: 1rem 1.1rem; display: grid; gap: .7rem; border-top: 4px solid var(--ok); }
    .mesa.OCUPADA { border-top-color: var(--error); }
    .mesa.RESERVADA { border-top-color: var(--aviso); }
    .mesa__cab { display: flex; align-items: center; justify-content: space-between; }
    .mesa__num { font-family: var(--serif); font-size: 1.6rem; font-weight: 700; }
    .mesa__meta { font-size: .85rem; color: var(--tinta-suave); display: flex; gap: .9rem; }
    .proxima { font-size: .8rem; padding: .45rem .6rem; border-radius: 8px; background: var(--crema-2); border: 1px dashed var(--linea-fuerte); }
    .proxima strong { color: var(--tinta); }
    .estados { display: grid; grid-template-columns: repeat(3, 1fr); gap: .3rem; }
    .estados button { padding: .4rem 0; border-radius: 8px; font-size: .75rem; font-weight: 600; border: 1.5px solid var(--linea); color: var(--tinta-suave); }
    .estados button:hover:not(:disabled) { border-color: var(--linea-fuerte); color: var(--tinta); }
    .estados button.DISPONIBLE.activo { background: var(--ok-bg); border-color: var(--ok); color: var(--ok); }
    .estados button.OCUPADA.activo { background: var(--error-bg); border-color: var(--error); color: var(--error); }
    .estados button.RESERVADA.activo { background: var(--aviso-bg); border-color: var(--aviso); color: var(--aviso); }
    .mesa__admin { display: flex; justify-content: flex-end; gap: .2rem; margin-top: -.3rem; }
  `,
})
export class MesasPagina {
  private readonly api = inject(ApiService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly auth = inject(AuthService);
  protected readonly esAdmin = computed(() => this.auth.rol() === 'ADMIN');
  protected readonly ESTADOS = ESTADOS_MESA;
  protected readonly ZONAS = ZONAS;
  protected readonly TIPOS = TIPOS;
  protected readonly listaEstados = Object.keys(ESTADOS_MESA) as EstadoMesa[];
  protected readonly listaZonas = Object.keys(ZONAS) as ZonaMesa[];
  protected readonly listaTipos = Object.keys(TIPOS) as TipoMesa[];

  protected readonly mesas = signal<Mesa[]>([]);
  protected readonly reservasHoy = signal<Reserva[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly procesando = signal<number | null>(null);

  protected readonly porZona = computed(() => this.listaZonas
    .map(z => ({ zona: z, mesas: this.mesas().filter(m => m.zona === z).sort((a, b) => a.numero - b.numero) }))
    .filter(g => g.mesas.length > 0));
  protected readonly resumen = computed(() => {
    const m = this.mesas();
    return {
      disponibles: m.filter(x => x.estado === 'DISPONIBLE').length,
      ocupadas: m.filter(x => x.estado === 'OCUPADA').length,
      plazas: m.reduce((s, x) => s + x.capacidad, 0),
      total: m.length,
    };
  });

  // ---- formulario (solo ADMIN)
  protected readonly editando = signal<Mesa | 'nueva' | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    numero: [1, [Validators.required, Validators.min(1), Validators.max(999)]],
    capacidad: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
    tipo: ['DOS' as TipoMesa, Validators.required],
    zona: ['INTERIOR' as ZonaMesa, Validators.required],
    estado: ['DISPONIBLE' as EstadoMesa, Validators.required],
  });

  constructor() { this.cargar(); }

  /** Próxima reserva activa de hoy para la mesa (para que el equipo sepa a quién espera). */
  protected proxima(mesaId: number): Reserva | undefined {
    const ahora = new Date().toTimeString().slice(0, 5);
    return this.reservasHoy()
      .filter(r => r.mesaId === mesaId && (r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && r.horaFin > ahora)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))[0];
  }

  cargar() {
    this.cargando.set(true);
    const hoy = fechaIso();
    forkJoin([this.api.mesas.listar(), this.api.reservas.listar(hoy, hoy)]).subscribe({
      next: ([m, r]) => { this.mesas.set(m); this.reservasHoy.set(r); this.cargando.set(false); },
      error: e => { this.error.set(mensajeDeError(e)); this.cargando.set(false); },
    });
  }

  protected cambiarEstado(m: Mesa, estado: EstadoMesa) {
    if (m.estado === estado) return;
    this.procesando.set(m.id);
    this.api.mesas.cambiarEstado(m.id, estado).subscribe({
      next: act => { this.mesas.update(l => l.map(x => x.id === act.id ? act : x)); this.procesando.set(null); },
      error: e => { this.avisos.error(mensajeDeError(e)); this.procesando.set(null); },
    });
  }

  protected abrir(m: Mesa | 'nueva') {
    this.errorForm.set(null);
    if (m === 'nueva') {
      const siguiente = Math.max(0, ...this.mesas().filter(x => x.numero < 900).map(x => x.numero)) + 1;
      this.form.reset({ numero: siguiente, capacidad: 2, tipo: 'DOS', zona: 'INTERIOR', estado: 'DISPONIBLE' });
    } else {
      this.form.reset({ numero: m.numero, capacidad: m.capacidad, tipo: m.tipo, zona: m.zona, estado: m.estado });
    }
    this.editando.set(m);
  }

  protected guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const actual = this.editando();
    const datos = this.form.getRawValue();
    this.guardando.set(true);
    this.errorForm.set(null);
    const peticion = actual === 'nueva' || actual === null ? this.api.mesas.crear(datos) : this.api.mesas.actualizar(actual.id, datos);
    peticion.subscribe({
      next: m => {
        this.mesas.update(l => actual === 'nueva' ? [...l, m] : l.map(x => x.id === m.id ? m : x));
        this.avisos.ok(`Mesa ${m.numero} guardada.`);
        this.editando.set(null);
        this.guardando.set(false);
      },
      error: e => { this.errorForm.set(mensajeDeError(e)); this.guardando.set(false); },
    });
  }

  protected async eliminar(m: Mesa) {
    if (!await this.confirmacion.preguntar(`¿Eliminar la mesa ${m.numero}?`,
      'Si tiene reservas registradas no se podrá eliminar; en ese caso puedes dejarla como ocupada.', { aceptar: 'Eliminar', peligro: true })) return;
    this.api.mesas.eliminar(m.id).subscribe({
      next: () => { this.mesas.update(l => l.filter(x => x.id !== m.id)); this.avisos.ok(`Mesa ${m.numero} eliminada.`); },
      error: e => this.avisos.error(mensajeDeError(e).replace('El registro esta duplicado o tiene datos relacionados',
        'La mesa tiene reservas registradas y no se puede eliminar.')),
    });
  }

  /** Sugiere el tipo según la capacidad para no tener que elegirlo a mano. */
  protected sugerirTipo() {
    const c = this.form.controls.capacidad.value;
    this.form.controls.tipo.setValue(c <= 2 ? 'DOS' : c <= 4 ? 'CUATRO' : 'EXTRA');
  }
}
