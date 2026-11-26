import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './client';
import { grupoKeys } from './grupos';
import type { Balance, GrupoDetalle, NuevoPago, Pago, Transferencia } from './types';

// Rutas del H4 (api-contract.md). El token lo agrega apiRequest.
const base = (id: string) => `/grupos/${encodeURIComponent(id)}`;

export const balancesApi = {
  balances: (id: string) =>
    apiRequest<{ balances: Balance[] }>('GET', `${base(id)}/balances`).then((r) => r.balances),
  liquidacion: (id: string) =>
    apiRequest<{ transferencias: Transferencia[] }>('GET', `${base(id)}/liquidacion`).then(
      (r) => r.transferencias,
    ),
  pagos: (id: string) =>
    apiRequest<{ pagos: Pago[] }>('GET', `${base(id)}/pagos`).then((r) => r.pagos),
  registrarPago: (id: string, body: NuevoPago) =>
    apiRequest<{ pago: Pago }>('POST', `${base(id)}/pagos`, { body }).then((r) => r.pago),
  eliminarPago: (id: string, pagoId: string) =>
    apiRequest<void>('DELETE', `${base(id)}/pagos/${encodeURIComponent(pagoId)}`),
  archivar: (id: string) =>
    apiRequest<{ grupo: GrupoDetalle }>('POST', `${base(id)}/archivar`).then((r) => r.grupo),
};

export const balanceKeys = {
  balances: (id: string) => [...grupoKeys.detalle(id), 'balances'] as const,
  liquidacion: (id: string) => [...grupoKeys.detalle(id), 'liquidacion'] as const,
  pagos: (id: string) => [...grupoKeys.detalle(id), 'pagos'] as const,
};

export const useBalances = (id: string) =>
  useQuery({ queryKey: balanceKeys.balances(id), queryFn: () => balancesApi.balances(id) });
export const useLiquidacion = (id: string) =>
  useQuery({ queryKey: balanceKeys.liquidacion(id), queryFn: () => balancesApi.liquidacion(id) });
export const usePagos = (id: string) =>
  useQuery({ queryKey: balanceKeys.pagos(id), queryFn: () => balancesApi.pagos(id) });

/** Un pago o un archivo cambian todo lo del grupo y el balance de "Mis grupos". */
function useMutacionDeGrupo<T, R>(id: string, fn: (v: T) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: grupoKeys.detalle(id) }),
        queryClient.invalidateQueries({ queryKey: grupoKeys.todos, exact: true }),
      ]),
  });
}

export const useRegistrarPago = (id: string) =>
  useMutacionDeGrupo(id, (body: NuevoPago) => balancesApi.registrarPago(id, body));
export const useEliminarPago = (id: string) =>
  useMutacionDeGrupo(id, (pagoId: string) => balancesApi.eliminarPago(id, pagoId));
export const useArchivar = (id: string) => useMutacionDeGrupo(id, () => balancesApi.archivar(id));
