import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { useQuitarMiembro } from '@/api/grupos';
import type { Miembro } from '@/api/types';
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

type Props = {
  grupoId: string;
  open: boolean;
  /** Se mantiene después de cerrar, para que el contenido no se vacíe mientras sale. */
  miembro: Miembro | null;
  onOpenChange: (open: boolean) => void;
  /** A dónde va el foco al cerrar: el botón que lo abrió o, si ya no está, otro destino. */
  onCloseAutoFocus: (e: Event) => void;
};

/**
 * Quitar del grupo (HU-11, design.md 7.6): confirmación con el verbo repetido en `debes`.
 * Si la API lo rechaza (SALDO_PENDIENTE, ADMIN_NO_PUEDE_SALIR), el mensaje queda en el diálogo.
 */
export function QuitarMiembroDialog({
  grupoId,
  open,
  miembro,
  onOpenChange,
  onCloseAutoFocus,
}: Props) {
  const quitar = useQuitarMiembro(grupoId);
  const [error, setError] = useState<string | null>(null);

  const cambiar = (abierto: boolean) => {
    if (quitar.isPending) return;
    if (!abierto) setError(null);
    onOpenChange(abierto);
  };

  async function confirmar() {
    if (!miembro) return;
    setError(null);
    try {
      await quitar.mutateAsync(miembro.id);
      onOpenChange(false);
      toast.success(`Quitaste a ${miembro.nombre} del grupo`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : `No pudimos quitar a ${miembro.nombre}. Probá de nuevo.`,
      );
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={cambiar}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        {miembro && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Quitar a {miembro.nombre} del grupo?</AlertDialogTitle>
              <AlertDialogDescription>
                Va a dejar de ver el grupo. Si más adelante vuelve, podés sumar a {miembro.nombre}{' '}
                de nuevo por email.
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
              <AlertDialogCancel className="h-11" disabled={quitar.isPending}>
                Cancelar
              </AlertDialogCancel>
              {/* Botón común (no AlertDialogAction): el diálogo queda abierto hasta que responde la API */}
              <Button
                variant="destructive"
                className="h-11"
                disabled={quitar.isPending}
                onClick={() => void confirmar()}
              >
                {quitar.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
                {quitar.isPending ? 'Quitando…' : 'Quitar del grupo'}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
