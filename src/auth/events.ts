// Bus mínimo de eventos de sesión: el cliente HTTP avisa y AuthProvider reacciona,
// sin que `api/` dependa de React.

/** Recibe el token con el que se hizo el pedido rechazado (null si no llevaba). */
type Listener = (tokenUsado: string | null) => void;
const listeners = new Set<Listener>();

export const authEvents = {
  /** Se suscribe a "la sesión dejó de ser válida". Devuelve la función para desuscribirse. */
  onSesionInvalida(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  emitSesionInvalida(tokenUsado: string | null): void {
    for (const fn of [...listeners]) fn(tokenUsado);
  },
};
