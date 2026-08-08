import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useLogin } from '~/api/auth';

import { Banner, LoginFormView } from './components';
import { createLoginSchema, LOGIN_DEFAULT_VALUES, type LoginFormSchema } from './constants';

export function LoginScreen() {
  const { t } = useTranslation('auth');
  const { mutate: login, isPending, error } = useLogin();

  const schema = useMemo(() => createLoginSchema(t), [t]);
  const methods = useForm<LoginFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: LOGIN_DEFAULT_VALUES,
  });

  function onSubmit(data: LoginFormSchema) {
    login(data);
  }

  const errorMessage = error ? error.message || t('errors.loginFailed') : undefined;

  return (
    <div className="relative box-border flex min-h-screen w-full max-w-[100vw] min-w-0 flex-col items-center justify-center gap-4 overflow-x-hidden bg-background px-4 py-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-6 lg:px-6">
      <Banner />

      <div className="relative flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] min-h-0 w-full min-w-0 flex-col justify-center">
        <div className="mx-auto flex w-full max-w-md flex-col items-stretch justify-center gap-3">
          <LoginFormView
            methods={methods}
            onSubmit={onSubmit}
            isPending={isPending}
            errorMessage={errorMessage}
          />
        </div>
      </div>

      <img
        src="/login-topo-top.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 w-full text-foreground lg:hidden"
      />
      <img
        src="/login-topo-bottom.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 w-full text-foreground lg:hidden"
      />
    </div>
  );
}
