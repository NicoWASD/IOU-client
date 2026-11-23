const KEY = 'iou.token';

// Respaldo en memoria para cuando localStorage no está disponible (navegación privada, bloqueos).
let memoria: string | null = null;

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY) ?? memoria;
    } catch {
      return memoria;
    }
  },
  set(token: string): void {
    memoria = token;
    try {
      localStorage.setItem(KEY, token);
    } catch {
      /* queda en memoria */
    }
  },
  clear(): void {
    memoria = null;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nada que borrar */
    }
  },
};
