import { UserMinus } from 'lucide-react';
import { useRef, useState } from 'react';
import { useMiembros } from '@/api/grupos';
import type { GrupoDetalle, Miembro } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { Avatar } from '@/components/Avatar';
import { Cargando, ErrorCarga } from '@/components/estados/Estados';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCargaDemorada } from '@/hooks/useCargaDemorada';
import { cn } from '@/lib/utils';
import { AgregarMiembroForm } from './AgregarMiembroForm';
import { QuitarMiembroDialog } from './QuitarMiembroDialog';

function FilaMiembro({
  miembro,
  esVos,
  onQuitar,
}: {
  miembro: Miembro;
  esVos: boolean;
  /** Solo para el admin, con el grupo activo, sobre otros miembros activos. */
  onQuitar?: (boton: HTMLButtonElement) => void;
}) {
  return (
    <li className="flex min-h-16 items-center gap-3 border-t border-rule px-4 py-3 first:border-t-0">
      <Avatar usuario={miembro} className={cn(!miembro.activo && 'opacity-60')} />
      <div className="grid min-w-0 flex-1">
        <span className={cn('truncate font-semibold', !miembro.activo && 'text-pencil')}>
          {esVos ? `${miembro.nombre} (vos)` : miembro.nombre}
        </span>
        <span className="truncate text-sm text-pencil">{miembro.email}</span>
      </div>
      {miembro.activo && (
        <span className="text-sm text-pencil">{miembro.rol === 'ADMIN' ? 'Admin' : 'Miembro'}</span>
      )}
      {onQuitar && (
        <Button
          variant="ghost"
          size="icon"
          className="size-11 text-pencil hover:bg-debes/10 hover:text-debes"
          aria-label={`Quitar a ${miembro.nombre}`}
          onClick={(e) => onQuitar(e.currentTarget)}
        >
          <UserMinus aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </Button>
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
  const { usuario } = useAuth();
  // A quién se quiere quitar y el botón que abrió la confirmación (para devolverle el foco)
  const [aQuitar, setAQuitar] = useState<{ miembro: Miembro; origen: HTMLElement } | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const tituloInactivos = useRef<HTMLHeadingElement>(null);
  // Al cerrar, el foco vuelve al botón "Quitar"; si la persona ya pasó a "Ya no participan",
  // el botón no existe más y el foco va al título de esa sección.
  const devolverFoco = (e: Event) => {
    const destino = aQuitar?.origen.isConnected ? aQuitar.origen : tituloInactivos.current;
    if (destino) {
      e.preventDefault();
      destino.focus();
    }
  };
  const gestiona = grupo.miRol === 'ADMIN' && !grupo.archivado;
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
      {gestiona && <AgregarMiembroForm grupoId={grupo.id} />}
      <section aria-labelledby="miembros-activos" className="grid gap-3">
        <h2 id="miembros-activos" className="sr-only">
          Participan
        </h2>
        <ul aria-labelledby="miembros-activos" className={LISTA}>
          {activos.map((m) => (
            <FilaMiembro
              key={m.id}
              miembro={m}
              esVos={m.id === usuario?.id}
              onQuitar={
                // El admin no puede quitarse ni quitar a otro admin (RN-13)
                gestiona && m.id !== usuario?.id && m.rol !== 'ADMIN'
                  ? (boton) => {
                      setAQuitar({ miembro: m, origen: boton });
                      setConfirmando(true);
                    }
                  : undefined
              }
            />
          ))}
        </ul>
      </section>
      {inactivos.length > 0 && (
        <section aria-labelledby="miembros-inactivos" className="grid gap-3">
          <h2
            ref={tituloInactivos}
            id="miembros-inactivos"
            tabIndex={-1}
            className="text-lg font-semibold outline-none"
          >
            Ya no participan
          </h2>
          <ul aria-labelledby="miembros-inactivos" className={LISTA}>
            {inactivos.map((m) => (
              <FilaMiembro key={m.id} miembro={m} esVos={m.id === usuario?.id} />
            ))}
          </ul>
        </section>
      )}
      {gestiona && (
        <QuitarMiembroDialog
          grupoId={grupo.id}
          open={confirmando}
          miembro={aQuitar?.miembro ?? null}
          onOpenChange={setConfirmando}
          onCloseAutoFocus={devolverFoco}
        />
      )}
    </div>
  );
}
