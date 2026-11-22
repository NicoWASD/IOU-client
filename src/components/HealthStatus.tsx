import { useEffect, useState } from 'react';
import { useHealth } from '@/api/health';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SLOW_AFTER_MS = 3000;

export function HealthStatus() {
  const { data, isPending, isError } = useHealth();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!isPending) return;
    const t = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [isPending]);

  if (isPending) {
    return (
      <div role="status" aria-busy="true" className="grid gap-3">
        <Skeleton className="h-5 w-40 bg-muted" />
        <p className="font-semibold">Despertando el servidor…</p>
        {slow && (
          <p className="text-sm text-pencil">
            La primera carga del día puede tardar hasta un minuto.
          </p>
        )}
      </div>
    );
  }

  const apiOk = !isError;
  const dbOk = data?.db === 'ok';
  const text = !apiOk
    ? 'API: sin conexión'
    : dbOk
      ? 'API: ok · DB: ok'
      : 'API: ok · DB: sin conexión';

  return (
    <p role="status" className="flex items-center gap-2 font-semibold">
      <span
        aria-hidden="true"
        className={cn('size-2.5 rounded-full', apiOk && dbOk ? 'bg-te-deben' : 'bg-debes')}
      />
      {text}
    </p>
  );
}
