import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PLATAFORMAS, useMediosDe, type MedioCobro } from '@/api/social';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** Copia al portapapeles; si el navegador no deja, selecciona el texto para copiarlo a mano. */
async function copiar(texto: string, el: HTMLElement | null) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    if (el) {
      const rango = document.createRange();
      rango.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(rango);
    }
    toast('Mantené apretado el texto para copiarlo');
    return false;
  }
}

function Fila({ medio }: { medio: MedioCobro }) {
  const [copiado, setCopiado] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);
  return (
    <li className="flex min-h-14 items-center gap-3 border-t border-rule px-3 py-2 first:border-t-0">
      <div className="grid min-w-0 flex-1">
        <span className="text-xs font-semibold text-pencil uppercase">
          {PLATAFORMAS[medio.plataforma]}
        </span>
        <code ref={setRef} className="truncate font-mono text-base font-semibold select-all">
          {medio.valor}
        </code>
        {medio.nota && <span className="truncate text-sm text-pencil">{medio.nota}</span>}
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-11 min-w-[104px]"
        aria-label={`Copiar ${medio.valor}`}
        onClick={async () => {
          if (await copiar(medio.valor, ref)) {
            setCopiado(true);
            toast.success('Copiado');
            setTimeout(() => setCopiado(false), 1800);
          }
        }}
      >
        {copiado ? (
          <Check aria-hidden="true" className="text-te-deben" />
        ) : (
          <Copy aria-hidden="true" />
        )}
        {copiado ? 'Copiado' : 'Copiar'}
      </Button>
    </li>
  );
}

/** Al saldar (HU-35): los medios de cobro de quien recibe, para transferirle desde el celu. */
export function MediosDeCobro({ usuarioId, nombre }: { usuarioId: string; nombre: string }) {
  const medios = useMediosDe(usuarioId);
  return (
    <section
      aria-labelledby="medios-cobro"
      className="grid gap-2 rounded-[14px] bg-birome-soft p-3"
    >
      <h3 id="medios-cobro" className="text-sm font-semibold">
        Cómo pagarle a {nombre}
      </h3>
      {medios.isPending ? (
        <Skeleton className="h-14 bg-muted" />
      ) : medios.isError || medios.data.length === 0 ? (
        <p className="text-sm text-pencil">
          {nombre} todavía no cargó cómo cobrar. Pedile el alias por mensaje.
        </p>
      ) : (
        <ul className="rounded-[12px] border border-rule bg-surface">
          {medios.data.map((m, i) => (
            <Fila key={i} medio={m} />
          ))}
        </ul>
      )}
    </section>
  );
}
