import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, merge } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Agenda, MesaLibre, Reserva, ZonaMesa } from '../../core/modelos';
import { ZONAS, fechaCorta, fechaIso, fechaLarga, mensajeDeError, sumarDias } from '../../core/textos';
import { ErrorCampoComponent } from '../../compartido/error-campo';

const BORRADOR = 'cafe14.reserva-borrador';

@Component({
  selector: 'app-reservar',
  imports: [ReactiveFormsModule, RouterLink, ErrorCampoComponent],
  templateUrl: './reservar.html',
  styleUrl: './reservar.css',
})
export class ReservarPagina {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly hoy = fechaIso();
  protected readonly maxFecha = sumarDias(this.hoy, 30);
  protected readonly dias = Array.from({ length: 14 }, (_, i) => sumarDias(this.hoy, i));
  protected readonly zonas: { valor: ZonaMesa | null; texto: string; icono: string }[] = [
    { valor: null, texto: 'Donde haya lugar', icono: 'fa-shuffle' },
    { valor: 'INTERIOR', texto: ZONAS.INTERIOR, icono: 'fa-couch' },
    { valor: 'VEREDA', texto: ZONAS.VEREDA, icono: 'fa-sun' },
    { valor: 'BARRA', texto: ZONAS.BARRA, icono: 'fa-mug-hot' },
  ];
  protected readonly ZONAS = ZONAS;
  protected readonly fechaCorta = fechaCorta;
  protected readonly fechaLarga = fechaLarga;

  protected readonly form = inject(FormBuilder).group({
    fecha: [this.hoy, Validators.required],
    personas: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
    zona: [null as ZonaMesa | null],
    hora: [null as string | null, Validators.required],
    mesaId: [null as number | null],
    nota: ['', Validators.maxLength(200)],
  });

  protected readonly agenda = signal<Agenda | null>(null);
  protected readonly cargandoAgenda = signal(false);
  protected readonly errorAgenda = signal<string | null>(null);
  protected readonly mesas = signal<MesaLibre[]>([]);
  protected readonly cargandoMesas = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmada = signal<Reserva | null>(null);

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly turnosPorMomento = computed(() => {
    const turnos = this.agenda()?.turnos ?? [];
    const grupos = [
      { titulo: 'Mañana', icono: 'fa-sun', turnos: turnos.filter(t => t.hora < '12:00') },
      { titulo: 'Tarde', icono: 'fa-cloud-sun', turnos: turnos.filter(t => t.hora >= '12:00' && t.hora < '17:00') },
      { titulo: 'Noche', icono: 'fa-moon', turnos: turnos.filter(t => t.hora >= '17:00') },
    ];
    return grupos.filter(g => g.turnos.length > 0);
  });
  protected readonly mesaElegida = computed(() => this.mesas().find(m => m.id === this.valores().mesaId) ?? null);
  protected readonly esPersonal = computed(() => this.auth.rol() === 'ADMIN' || this.auth.rol() === 'EMPLEADO');

  constructor() {
    this.restaurarBorrador();
    const c = this.form.controls;
    merge(c.fecha.valueChanges, c.personas.valueChanges, c.zona.valueChanges).pipe(debounceTime(150))
      .subscribe(() => {
        c.hora.setValue(null, { emitEvent: false });
        c.mesaId.setValue(null);
        this.mesas.set([]);
        this.cargarAgenda();
      });
    this.cargarAgenda();
  }

  protected cambiarPersonas(delta: number) {
    const p = Math.min(20, Math.max(1, (this.form.controls.personas.value ?? 2) + delta));
    this.form.controls.personas.setValue(p);
  }

  protected elegirFecha(valor: string) {
    if (valor && valor >= this.hoy && valor <= this.maxFecha) this.form.controls.fecha.setValue(valor);
  }

  protected elegirHora(hora: string) {
    this.form.patchValue({ hora, mesaId: null });
    const { fecha, personas, zona } = this.form.getRawValue();
    this.cargandoMesas.set(true);
    this.api.catalogo.mesasLibres(fecha!, hora, personas!, zona).subscribe({
      next: m => { this.mesas.set(m); this.cargandoMesas.set(false); },
      error: e => { this.error.set(mensajeDeError(e)); this.cargandoMesas.set(false); },
    });
  }

  protected irAIngresar(destino: 'login' | 'registro') {
    sessionStorage.setItem(BORRADOR, JSON.stringify(this.form.getRawValue()));
    void this.router.navigate(['/' + destino], { queryParams: { volver: '/reservar' } });
  }

  protected confirmar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.error.set(null);
    this.api.reservas.crear({
      fecha: v.fecha!, hora: v.hora!, personas: v.personas!, mesaId: v.mesaId, zona: v.zona,
      nota: v.nota?.trim() || null,
    }).subscribe({
      next: r => { this.confirmada.set(r); this.enviando.set(false); sessionStorage.removeItem(BORRADOR); window.scrollTo({ top: 0 }); },
      error: e => {
        this.error.set(mensajeDeError(e));
        this.enviando.set(false);
        this.cargarAgenda(); // la disponibilidad pudo cambiar mientras el cliente decidía
      },
    });
  }

  protected nuevaReserva() {
    this.confirmada.set(null);
    this.form.patchValue({ hora: null, mesaId: null, nota: '' });
    this.cargarAgenda();
  }

  private cargarAgenda() {
    const { fecha, personas, zona } = this.form.getRawValue();
    if (!fecha || !personas || this.form.controls.personas.invalid) return;
    this.cargandoAgenda.set(true);
    this.errorAgenda.set(null);
    this.api.catalogo.agenda(fecha, personas, zona).subscribe({
      next: a => { this.agenda.set(a); this.cargandoAgenda.set(false); },
      error: e => { this.agenda.set(null); this.errorAgenda.set(mensajeDeError(e)); this.cargandoAgenda.set(false); },
    });
  }

  private restaurarBorrador() {
    try {
      const b = JSON.parse(sessionStorage.getItem(BORRADOR) ?? 'null');
      if (b && b.fecha >= this.hoy) {
        this.form.patchValue({ fecha: b.fecha, personas: b.personas, zona: b.zona, nota: b.nota ?? '' });
        if (b.hora) setTimeout(() => this.elegirHora(b.hora));
      }
    } catch { /* borrador dañado: se ignora */ }
  }
}
