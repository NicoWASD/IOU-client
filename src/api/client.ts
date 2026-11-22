import { getApiUrl } from '@/config/env';

/** Une base y path sin barras dobles ni faltantes. */
export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** El cold start de Render puede tardar hasta ~60 s: el timeout por defecto lo cubre. */
export const DEFAULT_TIMEOUT_MS = 70_000;

/** Error con el formato de la API: `{ error: { code, message, details? } }`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string>;

  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ErrorBody = { error?: { code?: string; message?: string; details?: Record<string, string> } };

export async function apiRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  opts: { body?: unknown; token?: string | null; timeoutMs?: number } = {},
): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });
  if (opts.body !== undefined) headers.set('Content-Type', 'application/json');
  if (opts.token) headers.set('Authorization', `Bearer ${opts.token}`);

  let res: Response;
  try {
    res = await fetch(joinUrl(getApiUrl(), path), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No hay conexión con el servidor');
  }

  const data = (await res.json().catch(() => null)) as T | ErrorBody | null;
  if (!res.ok) {
    const e = (data as ErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      e?.code ?? 'ERROR',
      e?.message ?? `Error ${res.status}`,
      e?.details,
    );
  }
  return data as T;
}
