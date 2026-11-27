import { CircleAlert, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { ApiError } from '@/api/client';
import { TickyTocable } from '@/components/brand/Ticky';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Cold start de Render (design.md 7.1): debajo del esqueleto, después de 3 s. */
export function AvisoColdStart() {
  return (
    <div role="status" className="grid gap-2 rounded-[14px] bg-birome-soft px-4 py-3.5">
      <p className="font-semibold">Despertando el servidor…</p>
      <p className="text-sm">La primera carga puede tardar hasta un minuto.</p>
      <div className="barra-indeterminada" aria-hidden="true" />
    </div>
  );
}

/** Contenedor de carga: `aria-busy` y el texto para lectores (design.md 9). */
export function Cargando({
  texto,
  esqueleto,
  coldStart,
  children,
  className,
}: {
  texto: string;
  esqueleto: boolean;
  coldStart: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4', className)}>
      <div aria-busy="true">
        <span className="sr-only">{texto}</span>
        {esqueleto && <div aria-hidden="true">{children}</div>}
      </div>
      {/* Fuera del contenedor ocupado, para que los lectores anuncien el aviso */}
      {coldStart && <AvisoColdStart />}
    </div>
  );
}

/** Estado vacío (design.md 7.3): un vale en blanco "firmado", una frase y una sola acción. */
export function EstadoVacio({
  firma,
  texto,
  accion,
}: {
  firma?: string;
  texto: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="grid justify-items-start gap-4 overflow-hidden rounded-[14px] border border-dashed border-rule bg-surface p-7">
      <TickyTocable pose="camina" size={44} lado="costado" />
      {firma && (
        <span className="font-firma text-3xl leading-none text-birome" aria-hidden="true">
          {firma}
        </span>
      )}
      <p className="max-w-[40ch] text-pencil">{texto}</p>
      {accion}
    </div>
  );
}

/** Error al cargar (design.md 7.5): sin conexión, con "Reintentar". */
export function ErrorCarga({
  error,
  que,
  onReintentar,
  reintentando,
}: {
  error: unknown;
  /** "tus grupos", "el grupo"... */
  que: string;
  onReintentar: () => void;
  reintentando?: boolean;
}) {
  const sinConexion = error instanceof ApiError && error.code === 'SIN_CONEXION';
  const Icono = sinConexion ? WifiOff : CircleAlert;
  return (
    <div role="alert" className="grid justify-items-start gap-3 rounded-[14px] bg-debes/10 p-5">
      <p className="flex items-center gap-2 font-semibold text-debes">
        <Icono aria-hidden="true" className="size-5" strokeWidth={1.75} />
        {sinConexion ? 'No hay conexión con el servidor' : `No pudimos cargar ${que}`}
      </p>
      <p className="text-pencil">
        {sinConexion
          ? `No pudimos cargar ${que}. Revisá tu conexión y probá de nuevo.`
          : 'Probá de nuevo en un rato.'}
      </p>
      <Button variant="outline" className="h-11" onClick={onReintentar} disabled={reintentando}>
        {reintentando ? 'Reintentando…' : 'Reintentar'}
      </Button>
    </div>
  );
}
