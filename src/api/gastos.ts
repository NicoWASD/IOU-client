import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './client';
import { grupoKeys } from './grupos';
import type { GastoDetalle, NuevoGasto, PaginaGastos } from './types';

// Rutas del H3 (api-contract.md). El token lo agrega apiRequest.
const base = (grupoId: string) => `/grupos/${encodeURIComponent(grupoId)}/gastos`;
const uno = (grupoId: string, gastoId: string) => `${base(grupoId)}/${encodeURIComponent(gastoId)}`;

export const PAGE_SIZE = 20;

export const gastosApi = {
  listar: (grupoId: string, page: number) =>
    apiRequest<PaginaGastos>('GET', `${base(grupoId)}?page=${page}&pageSize=${PAGE_SIZE}`),
  detalle: (grupoId: string, gastoId: string) =>
    apiRequest<{ gasto: GastoDetalle }>('GET', uno(grupoId, gastoId)).then((r) => r.gasto),
  crear: (grupoId: string, body: NuevoGasto) =>
    apiRequest<{ gasto: GastoDetalle }>('POST', base(grupoId), { body }).then((r) => r.gasto),
  editar: (grupoId: string, gastoId: string, body: NuevoGasto) =>
    apiRequest<{ gasto: GastoDetalle }>('PUT', uno(grupoId, gastoId), { body }).then(
      (r) => r.gasto,
    ),
  eliminar: (grupoId: string, gastoId: string) => apiRequest<void>('DELETE', uno(grupoId, gastoId)),
};

export const gastoKeys = {
  lista: (grupoId: string) => [...grupoKeys.detalle(grupoId), 'gastos'] as const,
  detalle: (grupoId: string, gastoId: string) =>
    [...grupoKeys.detalle(grupoId), 'gasto', gastoId] as const,
};

/** Páginas de 20 (CA-15.2), con "Ver más". */
export function useGastos(grupoId: string) {
  return useInfiniteQuery({
    queryKey: gastoKeys.lista(grupoId),
    queryFn: ({ pageParam }) => gastosApi.listar(grupoId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (ultima) =>
      ultima.page * ultima.pageSize < ultima.total ? ultima.page + 1 : undefined,
  });
}

export function useGasto(grupoId: string, gastoId: string | null) {
  return useQuery({
    queryKey: gastoKeys.detalle(grupoId, gastoId ?? ''),
    queryFn: () => gastosApi.detalle(grupoId, gastoId ?? ''),
    enabled: gastoId !== null,
  });
}

/** Un gasto cambia la lista y, desde el H4, los balances: se invalida todo lo del grupo. */
function useInvalidarGrupo(grupoId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      // Prefijo del grupo: gastos, balances, liquidación y el detalle
      queryClient.invalidateQueries({ queryKey: grupoKeys.detalle(grupoId) }),
      queryClient.invalidateQueries({ queryKey: grupoKeys.todos, exact: true }),
    ]);
}

export function useGuardarGasto(grupoId: string, gastoId?: string) {
  const queryClient = useQueryClient();
  const invalidar = useInvalidarGrupo(grupoId);
  return useMutation({
    mutationFn: (body: NuevoGasto) =>
      gastoId ? gastosApi.editar(grupoId, gastoId, body) : gastosApi.crear(grupoId, body),
    onSuccess: (gasto) => {
      queryClient.setQueryData(gastoKeys.detalle(grupoId, gasto.id), gasto);
      void invalidar();
    },
  });
}

export function useEliminarGasto(grupoId: string) {
  const queryClient = useQueryClient();
  const invalidar = useInvalidarGrupo(grupoId);
  return useMutation({
    mutationFn: (gastoId: string) => gastosApi.eliminar(grupoId, gastoId),
    onSuccess: (_, gastoId) => {
      queryClient.removeQueries({ queryKey: gastoKeys.detalle(grupoId, gastoId) });
      void invalidar();
    },
  });
}
