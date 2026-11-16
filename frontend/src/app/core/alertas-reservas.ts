import { Injectable, signal } from '@angular/core';
import { Reserva } from './modelos';

export type TipoAlerta = 'NUEVA' | 'CANCELADA_POR_CLIENTE';
export interface Alerta { id: number; tipo: TipoAlerta; reserva: Reserva; llegada: Date; }

const CLAVE_SONIDO = 'cafe14.alertas.sonido';
const CLAVE_VOZ = 'cafe14.alertas.voz';

function leer(clave: string): boolean {
  try { return localStorage.getItem(clave) !== 'no'; } catch { return true; }
}
function guardar(clave: string, si: boolean) {
  try { localStorage.setItem(clave, si ? 'si' : 'no'); } catch { /* modo privado: solo para esta visita */ }
}

/**
 * Escucha en tiempo real (Server-Sent Events) las reservas nuevas o canceladas por clientes
 * y avisa al personal con una campanita de sala de espera, una voz y una tarjeta en pantalla.
 */
@Injectable({ providedIn: 'root' })
export class AlertasReservasService {
  readonly alertas = signal<Alerta[]>([]);
  /** Reservas nuevas que el personal aún no ha visto en la lista. */
  readonly sinVer = signal(0);
  /** Aumenta con cada aviso: las páginas de reservas lo observan para recargar. */
  readonly version = signal(0);
  readonly conectado = signal(false);
  readonly sonido = signal(leer(CLAVE_SONIDO));
  readonly voz = signal(leer(CLAVE_VOZ));
  /** El navegador solo deja sonar audio después de un clic del usuario en la página. */
  readonly audioListo = signal(false);

  private fuente: EventSource | null = null;
  private reintento: ReturnType<typeof setTimeout> | null = null;
  private audio: AudioContext | null = null;
  private siguiente = 1;
  private tituloOriginal = '';
  /** Primer clic en el panel: habilita el audio y pide permiso para notificaciones del sistema. */
  private readonly desbloquear = () => { this.prepararAudio(); this.pedirPermisoEscritorio(); };

  iniciar() {
    if (this.fuente) return;
    this.tituloOriginal = document.title;
    document.addEventListener('pointerdown', this.desbloquear);
    document.addEventListener('keydown', this.desbloquear);
    this.conectar();
  }

  detener() {
    this.fuente?.close();
    this.fuente = null;
    if (this.reintento) clearTimeout(this.reintento);
    document.removeEventListener('pointerdown', this.desbloquear);
    document.removeEventListener('keydown', this.desbloquear);
    this.conectado.set(false);
    this.alertas.set([]);
    this.marcarVistas();
  }

  cerrar(id: number) { this.alertas.update(l => l.filter(a => a.id !== id)); }

  marcarVistas() {
    this.sinVer.set(0);
    if (this.tituloOriginal) document.title = this.tituloOriginal;
  }

  alternarSonido() {
    this.sonido.update(v => !v);
    guardar(CLAVE_SONIDO, this.sonido());
    if (this.sonido()) { this.prepararAudio(); this.campana('NUEVA'); }
  }

  alternarVoz() {
    this.voz.update(v => !v);
    guardar(CLAVE_VOZ, this.voz());
    if (this.voz()) this.decir('Avisos por voz activados');
  }

  // ------------------------------------------------------------------ conexión

  private conectar() {
    const fuente = new EventSource('/api/reservas/avisos');
    this.fuente = fuente;
    fuente.addEventListener('conectado', () => this.conectado.set(true));
    fuente.addEventListener('reserva', ev => this.recibir(JSON.parse((ev as MessageEvent).data)));
    fuente.onerror = () => {
      this.conectado.set(false);
      // El navegador reintenta solo; si el servidor respondió con error (sesión vencida, reinicio) lo hacemos nosotros.
      if (fuente.readyState === EventSource.CLOSED && this.fuente === fuente) {
        this.fuente = null;
        this.reintento = setTimeout(() => this.conectar(), 15000);
      }
    };
  }

