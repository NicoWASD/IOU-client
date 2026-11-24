import { ArrowRight, Plus } from 'lucide-react';
import { Vale } from '@/components/Vale';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Avatar } from './AppFrame';
import { MIEMBROS, PAGOS_SUELTOS, SALDOS, TRANSFERENCIAS, YO, nombreDe } from './ejemplo';

/*
 * Pedazos de la UI de IOU para "Así funciona". Son ilustraciones: no tienen controles que se
 * puedan tocar (nada que parezca un botón y no haga nada), solo el aspecto real de cada pantalla.
 */

const marco = 'grid content-start gap-3 rounded-[14px] border border-rule bg-surface p-4';

export function FragmentoMiembros() {
  return (
    <div className={marco}>
      <p className="text-[15px] font-bold">Miembros</p>
      <ul className="grid">
        {MIEMBROS.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 border-b border-rule py-2 last:border-b-0"
          >
            <Avatar id={m.id} />
            <span className="flex-1 text-[15px] font-semibold">
              {m.id === YO ? `${m.nombre} (vos)` : m.nombre}
            </span>
            <span className="text-[13px] text-pencil">{m.id === YO ? 'Admin' : 'Miembro'}</span>
          </li>
        ))}
      </ul>
      <span className="flex h-10 items-center gap-2 rounded-[10px] border border-dashed border-rule px-3 text-sm text-pencil">
        <Plus className="size-4" aria-hidden="true" />
        Agregar por email
      </span>
    </div>
  );
}

export function FragmentoGasto() {
  return (
    <div className={marco}>
      <p className="text-[15px] font-bold">Nuevo gasto</p>
      <span className="text-[36px] leading-none font-extrabold tracking-tight">
        $ 36.000
      </span>
      <div className="flex flex-wrap gap-1.5">
        {['Super', 'Nafta', 'Cena', 'Alquiler'].map((c) => (
          <span
            key={c}
            className={cn(
              'rounded-full border px-3 py-1 text-[13px] font-medium',
              c === 'Cena' ? 'border-birome bg-birome-soft text-birome' : 'border-rule text-pencil',
            )}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 rounded-[10px] bg-paper p-1 text-center text-[12px] leading-tight font-semibold sm:whitespace-nowrap">
        <span className="rounded-[7px] bg-surface py-1.5 shadow-[0_1px_0_var(--rule)]">
          Partes iguales
        </span>
        <span className="py-1.5 text-pencil">Montos</span>
        <span className="py-1.5 text-pencil">Porcentajes</span>
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-pencil">Entre 4, $ 9.000 cada uno</span>
        <span className="font-semibold text-te-deben">Cierra justo</span>
      </div>
    </div>
  );
}

export function FragmentoSaldos() {
  const max = Math.max(...Object.values(SALDOS).map(Math.abs));
  return (
    <div className={marco}>
      <p className="text-[15px] font-bold">Saldos</p>
      <ul className="grid gap-2.5">
        {MIEMBROS.map((m) => {
          const v = SALDOS[m.id] ?? 0;
          const ancho = `${(Math.abs(v) / max) * 50}%`;
          return (
            <li key={m.id} className="grid gap-1">
              <span className="flex items-baseline justify-between gap-2 text-[13px]">
                <span className="font-semibold">{m.nombre}</span>
                <span
                  className={cn(
                    'font-semibold',
                    v >= 0 ? 'text-te-deben' : 'text-debes',
                  )}
                >
                  {v >= 0 ? '+' : '−'} {formatMoney(Math.abs(v))}
                </span>
              </span>
              <span className="relative h-2 rounded-full bg-paper">
                <span className="absolute inset-y-0 left-1/2 w-px bg-rule" />
                <span
                  className={cn(
                    'absolute inset-y-0 rounded-full',
                    v >= 0 ? 'left-1/2 bg-te-deben' : 'right-1/2 bg-debes',
                  )}
                  style={{ width: ancho }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Los pagos gasto por gasto contra las transferencias que sugiere IOU. */
export function Comparacion() {
  const porGasto = [...new Set(PAGOS_SUELTOS.map((p) => p.gasto))];
  return (
    <div
      data-ui
      className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6"
    >
      <div className={cn(marco, 'gap-2')}>
        <p className="flex items-baseline justify-between gap-3 text-[15px] font-bold">
          Gasto por gasto
          <span className="text-[13px] font-medium text-pencil">
            {PAGOS_SUELTOS.length} pagos
          </span>
        </p>
        <ul className="grid">
          {porGasto.map((gasto) => (
            <li key={gasto} className="grid gap-0.5 border-b border-rule py-2 last:border-b-0">
              <span className="text-[13px] font-medium text-pencil">{gasto}</span>
              <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px]">
                {PAGOS_SUELTOS.filter((p) => p.gasto === gasto).map((p) => (
                  <span key={`${p.de}-${p.a}`}>
                    {nombreDe(p.de)} → {nombreDe(p.a)} {formatMoney(p.montoCents)}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <ArrowRight className="hidden size-6 self-center text-pencil md:block" aria-hidden="true" />
      <div className="grid content-start gap-3">
        <p className="flex items-baseline justify-between gap-3 text-[15px] font-bold">
          Con IOU
          <span className="text-[13px] font-medium text-pencil">
            {TRANSFERENCIAS.length} transferencias
          </span>
        </p>
        <div className="grid gap-2.5">
          {TRANSFERENCIAS.map((t) => (
            <Vale
              key={`${t.de}-${t.a}`}
              titulo={`${nombreDe(t.de)} le transfiere a ${nombreDe(t.a)}`}
              meta="Transferencia sugerida"
              montoCents={t.montoCents}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
