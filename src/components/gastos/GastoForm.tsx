import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { useEliminarGasto, useGuardarGasto } from '@/api/gastos';
import type { GastoDetalle, GrupoDetalle, NuevoGasto, TipoDivision } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { Avatar } from '@/components/Avatar';
import { HojaODialogo } from '@/components/HojaODialogo';
import { Field } from '@/components/forms/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ayer, hoy } from '@/lib/fechas';
import {
  centsToMoney,
  formatMoney,
  moneyToCents,
  parseMoney,
  parsePorcentaje,
  pctToString,
  splitEqual,
  splitPct,
} from '@/lib/money';
import { cn } from '@/lib/utils';

const CHIPS = ['Super', 'Nafta', 'Cena', 'Alquiler'];
const MODOS: { id: TipoDivision; label: string }[] = [
  { id: 'IGUAL', label: 'Partes iguales' },
  { id: 'MONTOS', label: 'Montos' },
  { id: 'PORCENTAJE', label: 'Porcentajes' },
];
const chip = (activo: boolean) =>
  cn(
    'h-9 rounded-full border px-3.5 text-sm font-medium transition-colors',
    activo
      ? 'border-birome bg-birome-soft text-birome'
      : 'border-rule text-graphite hover:bg-muted',
  );

type Props = {
  grupo: GrupoDetalle;
  /** Si viene, el formulario edita ese gasto (HU-17). */
  gasto?: GastoDetalle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Hoja (mobile) o diálogo (desktop) para cargar o editar un gasto (HU-12 a HU-14, HU-17). */
export function GastoFormDialog({ grupo, gasto, open, onOpenChange }: Props) {
  const [enviando, setEnviando] = useState(false);
  return (
    <HojaODialogo
      open={open}
      onOpenChange={onOpenChange}
      titulo={gasto ? 'Editar gasto' : 'Nuevo gasto'}
      bloqueado={enviando}
    >
      {open && (
        <GastoForm
          grupo={grupo}
          gasto={gasto}
          onEnviando={setEnviando}
          onListo={() => onOpenChange(false)}
        />
      )}
    </HojaODialogo>
  );
}

function GastoForm({
  grupo,
  gasto,
  onEnviando,
  onListo,
}: {
  grupo: GrupoDetalle;
  gasto?: GastoDetalle;
  onEnviando: (v: boolean) => void;
  onListo: () => void;
}) {
  const { usuario } = useAuth();
  const activos = grupo.miembros.filter((m) => m.activo);
  const guardar = useGuardarGasto(grupo.id, gasto?.id);
  const eliminar = useEliminarGasto(grupo.id);

  const parteDe = (id: string) => gasto?.participaciones.find((p) => p.usuario.id === id);
  const [montoTxt, setMontoTxt] = useState(
    gasto ? formatMoney(moneyToCents(gasto.monto)).replace(/[$\s ]/g, '') : '',
  );
  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? '');
  const [pagadoPor, setPagadoPor] = useState(gasto?.pagadoPor.id ?? usuario?.id ?? '');
  const [fecha, setFecha] = useState(gasto?.fecha ?? hoy());
  const [tipo, setTipo] = useState<TipoDivision>(gasto?.tipoDivision ?? 'IGUAL');
  // CA-12.5: por defecto, todos los miembros activos
  const [elegidos, setElegidos] = useState<Set<string>>(
    () =>
      new Set(gasto ? gasto.participaciones.map((p) => p.usuario.id) : activos.map((m) => m.id)),
  );
  const [montos, setMontos] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      activos.map((m) => {
        const p = parteDe(m.id);
        return [m.id, gasto?.tipoDivision === 'MONTOS' && p ? p.monto.replace('.', ',') : ''];
      }),
    ),
  );
  const [pcts, setPcts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      activos.map((m) => {
        const p = parteDe(m.id);
        return [m.id, p?.porcentaje ? p.porcentaje.replace('.', ',').replace(/,00$/, '') : ''];
      }),
    ),
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const total = parseMoney(montoTxt);
  const totalOk = total !== null && total > 0;

  // Reparto en vivo y si "cierra" (design.md 7.4)
  let partes: Record<string, number> = {};
  let resumen: { texto: string; ok: boolean } | null = null;
  let participantes: NuevoGasto['participantes'] = [];
  if (tipo === 'IGUAL') {
    const ids = activos.filter((m) => elegidos.has(m.id)).map((m) => m.id);
    partes = totalOk ? splitEqual(total, ids) : {};
    participantes = ids.map((usuarioId) => ({ usuarioId }));
    resumen = ids.length === 0 ? { texto: 'Elegí al menos una persona', ok: false } : null;
  } else if (tipo === 'MONTOS') {
    const filas = activos
      .map((m) => ({ id: m.id, c: parseMoney(montos[m.id] ?? '') }))
      .filter((f): f is { id: string; c: number } => f.c !== null && f.c > 0);
    partes = Object.fromEntries(filas.map((f) => [f.id, f.c]));
    participantes = filas.map((f) => ({ usuarioId: f.id, monto: centsToMoney(f.c) }));
    const dif = (total ?? 0) - filas.reduce((s, f) => s + f.c, 0);
    resumen =
      dif === 0
        ? { texto: 'Cierra justo', ok: filas.length > 0 }
        : { texto: `${dif > 0 ? 'Faltan' : 'Sobran'} ${formatMoney(Math.abs(dif))}`, ok: false };
  } else {
    const filas = activos
      .map((m) => ({ id: m.id, pct: parsePorcentaje(pcts[m.id] ?? '') }))
      .filter((f): f is { id: string; pct: number } => f.pct !== null && f.pct > 0);
    partes = totalOk ? splitPct(total, filas) : {};
    participantes = filas.map((f) => ({ usuarioId: f.id, porcentaje: pctToString(f.pct) }));
    const suma = filas.reduce((s, f) => s + f.pct, 0);
    resumen =
      suma === 10000
        ? { texto: 'Cierra justo: 100 %', ok: true }
        : { texto: `Suman ${pctToString(suma).replace('.', ',')} %`, ok: false };
  }
  const listo =
    totalOk && descripcion.trim() !== '' && participantes.length > 0 && (resumen?.ok ?? true);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!totalOk) errs.monto = 'El monto tiene que ser mayor a 0';
    if (!descripcion.trim()) errs.descripcion = 'Poné una descripción';
    if (fecha > hoy()) errs.fecha = 'La fecha no puede ser futura';
    setErrores(errs);
    setErrorApi(null);
    if (Object.keys(errs).length > 0 || !listo || total === null) return;
    onEnviando(true);
    try {
      const guardado = await guardar.mutateAsync({
        descripcion: descripcion.trim(),
        monto: centsToMoney(total),
        fecha,
        pagadoPor,
        tipoDivision: tipo,
        participantes,
      });
      if (gasto) toast.success('Gasto actualizado');
      // design.md 7.4: "Gasto guardado" con Deshacer (lo elimina)
      else
        toast.success('Gasto guardado', {
          action: { label: 'Deshacer', onClick: () => eliminar.mutate(guardado.id) },
        });
      onListo();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.details) {
        setErrores(err.details as Record<string, string>);
      } else {
        setErrorApi(
          err instanceof ApiError ? err.message : 'No pudimos guardar el gasto. Probá de nuevo.',
        );
      }
    } finally {
      onEnviando(false);
    }
  }

  return (
    <form onSubmit={(e) => void enviar(e)} noValidate className="grid gap-5">
      <Field
        id="gasto-monto"
        label="Monto"
        inputMode="decimal"
        autoFocus
        placeholder="0"
        value={montoTxt}
        onChange={(e) => setMontoTxt(e.target.value)}
        error={errores.monto}
        className="h-14 text-2xl font-semibold tabular-nums"
      />

      <div className="grid gap-2">
        <Field
          id="gasto-descripcion"
          label="Descripción"
          maxLength={100}
          placeholder="¿En qué se gastó?"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          error={errores.descripcion}
        />
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              type="button"
              key={c}
              className={chip(descripcion === c)}
              onClick={() => setDescripcion(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-semibold">Pagó</legend>
        <div className="flex flex-wrap gap-2">
          {activos.map((m) => (
            <button
              type="button"
              key={m.id}
              aria-pressed={pagadoPor === m.id}
              className={cn(chip(pagadoPor === m.id), 'flex items-center gap-2 pl-1')}
              onClick={() => setPagadoPor(m.id)}
            >
              <Avatar usuario={m} size="sm" />
              {m.id === usuario?.id ? 'Vos' : m.nombre}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-semibold">Entre quiénes</legend>
        <div
          role="radiogroup"
          aria-label="Cómo se divide"
          className="grid grid-cols-3 gap-1 rounded-[10px] bg-muted p-1"
        >
          {MODOS.map((m) => (
            <button
              type="button"
              role="radio"
              aria-checked={tipo === m.id}
              key={m.id}
              onClick={() => setTipo(m.id)}
              className={cn(
                'h-9 rounded-[8px] text-sm font-medium',
                tipo === m.id ? 'bg-surface shadow-xs' : 'text-pencil',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <ul className="grid gap-1">
          {activos.map((m) => {
            const parte = partes[m.id];
            return (
              <li key={m.id} className="flex min-h-12 items-center gap-3">
                {tipo === 'IGUAL' ? (
                  <label className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      className="size-5 accent-birome"
                      checked={elegidos.has(m.id)}
                      onChange={(e) => {
                        const s = new Set(elegidos);
                        if (e.target.checked) s.add(m.id);
                        else s.delete(m.id);
                        setElegidos(s);
                      }}
                    />
                    <Avatar usuario={m} size="sm" />
                    <span className="truncate">{m.nombre}</span>
                  </label>
                ) : (
                  <>
                    <Avatar usuario={m} size="sm" />
                    <span className="flex-1 truncate">{m.nombre}</span>
                    <Input
                      aria-label={`${tipo === 'MONTOS' ? 'Monto' : 'Porcentaje'} de ${m.nombre}`}
                      inputMode="decimal"
                      className="h-10 w-24 text-right tabular-nums"
                      placeholder={tipo === 'MONTOS' ? '0' : '0 %'}
                      value={(tipo === 'MONTOS' ? montos : pcts)[m.id] ?? ''}
                      onChange={(e) =>
                        (tipo === 'MONTOS' ? setMontos : setPcts)((prev) => ({
                          ...prev,
                          [m.id]: e.target.value,
                        }))
                      }
                    />
                  </>
                )}
                <span className="w-24 text-right text-sm text-pencil tabular-nums">
                  {parte !== undefined && tipo !== 'MONTOS' ? formatMoney(parte) : ''}
                </span>
              </li>
            );
          })}
        </ul>
        {resumen && (
          <p
            role="status"
            className={cn('text-sm font-semibold', resumen.ok ? 'text-te-deben' : 'text-debes')}
          >
            {resumen.texto}
          </p>
        )}
      </fieldset>

      <div className="grid gap-2">
        <Field
          id="gasto-fecha"
          label="Fecha"
          type="date"
          max={hoy()}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          error={errores.fecha}
        />
        <div className="flex gap-2">
          <button type="button" className={chip(fecha === hoy())} onClick={() => setFecha(hoy())}>
            Hoy
          </button>
          <button type="button" className={chip(fecha === ayer())} onClick={() => setFecha(ayer())}>
            Ayer
          </button>
        </div>
      </div>

      {errorApi && (
        <p
          role="alert"
          className="rounded-[10px] bg-debes/10 px-4 py-3 text-sm font-medium text-debes"
        >
          {errorApi}
        </p>
      )}

      <Button type="submit" className="h-12" disabled={guardar.isPending || !listo}>
        {guardar.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
        {guardar.isPending ? 'Guardando…' : 'Guardar gasto'}
      </Button>
    </form>
  );
}
