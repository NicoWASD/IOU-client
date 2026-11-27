import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type PoseTicky =
  | 'quieto'
  | 'parpadea'
  | 'camina'
  | 'festeja'
  | 'saluda'
  | 'sentado'
  | 'leyendo'
  | 'telefono'
  | 'cosquillas';

const CUERPO = '#7C3AED';
const SOMBRA = '#6D28D9';
const OJO = '#1E1B4B';
const BOCA = '#4C1D95';
const RENGLON = '#DDD6FE';

/** Frases cuando lo tocan (HU-38): como si lo pellizcaras o le hicieras cosquillas. */
export const FRASES_TOQUE = [
  '¡Jiji, cosquillas!',
  '¡Ay! ¡Eso pincha!',
  '¡Ey, que soy de papel!',
  '¡No me arrugues!',
  '¡Jaja, pará, pará!',
  '¡Me vas a borrar la tinta!',
];

export const alAzar = <T,>(lista: readonly T[]): T =>
  lista[Math.floor(Math.random() * lista.length)]!;

/**
 * Ticky, la mascota de IOU (design.md 13): un ticket pixelado en grilla de 8 px, con dientes abajo.
 * Decorativo: siempre aria-hidden. Las poses son CSS (index.css) y respetan reduced-motion.
 */
export function Ticky({
  pose = 'parpadea',
  size = 64,
  className,
}: {
  pose?: PoseTicky;
  size?: number;
  className?: string;
}) {
  const brazosArriba = pose === 'festeja' || pose === 'cosquillas';
  const ojosAbajo = pose === 'leyendo';
  return (
    <svg
      viewBox="-16 -8 96 88"
      width={size}
      height={(size * 88) / 96}
      aria-hidden="true"
      shapeRendering="crispEdges"
      className={cn('ticky flex-none overflow-visible', `ticky-${pose}`, className)}
    >
      <g className="ticky-cuerpo">
        {/* Patitas al costado (sentado) */}
        {pose === 'sentado' && (
          <>
            <rect x="-14" y="62" width="14" height="6" fill={SOMBRA} />
            <rect x="64" y="62" width="14" height="6" fill={SOMBRA} />
          </>
        )}
        <rect x="0" y="0" width="64" height="64" fill={CUERPO} />
        {[0, 16, 32, 48].map((x) => (
          <rect key={x} x={x} y="64" width="8" height="8" fill={CUERPO} />
        ))}

        {/* Brazos */}
        {brazosArriba ? (
          <g className="ticky-brazos">
            <rect x="-8" y="20" width="8" height="8" fill={SOMBRA} />
            <rect x="-14" y="10" width="8" height="12" fill={SOMBRA} />
            <rect x="64" y="20" width="8" height="8" fill={SOMBRA} />
            <rect x="70" y="10" width="8" height="12" fill={SOMBRA} />
          </g>
        ) : pose !== 'leyendo' ? (
          <rect x="-8" y="36" width="8" height="10" fill={SOMBRA} />
        ) : null}
        {pose === 'saluda' && (
          <g className="ticky-brazo-saluda">
            <rect x="64" y="22" width="8" height="10" fill={SOMBRA} />
            <rect x="70" y="8" width="8" height="16" fill={SOMBRA} />
          </g>
        )}
        {pose === 'telefono' && (
          <>
            <rect x="64" y="24" width="8" height="14" fill={SOMBRA} />
            <rect x="60" y="4" width="10" height="22" fill={OJO} />
            <rect x="62" y="7" width="6" height="14" fill="#A78BFA" />
          </>
        )}
        {!brazosArriba && !['saluda', 'telefono', 'leyendo'].includes(pose) && (
          <rect x="64" y="36" width="8" height="10" fill={SOMBRA} />
        )}

        {/* Ojos */}
        {pose === 'cosquillas' ? (
          <g fill={OJO}>
            {[14, 38].map((x) => (
              <g key={x}>
                <rect x={x} y="18" width="4" height="4" />
                <rect x={x + 4} y="14" width="4" height="4" />
                <rect x={x + 8} y="18" width="4" height="4" />
              </g>
            ))}
          </g>
        ) : (
          <g className="ticky-ojos">
            <rect x="16" y={ojosAbajo ? 18 : 14} width="8" height="8" fill={OJO} />
            <rect x="40" y={ojosAbajo ? 18 : 14} width="8" height="8" fill={OJO} />
          </g>
        )}

        {/* Boca */}
        {pose === 'cosquillas' || pose === 'festeja' ? (
          <>
            <rect x="24" y="28" width="16" height="8" fill={BOCA} />
            <rect x="28" y="32" width="8" height="4" fill="#F472B6" />
          </>
        ) : (
          <rect className="ticky-boca" x="24" y="30" width="16" height="4" fill={BOCA} />
        )}

        {/* Renglones del ticket, o la cuenta que está leyendo */}
        {pose === 'leyendo' ? (
          <g className="ticky-papel">
            <rect x="10" y="36" width="44" height="30" fill="#F5F3FF" />
            <rect x="16" y="42" width="26" height="3" fill="#A78BFA" />
            <rect x="16" y="49" width="18" height="3" fill="#A78BFA" />
            <rect x="16" y="56" width="30" height="3" fill="#A78BFA" />
            <rect x="2" y="46" width="8" height="8" fill={SOMBRA} />
            <rect x="54" y="46" width="8" height="8" fill={SOMBRA} />
          </g>
        ) : (
          <>
            <rect x="8" y="40" width="48" height="4" fill={RENGLON} />
            <rect x="8" y="48" width="32" height="4" fill={RENGLON} />
            <rect x="8" y="56" width="40" height="4" fill={RENGLON} />
          </>
        )}
      </g>
    </svg>
  );
}

/**
 * Ticky que se puede tocar: reacciona con cosquillas y una frase. `mensaje` muestra un globo de
 * diálogo encima (lo usan la guía y las apariciones). `lado` alinea el globo.
 */
export function TickyTocable({
  pose = 'parpadea',
  size = 56,
  mensaje,
  lado = 'centro',
  className,
}: {
  pose?: PoseTicky;
  size?: number;
  mensaje?: string | null;
  lado?: 'izq' | 'der' | 'centro' | 'costado';
  className?: string;
}) {
  const [toque, setToque] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const tocar = () => {
    setToque(alAzar(FRASES_TOQUE));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToque(null), 1600);
  };
  const texto = toque ?? mensaje;

  return (
    <div className={cn('relative w-max', className)}>
      {texto && (
        <p
          key={texto}
          role="status"
          className={cn(
            'ticky-globo absolute bottom-full mb-2 w-max max-w-[220px] rounded-[12px] border border-rule bg-surface px-3 py-2 text-sm leading-snug text-graphite shadow-lg',
            lado === 'izq' && 'left-0',
            lado === 'der' && 'right-0',
            lado === 'centro' && 'left-1/2 -translate-x-1/2',
            lado === 'costado' && 'bottom-auto left-full top-0 mb-0 ml-2',
          )}
        >
          {texto}
        </p>
      )}
      <button
        type="button"
        onClick={tocar}
        aria-label="Hacerle cosquillas a Ticky"
        className="block cursor-pointer rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-birome"
      >
        <Ticky pose={toque ? 'cosquillas' : pose} size={size} />
      </button>
    </div>
  );
}
