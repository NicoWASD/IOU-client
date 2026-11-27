/** Tema de la app (HU-36). Se recuerda en este dispositivo; "sistema" sigue al SO. */
export type Tema = 'claro' | 'oscuro' | 'sistema';

const CLAVE = 'iou.tema';

export function temaGuardado(): Tema {
  try {
    const t = localStorage.getItem(CLAVE);
    return t === 'claro' || t === 'oscuro' ? t : 'sistema';
  } catch {
    return 'sistema';
  }
}

/**
 * Pone la clase `.dark` (oscuro) o `.light` (claro) en <html>. Con "sistema" no pone ninguna
 * y manda `prefers-color-scheme` (index.css).
 */
export function aplicarTema(tema: Tema, guardar = true) {
  const html = document.documentElement;
  html.classList.toggle('dark', tema === 'oscuro');
  html.classList.toggle('light', tema === 'claro');
  if (!guardar) return;
  try {
    if (tema === 'sistema') localStorage.removeItem(CLAVE);
    else localStorage.setItem(CLAVE, tema);
  } catch {
    // Almacenamiento bloqueado: el tema vale solo para esta visita
  }
}
