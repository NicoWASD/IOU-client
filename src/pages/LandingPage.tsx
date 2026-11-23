import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AppFrame } from './landing/AppFrame';
import { DemoReparto } from './landing/DemoReparto';
import { GASTOS, PAGOS_SUELTOS, TRANSFERENCIAS } from './landing/ejemplo';
import {
  Comparacion,
  FragmentoGasto,
  FragmentoMiembros,
  FragmentoSaldos,
} from './landing/Fragmentos';

const PASOS = [
  {
    titulo: 'Armá el grupo',
    texto: 'Creá un grupo para el viaje y sumá a tus amigos con su email.',
    fragmento: <FragmentoMiembros />,
  },
  {
    titulo: 'Anotá cada gasto',
    texto:
      'Quien paga lo carga desde el celu, en el momento: en partes iguales, por montos o por porcentaje.',
    fragmento: <FragmentoGasto />,
  },
  {
    titulo: 'Salden con pocas transferencias',
    texto: 'IOU calcula los saldos y te dice exactamente quién le transfiere a quién.',
    fragmento: <FragmentoSaldos />,
  },
];

const wrap = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

function Seccion({
  id,
  titulo,
  bajada,
  className,
  children,
}: {
  id: string;
  titulo: string;
  bajada: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className={cn('py-20 md:py-28', className)}>
      <div className={wrap}>
        <h2
          id={`${id}-t`}
          className="max-w-[24ch] text-[28px] leading-[1.15] font-bold tracking-[-0.02em] text-balance md:text-[36px]"
        >
          {titulo}
        </h2>
        <p className="mt-4 max-w-[52ch] text-lg text-pencil">{bajada}</p>
        <div className="mt-10 md:mt-14">{children}</div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const { status } = useAuth();
  const logueado = status === 'authenticated';
  const cta = logueado
    ? { to: '/grupos', label: 'Ir a mis grupos' }
    : { to: '/registrarme', label: 'Crear un grupo gratis' };

  return (
    <div className="min-h-svh overflow-x-clip">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-[10px] bg-surface px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur-sm">
        <div className={cn(wrap, 'flex h-16 items-center justify-between gap-3')}>
          <Link
            to="/"
            aria-label="IOU, inicio"
            className="-mx-2 grid h-11 place-items-center rounded-[10px] px-2"
          >
            <Logo className="h-6" />
          </Link>
          <nav aria-label="Cuenta" className="flex items-center gap-1.5">
            {logueado ? (
              <Button asChild className="h-11 px-4">
                <Link to="/grupos">Ir a mis grupos</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="h-11 px-3 sm:px-4">
                  <Link to="/ingresar">Ingresar</Link>
                </Button>
                <Button asChild className="h-11 px-4">
                  <Link to="/registrarme">Crear cuenta</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="contenido">
        <section
          aria-labelledby="hero-t"
          className="xl:flex xl:min-h-[calc(100svh-4rem)] xl:items-center"
        >
          <div
            className={cn(
              wrap,
              'grid gap-10 pt-12 pb-16 md:pt-16 md:pb-20 xl:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] xl:items-center xl:gap-10 xl:py-16',
            )}
          >
            <div className="max-w-xl">
              <h1
                id="hero-t"
                className="text-[clamp(40px,6vw,60px)] leading-[1.04] font-extrabold tracking-[-0.03em] text-balance"
              >
                Cuentas claras entre amigos.
              </h1>
              <p className="mt-5 max-w-[36ch] text-lg text-pencil md:text-xl">
                Anotá quién pagó qué en el viaje, el depto o el asado. IOU te dice quién le debe a
                quién, con la menor cantidad de transferencias.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 w-full px-5 text-base sm:w-auto">
                  <Link to={cta.to}>{cta.label}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 w-full bg-surface px-5 text-base sm:w-auto"
                >
                  <a href="#reparto">Probá el reparto</a>
                </Button>
              </div>
            </div>
            <AppFrame />
          </div>
        </section>

        <Seccion
          id="reparto"
          titulo="Repartos que cierran al centavo"
          bajada="Cuando un monto no se divide justo, los centavos que sobran se reparten de a uno y la suma siempre da el total. Probá con $ 100 entre 3."
          className="bg-surface"
        >
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
            <dl className="grid content-start gap-6 border-rule lg:border-t lg:pt-6">
              {[
                [
                  'Partes iguales',
                  'Para la nafta o el súper: se divide entre los que participaron.',
                ],
                ['Montos', 'Para la cena: cada uno pone lo que consumió.'],
                ['Porcentajes', 'Para el alquiler: 60 y 40, o lo que acuerden.'],
              ].map(([t, d]) => (
                <div key={t} className="grid gap-1">
                  <dt className="text-lg font-semibold">{t}</dt>
                  <dd className="text-pencil">{d}</dd>
                </div>
              ))}
            </dl>
            <DemoReparto />
          </div>
        </Seccion>

        <Seccion
          id="transferencias"
          titulo={`${GASTOS.length} gastos, ${TRANSFERENCIAS.length} transferencias`}
          bajada={`Si en Bariloche cada uno le devolviera a quien pagó, gasto por gasto, serían ${PAGOS_SUELTOS.length} pagos. IOU junta los saldos del grupo y los resuelve en ${TRANSFERENCIAS.length}.`}
        >
          <Comparacion />
        </Seccion>

        <Seccion
          id="como-funciona"
          titulo="Así funciona"
          bajada="Del primer gasto del viaje a la última transferencia, en tres pasos."
          className="bg-surface"
        >
          <ol className="grid gap-12 md:gap-10 xl:grid-cols-3 xl:gap-8">
            {PASOS.map((p, i) => (
              <li
                key={p.titulo}
                className="grid content-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-10 xl:grid-cols-1 xl:items-start xl:gap-5"
              >
                <div
                  aria-hidden="true"
                  className="max-w-md rounded-[18px] bg-paper p-3 sm:p-4 xl:max-w-none"
                >
                  {p.fragmento}
                </div>
                <div className="grid gap-1.5">
                  <h3 className="text-lg font-semibold">
                    <span className="mr-2 text-birome tabular-nums">{i + 1}</span>
                    {p.titulo}
                  </h3>
                  <p className="text-pencil">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </Seccion>
      </main>

      <footer className="bg-birome text-[var(--on-birome)]">
        <div className={cn(wrap, 'grid gap-16 pt-20 pb-10 md:pt-28')}>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <h2 className="max-w-[22ch] text-[28px] leading-[1.15] font-bold tracking-[-0.02em] text-balance md:text-[40px]">
              El próximo viaje, con las cuentas claras desde el día uno.
            </h2>
            <Link
              to={cta.to}
              className="presionable inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-surface px-6 text-base font-semibold text-birome hover:bg-paper focus-visible:outline-[var(--on-birome)] sm:w-auto"
            >
              {cta.label}
            </Link>
          </div>
          <p className="max-w-[70ch] border-t border-[color-mix(in_srgb,var(--on-birome)_25%,transparent)] pt-6 text-sm opacity-85">
            IOU es un proyecto académico. Los pagos se registran en la app; el dinero se transfiere
            por fuera.
          </p>
        </div>
      </footer>
    </div>
  );
}
