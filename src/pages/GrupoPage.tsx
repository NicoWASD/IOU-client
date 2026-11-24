import { Archive, Pencil } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '@/api/client';
import { useGrupo } from '@/api/grupos';
import type { GrupoDetalle } from '@/api/types';
import { AvatarPila } from '@/components/Avatar';
import { Cargando, ErrorCarga } from '@/components/estados/Estados';
import { EditarGrupoDialog } from '@/components/grupos/EditarGrupoDialog';
import { GrupoTabs } from '@/components/grupos/GrupoTabs';
import { MiembrosTab } from '@/components/grupos/MiembrosTab';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCargaDemorada } from '@/hooks/useCargaDemorada';
import { useFocoTitulo } from '@/hooks/useFocoTitulo';

const cantidad = (n: number) => (n === 1 ? '1 miembro' : `${n} miembros`);

/** 404 (no existe o no soy miembro, RN-16) y 400 (id mal formado) se ven igual. */
const noEncontrado = (err: unknown) =>
  err instanceof ApiError && (err.status === 404 || err.status === 400);

/** Columna central de 720 px y panel lateral fijo en desktop (design.md 5). */
function Layout({ children, panel }: { children: React.ReactNode; panel?: React.ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,720px)_240px]">
      <div className="grid max-w-[720px] min-w-0 content-start gap-6">{children}</div>
      {panel}
    </div>
  );
}

function PanelCuentas() {
  return (
    <aside
      aria-labelledby="panel-cuentas"
      className="hidden content-start gap-3 self-start border-l border-rule pl-6 lg:sticky lg:top-24 lg:grid"
    >
      <h2 id="panel-cuentas" className="text-lg font-semibold">
        Cómo están las cuentas
      </h2>
      <p className="text-pencil">Disponible cuando cargues gastos.</p>
    </aside>
  );
}

function NoEncontrado() {
  const ref = useFocoTitulo();
  return (
    <div className="grid justify-items-start gap-4 py-8">
      <h1 ref={ref} tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
        Este grupo no existe o no sos parte
      </h1>
      <p className="max-w-prose text-pencil">
        Puede que te hayan quitado o que el link esté mal. Tus grupos siguen en su lugar.
      </p>
      <Button asChild className="h-11">
        <Link to="/grupos">Ir a mis grupos</Link>
      </Button>
    </div>
  );
}

function EsqueletoGrupo() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Skeleton className="h-9 w-64 max-w-full bg-muted" />
        <div className="flex items-center gap-2.5">
          <div className="flex">
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                className="-ml-2 size-7 rounded-full border-2 border-paper bg-muted first:ml-0"
              />
            ))}
          </div>
          <Skeleton className="h-3.5 w-20 bg-muted" />
        </div>
      </div>
      <Skeleton className="h-12 w-full max-w-[400px] rounded-[12px] bg-muted" />
      <Skeleton className="h-48 rounded-[14px] bg-muted" />
    </div>
  );
}

function Encabezado({ grupo }: { grupo: GrupoDetalle }) {
  const ref = useFocoTitulo(grupo.id);
  const [editando, setEditando] = useState(false);
  const activos = grupo.miembros.filter((m) => m.activo);
  const puedeEditar = grupo.miRol === 'ADMIN' && !grupo.archivado;

  return (
    <header className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h1
            ref={ref}
            tabIndex={-1}
            className="text-3xl font-bold tracking-tight break-words outline-none"
          >
            {grupo.nombre}
          </h1>
          {grupo.descripcion && <p className="max-w-prose text-pencil">{grupo.descripcion}</p>}
        </div>
        {puedeEditar && (
          <Button variant="outline" className="h-11" onClick={() => setEditando(true)}>
            <Pencil aria-hidden="true" strokeWidth={1.75} />
            Editar grupo
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <AvatarPila usuarios={activos} fondo="paper" />
        <span className="text-sm text-pencil">{cantidad(activos.length)}</span>
      </div>
      {grupo.archivado && (
        <p className="flex items-center gap-2 justify-self-start rounded-[10px] bg-birome-soft px-3 py-2 text-sm font-medium">
          <Archive aria-hidden="true" className="size-4" strokeWidth={1.75} />
          El grupo está archivado: solo se puede consultar
        </p>
      )}
      {puedeEditar && (
        <EditarGrupoDialog grupo={grupo} open={editando} onOpenChange={setEditando} />
      )}
    </header>
  );
}

/** Detalle del grupo (HU-08). */
export function GrupoPage() {
  const { id = '' } = useParams();
  const grupo = useGrupo(id);
  const carga = useCargaDemorada(grupo.isPending);
  const queryClient = useQueryClient();
  const sinAcceso = grupo.isError && noEncontrado(grupo.error);

  // Si me quitaron del grupo (404) no se muestra lo que quedó en caché (RN-16): se descarta.
  useEffect(() => {
    if (sinAcceso) queryClient.removeQueries({ queryKey: ['grupos', id] });
  }, [sinAcceso, queryClient, id]);

  if (grupo.isPending || carga.esqueleto) {
    return (
      <Layout panel={<PanelCuentas />}>
        <Cargando texto="Cargando el grupo" esqueleto={carga.esqueleto} coldStart={carga.coldStart}>
          <EsqueletoGrupo />
        </Cargando>
      </Layout>
    );
  }
  if (sinAcceso) return <NoEncontrado />;
  // Un refetch fallido por red o 5xx con datos ya cargados no tapa la pantalla.
  if (grupo.isError && !grupo.data) {
    return (
      <ErrorCarga
        error={grupo.error}
        que="el grupo"
        onReintentar={() => void grupo.refetch()}
        reintentando={grupo.isFetching}
      />
    );
  }

  return (
    <Layout panel={<PanelCuentas />}>
      <Encabezado grupo={grupo.data} />
      <GrupoTabs nombre={grupo.data.nombre} miembros={<MiembrosTab grupo={grupo.data} />} />
    </Layout>
  );
}
