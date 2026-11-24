import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { useEliminarGasto, useGasto } from '@/api/gastos';
import type { GrupoDetalle, TipoDivision } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { Avatar } from '@/components/Avatar';
import { HojaODialogo } from '@/components/HojaODialogo';
import { ErrorCarga } from '@/components/estados/Estados';
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
import { GastoFormDialog } from './GastoForm';

const TIPO_TEXTO: Record<TipoDivision, string> = {
  IGUAL: 'Partes iguales',
  MONTOS: 'Montos exactos',
  PORCENTAJE: 'Porcentajes',
};

type Props = {
  grupo: GrupoDetalle;
  gastoId: string | null;
  onClose: () => void;
};

/** Detalle de un gasto (HU-16), con editar (HU-17) y eliminar (HU-18) si se puede. */
export function GastoDetalleDialog({ grupo, gastoId, onClose }: Props) {
  const gasto = useGasto(grupo.id, gastoId);
  const { usuario } = useAuth();
  const eliminar = useEliminarGasto(grupo.id);
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmarEliminar() {
    if (!gastoId) return;
    setError(null);
    try {
      await eliminar.mutateAsync(gastoId);
      setConfirmando(false);
      onClose();
      toast.success('Gasto eliminado');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No pudimos eliminar el gasto. Probá de nuevo.',
      );
    }
  }

  const g = gasto.data;
  return (
    <>
      <HojaODialogo
        open={gastoId !== null && !editando}
        onOpenChange={(o) => !o && onClose()}
        titulo={g?.descripcion ?? 'Gasto'}
      >
        {gasto.isPending ? (
          <div aria-busy="true" className="grid gap-3">
            <span className="sr-only">Cargando el gasto</span>
            <Skeleton className="h-8 w-1/3 bg-muted" />
            <Skeleton className="h-24 bg-muted" />
          </div>
        ) : gasto.isError ? (
          <ErrorCarga
            error={gasto.error}
            que="el gasto"
            onReintentar={() => void gasto.refetch()}
            reintentando={gasto.isFetching}
          />
        ) : (
          g && (
            <div className="grid gap-5">
              <div className="grid gap-1">
                <p className="text-3xl font-semibold tabular-nums">
                  {formatMoney(moneyToCents(g.monto))}
                </p>
                <p className="text-sm text-pencil">
                  Pagó {g.pagadoPor.id === usuario?.id ? 'vos' : g.pagadoPor.nombre} ·{' '}
                  {etiquetaDia(g.fecha)} · {TIPO_TEXTO[g.tipoDivision]}
                </p>
              </div>
              <ul className="rounded-[14px] border border-rule bg-surface">
                {g.participaciones.map((p) => (
                  <li
                    key={p.usuario.id}
                    className="flex min-h-14 items-center gap-3 border-t border-rule px-4 py-2 first:border-t-0"
                  >
                    <Avatar usuario={p.usuario} size="sm" />
                    <span className="flex-1 truncate">
                      {p.usuario.id === usuario?.id
                        ? `${p.usuario.nombre} (vos)`
                        : p.usuario.nombre}
                    </span>
                    {p.porcentaje && (
                      <span className="text-sm text-pencil">
                        {p.porcentaje.replace('.', ',')} %
                      </span>
                    )}
                    <span className="font-semibold tabular-nums">
                      {formatMoney(moneyToCents(p.monto))}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-pencil">Lo cargó {g.creadoPor.nombre}.</p>
              {g.puedeEditar ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-11" onClick={() => setEditando(true)}>
                    <Pencil aria-hidden="true" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 text-debes hover:bg-debes/10 hover:text-debes"
                    onClick={() => setConfirmando(true)}
                  >
                    <Trash2 aria-hidden="true" /> Eliminar
                  </Button>
                </div>
              ) : (
                !grupo.archivado &&
                (g.creadoPor.id === usuario?.id || grupo.miRol === 'ADMIN') && (
                  <p className="text-sm text-pencil">
                    No se puede editar: alguien del gasto ya no es miembro del grupo.
                  </p>
                )
              )}
            </div>
          )
        )}
      </HojaODialogo>

      {g && <GastoFormDialog grupo={grupo} gasto={g} open={editando} onOpenChange={setEditando} />}

      <AlertDialog
        open={confirmando}
        onOpenChange={(o) => !eliminar.isPending && setConfirmando(o)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{g?.descripcion}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Los balances del grupo se recalculan. Si ya se había saldado, las deudas pueden
              cambiar.
            </AlertDialogDescription>
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
              onClick={() => void confirmarEliminar()}
            >
              {eliminar.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
              {eliminar.isPending ? 'Eliminando…' : 'Eliminar gasto'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
