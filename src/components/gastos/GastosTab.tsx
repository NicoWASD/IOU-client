import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useGastos } from '@/api/gastos';
import type { GastoResumen, GrupoDetalle } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { Avatar } from '@/components/Avatar';
import { Cargando, ErrorCarga, EstadoVacio } from '@/components/estados/Estados';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCargaDemorada } from '@/hooks/useCargaDemorada';
import { etiquetaDia } from '@/lib/fechas';
import { formatMoney, moneyToCents } from '@/lib/money';
import { GastoDetalleDialog } from './GastoDetalleDialog';
import { GastoFormDialog } from './GastoForm';

const LISTA = 'rounded-[14px] border border-rule bg-surface';
const FILA = 'flex min-h-16 items-center gap-3 border-t border-rule px-4 py-3 first:border-t-0';

function porDia(gastos: GastoResumen[]) {
  const dias: { fecha: string; gastos: GastoResumen[] }[] = [];
  for (const g of gastos) {
    const ultimo = dias.at(-1);
    if (ultimo?.fecha === g.fecha) ultimo.gastos.push(g);
    else dias.push({ fecha: g.fecha, gastos: [g] });
  }
  return dias;
}

function Esqueleto() {
  return (
    <ul className={LISTA}>
      {[0, 1, 2].map((i) => (
        <li key={i} className={FILA}>
          <Skeleton className="size-9 rounded-full bg-muted" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-2/5 bg-muted" />
            <Skeleton className="h-3 w-1/4 bg-muted" />
          </div>
          <Skeleton className="h-4 w-16 bg-muted" />
        </li>
      ))}
    </ul>
  );
}

/** Pestaña Gastos (HU-15): por día, del más reciente al más antiguo, de a 20. */
export function GastosTab({ grupo }: { grupo: GrupoDetalle }) {
  const gastos = useGastos(grupo.id);
  const { usuario } = useAuth();
  const [nuevo, setNuevo] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const carga = useCargaDemorada(gastos.isPending);
  const puedeCargar = !grupo.archivado;

  const botonAgregar = puedeCargar && (
    <Button className="h-11" onClick={() => setNuevo(true)}>
      <Plus aria-hidden="true" /> Agregar un gasto
    </Button>
  );

  let contenido;
  if (gastos.isPending || carga.esqueleto) {
    contenido = (
      <Cargando texto="Cargando gastos" esqueleto={carga.esqueleto} coldStart={carga.coldStart}>
        <Esqueleto />
      </Cargando>
    );
  } else if (gastos.isError) {
    contenido = (
      <ErrorCarga
        error={gastos.error}
        que="los gastos"
        onReintentar={() => void gastos.refetch()}
        reintentando={gastos.isFetching}
      />
    );
  } else {
    const todos = gastos.data.pages.flatMap((p) => p.gastos);
    contenido =
      todos.length === 0 ? (
        <EstadoVacio
          firma="Sin gastos"
          texto="Sin gastos todavía. El primero que pague, que lo anote."
          accion={botonAgregar}
        />
      ) : (
        <div className="grid gap-5">
          {botonAgregar && <div className="justify-self-start">{botonAgregar}</div>}
          {porDia(todos).map((dia) => (
            <section key={dia.fecha} aria-labelledby={`dia-${dia.fecha}`} className="grid gap-2">
              <h3 id={`dia-${dia.fecha}`} className="text-sm font-semibold text-pencil">
                {etiquetaDia(dia.fecha)}
              </h3>
              <ul className={LISTA}>
                {dia.gastos.map((g) => {
                  const miParte = moneyToCents(g.miParte);
                  return (
                    <li key={g.id} className="border-t border-rule first:border-t-0">
                      <button
                        type="button"
                        onClick={() => setAbierto(g.id)}
                        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                      >
                        <Avatar usuario={g.pagadoPor} />
                        <span className="grid min-w-0 flex-1">
                          <span className="truncate font-semibold">{g.descripcion}</span>
                          <span className="truncate text-sm text-pencil">
                            Pagó {g.pagadoPor.id === usuario?.id ? 'vos' : g.pagadoPor.nombre}
                          </span>
                        </span>
                        <span className="grid justify-items-end">
                          <span className="font-semibold tabular-nums">
                            {formatMoney(moneyToCents(g.monto))}
                          </span>
                          <span className="text-xs text-pencil tabular-nums">
                            {miParte > 0 ? `Tu parte ${formatMoney(miParte)}` : 'No participás'}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {gastos.hasNextPage && (
            <Button
              variant="outline"
              className="h-11 justify-self-center"
              disabled={gastos.isFetchingNextPage}
              onClick={() => void gastos.fetchNextPage()}
            >
              {gastos.isFetchingNextPage ? 'Cargando…' : 'Ver más gastos'}
            </Button>
          )}
        </div>
      );
  }

  return (
    <>
      {contenido}
      <GastoFormDialog grupo={grupo} open={nuevo} onOpenChange={setNuevo} />
      <GastoDetalleDialog grupo={grupo} gastoId={abierto} onClose={() => setAbierto(null)} />
    </>
  );
}
