import { RotateCcw } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Vale } from '@/components/Vale';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
  GASTOS,
  MIEMBROS,
  TOTAL_GRUPO,
  TRANSFERENCIAS,
  YO,
  nombreDe,
  type Transferencia,
} from './ejemplo';

const DURACION_CORTE_MS = 400;
const DURACION_HUECO_MS = 220;

const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Interpola un monto en 300 ms cuando cambia (design.md 8). Sin movimiento, salta directo. */
function useMontoAnimado(objetivo: number) {
  const [valor, setValor] = useState(objetivo);
  const desde = useRef(objetivo);
  const directo = prefiereMenosMovimiento() || typeof requestAnimationFrame !== 'function';
  useEffect(() => {
    const inicio = desde.current;
    if (inicio === objetivo) return;
    if (directo) {
      desde.current = objetivo;
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / 300);
      const e = 1 - (1 - p) ** 3;
      const v = Math.round(inicio + (objetivo - inicio) * e);
      desde.current = v;
      setValor(v);
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, directo]);
  return directo ? objetivo : valor;
}

export function Avatar({ id, className }: { id: number; className?: string }) {
  const nombre = nombreDe(id);
  return (
    <span
      aria-hidden="true"
      className={cn('av size-8 text-[13px]', className)}
      style={{ background: `var(--av${((id - 1) % 5) + 1})` }}
    >
      {nombre.slice(0, 2)}
    </span>
  );
}

const clave = (t: Transferencia) => `${t.de}-${t.a}`;

