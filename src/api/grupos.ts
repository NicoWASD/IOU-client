import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiRequest, esErrorDelCliente } from './client';
import type { EdicionGrupo, GrupoDetalle, GrupoResumen, Miembro, NuevoGrupo } from './types';

// Rutas del H2 (api-contract.md). El token lo agrega apiRequest.
const grupoPath = (id: string) => `/grupos/${encodeURIComponent(id)}`;

export const gruposApi = {
  listar: () => apiRequest<{ grupos: GrupoResumen[] }>('GET', '/grupos').then((r) => r.grupos),
  crear: (body: NuevoGrupo) =>
    apiRequest<{ grupo: GrupoDetalle }>('POST', '/grupos', { body }).then((r) => r.grupo),
  detalle: (id: string) =>
    apiRequest<{ grupo: GrupoDetalle }>('GET', grupoPath(id)).then((r) => r.grupo),
  editar: (id: string, body: EdicionGrupo) =>
    apiRequest<{ grupo: GrupoDetalle }>('PATCH', grupoPath(id), { body }).then((r) => r.grupo),
  miembros: (id: string) =>
    apiRequest<{ miembros: Miembro[] }>('GET', `${grupoPath(id)}/miembros`).then(
      (r) => r.miembros,
    ),
  agregarMiembro: (id: string, email: string) =>
    apiRequest<{ miembro: Miembro }>('POST', `${grupoPath(id)}/miembros`, {
      body: { email },
    }).then((r) => r.miembro),
  quitarMiembro: (id: string, usuarioId: string) =>
    apiRequest<void>('DELETE', `${grupoPath(id)}/miembros/${encodeURIComponent(usuarioId)}`),
};

export const grupoKeys = {
  todos: ['grupos'] as const,
  detalle: (id: string) => ['grupos', id] as const,
  miembros: (id: string) => ['grupos', id, 'miembros'] as const,
};

/** Un 4xx (404, 403...) no se reintenta; un error de red, una vez. */
const reintentar = (fallos: number, err: unknown) => !esErrorDelCliente(err) && fallos < 1;

export function useGrupos() {
  return useQuery({ queryKey: grupoKeys.todos, queryFn: gruposApi.listar, retry: reintentar });
}

export function useGrupo(id: string) {
  return useQuery({
    queryKey: grupoKeys.detalle(id),
    queryFn: () => gruposApi.detalle(id),
    enabled: id !== '',
    retry: reintentar,
  });
}

export function useMiembros(id: string) {
  return useQuery({
    queryKey: grupoKeys.miembros(id),
    queryFn: () => gruposApi.miembros(id),
    enabled: id !== '',
    retry: reintentar,
  });
}

export function useCrearGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gruposApi.crear,
    onSuccess: async (grupo) => {
      // El detalle ya viene en la respuesta: la pantalla del grupo nuevo abre sin esqueleto.
      queryClient.setQueryData(grupoKeys.detalle(grupo.id), grupo);
      await queryClient.invalidateQueries({ queryKey: grupoKeys.todos, exact: true });
    },
  });
}

export function useEditarGrupo(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EdicionGrupo) => gruposApi.editar(id, body),
    onSuccess: async (grupo) => {
      queryClient.setQueryData(grupoKeys.detalle(id), grupo);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: grupoKeys.todos, exact: true }),
        queryClient.invalidateQueries({ queryKey: grupoKeys.detalle(id), exact: true }),
      ]);
    },
  });
}

/** Después de un alta o una baja cambian los miembros, el detalle y los avatares de la lista. */
function invalidarMiembros(queryClient: QueryClient, id: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: grupoKeys.miembros(id) }),
    queryClient.invalidateQueries({ queryKey: grupoKeys.detalle(id), exact: true }),
    queryClient.invalidateQueries({ queryKey: grupoKeys.todos, exact: true }),
  ]);
}

export function useAgregarMiembro(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => gruposApi.agregarMiembro(id, email),
    onSuccess: () => invalidarMiembros(queryClient, id),
  });
}

export function useQuitarMiembro(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (usuarioId: string) => gruposApi.quitarMiembro(id, usuarioId),
    onSuccess: () => invalidarMiembros(queryClient, id),
  });
}
