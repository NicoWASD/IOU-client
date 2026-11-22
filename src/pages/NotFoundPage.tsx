import { Link } from 'react-router';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="grid justify-items-start gap-4">
        <Logo className="h-8" />
        <h1 className="text-3xl font-bold tracking-tight">Esta página no existe</h1>
        <p className="text-pencil">Revisá la dirección o volvé al inicio.</p>
        <Button asChild>
          <Link to="/">Ir al inicio</Link>
        </Button>
      </div>
    </main>
  );
}
