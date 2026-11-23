import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

/** Campo con label siempre visible y error enlazado por aria-describedby (design.md 9). */
export function Field({ id, label, error, hint, ...inputProps }: FieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="h-11"
        {...inputProps}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-pencil">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-debes">
          {error}
        </p>
      )}
    </div>
  );
}
