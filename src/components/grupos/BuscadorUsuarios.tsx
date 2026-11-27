import { Loader2, Search, UserPlus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import {
  useBuscarUsuarios,
  useCancelarInvitacion,
  useInvitacionesDelGrupo,
  useInvitar,
  type UsuarioBuscado,
} from '@/api/social';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const normalizar = (s: string) => s.trim().toLowerCase().replace(/^@/, '');

function useDebounce<T>(valor: T, ms: number) {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}

/**
 * Invitar por @usuario (HU-32): combobox que busca mientras se escribe (desde 2 caracteres,
 * 250 ms de espera). Elegir a alguien manda la invitación; la persona la acepta (RN-20).
 */
export function BuscadorUsuarios({ grupoId }: { grupoId: string }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const q = useDebounce(normalizar(texto), 250);
  const busqueda = useBuscarUsuarios(q, grupoId);
  const invitar = useInvitar(grupoId);
  const resultados = q.length >= 2 ? (busqueda.data ?? []) : [];
  const mostrarLista = abierto && q.length >= 2;

  async function elegir(u: UsuarioBuscado) {
    setError(null);
    try {
      await invitar.mutateAsync(u.id);
      toast.success(`Invitamos a @${u.usuario}. Cuando acepte, se suma al grupo.`);
      setTexto('');
      setAbierto(false);
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos invitar. Probá de nuevo.');
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!mostrarLista || resultados.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((i) => (i + 1) % resultados.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => (i - 1 + resultados.length) % resultados.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const u = resultados[activo];
      if (u) void elegir(u);
    } else if (e.key === 'Escape') setAbierto(false);
  }

  const listaId = `${id}-lista`;
  return (
    <div className="grid gap-1.5" data-tour="buscar-usuario">
      <Label htmlFor={`${id}-q`} className="text-sm font-semibold">
        Invitar por @usuario
      </Label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-pencil"
        />
        <Input
          ref={inputRef}
          id={`${id}-q`}
          role="combobox"
          aria-expanded={mostrarLista}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-activedescendant={
            mostrarLista && resultados[activo] ? `${id}-op-${activo}` : undefined
          }
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="@usuario"
          className="h-11 pl-9"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
            setActivo(0);
            setError(null);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={onKeyDown}
        />
        {mostrarLista && (
          <ul
            id={listaId}
            role="listbox"
            aria-label="Usuarios encontrados"
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-[12px] border border-rule bg-surface py-1 shadow-lg"
          >
            {busqueda.isFetching && resultados.length === 0 ? (
              <li className="flex items-center gap-2 px-4 py-3 text-sm text-pencil">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" /> Buscando…
              </li>
            ) : resultados.length === 0 ? (
              <li className="px-4 py-3 text-sm text-pencil">
                No encontramos a nadie con ese usuario.
              </li>
            ) : (
              resultados.map((u, i) => (
                <li
                  key={u.id}
                  id={`${id}-op-${i}`}
                  role="option"
                  aria-selected={i === activo}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => void elegir(u)}
                  className={cn(
                    'flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2',
                    i === activo && 'bg-birome-soft',
                  )}
                >
                  <Avatar usuario={u} size="sm" />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate font-semibold">{u.nombre}</span>
                    <span className="truncate text-sm text-pencil">@{u.usuario}</span>
                  </span>
                  {invitar.isPending && invitar.variables === u.id ? (
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <UserPlus aria-hidden="true" className="size-4 text-birome" />
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-debes">
          {error}
        </p>
      ) : (
        <p className="text-sm text-pencil">
          Escribí al menos 2 letras. La persona tiene que aceptar.
        </p>
      )}
    </div>
  );
}

/** Invitaciones pendientes del grupo, para el admin, con "Cancelar". */
export function InvitacionesPendientes({ grupoId }: { grupoId: string }) {
  const pendientes = useInvitacionesDelGrupo(grupoId, true);
  const cancelar = useCancelarInvitacion(grupoId);
  const lista = pendientes.data ?? [];
  if (lista.length === 0) return null;
  return (
    <section aria-labelledby="pendientes" className="grid gap-2">
      <h2 id="pendientes" className="text-sm font-semibold text-pencil">
        Esperando respuesta
      </h2>
      <ul className="rounded-[14px] border border-dashed border-rule bg-surface">
        {lista.map((inv) => (
          <li
            key={inv.id}
            className="flex min-h-14 items-center gap-3 border-t border-rule px-4 py-2 first:border-t-0"
          >
            <Avatar usuario={inv.invitado} size="sm" className="opacity-70" />
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-semibold">{inv.invitado.nombre}</span>
              <span className="truncate text-sm text-pencil">
                @{inv.invitado.usuario} · invitado
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-pencil hover:text-debes"
              aria-label={`Cancelar la invitación a @${inv.invitado.usuario}`}
              disabled={cancelar.isPending}
              onClick={() => cancelar.mutate(inv.id)}
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
