import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  miembro: Miembro | null;
  /** El botón que abrió el diálogo. */
  origen: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * Quitar del grupo (HU-11, design.md 7.6): confirmación con el verbo repetido en `debes`.
 * Si la API lo rechaza (SALDO_PENDIENTE, ADMIN_NO_PUEDE_SALIR), el mensaje queda en el diálogo.
 */
export function QuitarMiembroDialog({ grupoId, miembro, origen, onOpenChange }: Props) {
  const quitar = useQuitarMiembro(grupoId);
  const [error, setError] = useState<string | null>(null);

  // Diálogo controlado: al cerrar, el foco vuelve al botón "Quitar" si sigue en pantalla;
  // si la persona pasó a "Ya no participan", al título de esa sección.
  // Al cerrar, `origen` ya viene en null: se guarda el último.
  const ultimoOrigen = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (origen) ultimoOrigen.current = origen;
  }, [origen]);
  const devolverFoco = (e: Event) => {
    const previo = ultimoOrigen.current;
    const destino = previo?.isConnected ? previo : document.getElementById('miembros-inactivos');
    if (destino) {
      e.preventDefault();
      destino.focus();
    }
  };

  const cambiar = (open: boolean) => {
    if (quitar.isPending) return;
    if (!open) setError(null);
    onOpenChange(open);
  };

  async function confirmar() {
    if (!miembro) return;
    setError(null);
    try {
      await quitar.mutateAsync(miembro.id);
      onOpenChange(false);
      toast.success(`${miembro.nombre} ya no participa del grupo`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos quitarlo. Probá de nuevo.');
    }
  }

  return (
    <AlertDialog open={miembro !== null} onOpenChange={cambiar}>
      <AlertDialogContent onCloseAutoFocus={devolverFoco}>
        {miembro && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Quitar a {miembro.nombre} del grupo?</AlertDialogTitle>
              <AlertDialogDescription>
                Va a dejar de ver el grupo. Si más adelante vuelve, lo podés agregar de nuevo por
                email.
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
