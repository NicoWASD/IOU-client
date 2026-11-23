// Bus mínimo de eventos de sesión: el cliente HTTP avisa y AuthProvider reacciona,
// sin que `api/` dependa de React.

type Listener = () => void;
const listeners = new Set<Listener>();

export const authEvents = {
  /** Se suscribe a "la sesión dejó de ser válida". Devuelve la función para desuscribirse. */
  onSesionInvalida(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  emitSesionInvalida(): void {
    for (const fn of [...listeners]) fn();
  },
};