function Cuentas() {
  const [ronda, setRonda] = useState(0);
  const [cortando, setCortando] = useState<Set<string>>(new Set());
  const [cerrados, setCerrados] = useState<Set<string>>(new Set());
  const [quitados, setQuitados] = useState<Set<string>>(new Set());
  const [saldados, setSaldados] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState('');
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // El panel guarda el alto que tenía con todos los vales: al cortarlos, el marco no salta.
  const panel = useRef<HTMLDivElement>(null);
  const [altoMinimo, setAltoMinimo] = useState<number>();
  const intacto = saldados.size === 0;
  useLayoutEffect(() => {
    if (!intacto) return;
    const medir = () => {
      const el = panel.current;
      if (!el) return;
      el.style.minHeight = '';
      setAltoMinimo(el.getBoundingClientRect().height);
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [intacto]);

  const mias = TRANSFERENCIAS.filter((t) => t.a === YO || t.de === YO);
  const pendientes = mias.filter((t) => !saldados.has(clave(t)));
  const teDeben = pendientes.reduce((s, t) => s + (t.a === YO ? t.montoCents : -t.montoCents), 0);
  const monto = useMontoAnimado(teDeben);
  const visibles = mias.filter((t) => !quitados.has(clave(t)));
  const todosAMano = pendientes.length === 0;

  const saldar = (t: Transferencia) => {
    const k = clave(t);
    const corte = prefiereMenosMovimiento() ? 100 : DURACION_CORTE_MS;
    setCortando((s) => new Set(s).add(k));
    setSaldados((s) => new Set(s).add(k));
    setAviso(
      `Pago registrado: ${nombreDe(t.de)} le pagó ${formatMoney(t.montoCents)} a ${nombreDe(t.a)}.`,
    );
    timers.current.push(
      window.setTimeout(() => setCerrados((s) => new Set(s).add(k)), corte),
      window.setTimeout(() => setQuitados((s) => new Set(s).add(k)), corte + DURACION_HUECO_MS),
    );
  };

  const reiniciar = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setCortando(new Set());
    setCerrados(new Set());
    setQuitados(new Set());
    setSaldados(new Set());
    setAviso('');
    setRonda((r) => r + 1);
  };

  return (
    <div
      ref={panel}
      style={intacto ? undefined : { minHeight: altoMinimo }}
      className="grid h-full content-start gap-4 bg-paper p-4 sm:p-5"
    >
      <p className="text-[15px] font-bold">Cómo están las cuentas</p>
      <div className="grid gap-0.5">
        {todosAMano ? (
          <p className="py-1 text-2xl font-extrabold tracking-tight">
            <span className="saldado">Están todos a mano.</span>
          </p>
        ) : (
          <>
            <span className="text-sm font-semibold text-te-deben">Te deben</span>
            <span className="text-[30px] leading-[1.1] font-extrabold tracking-tight text-te-deben sm:text-[34px]">
              + {formatMoney(monto)}
            </span>
          </>
        )}
      </div>
      <div className="grid">
        {visibles.map((t, i) => {
          const k = clave(t);
          const titulo = t.a === YO ? `${nombreDe(t.de)} te debe` : `Le debés a ${nombreDe(t.a)}`;
          return (
            <div key={`${ronda}-${k}`} className="vale-hueco" data-cerrado={cerrados.has(k)}>
              <div className="pb-2.5">
                <Vale
                  titulo={titulo}
                  meta="Transferencia sugerida"
                  montoCents={t.montoCents}
                  caer
                  delayMs={250 + i * 90}
                  cortando={cortando.has(k)}
                  compacto
                  onSaldar={() => saldar(t)}
                  saldarLabel={`Saldar: ${titulo} ${formatMoney(t.montoCents)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      {todosAMano && (
        <button
          type="button"
          onClick={reiniciar}
          className="presionable inline-flex h-11 items-center gap-2 justify-self-start rounded-[10px] px-3 text-sm font-semibold text-birome hover:bg-birome-soft"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Volver a empezar
        </button>
      )}
      <p role="status" className="sr-only">
        {aviso}
      </p>
    </div>
  );
}

function Gastos() {
  const dias = [...new Set(GASTOS.map((g) => g.dia))];
  return (
    <div className="grid content-start gap-3 p-4 sm:p-5">
      {dias.map((dia) => (
        <div key={dia} className="grid gap-1">
          <p className="text-[13px] font-medium text-pencil">{dia}</p>
          <ul className="grid">
            {GASTOS.filter((g) => g.dia === dia).map((g) => {
              const Icono = g.icono;
              return (
                <li
                  key={g.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule py-2.5 last:border-b-0"
                >
                  <span className="grid size-9 place-items-center rounded-[10px] bg-paper text-pencil">
                    <Icono className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="grid min-w-0">
                    <span className="truncate text-[15px] font-semibold">{g.descripcion}</span>
                    <span className="truncate text-[13px] text-pencil">
                      Pagó {g.pagoId === YO ? 'vos' : nombreDe(g.pagoId)} · entre {g.entre.length}
                    </span>
                  </span>
                  <span className="text-[15px] font-semibold">
                    {formatMoney(g.totalCents)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * La UI real de IOU como HTML vivo: el detalle del grupo con sus gastos y el panel de cuentas.
 * Los talones de los vales se pueden tocar para saldar (el corte del vale, design.md 8).
 */
export function AppFrame() {
  return (
    <div
      role="group"
      data-ui
      aria-label="Ejemplo: así se ve el grupo Bariloche 2026 en IOU"
      className="app-frame min-w-0 overflow-hidden rounded-[20px] border border-rule bg-surface shadow-[0_1px_0_var(--rule),0_24px_48px_-24px_rgb(27_30_37/0.18)]"
    >
      <div className="flex h-12 items-center justify-between gap-3 border-b border-rule px-4 sm:px-5">
        <span className="flex min-w-0 items-center gap-2 text-sm text-pencil">
          <Logo className="h-3.5" title="IOU" />
          <span aria-hidden="true">/</span>
          <span className="truncate">Mis grupos</span>
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Avatar id={YO} className="size-7 text-xs" />
          <span className="hidden sm:inline">{nombreDe(YO)}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-rule px-4 py-4 sm:px-5">
        <div className="grid gap-1">
          <p className="text-[22px] leading-tight font-bold tracking-tight">Bariloche 2026</p>
          <p className="text-[13px] text-pencil">
            {GASTOS.length} gastos · {formatMoney(TOTAL_GRUPO)} en total
          </p>
        </div>
        <div className="flex" aria-label={`${MIEMBROS.length} miembros`} role="img">
          {MIEMBROS.map((m) => (
            <Avatar key={m.id} id={m.id} className="-ml-2 border-2 border-surface first:ml-0" />
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(300px,1fr)]">
        <div className="order-2 md:order-1">
          <Gastos />
        </div>
        <div className="order-1 border-rule md:order-2 md:border-l">
          <Cuentas />
        </div>
      </div>
    </div>
  );
}
