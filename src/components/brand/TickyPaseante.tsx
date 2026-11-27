import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { alAzar, TickyTocable, type PoseTicky } from './Ticky';
import { escucharTicky } from './tickyBus';

type Borde = 'izq' | 'der' | 'abajo-izq' | 'abajo-der';
type Aparicion = {
  borde: Borde;
  y: number;
  pose: PoseTicky;
  mensaje: string | null;
  sale: boolean;
};

const TAM = 56;
const GLOBO = { ancho: 230, alto: 80 };
const BLOQUEAN =
  'input, select, textarea, button, a, [role="tab"], [role="combobox"], [role="dialog"]';

const FRASES: Partial<Record<PoseTicky, string[]>> = {
  sentado: ['Acá descanso un ratito…', 'Lindo día para no deberle nada a nadie.'],
  leyendo: ['Mmm… estas cuentas cierran.', 'Revisando los números…', '¿Quién pidió el postre?'],
  telefono: ['¿Hola? Sí, ya te paso el alias…', 'No, ma, no me olvidé de pagar.'],
  parpadea: ['¿Todo en orden por acá?', 'Psst… cuentas claras, amistades largas.'],
};
const POSES: PoseTicky[] = ['sentado', 'leyendo', 'telefono', 'saluda', 'parpadea'];

const entre = (a: number, b: number) => a + Math.random() * (b - a);
const offsetAbajo = () => (window.innerWidth < 1024 ? 84 : 16);

/** Rectángulo que ocuparían Ticky y su globo en ese borde. */
function zona(borde: Borde, y: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ancho = Math.max(TAM + 8, GLOBO.ancho);
  const top = borde.startsWith('abajo') ? vh - offsetAbajo() - TAM - GLOBO.alto : y - GLOBO.alto;
  const bottom = borde.startsWith('abajo') ? vh - offsetAbajo() : y + TAM;
  const left = borde.endsWith('izq') ? 0 : vw - ancho;
  return { top, bottom, left, right: left + ancho };
}

/** Busca un borde libre: que Ticky no tape campos, botones ni links. */
function lugarLibre(): { borde: Borde; y: number } | null {
  const vh = window.innerHeight;
  const ocupados = [...document.querySelectorAll(BLOQUEAN)]
    .filter((el) => !el.closest('[data-ticky]'))
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.bottom > 0 && r.top < vh);
  const candidatos = (
    [
      { borde: 'izq', y: entre(0.3, 0.7) * vh },
      { borde: 'der', y: entre(0.3, 0.7) * vh },
      { borde: 'abajo-izq', y: 0 },
      { borde: 'abajo-der', y: 0 },
    ] satisfies { borde: Borde; y: number }[]
  ).sort(() => Math.random() - 0.5);
  return (
    candidatos.find((c) => {
      const z = zona(c.borde, c.y);
      return (
        z.top > 72 &&
        !ocupados.some(
          (r) => r.left < z.right && r.right > z.left && r.top < z.bottom && r.bottom > z.top,
        )
      );
    }) ?? null
  );
}

/**
 * Ticky con vida propia (design.md 13): cada tanto se asoma desde un borde libre, hace algo
 * (sentarse, leer cuentas, hablar por teléfono) y se va. También aparece cuando otra pantalla
 * se lo pide (tickyDice), por ejemplo al registrar un pago. Se puede tocar.
 */
export function TickyPaseante({ pausado }: { pausado: boolean }) {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const [ap, setAp] = useState<Aparicion | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nombre = usuario?.nombre.split(' ')[0] ?? '';

  const limpiar = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const luego = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const mostrar = (a: Omit<Aparicion, 'sale'>, ms: number, alIrse: () => void) => {
    setAp({ ...a, sale: false });
    luego(() => setAp((p) => (p ? { ...p, sale: true } : p)), ms);
    luego(() => {
      setAp(null);
      alIrse();
    }, ms + 400);
  };

  // Apariciones al azar
  useEffect(() => {
    if (pausado) return;
    const programar = (ms: number) =>
      luego(() => {
        const ocupado =
          document.hidden ||
          document.querySelector('[role="dialog"], [role="alertdialog"]') ||
          document.activeElement?.matches('input, textarea, select');
        const lugar = ocupado ? null : lugarLibre();
        if (!lugar) return programar(entre(10_000, 20_000));
        const pose = alAzar(POSES);
        const frases = pose === 'saluda' ? [`¡Hola, ${nombre}!`] : (FRASES[pose] ?? []);
        const mensaje = frases.length && Math.random() < 0.7 ? alAzar(frases) : null;
        mostrar({ ...lugar, pose, mensaje }, entre(6_000, 9_000), () =>
          programar(entre(45_000, 110_000)),
        );
      }, ms);
    programar(entre(15_000, 35_000));
    return () => {
      limpiar();
      setAp(null);
    };
    // Al cambiar de pantalla se va y vuelve a programarse
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pausado, pathname]);

  // Avisos de otras pantallas: aparece enseguida abajo, festejando
  useEffect(
    () =>
      escucharTicky(({ texto, pose = 'festeja' }) => {
        limpiar();
        mostrar({ borde: 'abajo-der', y: 0, pose, mensaje: texto }, 4_500, () => {});
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (!ap) return null;
  const abajo = ap.borde.startsWith('abajo');
  const izq = ap.borde.endsWith('izq');
  const direccion = abajo ? 'abajo' : izq ? 'izq' : 'der';
  return (
    <div
      data-ticky
      className={cn(
        'fixed z-40',
        ap.sale ? `ticky-hacia-${direccion}` : `ticky-desde-${direccion}`,
        abajo && 'bottom-[calc(84px+env(safe-area-inset-bottom))] lg:bottom-4',
        abajo && (izq ? 'left-3' : 'right-3'),
        !abajo && (izq ? '-left-2' : '-right-2'),
      )}
      style={abajo ? undefined : { top: ap.y }}
    >
      <TickyTocable pose={ap.pose} size={TAM} mensaje={ap.mensaje} lado={izq ? 'izq' : 'der'} />
    </div>
  );
}
