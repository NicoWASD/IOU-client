import { toast } from 'sonner';
import { useEditarGrupo } from '@/api/grupos';
import type { GrupoDetalle } from '@/api/types';
import { HojaODialogo } from '@/components/HojaODialogo';
import { GrupoForm } from './GrupoForm';

type Props = { grupo: GrupoDetalle; open: boolean; onOpenChange: (open: boolean) => void };

/** Editar grupo (HU-09): solo el admin y con el grupo activo. */
export function EditarGrupoDialog({ grupo, open, onOpenChange }: Props) {
  const editar = useEditarGrupo(grupo.id);

  return (
    <HojaODialogo
      open={open}
      onOpenChange={onOpenChange}
      titulo="Editar grupo"
      bloqueado={editar.isPending}
    >
      <GrupoForm
        inicial={{ nombre: grupo.nombre, descripcion: grupo.descripcion ?? '' }}
        accion="Guardar cambios"
        enviando="Guardando…"
        onSubmit={async (valores) => {
          // La descripción vacía se manda como "": el back la guarda como null (contrato H2).
          await editar.mutateAsync(valores);
          onOpenChange(false);
          toast.success('Grupo actualizado');
        }}
      />
    </HojaODialogo>
  );
}
