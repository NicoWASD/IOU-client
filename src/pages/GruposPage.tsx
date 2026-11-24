import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useGrupos } from '@/api/grupos';
import type { GrupoResumen } from '@/api/types';
import { Cargando, ErrorCarga, EstadoVacio } from '@/components/estados/Estados';
import { CrearGrupoDialog } from '@/components/grupos/CrearGrupoDialog';
import { GrupoCard, GrupoCardSkeleton } from '@/components/grupos/GrupoCard';
import { Button } from '@/components/ui/button';
import { useCargaDemorada } from '@/hooks/useCargaDemorada';
import { useFocoTitulo } from '@/hooks/useFocoTitulo';

const GRILLA = 'grid gap-3.5 md:grid-cols-2 lg:grid-cols-3';

function ListaGrupos({
  grupos,
  label,
  titulo,
}: {
  grupos: GrupoResumen[];
  label?: string;
  titulo: 'h2' | 'h3';
}) {
  return (
    <ul aria-label={label} className={GRILLA}>
      {grupos.map((g) => (
        <li key={g.id}>
          <GrupoCard grupo={g} titulo={titulo} />
        </li>
      ))}
    </ul>
  );
}

/** Mis grupos (HU-07): activos primero; los archivados, aparte. */
export function GruposPage() {
  const grupos = useGrupos();
  const carga = useCargaDemorada(grupos.isPending);
  const [creando, setCreando] = useState(false);
  const tituloRef = useFocoTitulo();

  const lista = grupos.data;
  const activos = lista?.filter((g) => !g.archivado) ?? [];
  const archivados = lista?.filter((g) => g.archivado) ?? [];
  const vacio = lista?.length === 0;

  let cuerpo;
  if (grupos.isPending || carga.esqueleto) {
    cuerpo = (
      <Cargando texto="Cargando tus grupos" esqueleto={carga.esqueleto} coldStart={carga.coldStart}>
        <div className={GRILLA}>
          {[0, 1, 2].map((i) => (
            <GrupoCardSkeleton key={i} />
          ))}
        </div>
      </Cargando>
    );
  } else if (grupos.isError) {
    cuerpo = (
      <ErrorCarga
        error={grupos.error}
        que="tus grupos"
        onReintentar={() => void grupos.refetch()}
        reintentando={grupos.isFetching}
      />
    );
  } else if (vacio) {
    cuerpo = (
      <EstadoVacio
        firma="tu primer grupo"
        texto="Todavía no tenés grupos. Armá uno para el viaje, el depto o el asado."
        accion={
          <Button className="h-11" onClick={() => setCreando(true)}>
            <Plus aria-hidden="true" />
            Crear un grupo
          </Button>
        }
      />
    );
  } else {
    cuerpo = (
      <>
        {activos.length > 0 ? (
          <section aria-labelledby="grupos-activos" className="grid gap-3">
            <h2 id="grupos-activos" className="sr-only">
              Activos
            </h2>
            <ListaGrupos grupos={activos} label="Tus grupos" titulo="h3" />
          </section>
        ) : (
          <p className="text-pencil">No tenés grupos activos.</p>
        )}
        {archivados.length > 0 && (
          <section aria-labelledby="grupos-archivados" className="grid gap-3 pt-4">
            <h2 id="grupos-archivados" className="text-2xl font-bold tracking-tight">
              Archivados
            </h2>
            <p className="-mt-1 text-sm text-pencil">Solo se pueden consultar.</p>
            <ListaGrupos grupos={archivados} titulo="h3" />
          </section>
        )}
      </>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1
          ref={tituloRef}
          tabIndex={-1}
          className="text-3xl font-bold tracking-tight outline-none"
        >
          Mis grupos
        </h1>
        {!vacio && (
          <Button className="h-11" onClick={() => setCreando(true)}>
            <Plus aria-hidden="true" />
            Crear grupo
          </Button>
        )}
      </div>
      {cuerpo}
      <CrearGrupoDialog open={creando} onOpenChange={setCreando} />
    </div>
  );
}
