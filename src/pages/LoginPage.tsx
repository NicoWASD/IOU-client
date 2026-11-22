import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthProvider';
import { useDestinoPostLogin } from '@/auth/useAuthRedirect';
import { AuthLayout } from '@/components/AuthLayout';
import { Field } from '@/components/forms/Field';
import { Button } from '@/components/ui/button';
import { fieldErrors, loginSchema, type FieldErrors } from '@/schemas/auth';

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const destino = useDestinoPostLogin();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (status === 'authenticated') return <Navigate to={destino} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const invalid = fieldErrors(loginSchema, form);
    setErrors(invalid ?? {});
    if (invalid) return;
    setEnviando(true);
    try {
      await login(form.email.trim(), form.password);
      await navigate(destino, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      setFormError(err instanceof ApiError ? err.message : 'No pudimos ingresar. Probá de nuevo.');
      setEnviando(false);
    }
  }

  const set = (campo: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold tracking-tight">Ingresá a IOU</h1>
      {params.get('sesion') === 'expirada' && !formError && (
        <p role="status" className="rounded-[10px] bg-birome-soft px-4 py-3 text-sm font-medium">
          Tu sesión expiró. Ingresá de nuevo.
        </p>
      )}
      <form noValidate onSubmit={onSubmit} className="grid gap-4">
        {formError && (
          <p
            role="alert"
            className="rounded-[10px] bg-debes/10 px-4 py-3 text-sm font-medium text-debes"
          >
            {formError}
          </p>
        )}
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />
        <Field
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />
        <Button type="submit" className="h-11" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
      <p className="text-sm text-pencil">
        ¿No tenés cuenta?{' '}
        <Link
          to="/registrarme"
          className="font-semibold text-birome underline-offset-4 hover:underline"
        >
          Creala en un minuto
        </Link>
      </p>
    </AuthLayout>
  );
}
