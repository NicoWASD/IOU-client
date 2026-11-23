import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiError } from '@/api/client';
import { Field, TextareaField } from '@/components/forms/Field';
import { Button } from '@/components/ui/button';
import { fieldErrors, type FieldErrors } from '@/schemas/auth';
import { grupoSchema, type GrupoForm as Valores } from '@/schemas/grupo';

/** Solo los errores de campos que este formulario muestra; si no hay ninguno, null. */
function camposConocidos(details?: Record<string, string>): FieldErrors | null {
  const out: FieldErrors = {};
  if (details?.nombre) out.nombre = details.nombre;
  if (details?.descripcion) out.descripcion = details.descripcion;
  return Object.keys(out).length ? out : null;
}

const enfocarPrimerError = (errores: FieldErrors) =>
  document.getElementById(errores.nombre ? 'grupo-nombre' : 'grupo-descripcion')?.focus();

type Props = {
  inicial?: Valores;
  /** "Crear grupo", "Guardar cambios" */
  accion: string;
  /** "Creando grupo…", "Guardando…" */
  enviando: string;
  /** Recibe los valores ya recortados. Si tira un ApiError, se muestra en el formulario. */
  onSubmit: (valores: { nombre: string; descripcion: string }) => Promise<unknown>;
};

/** Nombre y descripción de un grupo: lo comparten Crear y Editar. */
export function GrupoForm({
  inicial = { nombre: '', descripcion: '' },
  accion,
  enviando,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<Valores>(inicial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setFormError(null);
    const invalid = fieldErrors(grupoSchema, form);
    setErrors(invalid ?? {});
    if (invalid) {
      enfocarPrimerError(invalid);
      return;
    }
    setOcupado(true);
    try {
      await onSubmit({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() });
    } catch (err) {
      const campos = err instanceof ApiError ? camposConocidos(err.details) : null;
      if (campos) {
        setErrors(campos);
        enfocarPrimerError(campos);
      } else {
        setFormError(err instanceof ApiError ? err.message : 'No pudimos guardar. Probá de nuevo.');
      }
      setOcupado(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="grid gap-4">
      {formError && (
        <p
          role="alert"
          className="rounded-[10px] bg-debes/10 px-4 py-3 text-sm font-medium text-debes"
        >
          {formError}
        </p>
      )}
      <Field
        id="grupo-nombre"
        label="Nombre"
        autoComplete="off"
        placeholder="Bariloche 2026"
        value={form.nombre}
        onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
        error={errors.nombre}
        autoFocus
      />
      <TextareaField
        id="grupo-descripcion"
        label="Descripción (opcional)"
        hint="Hasta 200 caracteres."
        rows={2}
        value={form.descripcion}
        onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
        error={errors.descripcion}
      />
      <Button type="submit" className="mt-1 h-11" disabled={ocupado}>
        {ocupado && <Loader2 aria-hidden="true" className="animate-spin" />}
        {ocupado ? enviando : accion}
      </Button>
    </form>
  );
}
