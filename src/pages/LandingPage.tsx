import { ArrowRight, Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Vale } from '@/components/Vale';
import { formatMoney, parseMoney, splitEqual } from '@/lib/money';

const NOMBRES = ['Sofi', 'Tomi', 'Juli', 'Lu', 'Fran', 'Maite', 'Rami', 'Cami'];
const MIN_PERSONAS = 1;
const MAX_PERSONAS = 8;

/** Hero interactivo: Sofi pagó la cena y los vales muestran cuánto le debe cada uno (CA-30.2). */
function DemoReparto() {
  const montoId = useId();
  const personasId = useId();
  const [texto, setTexto] = useState('36.000');
  const [personas, setPersonas] = useState(4);
  const [animar, setAnimar] = useState(true);

  const total = parseMoney(texto) ?? 0;
  const ids = Array.from({ length: personas }, (_, i) => i + 1);
  const partes = splitEqual(total, ids);
  const deudores = ids.slice(1);
  const parteDeCada = partes[ids[ids.length - 1] ?? 1] ?? 0;

  const cambiarPersonas = (delta: number) => {
    setAnimar(false);
    setPersonas((p) => Math.min(MAX_PERSONAS, Math.max(MIN_PERSONAS, p + delta)));
  };

  return (
    <section
      aria-label="Probá cómo se reparte un gasto"
      className="grid min-w-0 gap-4 rounded-[20px] border border-rule bg-surface p-5"
    >
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <div className="grid gap-1.5">
          <label htmlFor={montoId} className="text-sm font-semibold">
            Sofi pagó la cena
          </label>
          <Input
            id={montoId}
            inputMode="decimal"
            value={texto}
            onChange={(e) => {
              setAnimar(false);
              setTexto(e.target.value);
            }}
            className="h-11 tabular-nums"
          />
        </div>
        <div className="grid gap-1.5">
          <span id={personasId} className="text-sm font-semibold">
            Personas
          </span>
          <div
            role="group"
            aria-labelledby={personasId}
            className="flex h-11 items-center rounded-[10px] border border-rule"
          >
            <button
              type="button"
              aria-label="Una persona menos"
              disabled={personas <= MIN_PERSONAS}
              onClick={() => cambiarPersonas(-1)}
              className="grid size-11 place-items-center disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <output aria-live="polite" className="min-w-7 text-center font-bold tabular-nums">
              {personas}
            </output>
            <button
              type="button"
              aria-label="Una persona más"
              disabled={personas >= MAX_PERSONAS}
              onClick={() => cambiarPersonas(1)}
              className="grid size-11 place-items-center disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <p className="text-sm text-pencil tabular-nums">
        {formatMoney(total)} entre {personas}: {formatMoney(parteDeCada)} cada uno
      </p>
      <div className="grid gap-2.5 rounded-[14px] bg-paper p-3">
        {deudores.length === 0 ? (
          <p className="text-sm text-pencil">Con una sola persona no hay nada que dividir.</p>
        ) : (
          deudores.map((id, i) => {
            const nombre = NOMBRES[id - 1] ?? `Persona ${id}`;
            return (
              <Vale
                key={id}
                titulo={`${nombre} le debe a Sofi`}
                montoCents={partes[id] ?? 0}
                firma={nombre.toLowerCase()}
                caer={animar}
                delayMs={i * 90}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

const PASOS = [
  {
    titulo: 'Armá el grupo',
    texto: 'Creá un grupo para el viaje y sumá a tus amigos con su email.',
  },
  {
    titulo: 'Anotá cada gasto',
    texto: 'Quien paga lo carga en segundos: en partes iguales, por montos o por porcentaje.',
  },
  {
    titulo: 'Salden con pocas transferencias',
    texto: 'IOU calcula los saldos y te dice exactamente quién le transfiere a quién.',
  },
];

const BENEFICIOS = [
  {
    titulo: 'Cualquier forma de dividir',
    texto: 'Partes iguales para la nafta, montos exactos para la cena, 60/40 para el alquiler.',
  },
  {
    titulo: 'Centavos que cierran',
    texto:
      'Cuando un monto no se divide justo, el redondeo se reparte y la suma siempre da el total.',
  },
  {
    titulo: 'Desde el celu, en el momento',
    texto: 'Anotás el gasto mientras pagás. Lo ven todos al instante.',
  },
];

export function LandingPage() {
  const { status } = useAuth();
  const logueado = status === 'authenticated';
  const cta = logueado
    ? { to: '/grupos', label: 'Ir a mis grupos' }
    : { to: '/registrarme', label: 'Crear un grupo gratis' };

  return (
    <div className="min-h-svh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" aria-label="IOU, inicio">
          <Logo className="h-6" />
        </Link>
        <nav className="flex items-center gap-1.5">
          {logueado ? (
            <Button asChild>
              <Link to="/grupos">Ir a mis grupos</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/ingresar">Ingresar</Link>
              </Button>
              <Button asChild>
                <Link to="/registrarme">Crear cuenta</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-16 md:grid-cols-[1.05fr_0.95fr] md:pt-12 md:pb-20">
          <div>
            <h1 className="text-[clamp(40px,6vw,60px)] leading-[1.04] font-extrabold tracking-[-0.03em] text-balance">
              Cuentas claras entre amigos.
            </h1>
            <p className="mt-5 mb-7 max-w-[34ch] text-lg text-pencil">
              Anotá quién pagó qué en el viaje, el depto o el asado. IOU te dice quién le debe a
              quién, con la menor cantidad de transferencias.
            </p>
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          </div>
          <DemoReparto />
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-bold tracking-tight">Así funciona</h2>
            <ol className="mt-9 grid gap-8 md:grid-cols-3">
              {PASOS.map((p, i) => (
                <li key={p.titulo} className="grid content-start gap-2">
                  <span
                    aria-hidden="true"
                    className="grid size-9 place-items-center rounded-full border-2 border-birome font-extrabold text-birome"
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{p.titulo}</h3>
                  <p className="text-pencil">{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
            <div>
              <h2 className="max-w-[22ch] text-3xl font-bold tracking-tight">
                Una semana en Bariloche, cuatro amigos
              </h2>
              <div className="mt-5 flex flex-wrap items-center gap-5">
                <p>
                  <strong className="block text-6xl leading-none font-extrabold tracking-tight tabular-nums">
                    23
                  </strong>
                  <span className="text-pencil">gastos anotados</span>
                </p>
                <ArrowRight className="size-8 text-pencil" aria-label="se resuelven en" />
                <p>
                  <strong className="block text-6xl leading-none font-extrabold tracking-tight tabular-nums">
                    3
                  </strong>
                  <span className="text-pencil">transferencias para quedar a mano</span>
                </p>
              </div>
              <p className="mt-4 max-w-[40ch] text-sm text-pencil">
                Sin planillas ni capturas del grupo de WhatsApp: cada uno ve en todo momento cuánto
                puso y cuánto le toca.
              </p>
            </div>
            <div className="grid gap-2.5">
              <Vale
                titulo="Tomi le debe a Sofi"
                montoCents={4120000}
                meta="Transferencia sugerida"
              />
              <Vale
                titulo="Juli le debe a Sofi"
                montoCents={2875000}
                meta="Transferencia sugerida"
              />
              <Vale titulo="Juli le debe a Lu" montoCents={905000} meta="Transferencia sugerida" />
            </div>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-bold tracking-tight">
              Pensado para cómo gastan de verdad
            </h2>
            <div className="mt-7 grid gap-8 md:grid-cols-3">
              {BENEFICIOS.map((b) => (
                <div key={b.titulo}>
                  <h3 className="mb-1.5 text-lg font-semibold">{b.titulo}</h3>
                  <p className="text-pencil">{b.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-4 py-16">
            <h2 className="max-w-[24ch] text-3xl font-bold tracking-tight">
              El próximo viaje, con las cuentas claras desde el día uno.
            </h2>
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pt-6 pb-10 text-sm text-pencil">
        IOU es un proyecto académico. Los pagos se registran en la app; el dinero se transfiere por
        fuera.
      </footer>
    </div>
  );
}
