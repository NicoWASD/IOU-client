import { Loader2, UserPlus } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { useAgregarMiembro } from '@/api/grupos';
import { Field } from '@/components/forms/Field';
import { Button } from '@/components/ui/button';
import { emailMiembroSchema } from '@/schemas/grupo';

/** Agregar por email (HU-10): los errores de la API van debajo del campo (design.md 7.5). */
export function AgregarMiembroForm({ grupoId }: { grupoId: string }) {
  const agregar = useAgregarMiembro(grupoId);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (agregar.isPending) return;
    const parsed = emailMiembroSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      inputRef.current?.focus();
      return;
    }
    setError(undefined);
    try {
      const miembro = await agregar.mutateAsync(parsed.data);
      setEmail('');
      toast.success(`${miembro.nombre} se sumó al grupo`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.details?.email ?? err.message)
          : 'No pudimos agregarlo. Probá de nuevo.',
      );
      inputRef.current?.focus();
    }
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start"
    >
      <Field
        ref={inputRef}
        id={`${id}-email`}
        label="Agregar por email"
        type="email"
        inputMode="email"
        autoComplete="off"
        placeholder="nombre@ejemplo.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(undefined);
        }}
        error={error}
      />
      <Button
        type="submit"
        variant="outline"
        className="h-11 sm:mt-[26px]"
        disabled={agregar.isPending}
      >
        {agregar.isPending ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <UserPlus aria-hidden="true" strokeWidth={1.75} />
        )}
        {agregar.isPending ? 'Agregando…' : 'Agregar'}
      </Button>
    </form>
  );
}
