import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Placeholder del H1: la gestión de grupos llega en el H2. */
export function GruposPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Mis grupos</h1>
      <div className="grid justify-items-start gap-4 rounded-[14px] border border-dashed border-rule bg-surface p-7">
        <span className="font-firma text-3xl text-birome">tu primer grupo</span>
        <p className="max-w-[40ch] text-pencil">
          Todavía no tenés grupos. Armá uno para el viaje, el depto o el asado.
        </p>
        <Button disabled aria-describedby="grupos-pronto">
          <Plus aria-hidden="true" />
          Crear un grupo
        </Button>
        <p id="grupos-pronto" className="text-sm text-pencil">
          Disponible en la próxima versión.
        </p>
      </div>
    </div>
  );
}