  private recibir(aviso: { tipo: TipoAlerta; reserva: Reserva }) {
    const alerta: Alerta = { id: this.siguiente++, tipo: aviso.tipo, reserva: aviso.reserva, llegada: new Date() };
    this.alertas.update(l => [alerta, ...l].slice(0, 4));
    this.version.update(v => v + 1);
    const r = aviso.reserva;
    if (aviso.tipo === 'NUEVA') {
      this.sinVer.update(n => n + 1);
      document.title = `(${this.sinVer()}) Nueva reserva · Café Catorce`;
      setTimeout(() => this.cerrar(alerta.id), 30000);
    } else {
      setTimeout(() => this.cerrar(alerta.id), 12000);
    }
    this.campana(aviso.tipo);
    if (this.voz()) {
      const hora = r.horaInicio.replace(':00', '').replace(':', ' y ');
      const texto = aviso.tipo === 'NUEVA'
        ? `Nueva reserva. ${r.clienteNombre.split(' ')[0]}, ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}, mesa ${r.mesaNumero}, a las ${hora}.`
        : `Reserva cancelada por ${r.clienteNombre.split(' ')[0]}.`;
      setTimeout(() => this.decir(texto), aviso.tipo === 'NUEVA' ? 1900 : 900);
    }
    this.notificarEscritorio(alerta);
  }

  // ------------------------------------------------------------------ sonido

  private prepararAudio() {
    try {
      this.audio ??= new AudioContext();
      if (this.audio.state === 'suspended') void this.audio.resume();
      this.audioListo.set(true);
    } catch { /* navegador sin Web Audio */ }
  }

  /**
   * Campanita tipo sala de espera ("ding-dong-ding"), sintetizada: notas con armónicos y caída
   * como una campana de metal. Para cancelaciones, un solo tono suave y grave.
   */
  private campana(tipo: TipoAlerta) {
    if (!this.sonido() || !this.audio || this.audio.state !== 'running') return;
    const ctx = this.audio;
    const salida = ctx.createDynamicsCompressor();
    salida.connect(ctx.destination);
    const notas = tipo === 'NUEVA'
      ? [[659.25, 0], [523.25, 0.45], [783.99, 0.9]]   // Mi5, Do5, Sol5
      : [[392.0, 0]];                                     // Sol4
    for (const [frecuencia, desfase] of notas) {
      const t = ctx.currentTime + desfase;
      for (const [multiplo, volumen] of [[1, 0.32], [2.0, 0.12], [3.01, 0.05], [4.2, 0.02]]) {
        const osc = ctx.createOscillator();
        const gan = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frecuencia * multiplo;
        gan.gain.setValueAtTime(0.0001, t);
        gan.gain.exponentialRampToValueAtTime(volumen, t + 0.012);
        gan.gain.exponentialRampToValueAtTime(0.0001, t + (multiplo === 1 ? 1.9 : 0.9));
        osc.connect(gan).connect(salida);
        osc.start(t);
        osc.stop(t + 2);
      }
    }
  }

  private decir(texto: string) {
    if (!('speechSynthesis' in window)) return;
    const frase = new SpeechSynthesisUtterance(texto);
    frase.lang = 'es-PE';
    const voces = speechSynthesis.getVoices();
    frase.voice = voces.find(v => v.lang === 'es-PE') ?? voces.find(v => v.lang.startsWith('es-4') || v.lang === 'es-MX')
      ?? voces.find(v => v.lang.startsWith('es')) ?? null;
    frase.rate = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(frase);
  }

  /** Si la pestaña está en segundo plano, además muestra una notificación del sistema (si se dio permiso). */
  private notificarEscritorio(a: Alerta) {
    if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
    const r = a.reserva;
    new Notification(a.tipo === 'NUEVA' ? '🔔 Nueva reserva' : 'Reserva cancelada', {
      body: `${r.clienteNombre} · ${r.fecha} ${r.horaInicio} · ${r.personas} pers. · Mesa ${r.mesaNumero}`,
      icon: '/Image/Café 14 - logo.svg', tag: 'reserva-' + r.id,
    });
  }

  pedirPermisoEscritorio() {
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission();
  }
}
