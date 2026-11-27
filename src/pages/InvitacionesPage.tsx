import { EstadoVacio } from '@/components/estados/Estados';
import { InvitacionesLista } from '@/components/grupos/InvitacionesLista';
import { useFocoTitulo } from '@/hooks/useFocoTitulo';

/** Invitaciones (HU-33): la pestaña de la barra inferior. */
export function InvitacionesPage() {
  const ref = useFocoTitulo();
  return (
    <div className="mx-auto grid max-w-[720px] gap-6">
      <h1 ref={ref} tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
        Invitaciones
      </h1>
      <InvitacionesLista
        vacio={
          <EstadoVacio texto="No tenés invitaciones. Cuando alguien te sume a un grupo por tu @usuario, aparece acá." />
        }
      />
    </div>
  );
}
