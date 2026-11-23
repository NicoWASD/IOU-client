import type { UsuarioRef } from '@/api/types';
import { iniciales, listarNombres, tonoDe } from '@/lib/avatar';
import { cn } from '@/lib/utils';

type AvatarProps = {
  usuario: UsuarioRef;
  size?: 'sm' | 'md';
  /** En pilas y listas el nombre ya está escrito al lado: el avatar es decorativo. */
  decorativo?: boolean;
  className?: string;
};

export function Avatar({ usuario, size = 'md', decorativo = true, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-grid flex-none place-items-center rounded-full font-bold text-(--av-ink) select-none',
        size === 'md' ? 'size-9 text-sm' : 'size-7 text-xs',
        className,
      )}
      style={{ background: `var(--av${tonoDe(usuario.id)})` }}
      {...(decorativo ? { 'aria-hidden': true } : { role: 'img', 'aria-label': usuario.nombre })}
    >
      {iniciales(usuario.nombre)}
    </span>
  );
}

/** Avatares superpuestos (hasta `max`, el resto como "+N"), con los nombres para lectores. */
export function AvatarPila({ usuarios, max = 4 }: { usuarios: UsuarioRef[]; max?: number }) {
  const visibles = usuarios.slice(0, max);
  const resto = usuarios.length - visibles.length;
  return (
    <span className="flex">
      <span className="sr-only">{listarNombres(usuarios.map((u) => u.nombre))}</span>
      {visibles.map((u) => (
        <Avatar
          key={u.id}
          usuario={u}
          size="sm"
          className="-ml-2 border-2 border-surface first:ml-0"
        />
      ))}
      {resto > 0 && (
        <span
          aria-hidden="true"
          className="-ml-2 inline-grid size-7 place-items-center rounded-full border-2 border-surface bg-paper text-xs font-semibold text-pencil"
        >
          +{resto}
        </span>
      )}
    </span>
  );
}
