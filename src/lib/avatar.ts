const TONOS = 6;

/** Tono estable por persona: el mismo id siempre da el mismo color (design.md 4). */
export function tonoDe(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % TONOS) + 1;
}

/** "Sofía" → "S", "Juan Pérez" → "JP". */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const letras = partes.length > 1 ? [partes[0], partes[partes.length - 1]] : partes;
  return letras.map((p) => p?.charAt(0).toLocaleUpperCase('es-AR') ?? '').join('');
}

/** "Sofía", "Sofía y Tomi", "Sofía, Tomi y Juli". */
export function listarNombres(nombres: string[]): string {
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}
