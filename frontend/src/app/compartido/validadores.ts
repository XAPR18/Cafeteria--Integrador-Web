import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Validadores que replican las reglas de la API para avisar antes de enviar. */

export const slugValido: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  !c.value || /^[a-z0-9-]+$/.test(c.value) ? null : { slug: true };

export const dosDecimales: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  c.value === null || c.value === '' || /^\d+(\.\d{1,2})?$/.test(String(c.value)) ? null : { decimales: true };

/** BCrypt solo usa los primeros 72 bytes: más largo sería engañoso. */
export const maximo72Bytes: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  !c.value || new TextEncoder().encode(c.value).length <= 72 ? null : { bytes: true };

export function coincideCon(campo: string): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const otro = c.parent?.get(campo)?.value;
    return !c.value || c.value === otro ? null : { noCoincide: true };
  };
}

/** "Juan  " -> "Juan"; cadena vacía -> null (lo que espera la API para campos opcionales). */
export function textoOpcional(v: string | null | undefined): string | null {
  const t = (v ?? '').trim();
  return t ? t : null;
}
