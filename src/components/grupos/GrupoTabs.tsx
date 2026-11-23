import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { EstadoVacio } from '@/components/estados/Estados';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const PESTAÑAS = [
  { id: 'gastos', label: 'Gastos' },
  { id: 'balances', label: 'Balances' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'miembros', label: 'Miembros' },
] as const;
export type Pestaña = (typeof PESTAÑAS)[number]['id'];

const esPestaña = (v: string | null): v is Pestaña => PESTAÑAS.some((p) => p.id === v);

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

const proximamente = <EstadoVacio texto="Llega en la próxima versión." />;

/**
 * Secciones del grupo (design.md 5): control segmentado; en mobile queda fijo bajo la barra.
 * Las pestañas cambian sin animación (design.md 8).
 */
export function GrupoTabs({ miembros }: { miembros: ReactNode }) {
  const [tab, setTab] = usePestaña();
  const contenido: Record<Pestaña, ReactNode> = {
    gastos: proximamente,
    balances: proximamente,
    pagos: proximamente,
    miembros,
  };

  return (
    <Tabs value={tab} onValueChange={(v) => esPestaña(v) && setTab(v)} className="gap-5">
      <div className="sticky top-16 z-[5] -mx-4 bg-paper/90 px-4 py-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <TabsList aria-label="Secciones del grupo" className="w-full md:w-fit">
          {PESTAÑAS.map((p) => (
            <TabsTrigger key={p.id} value={p.id}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {PESTAÑAS.map((p) => (
        <TabsContent key={p.id} value={p.id}>
          {contenido[p.id]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
