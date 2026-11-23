import { CircleAlert } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Comunes = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

const describedByDe = ({ id, error, hint }: Comunes) =>
  [hint && !error && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

function Marco({ id, label, error, hint, children }: Comunes & { children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-pencil">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm text-debes">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 flex-none" strokeWidth={1.75} />
          {error}
        </p>
      )}
    </div>
  );
}

type FieldProps = ComponentProps<typeof Input> & Comunes;

/** Campo con label siempre visible y error enlazado por aria-describedby (design.md 9). */
export function Field({ id, label, error, hint, className, ...inputProps }: FieldProps) {
  return (
    <Marco id={id} label={label} error={error} hint={hint}>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByDe({ id, label, error, hint })}
        className={className ?? 'h-11'}
        {...inputProps}
      />
    </Marco>
  );
}

type TextareaFieldProps = ComponentProps<typeof Textarea> & Comunes;

export function TextareaField({ id, label, error, hint, ...props }: TextareaFieldProps) {
  return (
    <Marco id={id} label={label} error={error} hint={hint}>
      <Textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByDe({ id, label, error, hint })}
        className="min-h-20"
        {...props}
      />
    </Marco>
  );
}
