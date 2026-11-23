import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/money';

type ValeProps = {
  /** Texto principal, p. ej. "Tomi le debe a Sofi". */
  titulo: ReactNode;
  montoCents: number;
  /** Nombre "firmado" a mano (solo decorativo, design.md 3). */
  firma?: string;
  meta?: ReactNode;
  /** Animación de caída al aparecer (la única animación protagonista de la landing). */
  caer?: boolean;
  delayMs?: number;
  className?: string;
};

/** El vale troquelado de IOU: cada deuda es un papelito con el borde perforado. */
export function Vale({ titulo, montoCents, firma, meta, caer, delayMs = 0, className }: ValeProps) {
  const style: CSSProperties | undefined = caer ? { animationDelay: `${delayMs}ms` } : undefined;
  return (
    <div data-testid="vale" className={cn('vale', caer && 'vale-caer', className)} style={style}>
      <div className="vale-cuerpo">
        <span className="font-semibold">{titulo}</span>
        {meta && <span className="text-[13px] text-pencil">{meta}</span>}
        {firma && (
          <span className="font-firma text-[22px] leading-none text-birome" aria-hidden="true">
            {firma}
          </span>
        )}
      </div>
      <div className="vale-talon">
        <span className="text-xl font-extrabold tabular-nums">{formatMoney(montoCents)}</span>
      </div>
    </div>
  );
}
