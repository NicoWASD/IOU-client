import { z } from 'zod';

// Espejo de la validación del back (contrato H2), solo para avisar antes de enviar.
export const MENSAJE_NOMBRE = 'Poné un nombre de hasta 60 caracteres';
export const MENSAJE_DESCRIPCION = 'La descripción puede tener hasta 200 caracteres';

export const grupoSchema = z.object({
  nombre: z.string().trim().min(1, MENSAJE_NOMBRE).max(60, MENSAJE_NOMBRE),
  descripcion: z.string().trim().max(200, MENSAJE_DESCRIPCION),
});

export type GrupoForm = z.input<typeof grupoSchema>;

/** Email de la persona a agregar (reglas del H1; el back también lo normaliza). */
export const emailMiembroSchema = z
  .string()
  .trim()
  .min(1, 'Ingresá el email de la persona')
  .max(120, 'El email puede tener hasta 120 caracteres')
  .pipe(z.email({ error: 'El email no es válido' }));
