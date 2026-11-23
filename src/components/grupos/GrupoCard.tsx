import { Link } from 'react-router';
import type { GrupoResumen, Money } from '@/api/types';
import { AvatarPila } from '@/components/Avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, moneyToCents } from '@/lib/money';
import { cn } from '@/lib/utils';

/** Mi balance en el grupo: verde/rojo siempre con texto y signo (design.md 2). */
export function MiBalance({ balance }: { balance: Money }) {
  const cents = moneyToCents(balance);
  if (cents === 0) return <span className="saldado text-lg font-extrabold">Están a mano</span>;
  const meDeben = cents > 0;
  const monto = formatMoney(Math.abs(cents));
  return (
    <span
      className="grid justify-items-end"
      aria-label={`${meDeben ? 'Te deben' : 'Debés'} ${monto}`}
    >
      <span className="text-sm text-pencil">{meDeben ? 'Te deben' : 'Debés'}</span>
      <span
        className={cn(
          'text-[22px] leading-tight font-extrabold tabular-nums',
          meDeben ? 'text-te-deben' : 'text-debes',
        )}
      >
        {meDeben ? '+' : '−'}
        {monto}
      </span>
    </span>
  );
}

const cantidad = (n: number) => (n === 1 ? '1 miembro' : `${n} miembros`);

type Props = { grupo: GrupoResumen; titulo?: 'h2' | 'h3' };

export function GrupoCard({ grupo, titulo: Titulo = 'h2' }: Props) {
  return (
    <Link
      to={`/grupos/${grupo.id}`}
      className={cn(
        'grid h-full gap-4 rounded-[14px] border border-rule bg-surface p-[18px] transition-colors',
        'hover:border-[color-mix(in_srgb,var(--birome)_40%,var(--rule))]',
      )}
    >
      <div className="grid min-w-0 gap-1">
        <Titulo className="truncate text-lg font-semibold">{grupo.nombre}</Titulo>
        {grupo.descripcion && <p className="truncate text-sm text-pencil">{grupo.descripcion}</p>}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-1.5">
          <AvatarPila usuarios={grupo.miembros} />
          <span className="text-sm text-pencil">{cantidad(grupo.miembros.length)}</span>
        </div>
        <MiBalance balance={grupo.miBalance} />
      </div>
    </Link>
  );
}

/** Esqueleto con la misma forma que la tarjeta (design.md 7.1). */
export function GrupoCardSkeleton() {
  return (
    <div className="grid gap-4 rounded-[14px] border border-rule bg-surface p-[18px]">
      <Skeleton className="h-[18px] w-3/5 bg-muted" />
      <div className="flex items-end justify-between">
        <div className="grid gap-1.5">
          <div className="flex">
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                className="-ml-2 size-7 rounded-full border-2 border-surface bg-muted first:ml-0"
              />
            ))}
          </div>
          <Skeleton className="h-3.5 w-20 bg-muted" />
        </div>
        <Skeleton className="h-6 w-24 bg-muted" />
      </div>
    </div>
  );
}
