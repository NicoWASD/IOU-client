import { useMiembros } from '@/api/grupos';
import type { GrupoDetalle, Miembro } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { Cargando, ErrorCarga } from '@/components/estados/Estados';
import { Skeleton } from '@/components/ui/skeleton';
import { useCargaDemorada } from '@/hooks/useCargaDemorada';
import { cn } from '@/lib/utils';

function FilaMiembro({ miembro }: { miembro: Miembro }) {
  return (
    <li className="flex min-h-16 items-center gap-3 border-t border-rule px-4 py-3 first:border-t-0">
      <Avatar usuario={miembro} className={cn(!miembro.activo && 'opacity-60')} />
      <div className="grid min-w-0 flex-1">
        <span className={cn('truncate font-semibold', !miembro.activo && 'text-pencil')}>
          {miembro.nombre}
        </span>
        <span className="truncate text-sm text-pencil">{miembro.email}</span>
      </div>
      {miembro.activo && (
        <span className="text-sm text-pencil">{miembro.rol === 'ADMIN' ? 'Admin' : 'Miembro'}</span>
      )}
    </li>
  );
}

const LISTA = 'rounded-[14px] border border-rule bg-surface';

function EsqueletoMiembros() {
  return (
    <ul className={LISTA}>
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="flex min-h-16 items-center gap-3 border-t border-rule px-4 py-3 first:border-t-0"
        >
          <Skeleton className="size-9 rounded-full bg-muted" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-2/5 bg-muted" />
            <Skeleton className="h-3 w-1/3 bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Pestaña Miembros (HU-10, HU-11): activos y, aparte, los que ya no participan. */
export function MiembrosTab({ grupo }: { grupo: GrupoDetalle }) {
  const miembros = useMiembros(grupo.id, grupo.miembros);
  const carga = useCargaDemorada(miembros.isPending);

  if (miembros.isPending || carga.esqueleto) {
    return (
      <Cargando texto="Cargando miembros" esqueleto={carga.esqueleto} coldStart={carga.coldStart}>
        <EsqueletoMiembros />
      </Cargando>
    );
  }
  if (miembros.isError) {
    return (
      <ErrorCarga
        error={miembros.error}
        que="los miembros"
        onReintentar={() => void miembros.refetch()}
        reintentando={miembros.isFetching}
      />
    );
  }

  const activos = miembros.data.filter((m) => m.activo);
  const inactivos = miembros.data.filter((m) => !m.activo);

  return (
    <div className="grid gap-6">
      <section aria-labelledby="miembros-activos" className="grid gap-3">
        <h2 id="miembros-activos" className="sr-only">
          Participan
        </h2>
        <ul className={LISTA}>
          {activos.map((m) => (
            <FilaMiembro key={m.id} miembro={m} />
          ))}
        </ul>
      </section>
      {inactivos.length > 0 && (
        <section aria-labelledby="miembros-inactivos" className="grid gap-3">
          <h2 id="miembros-inactivos" className="text-lg font-semibold">
            Ya no participan
          </h2>
          <ul className={LISTA}>
            {inactivos.map((m) => (
              <FilaMiembro key={m.id} miembro={m} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
