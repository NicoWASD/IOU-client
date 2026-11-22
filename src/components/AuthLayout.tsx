import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Logo } from '@/components/brand/Logo';

/** Una columna de 400 px con el logo (design.md, sección 6). */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex h-16 max-w-5xl items-center px-4">
        <Link to="/" aria-label="IOU, inicio">
          <Logo className="h-6" />
        </Link>
      </header>
      <main className="grid place-items-center px-4 py-10 sm:py-16">
        <div className="grid w-full max-w-[400px] gap-6">{children}</div>
      </main>
    </div>
  );
}
