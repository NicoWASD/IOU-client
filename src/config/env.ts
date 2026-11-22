/** URL base de la API (incluye `/api`). Vite la incrusta al compilar. */
export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (!url) throw new Error('Falta VITE_API_URL');
  return url;
}
