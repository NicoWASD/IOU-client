import { useEffect, useRef } from 'react';

/** Al entrar a una pantalla, el foco va a su h1 (design.md 9). El h1 lleva tabIndex={-1}. */
export function useFocoTitulo<T extends HTMLElement = HTMLHeadingElement>(clave?: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [clave]);
  return ref;
}
