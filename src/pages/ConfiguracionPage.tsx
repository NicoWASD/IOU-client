import { Loader2, LogOut, Monitor, Moon, Plus, Sun, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import {
  MAX_MEDIOS,
  PLATAFORMAS,
  useActualizarPerfil,
  useGuardarMedios,
  useMisMedios,
  type MedioCobro,
  type Plataforma,
} from '@/api/social';
import { useAuth } from '@/auth/AuthProvider';
import { ErrorCarga } from '@/components/estados/Estados';
import { Field } from '@/components/forms/Field';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { useFocoTitulo } from '@/hooks/useFocoTitulo';
import { aplicarTema, temaGuardado, type Tema } from '@/lib/tema';
import { cn } from '@/lib/utils';
import { usuarioSchema } from '@/schemas/auth';

const SECCION = 'grid gap-4 rounded-[14px] border border-rule bg-surface p-4 sm:p-6';
const mensaje = (err: unknown, otro: string) => (err instanceof ApiError ? err.message : otro);

function Perfil() {
  const { usuario } = useAuth();
  const actualizar = useActualizarPerfil();
  const [form, setForm] = useState({
    usuario: usuario?.usuario ?? '',
    nombre: usuario?.nombreReal ?? '',
    apellido: usuario?.apellido ?? '',
  });
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const u = usuarioSchema.safeParse(form.usuario);
    if (!u.success) return setErrores({ usuario: u.error.issues[0]?.message ?? '' });
    setErrores({});
    try {
      await actualizar.mutateAsync({
        usuario: u.data,
        nombre: form.nombre,
        apellido: form.apellido,
      });
      toast.success('Guardamos tu perfil');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'USUARIO_EN_USO')
        setErrores({ usuario: err.message });
      else if (err instanceof ApiError && err.details) setErrores(err.details);
      else toast.error(mensaje(err, 'No pudimos guardar el perfil. Probá de nuevo.'));
    }
  }

  const set = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  return (
    <form noValidate onSubmit={guardar} aria-labelledby="perfil" className={SECCION}>
      <div className="grid gap-1">
        <h2 id="perfil" className="text-lg font-semibold">
          Perfil
        </h2>
        <p className="text-sm text-pencil">
          Si cargás tu nombre y apellido, el grupo te ve así. Si no, ve tu @usuario.
        </p>
      </div>
      <Field
        id="cfg-usuario"
        label="Nombre de usuario"
        autoCapitalize="none"
        spellCheck={false}
        value={form.usuario}
        onChange={set('usuario')}
        error={errores.usuario}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="cfg-nombre"
          label="Nombre (opcional)"
          autoComplete="given-name"
          value={form.nombre}
          onChange={set('nombre')}
          error={errores.nombre}
        />
        <Field
          id="cfg-apellido"
          label="Apellido (opcional)"
          autoComplete="family-name"
          value={form.apellido}
          onChange={set('apellido')}
          error={errores.apellido}
        />
      </div>
      <p className="text-sm text-pencil">Tu email ({usuario?.email}) no lo ve nadie al buscarte.</p>
      <Button type="submit" className="h-11 justify-self-start" disabled={actualizar.isPending}>
        {actualizar.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
        {actualizar.isPending ? 'Guardando…' : 'Guardar perfil'}
      </Button>
    </form>
  );
}

const vacio = (): MedioCobro => ({ plataforma: 'MERCADO_PAGO', valor: '', nota: null });

