import { useLocation } from 'react-router';

/** A dónde volver después de ingresar: la ruta que RequireAuth guardó, o Mis grupos. */
export function useDestinoPostLogin(): string {
  const location = useLocation();
  const from = (location.state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && from.startsWith('/') ? from : '/grupos';
}
