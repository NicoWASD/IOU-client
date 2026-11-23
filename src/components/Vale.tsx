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
  /** Animación de caída al aparecer. */
  caer?: boolean;
  delayMs?: number;
  /** Si está, el talón es un botón que salda la deuda (design.md 8: el corte del vale). */
  onSaldar?: () => void;
  /** Nombre accesible del botón del talón. */
  saldarLabel?: string;
  /** El vale se está cortando por el troquel (la animación protagonista). */
  cortando?: boolean;
  /** Monto un paso más chico, para vales dentro de paneles angostos. */
  compacto?: boolean;
  className?: string;
};

/** El vale troquelado de IOU: cada deuda es un papelito con el borde perforado. */
export function Vale({
  titulo,
  montoCents,
  firma,
  meta,
  caer,
  delayMs = 0,
  onSaldar,
  saldarLabel,
  cortando,
  compacto,
  className,
}: ValeProps) {
  const style: CSSProperties | undefined = caer ? { animationDelay: `${delayMs}ms` } : undefined;
  const monto = (
    <span className={cn('font-extrabold', compacto ? 'text-lg' : 'text-xl')}>
      {formatMoney(montoCents)}
    </span>
  );
  return (
    <div
      data-testid="vale"
      className={cn(
        'vale',
        compacto && 'vale--compacto',
        caer && 'vale-caer',
        cortando && 'vale-cortar',
        className,
      )}
      style={style}
    >
      <div className="vale-cuerpo">
        <span className="font-semibold">{titulo}</span>
        {meta && <span className="text-[13px] text-pencil">{meta}</span>}
        {firma && (
          <span className="font-firma text-[22px] leading-none text-birome" aria-hidden="true">
            {firma}
          </span>
        )}
      </div>
      <div className={cn('vale-talon', onSaldar && 'vale-talon--accion')}>
        {onSaldar ? (
          <button
            type="button"
            className="vale-saldar"
            onClick={onSaldar}
            disabled={cortando}
            aria-label={saldarLabel}
          >
            {monto}
            <span className="text-[13px] font-semibold text-birome">Saldar</span>
          </button>
        ) : (
          monto
        )}
      </div>
    </div>
  );
}