function Medios() {
  const medios = useMisMedios();
  const guardar = useGuardarMedios();
  const [lista, setLista] = useState<MedioCobro[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (medios.data && lista === null) setLista(medios.data);
  }, [medios.data, lista]);

  if (medios.isError)
    return (
      <section className={SECCION}>
        <ErrorCarga
          error={medios.error}
          que="tus medios de cobro"
          onReintentar={() => void medios.refetch()}
          reintentando={medios.isFetching}
        />
      </section>
    );

  const cambiar = (i: number, cambios: Partial<MedioCobro>) =>
    setLista((l) => l?.map((m, j) => (j === i ? { ...m, ...cambios } : m)) ?? null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!lista) return;
    const limpia = lista
      .map((m) => ({ ...m, valor: m.valor.trim(), nota: m.nota?.trim() || null }))
      .filter((m) => m.valor !== '');
    setError(null);
    try {
      setLista(await guardar.mutateAsync(limpia));
      toast.success('Guardamos tus medios de cobro');
    } catch (err) {
      setError(mensaje(err, 'No pudimos guardar los medios. Probá de nuevo.'));
    }
  }

  return (
    <form noValidate onSubmit={enviar} aria-labelledby="medios" className={SECCION}>
      <div className="grid gap-1">
        <h2 id="medios" className="text-lg font-semibold">
          Medios de cobro
        </h2>
        <p className="text-sm text-pencil">
          Cuando alguien te salde una deuda, ve estos datos y los copia con un toque. Solo los ve
          gente con la que compartís un grupo.
        </p>
      </div>
      {lista === null ? (
        <Skeleton className="h-24 bg-muted" />
      ) : (
        <>
          {lista.length === 0 && (
            <p className="text-pencil">
              Todavía no cargaste ninguno. Agregá tu alias de Mercado Pago o tu CVU.
            </p>
          )}
          <ul className="grid gap-3">
            {lista.map((m, i) => (
              <li
                key={i}
                className="grid gap-2 rounded-[12px] border border-rule p-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start"
              >
                <div className="grid min-w-0 gap-1.5">
                  <Label htmlFor={`medio-${i}-plat`} className="text-sm font-semibold">
                    Plataforma
                  </Label>
                  <select
                    id={`medio-${i}-plat`}
                    value={m.plataforma}
                    onChange={(e) => cambiar(i, { plataforma: e.target.value as Plataforma })}
                    className="h-11 w-full min-w-0 rounded-md border border-rule bg-surface px-3 text-sm"
                  >
                    {Object.entries(PLATAFORMAS).map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  id={`medio-${i}-valor`}
                  label="Alias, CVU o usuario"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={60}
                  value={m.valor}
                  onChange={(e) => cambiar(i, { valor: e.target.value })}
                />
                <Field
                  id={`medio-${i}-nota`}
                  label="Nota (opcional)"
                  maxLength={60}
                  placeholder="A nombre de…"
                  value={m.nota ?? ''}
                  onChange={(e) => cambiar(i, { nota: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 justify-self-end text-pencil sm:mt-[26px] hover:bg-debes/10 hover:text-debes"
                  aria-label={`Quitar el medio ${i + 1}`}
                  onClick={() => setLista((l) => l?.filter((_, j) => j !== i) ?? null)}
                >
                  <Trash2 aria-hidden="true" className="size-5" strokeWidth={1.75} />
                </Button>
              </li>
            ))}
          </ul>
          {error && (
            <p
              role="alert"
              className="rounded-[10px] bg-debes/10 px-4 py-3 text-sm font-medium text-debes"
            >
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={lista.length >= MAX_MEDIOS}
              onClick={() => setLista((l) => [...(l ?? []), vacio()])}
            >
              <Plus aria-hidden="true" /> Agregar medio
            </Button>
            <Button type="submit" className="h-11" disabled={guardar.isPending}>
              {guardar.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
              {guardar.isPending ? 'Guardando…' : 'Guardar medios'}
            </Button>
          </div>
          {lista.length >= MAX_MEDIOS && (
            <p className="text-sm text-pencil">Podés cargar hasta {MAX_MEDIOS} medios.</p>
          )}
        </>
      )}
    </form>
  );
}

const TEMAS: { valor: Tema; texto: string; Icono: typeof Sun }[] = [
  { valor: 'claro', texto: 'Claro', Icono: Sun },
  { valor: 'oscuro', texto: 'Oscuro', Icono: Moon },
  { valor: 'sistema', texto: 'Como el sistema', Icono: Monitor },
];

function Apariencia() {
  const [tema, setTema] = useState<Tema>(temaGuardado);
  return (
    <fieldset className={SECCION}>
      <legend className="float-left text-lg font-semibold">Apariencia</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {TEMAS.map(({ valor, texto, Icono }) => (
          <label
            key={valor}
            className={cn(
              'flex h-12 cursor-pointer items-center gap-3 rounded-[12px] border border-rule px-4 transition-colors',
              'has-[:checked]:border-birome has-[:checked]:bg-birome-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-birome',
            )}
          >
            <input
              type="radio"
              name="tema"
              value={valor}
              checked={tema === valor}
              onChange={() => {
                setTema(valor);
                aplicarTema(valor);
              }}
              className="sr-only"
            />
            <Icono aria-hidden="true" className="size-5" strokeWidth={1.75} />
            {texto}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Configuración (HU-34, HU-35, HU-36). */
export function ConfiguracionPage() {
  const ref = useFocoTitulo();
  const { logout } = useAuth();
  const actualizar = useActualizarPerfil();
  return (
    <div className="mx-auto grid max-w-[720px] gap-6">
      <h1 ref={ref} tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
        Configuración
      </h1>
      <Perfil />
      <Medios />
      <Apariencia />
      <section className={cn(SECCION, 'sm:grid-cols-2')}>
        <Button
          variant="outline"
          className="h-11"
          onClick={() =>
            actualizar.mutate(
              { tutorialVisto: false },
              { onSuccess: () => toast.success('Listo: Ticky te vuelve a guiar en Mis grupos') },
            )
          }
        >
          Ver la guía de nuevo
        </Button>
        <Button variant="outline" className="h-11 text-debes hover:bg-debes/10" onClick={logout}>
          <LogOut aria-hidden="true" /> Cerrar sesión
        </Button>
      </section>
    </div>
  );
}
