import { Check, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { useMisInvitaciones, useResponderInvitacion, type Invitacion } from '@/api/social';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';

function Tarjeta({ inv }: { inv: Invitacion }) {
  const { aceptar, rechazar } = useResponderInvitacion();
  const navigate = useNavigate();
  const ocupado = aceptar.isPending || rechazar.isPending;
  const fallo = (err: unknown) =>
    toast.error(err instanceof ApiError ? err.message : 'No pudimos responder. Probá de nuevo.');

  return (
    <li className="pantalla-entra grid gap-3 rounded-[14px] border border-birome/40 bg-birome-soft p-4 sm:flex sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar usuario={inv.invitadoPor} />
        <p className="min-w-0">
          <span className="font-semibold">{inv.invitadoPor.nombre}</span> te invitó a{' '}
          <span className="font-semibold break-words">{inv.grupo.nombre}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          variant="outline"
          className="h-11"
          disabled={ocupado}
          onClick={() =>
            rechazar.mutate(inv.id, {
              onSuccess: () => toast('Rechazaste la invitación'),
              onError: fallo,
            })
          }
        >
          {rechazar.isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <X aria-hidden="true" />
          )}
          Rechazar
        </Button>
        <Button
          className="h-11"
          disabled={ocupado}
          onClick={() =>
            aceptar.mutate(inv.id, {
              onSuccess: ({ grupoId }) => {
                toast.success(`¡Ya sos parte de ${inv.grupo.nombre}!`);
                void navigate(`/grupos/${grupoId}`);
              },
              onError: fallo,
            })
          }
        >
          {aceptar.isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Check aria-hidden="true" />
          )}
          Aceptar
        </Button>
      </div>
    </li>
  );
}

/** Mis invitaciones pendientes (HU-33). `vacio` se muestra si no hay ninguna. */
export function InvitacionesLista({ vacio }: { vacio?: React.ReactNode }) {
  const invitaciones = useMisInvitaciones();
  const lista = invitaciones.data ?? [];
  if (lista.length === 0) return invitaciones.isPending ? null : (vacio ?? null);
  return (
    <section aria-labelledby="invitaciones-titulo" className="grid gap-3">
      <h2 id="invitaciones-titulo" className="text-lg font-semibold">
        {lista.length === 1 ? 'Tenés una invitación' : `Tenés ${lista.length} invitaciones`}
      </h2>
      <ul className="grid gap-3">
        {lista.map((inv) => (
          <Tarjeta key={inv.id} inv={inv} />
        ))}
      </ul>
    </section>
  );
}
