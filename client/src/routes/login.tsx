import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation('auth');

  return (
    <div className="flex h-screen">
      {/* Left side - Welcome message */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <h1 className="text-5xl font-bold mb-6">Welcome Back</h1>
          <p className="text-xl">
            Sign in to manage your appointments and access exclusive member benefits.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">{t('login.title')}</h2>
            <p className="text-muted-foreground mt-2">{t('login.subtitle')}</p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t('login.email')}</label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90"
            >
              {t('login.signIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('login.noAccount')}{' '}
              <a href="/register" className="text-primary hover:underline font-medium">
                {t('login.signUp')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
