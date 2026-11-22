import { getApiUrl } from '@/config/env';

/** Une base y path sin barras dobles ni faltantes. */
export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** El cold start de Render puede tardar hasta ~60 s: el timeout por defecto lo cubre. */
export const DEFAULT_TIMEOUT_MS = 70_000;

type ApiErrorBody = { error?: { message?: string } };

export async function apiGet<T>(path: string, opts: { timeoutMs?: number } = {}): Promise<T> {
  const res = await fetch(joinUrl(getApiUrl(), path), {
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });
  const body = (await res.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!res.ok) {
    const message = (body as ApiErrorBody | null)?.error?.message;
    throw new Error(message ?? `Error ${res.status}`);
  }
  return body as T;
}
