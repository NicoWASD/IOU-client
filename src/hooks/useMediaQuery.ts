import { useCallback, useSyncExternalStore } from 'react';

/** `true` si la media query coincide. Sin `matchMedia` (tests, entornos viejos) usa `fallback`. */
export function useMediaQuery(query: string, fallback = true): boolean {
  const suscribir = useCallback(
    (avisar: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', avisar);
      return () => mql.removeEventListener('change', avisar);
    },
    [query],
  );
  return useSyncExternalStore(suscribir, () =>
    typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback,
  );
}

/** Desktop y tablet: diálogo centrado. Mobile (< 768 px): hoja inferior (design.md 5). */
export const useEsDesktop = () => useMediaQuery('(min-width: 768px)');
