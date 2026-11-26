import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useRegistrarPago } from '@/api/balances';
import { ApiError } from '@/api/client';
import type { GrupoDetalle } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { HojaODialogo } from '@/components/HojaODialogo';
import { Field } from '@/components/forms/Field';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { hoy } from '@/lib/fechas';
import { centsToMoney, parseMoney } from '@/lib/money';

/** Precarga desde la liquidación sugerida (CA-22.4). */
export type PagoInicial = { de: string; a: string; monto: string };

type Props = {
  grupo: GrupoDetalle;
  inicial: PagoInicial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SELECT =
  'h-11 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none';

/** Registrar un pago (HU-22): quién paga, a quién, cuánto y cuándo. */
export function PagoFormDialog({ grupo, inicial, open, onOpenChange }: Props) {
  const [enviando, setEnviando] = useState(false);
  return (
    <HojaODialogo
      open={open}
      onOpenChange={onOpenChange}
      titulo="Registrar un pago"
      bloqueado={enviando}
    >
      {open && (
        <PagoForm
          grupo={grupo}
          inicial={inicial}
          onEnviando={setEnviando}
          onListo={() => onOpenChange(false)}
        />
      )}
    </HojaODialogo>
  );
}

function PagoForm({
  grupo,
  inicial,
  onEnviando,
  onListo,
}: {
  grupo: GrupoDetalle;
  inicial: PagoInicial | null;
  onEnviando: (v: boolean) => void;
  onListo: () => void;
}) {
  const { usuario } = useAuth();
  const activos = grupo.miembros.filter((m) => m.activo);
  const registrar = useRegistrarPago(grupo.id);
  const otro = activos.find((m) => m.id !== usuario?.id)?.id ?? '';
  const [de, setDe] = useState(inicial?.de ?? usuario?.id ?? '');
  const [a, setA] = useState(inicial?.a ?? otro);
  const [montoTxt, setMontoTxt] = useState(inicial?.monto.replace('.', ',') ?? '');
  const [fecha, setFecha] = useState(hoy());
  const [error, setError] = useState<string | null>(null);
  const total = parseMoney(montoTxt);
  const nombre = (id: string) =>
    id === usuario?.id ? 'Vos' : (activos.find((m) => m.id === id)?.nombre ?? '');

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (de === a) return setError('Quien paga y quien recibe tienen que ser personas distintas');
    if (total === null || total <= 0) return setError('El monto tiene que ser mayor a 0');
    onEnviando(true);
    try {
      await registrar.mutateAsync({ de, a, monto: centsToMoney(total), fecha });
      toast.success(`Pago registrado: ${nombre(de)} → ${nombre(a)}`);
      onListo();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No pudimos registrar el pago. Probá de nuevo.',
      );
    } finally {
      onEnviando(false);
    }
  }

  const selector = (id: string, label: string, valor: string, set: (v: string) => void) => (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <select id={id} className={SELECT} value={valor} onChange={(e) => set(e.target.value)}>
        {activos.map((m) => (
          <option key={m.id} value={m.id}>
            {m.id === usuario?.id ? `${m.nombre} (vos)` : m.nombre}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={(e) => void enviar(e)} noValidate className="grid gap-5">
      <div className="grid grid-cols-2 gap-3">
        {selector('pago-de', 'Paga', de, setDe)}
        {selector('pago-a', 'Le paga a', a, setA)}
      </div>
      <Field
        id="pago-monto"
        label="Monto"
        inputMode="decimal"
        placeholder="0"
        value={montoTxt}
        onChange={(e) => setMontoTxt(e.target.value)}
        className="text-xl font-semibold tabular-nums"
      />
      <Field
        id="pago-fecha"
        label="Fecha"
        type="date"
        max={hoy()}
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />
      {error && (
        <p
          role="alert"
          className="rounded-[10px] bg-debes/10 px-4 py-3 text-sm font-medium text-debes"
        >
          {error}
        </p>
      )}
      <Button type="submit" className="h-12" disabled={registrar.isPending}>
        {registrar.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
        {registrar.isPending ? 'Registrando…' : 'Registrar pago'}
      </Button>
    </form>
  );
}
