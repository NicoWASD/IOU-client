import { Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Vale } from '@/components/Vale';
import { formatMoney, parseMoney, splitEqual } from '@/lib/money';

const NOMBRES = ['Sofi', 'Tomi', 'Juli', 'Lu', 'Fran', 'Maite', 'Rami', 'Cami'];
const MIN_PERSONAS = 1;
const MAX_PERSONAS = 8;

const pasoClase =
  'presionable grid size-11 place-items-center rounded-[9px] hover:bg-birome-soft hover:text-birome disabled:pointer-events-none disabled:opacity-40';

/**
 * Demo interactiva (CA-30.2): Sofi pagó la cena y los vales muestran cuánto le debe cada uno,
 * con el redondeo de `splitEqual` (spec 4.2). Un vale nuevo cae al sumar una persona.
 */
export function DemoReparto() {
  const montoId = useId();
  const personasId = useId();
  const [texto, setTexto] = useState('36.000');
  const [personas, setPersonas] = useState(4);

  const total = parseMoney(texto) ?? 0;
  const montoInvalido = texto.trim() !== '' && parseMoney(texto) === null;
  const ids = Array.from({ length: personas }, (_, i) => i + 1);
  const partes = splitEqual(total, ids);
  const deudores = ids.slice(1);
  const parteDeSofi = partes[1] ?? 0;
  const montosDeudores = [...new Set(deudores.map((id) => partes[id] ?? 0))].sort((a, b) => b - a);
  const cuantoDeben =
    montosDeudores.length === 0
      ? ''
      : montosDeudores.length === 1
        ? ` y cada uno le debe ${formatMoney(montosDeudores[0] ?? 0)}`
        : ` y los demás le deben ${montosDeudores.map(formatMoney).join(' o ')}`;

  const cambiarPersonas = (delta: number) =>
    setPersonas((p) => Math.min(MAX_PERSONAS, Math.max(MIN_PERSONAS, p + delta)));

  return (
    <section
      aria-label="Probá cómo se reparte un gasto"
      className="grid min-w-0 gap-5 rounded-[20px] border border-rule bg-surface p-4 sm:p-6"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="grid gap-1.5">
          <label htmlFor={montoId} className="text-sm font-semibold">
            Sofi pagó la cena
          </label>
          <Input
            id={montoId}
            inputMode="decimal"
            autoComplete="off"
            value={texto}
            aria-invalid={montoInvalido || undefined}
            aria-describedby={`${montoId}-r`}
            onChange={(e) => setTexto(e.target.value)}
            className="h-12 text-lg font-bold"
          />
        </div>
        <div className="grid gap-1.5">
          <span id={personasId} className="text-sm font-semibold">
            Personas
          </span>
          <div
            role="group"
            aria-labelledby={personasId}
            className="flex h-12 items-center rounded-[10px] border border-rule px-0.5"
          >
            <button
              type="button"
              aria-label="Una persona menos"
              disabled={personas <= MIN_PERSONAS}
              onClick={() => cambiarPersonas(-1)}
              className={pasoClase}
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <output
              aria-live="polite"
              className="min-w-7 text-center text-lg font-bold"
            >
              {personas}
            </output>
            <button
              type="button"
              aria-label="Una persona más"
              disabled={personas >= MAX_PERSONAS}
              onClick={() => cambiarPersonas(1)}
              className={pasoClase}
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <p id={`${montoId}-r`} className="text-sm text-pencil">
        {montoInvalido
          ? 'Escribí el monto con números, por ejemplo 36.000 o 100,50.'
          : `${formatMoney(total)} entre ${personas}: Sofi pone ${formatMoney(parteDeSofi)}${cuantoDeben}.`}
      </p>
      <div className="grid gap-2.5 rounded-[14px] bg-paper p-3">
        {deudores.length === 0 ? (
          <p className="px-1 py-3 text-sm text-pencil">
            Con una sola persona no hay nada que dividir.
          </p>
        ) : (
          deudores.map((id) => {
            const nombre = NOMBRES[id - 1] ?? `Persona ${id}`;
            return (
              <Vale
                key={id}
                titulo={`${nombre} le debe a Sofi`}
                montoCents={partes[id] ?? 0}
                firma={nombre.toLowerCase()}
                caer
              />
            );
          })
        )}
      </div>
    </section>
  );
}
