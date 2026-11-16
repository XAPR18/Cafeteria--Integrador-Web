import { Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Mensajes de validación de un campo de formulario reactivo; aparecen cuando el usuario ya lo tocó.
 * Escucha control.events (valor, estado y "tocado") para refrescarse aunque el componente sea OnPush.
 */
@Component({
  selector: 'app-error-campo',
  template: `
    @if (mensaje(); as m) {
      <span class="error-campo" role="alert"><i class="fa-solid fa-circle-exclamation"></i>{{ m }}</span>
    }
  `,
})
export class ErrorCampoComponent {
  readonly control = input.required<AbstractControl | null>();
  readonly nombre = input('Este campo');
  private readonly version = signal(0);

  constructor() {
    effect(alLimpiar => {
      const c = this.control();
      if (!c) return;
      const sub = c.events.subscribe(() => this.version.update(v => v + 1));
      alLimpiar(() => sub.unsubscribe());
    });
  }

  protected readonly mensaje = computed((): string | null => {
    this.version();
    const c = this.control();
    if (!c || !c.errors || !(c.touched || c.dirty)) return null;
    const e = c.errors;
    if (e['required']) return `Falta ${this.nombre().charAt(0).toLowerCase()}${this.nombre().slice(1)}.`;
    if (e['email']) return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
    if (e['minlength']) return `Debe tener al menos ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength']) return `No puede superar ${e['maxlength'].requiredLength} caracteres.`;
    if (e['min']) return `El valor mínimo es ${e['min'].min}.`;
    if (e['max']) return `El valor máximo es ${e['max'].max}.`;
    if (e['decimales']) return 'Usa como máximo dos decimales.';
    if (e['slug']) return 'Solo minúsculas, números y guiones (ej. cafes-frios).';
    if (e['noCoincide']) return 'Las contraseñas no coinciden.';
    if (e['bytes']) return 'La contraseña es demasiado larga (máximo 72 bytes).';
    if (e['pattern']) return this.nombre() === 'El celular' ? 'Escribe un celular peruano, por ejemplo 987 654 321.' : 'El formato no es válido.';
    return 'Revisa este campo.';
  });
}
