import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import { authApi, type AuthResponse, type Usuario } from '@/api/auth';
import { ApiError } from '@/api/client';
import { authEvents } from './events';
import { tokenStore } from './tokenStore';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error';

type AuthContextValue = {
  status: AuthStatus;
  usuario: Usuario | null;
  login(email: string, password: string): Promise<void>;
  register(nombre: string, email: string, password: string): Promise<void>;
  logout(): void;
  retry(): void;
  /** La sesión anterior venció o dejó de ser válida: el login lo avisa (CA-03.2). */
  sesionExpirada: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESION_INVALIDA = new Set(['TOKEN_EXPIRADO', 'TOKEN_INVALIDO', 'NO_AUTENTICADO']);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [sesionExpirada, setSesionExpirada] = useState(false);

  const me = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: () => authApi.me(token as string).then((r) => r.usuario),
    enabled: token !== null,
    staleTime: Infinity,
    retry: false,
  });

  // Token vencido o inválido: se descarta junto con los datos del usuario, y RequireAuth
  // redirige al login con el aviso (CA-03.2).
  const sesionVencida = useCallback(() => {
    tokenStore.clear();
    queryClient.clear();
    setSesionExpirada(true);
    setToken(null);
  }, [queryClient]);

  useEffect(() => {
    const err = me.error;
    if (err instanceof ApiError && SESION_INVALIDA.has(err.code)) sesionVencida();
  }, [me.error, sesionVencida]);

  // Cualquier pedido a la API que responda 401 TOKEN_EXPIRADO o TOKEN_INVALIDO (api/client.ts).
  // Si el pedido usó un token que ya no es el guardado (llegó tarde de una sesión anterior),
  // no se cierra la sesión actual.
  useEffect(
    () =>
      authEvents.onSesionInvalida((tokenUsado) => {
        if (tokenUsado === tokenStore.get()) sesionVencida();
      }),
    [sesionVencida],
  );

  const iniciar = useCallback(
    ({ token: nuevo, usuario }: AuthResponse) => {
      tokenStore.set(nuevo);
      queryClient.setQueryData(['auth', 'me', nuevo], usuario);
      setSesionExpirada(false);
      setToken(nuevo);
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(() => {
    let status: AuthStatus;
    if (token === null) status = 'anonymous';
    else if (me.data) status = 'authenticated';
    else if (me.isError && !(me.error instanceof ApiError && SESION_INVALIDA.has(me.error.code)))
      status = 'error';
    else status = 'loading';

    return {
      status,
      usuario: me.data ?? null,
      login: async (email, password) => iniciar(await authApi.login({ email, password })),
      register: async (nombre, email, password) =>
        iniciar(await authApi.register({ nombre, email, password })),
      logout: () => {
        tokenStore.clear();
        setToken(null);
        queryClient.clear();
        void navigate('/ingresar', { replace: true });
      },
      retry: () => void me.refetch(),
      sesionExpirada,
    };
  }, [token, me, iniciar, queryClient, navigate, sesionExpirada]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  return ctx;
}
