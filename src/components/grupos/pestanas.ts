import { useSearchParams } from 'react-router';

export const PESTAÑAS = [
  { id: 'gastos', label: 'Gastos' },
  { id: 'balances', label: 'Balances' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'miembros', label: 'Miembros' },
] as const;
export type Pestaña = (typeof PESTAÑAS)[number]['id'];

export const esPestaña = (v: string | null): v is Pestaña => PESTAÑAS.some((p) => p.id === v);

/** Pestaña activa en la URL (`?tab=miembros`); sin valor o inválida, Gastos. */
export function usePestaña(): [Pestaña, (p: Pestaña) => void] {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab');
  const actual: Pestaña = esPestaña(tab) ? tab : 'gastos';
  const cambiar = (p: Pestaña) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', p);
        return next;
      },
      { replace: true },
    );
  return [actual, cambiar];
}
