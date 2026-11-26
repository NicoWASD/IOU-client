import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useEliminarPago, usePagos } from '@/api/balances';
import { ApiError } from '@/api/client';
import type { GrupoDetalle, Pago } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { ErrorCarga, EstadoVacio } from '@/components/estados/Estados';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { etiquetaDia } from '@/lib/fechas';
import { formatMoney, moneyToCents } from '@/lib/money';
import { PagoFormDialog } from './PagoForm';

/** Pestaña Pagos (HU-23, HU-24): historial, registrar y eliminar. */
export function PagosTab({ grupo }: { grupo: GrupoDetalle }) {
  const pagos = usePagos(grupo.id);
  const eliminar = useEliminarPago(grupo.id);
  const { usuario } = useAuth();
  const [nuevo, setNuevo] = useState(false);
  const [aBorrar, setABorrar] = useState<Pago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nombre = (u: { id: string; nombre: string }) => (u.id === usuario?.id ? 'Vos' : u.nombre);

  async function confirmar() {
    if (!aBorrar) return;
    setError(null);
    try {
      await eliminar.mutateAsync(aBorrar.id);
      setABorrar(null);
      toast.success('Pago eliminado');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No pudimos eliminar el pago. Probá de nuevo.',
      );
    }
  }

  const boton = !grupo.archivado && (
    <Button className="h-11" onClick={() => setNuevo(true)}>
      <Plus aria-hidden="true" /> Registrar un pago
    </Button>
  );

  let contenido;
  if (pagos.isPending) {
    contenido = (
      <div aria-busy="true">
        <span className="sr-only">Cargando pagos</span>
        <Skeleton className="h-32 bg-muted" />
      </div>
    );
  } else if (pagos.isError) {
    contenido = (
      <ErrorCarga
        error={pagos.error}
        que="los pagos"
        onReintentar={() => void pagos.refetch()}
        reintentando={pagos.isFetching}
      />
    );
  } else if (pagos.data.length === 0) {
    contenido = (
      <EstadoVacio texto="Cuando alguien salde una deuda, va a aparecer acá." accion={boton} />
    );
  } else {
    contenido = (
      <div className="grid gap-4">
        {boton && <div className="justify-self-start">{boton}</div>}
        <ul className="rounded-[14px] border border-rule bg-surface">
          {pagos.data.map((p) => (
            <li
              key={p.id}
              className="flex min-h-16 items-center gap-3 border-t border-rule px-4 py-3 first:border-t-0"
            >
              <span className="grid min-w-0 flex-1">
                <span className="truncate font-semibold">
                  {nombre(p.de)} → {nombre(p.a)}
                </span>
                <span className="text-sm text-pencil">{etiquetaDia(p.fecha)}</span>
              </span>
              <span className="font-semibold tabular-nums">
                {formatMoney(moneyToCents(p.monto))}
              </span>
              {p.puedeEliminar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 text-pencil hover:bg-debes/10 hover:text-debes"
                  aria-label={`Eliminar el pago de ${p.de.nombre} a ${p.a.nombre}`}
                  onClick={() => setABorrar(p)}
                >
                  <Trash2 aria-hidden="true" className="size-5" strokeWidth={1.75} />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      {contenido}
      <PagoFormDialog grupo={grupo} inicial={null} open={nuevo} onOpenChange={setNuevo} />
      <AlertDialog
        open={aBorrar !== null}
        onOpenChange={(o) => !o && !eliminar.isPending && setABorrar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este pago?</AlertDialogTitle>
            <AlertDialogDescription>Los balances del grupo se recalculan.</AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p
              role="alert"
              className="rounded-[10px] bg-debes/10 px-4 py-3 text-sm font-medium text-debes"
            >
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11" disabled={eliminar.isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="h-11"
              disabled={eliminar.isPending}
              onClick={() => void confirmar()}
            >
              {eliminar.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
              {eliminar.isPending ? 'Eliminando…' : 'Eliminar pago'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
