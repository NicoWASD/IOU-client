import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';
import { useActualizarPerfil } from '@/api/social';
import { TickyTocable } from '@/components/brand/Ticky';
import { Button } from '@/components/ui/button';
import { PASOS, RUTA_GRUPO } from './pasos';

const CLAVE = 'iou.tour';
const GUTTER = 16;
const ANCHO = 320;

function pasoGuardado() {
  try {
    const n = Number(sessionStorage.getItem(CLAVE));
    return Number.isInteger(n) && n >= 0 && n < PASOS.length ? n : 0;
  } catch {
    return 0;
  }
}
function guardarPaso(n: number | null) {
  try {
    if (n === null) sessionStorage.removeItem(CLAVE);
    else sessionStorage.setItem(CLAVE, String(n));
  } catch {
    // Sin almacenamiento: al recargar, la guía arranca de nuevo
  }
}

/** Sigue la posición del objetivo en cada cuadro (scroll, diálogos que se animan, resize). */
function useRectDe(selector: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    let id = 0;
    let previo = '';
    const medir = () => {
      const el = document.querySelector(selector);
      const r = el?.getBoundingClientRect() ?? null;
      const clave = r && r.width > 0 ? `${r.x},${r.y},${r.width},${r.height}` : '';
      if (clave !== previo) {
        previo = clave;
        setRect(clave ? r : null);
      }
      id = requestAnimationFrame(medir);
    };
    medir();
    return () => cancelAnimationFrame(id);
  }, [selector]);
  return rect;
}

/**
 * Guía de primer uso (HU-38): Ticky se asoma desde el borde, se presenta y después camina hasta
 * cada botón que hay que tocar (el resto se oscurece). El usuario toca los botones reales; la guía
 * escucha y avanza. Siempre se puede saltear.
 */
export function Tour() {
  const [paso, setPaso] = useState(pasoGuardado);
  const [cerrado, setCerrado] = useState(false);
  const { pathname } = useLocation();
  const actualizar = useActualizarPerfil();
  const actual = PASOS[paso];
  const rect = useRectDe(actual?.objetivo ?? '');
  // Al cambiar de paso, Ticky camina hasta el botón nuevo
  const [moviendo, setMoviendo] = useState(false);
  useEffect(() => {
    if (paso === 0) return;
    setMoviendo(true);
    const t = setTimeout(() => setMoviendo(false), 700);
    return () => clearTimeout(t);
  }, [paso]);

  const ir = (n: number) => {
    setPaso(n);
    guardarPaso(n);
  };
  const terminar = () => {
    setCerrado(true);
    guardarPaso(null);
    actualizar.mutate({ tutorialVisto: true });
  };

  // Avanza al tocar o escribir en el objetivo real
  useEffect(() => {
    const objetivo = actual?.objetivo;
    if (!objetivo || (actual.avanzaCon !== 'click' && actual.avanzaCon !== 'input')) return;
    const tipo = actual.avanzaCon;
    const handler = (e: Event) => {
      const el = e.target instanceof Element ? e.target.closest(objetivo) : null;
      if (!el) return;
      if (tipo === 'input' && !(el instanceof HTMLInputElement && el.value.trim())) return;
      ir(paso + 1);
    };
    document.addEventListener(tipo, handler, true);
    return () => document.removeEventListener(tipo, handler, true);
  }, [actual, paso]);

  // Paso 3 → 4: el grupo se creó y la app navegó a su detalle
  useEffect(() => {
    if (actual?.avanzaCon === 'ruta' && RUTA_GRUPO.test(pathname)) ir(paso + 1);
  }, [actual, paso, pathname]);

  if (cerrado || !actual) return null;

  const pie = (accion: ReactNode) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-pencil">
        {paso === 0 ? 'Guía rápida' : `Paso ${paso} de ${PASOS.length - 1}`}
      </span>
      {accion}
    </div>
  );
  const saltar = (
    <Button variant="ghost" className="h-10 text-pencil" onClick={terminar}>
      Saltar guía
    </Button>
  );

  // Presentación: Ticky entra desde el borde derecho y saluda
  if (!actual.objetivo)
    return createPortal(
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-texto"
        className="ticky-desde-der fixed right-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[61] grid justify-items-end gap-2 lg:bottom-6"
        style={{ width: Math.min(ANCHO, window.innerWidth - GUTTER * 2) }}
      >
        <TickyTocable pose="saluda" size={72} lado="der" className="ticky-tour mr-2" />
        <div className="grid w-full gap-3 rounded-[14px] border border-rule bg-surface p-4 shadow-xl">
          <p id="tour-texto" aria-live="polite" className="text-sm leading-relaxed">
            {actual.texto}
          </p>
          {pie(
            <div className="flex gap-1">
              {saltar}
              <Button className="h-10" onClick={() => ir(paso + 1)}>
                ¡Dale!
              </Button>
            </div>,
          )}
        </div>
      </div>,
      document.body,
    );

  if (!rect) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ancho = Math.min(ANCHO, vw - GUTTER * 2);
  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - ancho / 2, GUTTER),
    vw - ancho - GUTTER,
  );
  const abajo = actual.arriba ? rect.top < 200 : rect.top < vh / 2;
  const pad = 6;

  return createPortal(
    <>
      {/* El recorte: una sombra enorme alrededor del objetivo. No intercepta clics. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-[60] rounded-[12px] ring-2 ring-[#9F67FA] transition-all duration-200 motion-reduce:transition-none"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: '0 0 0 9999px rgb(15 12 30 / 0.55)',
        }}
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-texto"
        className="fixed z-[61] grid gap-3 rounded-[14px] border border-rule bg-surface p-4 shadow-xl transition-[left,top,bottom] duration-500 ease-out motion-reduce:transition-none"
        style={{
          left,
          width: ancho,
          pointerEvents: 'auto',
          ...(abajo ? { top: rect.bottom + pad + 12 } : { bottom: vh - rect.top + pad + 12 }),
        }}
      >
        <div
          className={`ticky-tour absolute right-3 ${abajo ? 'top-full mt-1' : 'bottom-full mb-1'}`}
        >
          <TickyTocable
            pose={moviendo ? 'camina' : actual.avanzaCon === 'fin' ? 'festeja' : 'parpadea'}
            size={48}
            lado="der"
          />
        </div>
        <p id="tour-texto" aria-live="polite" className="text-sm leading-relaxed">
          {actual.texto}
        </p>
        {pie(
          actual.avanzaCon === 'fin' ? (
            <Button className="h-10" onClick={terminar}>
              Terminar
            </Button>
          ) : (
            saltar
          ),
        )}
      </div>
    </>,
    document.body,
  );
}
