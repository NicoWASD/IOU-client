import type { PoseTicky } from './Ticky';

/** Para que cualquier pantalla le pida a Ticky que aparezca y diga algo (por ejemplo, al pagar). */
export type AvisoTicky = { texto: string; pose?: PoseTicky };

const bus = new EventTarget();

export function tickyDice(aviso: AvisoTicky) {
  bus.dispatchEvent(new CustomEvent<AvisoTicky>('aviso', { detail: aviso }));
}

export function escucharTicky(fn: (aviso: AvisoTicky) => void) {
  const h = (e: Event) => fn((e as CustomEvent<AvisoTicky>).detail);
  bus.addEventListener('aviso', h);
  return () => bus.removeEventListener('aviso', h);
}

/** Halagos al registrar un pago; `{a}` es quien recibe la plata. */
export const FRASES_PAGO = [
  '¡{a} gastará eso pronto!',
  '¡Cuentas claras! {a} ya está pensando en qué gastarlo.',
  '¡Bien ahí! {a} se lo va a gastar en un abrir y cerrar de ojos.',
  '¡Deuda saldada! Te ganaste un aplauso (y {a}, unos mangos).',
  '¡Pagador estrella! {a} te debería invitar algo.',
];
