import { Logo } from '@/components/brand/Logo';
import { HealthStatus } from '@/components/HealthStatus';

export default function App() {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-12">
      <section className="grid w-full max-w-md gap-6 rounded-[14px] border border-rule bg-surface p-8">
        <div className="grid gap-2">
          <h1>
            <Logo className="h-10" />
          </h1>
          <p className="text-pencil">Gastos compartidos sin vueltas</p>
        </div>
        <HealthStatus />
      </section>
    </main>
  );
}
