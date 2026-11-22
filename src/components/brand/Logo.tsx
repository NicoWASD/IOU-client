import { useId } from 'react';
import { cn } from '@/lib/utils';

// Construcción: docs/design.md, sección 12 (el vale cortado).
const GLYPHS =
  'M0 0H30V120H0ZM48 60a60 60 0 1 0 120 0a60 60 0 1 0-120 0ZM78 60a30 30 0 1 0 60 0a30 30 0 1 0-60 0ZM186 0H216V66A24 24 0 0 0 264 66V0H294V66A54 54 0 0 1 186 66Z';

type LogoProps = { className?: string; title?: string };

export function Logo({ className, title = 'IOU' }: LogoProps) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 302 120"
      role="img"
      aria-label={title}
      className={cn('h-6 w-auto', className)}
    >
      <defs>
        <clipPath id={`${id}t`}>
          <rect x="-20" y="-20" width="342" height="78" />
        </clipPath>
        <clipPath id={`${id}b`}>
          <rect x="-20" y="62" width="342" height="120" />
        </clipPath>
      </defs>
      <path clipPath={`url(#${id}t)`} fill="var(--graphite)" fillRule="evenodd" d={GLYPHS} />
      <g transform="translate(8 0)">
        <path clipPath={`url(#${id}b)`} fill="var(--birome)" fillRule="evenodd" d={GLYPHS} />
      </g>
    </svg>
  );
}
