import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useCrearGrupo } from '@/api/grupos';
import { HojaODialogo } from '@/components/HojaODialogo';
import { GrupoForm } from './GrupoForm';

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

/** Crear grupo (HU-06): al crear, abre el detalle y avisa "Grupo creado". */
export function CrearGrupoDialog({ open, onOpenChange }: Props) {
  const crear = useCrearGrupo();
  const navigate = useNavigate();

  return (
    <HojaODialogo open={open} onOpenChange={onOpenChange} titulo="Crear grupo">
      <GrupoForm
        accion="Crear grupo"
        enviando="Creando grupo…"
        onSubmit={async ({ nombre, descripcion }) => {
          const grupo = await crear.mutateAsync(descripcion ? { nombre, descripcion } : { nombre });
          onOpenChange(false);
          toast.success('Grupo creado');
          await navigate(`/grupos/${grupo.id}`);
        }}
      />
    </HojaODialogo>
  );
}
