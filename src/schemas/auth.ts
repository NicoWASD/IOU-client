import { z } from 'zod';

// Espejo de las validaciones del back (IOU-backend/src/schemas/auth.schemas.ts),
// solo para avisar antes de enviar. La validación que vale es la del servidor.
const email = z
  .string()
  .trim()
  .min(1, 'Ingresá tu email.')
  .max(120, 'El email puede tener hasta 120 caracteres.')
  .pipe(z.email({ error: 'El email no es válido.' }));

/** RN-19: 3 a 20 caracteres a-z 0-9 _ . (acepta una @ adelante). */
export const usuarioSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((s) => s.replace(/^@/, ''))
  .pipe(
    z
      .string()
      .min(3, 'El usuario tiene que tener al menos 3 caracteres.')
      .max(20, 'El usuario puede tener hasta 20 caracteres.')
      .regex(/^[a-z0-9_.]+$/, 'Usá solo letras, números, punto o guion bajo.'),
  );

export const registerSchema = z.object({
  usuario: usuarioSchema,
  email,
  password: z
    .string()
    .min(8, 'La contraseña tiene que tener al menos 8 caracteres.')
    .max(72, 'La contraseña puede tener hasta 72 caracteres.'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresá tu contraseña.'),
});

export type FieldErrors = Record<string, string>;

/** Primer error de cada campo, o null si el formulario es válido. */
export function fieldErrors(schema: z.ZodType, data: unknown): FieldErrors | null {
  const parsed = schema.safeParse(data);
  if (parsed.success) return null;
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const campo = String(issue.path[0] ?? '_');
    errors[campo] ??= issue.message;
  }
  return errors;
}
