import { useEffect, useState } from 'react';

export const ESQUELETO_DEMORA_MS = 150;
export const ESQUELETO_MINIMO_MS = 300;
export const COLD_START_MS = 3000;

/**
 * Tiempos de carga de design.md 7.1:
 * - el esqueleto aparece recién a los 150 ms (sin parpadeo en respuestas rápidas)
 *   y, una vez visible, se mantiene al menos 300 ms;
 * - pasados 3 s se avisa del cold start de Render.
 */
export function useCargaDemorada(cargando: boolean) {
  const [visibleDesde, setVisibleDesde] = useState<number | null>(null);
  const [coldStart, setColdStart] = useState(false);

  useEffect(() => {
    if (!cargando) return;
    const esqueleto = setTimeout(() => setVisibleDesde(Date.now()), ESQUELETO_DEMORA_MS);
    const frio = setTimeout(() => setColdStart(true), COLD_START_MS);
    return () => {
      clearTimeout(esqueleto);
      clearTimeout(frio);
    };
  }, [cargando]);

  // Terminó la carga: el esqueleto se va cuando cumplió su mínimo
  useEffect(() => {
    if (cargando || visibleDesde === null) return;
    const falta = Math.max(0, ESQUELETO_MINIMO_MS - (Date.now() - visibleDesde));
    const t = setTimeout(() => {
      setVisibleDesde(null);
      setColdStart(false);
    }, falta);
    return () => clearTimeout(t);
  }, [cargando, visibleDesde]);

  const sosteniendo = !cargando && visibleDesde !== null;
  return {
    /** Mostrar el esqueleto (o seguir mostrándolo para cumplir el mínimo). */
    esqueleto: (cargando && visibleDesde !== null) || sosteniendo,
    /** Todavía no hay que mostrar nada: ni esqueleto ni datos. */
    enEspera: cargando && visibleDesde === null,
    coldStart: cargando && coldStart,
  };
}
