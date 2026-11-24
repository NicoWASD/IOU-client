import type { ReactNode } from 'react';
import { EstadoVacio } from '@/components/estados/Estados';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { esPestaña, PESTAÑAS, usePestaña, type Pestaña } from './pestanas';

const proximamente = <EstadoVacio texto="Llega en la próxima versión." />;

/**
 * Secciones del grupo (design.md 5): control segmentado. En mobile queda fijo bajo la barra,
 * con el nombre del grupo para no perder de vista dónde estás. Cambian sin animación (8).
 */
export function GrupoTabs({ nombre, miembros }: { nombre: string; miembros: ReactNode }) {
  const [tab, setTab] = usePestaña();
  const contenido: Record<Pestaña, ReactNode> = {
    gastos: proximamente,
    balances: proximamente,
    pagos: proximamente,
    miembros,
  };

  return (
    <Tabs value={tab} onValueChange={(v) => esPestaña(v) && setTab(v)} className="gap-5">
      <div
        data-testid="franja-pestanas"
        className="sticky top-16 z-[5] -mx-4 grid gap-1.5 border-b border-rule bg-paper/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
      >
        <p aria-hidden="true" className="truncate text-sm font-semibold md:hidden">
          {nombre}
        </p>
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
