import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation('auth');

  return (
    <div className="flex h-screen">
      {/* Left side - Welcome message */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <h1 className="text-5xl font-bold mb-6">Join Our Community</h1>
          <p className="text-xl">
            Create your account and start booking your appointments with ease.
          </p>
          <ul className="mt-8 space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <span>Easy online booking 24/7</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <span>Exclusive member discounts</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <span>Loyalty rewards program</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">{t('register.title')}</h2>
            <p className="text-muted-foreground mt-2">{t('register.subtitle')}</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('register.fullName')}</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('register.email')}</label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('register.phoneNumber')}</label>
              <input
                type="tel"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('register.password')}</label>
              <input
                type="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('register.confirmPassword')}
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <label className="text-sm text-muted-foreground">
                {t('register.terms')}{' '}
                <a href="#" className="text-primary hover:underline">
                  {t('register.termsOfService')}
                </a>{' '}
                {t('register.and')}{' '}
                <a href="#" className="text-primary hover:underline">
                  {t('register.privacyPolicy')}
                </a>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90"
            >
              {t('register.createAccount')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('register.alreadyHaveAccount')}{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                {t('register.signIn')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
