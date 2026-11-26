import { Archive, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useArchivar, useBalances, useLiquidacion } from '@/api/balances';
import { ApiError } from '@/api/client';
import type { GrupoDetalle } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { Avatar } from '@/components/Avatar';
import { Vale } from '@/components/Vale';
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
import { formatMoney, moneyToCents } from '@/lib/money';
import { cn } from '@/lib/utils';
import { PagoFormDialog, type PagoInicial } from './PagoForm';

/** Pestaña Balances (HU-19, HU-21, HU-25): quién debe, cómo saldarlo y archivar. */
export function BalancesTab({ grupo }: { grupo: GrupoDetalle }) {
  const balances = useBalances(grupo.id);
  const liquidacion = useLiquidacion(grupo.id);
  const archivar = useArchivar(grupo.id);
  const { usuario } = useAuth();
  const [pago, setPago] = useState<PagoInicial | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nombre = (u: { id: string; nombre: string }) => (u.id === usuario?.id ? 'Vos' : u.nombre);

  if (balances.isPending || liquidacion.isPending) {
    return (
      <div aria-busy="true" className="grid gap-3">
        <span className="sr-only">Cargando balances</span>
        <Skeleton className="h-40 bg-muted" />
        <Skeleton className="h-24 bg-muted" />
      </div>
    );
  }
  if (balances.isError || liquidacion.isError) {
    return (
      <ErrorCarga
        error={balances.error ?? liquidacion.error}
        que="los balances"
        onReintentar={() => void Promise.all([balances.refetch(), liquidacion.refetch()])}
      />
    );
  }

  const maximo = Math.max(1, ...balances.data.map((b) => Math.abs(moneyToCents(b.balance))));
  const alDia = liquidacion.data.length === 0;

  async function confirmarArchivo() {
    setError(null);
    try {
      await archivar.mutateAsync(undefined);
      setConfirmando(false);
      toast.success('Grupo archivado');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No pudimos archivar el grupo. Probá de nuevo.',
      );
    }
  }

  return (
    <div className="grid gap-7">
      <section aria-labelledby="titulo-balances" className="grid gap-3">
        <h2 id="titulo-balances" className="text-lg font-semibold">
          Balances
        </h2>
        <ul className="rounded-[14px] border border-rule bg-surface">
          {balances.data.map((b) => {
            const c = moneyToCents(b.balance);
            const ancho = `${(Math.abs(c) / maximo) * 50}%`;
            return (
              <li
                key={b.usuario.id}
                className="grid gap-2 border-t border-rule px-4 py-3 first:border-t-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar usuario={b.usuario} size="sm" />
                  <span className="flex-1 truncate font-semibold">{nombre(b.usuario)}</span>
                  <span
                    className={cn(
                      'text-right tabular-nums',
                      c > 0 && 'text-te-deben',
                      c < 0 && 'text-debes',
                      c === 0 && 'text-pencil',
                    )}
                  >
                    <span className="block text-xs">
                      {c > 0 ? 'Le deben' : c < 0 ? 'Debe' : 'A mano'}
                    </span>
                    <span className="font-bold">
                      {c > 0 ? '+' : c < 0 ? '−' : ''}
                      {formatMoney(Math.abs(c))}
                    </span>
                  </span>
                </div>
                {/* Barra centrada en 0: verde a la derecha, roja a la izquierda (design.md 6) */}
                <div aria-hidden="true" className="relative h-1.5 rounded-full bg-muted">
                  <span className="absolute inset-y-0 left-1/2 w-px bg-rule" />
                  {c !== 0 && (
                    <span
                      className={cn(
                        'absolute inset-y-0 rounded-full',
                        c > 0 ? 'left-1/2 bg-te-deben' : 'right-1/2 bg-debes',
                      )}
                      style={{ width: ancho }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="titulo-liquidacion" className="grid gap-3">
        <h2 id="titulo-liquidacion" className="text-lg font-semibold">
          Cómo quedan a mano
        </h2>
        {alDia ? (
          <EstadoVacio
            texto={<span className="saldado font-semibold">¡Están todos al día!</span>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {liquidacion.data.map((t) => (
              <Vale
                key={`${t.de.id}-${t.a.id}`}
                titulo={`${nombre(t.de)} → ${nombre(t.a)}`}
                montoCents={moneyToCents(t.monto)}
                {...(grupo.archivado
                  ? {}
                  : {
                      onSaldar: () => setPago({ de: t.de.id, a: t.a.id, monto: t.monto }),
                      saldarLabel: 'Registrar este pago',
                    })}
              />
            ))}
          </div>
        )}
      </section>

      {grupo.miRol === 'ADMIN' && !grupo.archivado && alDia && (
        <Button
          variant="outline"
          className="h-11 justify-self-start"
          onClick={() => setConfirmando(true)}
        >
          <Archive aria-hidden="true" /> Archivar grupo
        </Button>
      )}

      <PagoFormDialog
        grupo={grupo}
        inicial={pago}
        open={pago !== null}
        onOpenChange={(o) => !o && setPago(null)}
      />

      <AlertDialog
        open={confirmando}
        onOpenChange={(o) => !archivar.isPending && setConfirmando(o)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar «{grupo.nombre}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Queda en solo lectura: nadie va a poder cargar gastos, pagos ni miembros.
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
            <AlertDialogCancel className="h-11" disabled={archivar.isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button
              className="h-11"
              disabled={archivar.isPending}
              onClick={() => void confirmarArchivo()}
            >
              {archivar.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
              {archivar.isPending ? 'Archivando…' : 'Archivar grupo'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
