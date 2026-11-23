import { z } from 'zod';

// Espejo de la validación del back (contrato H2), solo para avisar antes de enviar.
export const MENSAJE_NOMBRE = 'Poné un nombre de hasta 60 caracteres';
export const MENSAJE_DESCRIPCION = 'Usá hasta 200 caracteres en la descripción';

export const grupoSchema = z.object({
  nombre: z.string().trim().min(1, MENSAJE_NOMBRE).max(60, MENSAJE_NOMBRE),
  descripcion: z.string().trim().max(200, MENSAJE_DESCRIPCION),
});

export type GrupoForm = z.input<typeof grupoSchema>;
