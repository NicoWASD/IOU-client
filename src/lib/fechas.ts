// Fechas de negocio (YYYY-MM-DD) en la zona de Buenos Aires, igual que el back (RN-07).

const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

export const hoy = (ahora = new Date()) => ymd.format(ahora);
export const ayer = (ahora = new Date()) => ymd.format(new Date(ahora.getTime() - 86_400_000));

const largo = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/** "Hoy", "Ayer" o "lunes 3 de noviembre". */
export function etiquetaDia(fecha: string, ahora = new Date()): string {
  if (fecha === hoy(ahora)) return 'Hoy';
  if (fecha === ayer(ahora)) return 'Ayer';
  const texto = largo.format(new Date(`${fecha}T00:00:00Z`)).replace(',', '');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
