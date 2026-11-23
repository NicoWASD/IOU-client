import { z } from 'zod';

// Espejo de las validaciones del back (IOU-backend/src/schemas/auth.schemas.ts),
// solo para avisar antes de enviar. La validación que vale es la del servidor.
const email = z
  .string()
  .trim()
  .min(1, 'Ingresá tu email.')
  .max(120, 'El email puede tener hasta 120 caracteres.')
  .pipe(z.email({ error: 'El email no es válido.' }));

export const registerSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'Ingresá tu nombre.')
    .max(80, 'El nombre puede tener hasta 80 caracteres.'),
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
