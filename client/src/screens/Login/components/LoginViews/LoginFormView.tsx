import { type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

import { FormElements } from '~/components/form-elements';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';

import type { LoginFormSchema } from '../../constants';
import { LoginViewAlert } from '../LoginViewAlert';
import { ViewTransition } from './ViewTransition';

type LoginFormViewProps = {
  methods: UseFormReturn<LoginFormSchema>;
  onSubmit: (data: LoginFormSchema) => void;
  isPending: boolean;
  errorMessage?: string;
};

export function LoginFormView({ methods, onSubmit, isPending, errorMessage }: LoginFormViewProps) {
  const { t } = useTranslation('auth');
  const { handleSubmit, control } = methods;

  return (
    <ViewTransition
      keyName="form"
      className="flex w-full max-w-md flex-col items-stretch gap-6 text-left"
    >
      <div>
        <h1 className="text-3xl font-bold">{t('login.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('login.subtitle')}</p>
      </div>

      {errorMessage ? <LoginViewAlert description={errorMessage} /> : null}

      <Form {...methods}>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormElements.Input
              control={control}
              required
              name="email"
              type="email"
              autoComplete="email"
              label={t('login.email')}
              placeholder="you@example.com"
              disabled={isPending}
            />
            <FormElements.Input
              control={control}
              required
              name="password"
              type="password"
              autoComplete="current-password"
              label={t('login.password')}
              placeholder="••••••••"
              disabled={isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t('login.signingIn') : t('login.signIn')}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          {t('login.signUp')}
        </Link>
      </p>
    </ViewTransition>
  );
}
