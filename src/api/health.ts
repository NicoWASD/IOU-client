import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/config/env';
import { DEFAULT_TIMEOUT_MS, joinUrl } from './client';

export type HealthResponse = { status: 'ok' | 'error'; db: 'ok' | 'error' };

/**
 * Un 503 es una respuesta válida: la API contestó pero la DB no.
 * Solo un error de red o timeout significa "la API no responde".
 */
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(joinUrl(getApiUrl(), '/health'), {
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  if (res.ok || res.status === 503) return (await res.json()) as HealthResponse;
  throw new Error(`Error ${res.status}`);
}

export function useHealth() {
  return useQuery({ queryKey: ['health'], queryFn: fetchHealth });
}
