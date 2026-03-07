import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useLogin } from '~/api/auth';

const loginSchema = z.object({
  email: z.string().email({ message: 'errors.invalidEmail' }),
  password: z.string().min(6, { message: 'errors.minLength' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const { t } = useTranslation('auth');
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginFormData) {
    login(data);
  }

  return (
    <div className="flex h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <h1 className="text-5xl font-bold mb-6">Welcome Back</h1>
          <p className="text-xl">
            Sign in to manage your appointments and access exclusive member benefits.
          </p>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">{t('login.title')}</h2>
            <p className="text-muted-foreground mt-2">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error.message || t('errors.loginFailed')}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium mb-2">{t('login.email')}</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{t(errors.email.message ?? '')}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">{t('login.password')}</label>
                <a href="#" className="text-sm text-primary hover:underline">
                  {t('login.forgotPassword')}
                </a>
              </div>
              <input
                type="password"
                {...register('password')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{t(errors.password.message ?? '')}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Signing in...' : t('login.signIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                {t('login.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
