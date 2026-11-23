import '@testing-library/jest-dom/vitest';

// jsdom no trae matchMedia (lo usan sonner y useMediaQuery). Simulamos una pantalla de
// escritorio: las consultas `min-width` coinciden y el resto (modo oscuro, reduced motion) no.
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: query.includes('min-width'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
