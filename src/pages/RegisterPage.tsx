import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthProvider';
import { useDestinoPostLogin } from '@/auth/useAuthRedirect';
import { AuthLayout } from '@/components/AuthLayout';
import { Field } from '@/components/forms/Field';
import { Button } from '@/components/ui/button';
import { fieldErrors, registerSchema, type FieldErrors } from '@/schemas/auth';

type Campo = 'usuario' | 'email' | 'password';

export function RegisterPage() {
  const { status, register } = useAuth();
  const navigate = useNavigate();
  const destino = useDestinoPostLogin();
  const [form, setForm] = useState({ usuario: '', email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (status === 'authenticated') return <Navigate to={destino} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const invalid = fieldErrors(registerSchema, form);
    setErrors(invalid ?? {});
    if (invalid) return;
    setEnviando(true);
    try {
      await register(
        form.usuario.trim().toLowerCase().replace(/^@/, ''),
        form.email.trim(),
        form.password,
      );
      await navigate(destino, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_EN_USO') {
        setErrors({ email: err.message });
      } else if (err instanceof ApiError && err.code === 'USUARIO_EN_USO') {
        setErrors({ usuario: err.message });
      } else if (err instanceof ApiError && err.details) {
        setErrors(err.details);
      } else {
        setFormError(
          err instanceof ApiError ? err.message : 'No pudimos crear la cuenta. Probá de nuevo.',
        );
      }
      setEnviando(false);
    }
  }

  const set = (campo: Campo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold tracking-tight">Creá tu cuenta</h1>
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
          id="usuario"
          label="Nombre de usuario"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="@tu.usuario"
          hint="Así te encuentran para invitarte. Letras, números, punto o guion bajo."
          value={form.usuario}
          onChange={set('usuario')}
          error={errors.usuario}
        />
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
          autoComplete="new-password"
          hint="Al menos 8 caracteres."
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />
        <Button type="submit" className="h-11" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="text-sm text-pencil">
        ¿Ya tenés cuenta?{' '}
        <Link
          to="/ingresar"
          className="font-semibold text-birome underline-offset-4 hover:underline"
        >
          Ingresá
        </Link>
      </p>
    </AuthLayout>
  );
}
