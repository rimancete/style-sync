import { useMemo } from 'react';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { useLogin } from '~/api/auth';

import { Banner, LoginFormView } from './components';
import { createLoginSchema, LOGIN_DEFAULT_VALUES, type LoginFormSchema } from './constants';

const HTTP_UNPROCESSABLE_ENTITY = 422;
const HTTP_TOO_MANY_REQUESTS = 429;

const LOGIN_FIELD_NAMES = ['email', 'password'] as const;

type LoginFieldName = (typeof LOGIN_FIELD_NAMES)[number];

type LoginScreenProps = {
  redirect?: string;
};

export function LoginScreen({ redirect }: LoginScreenProps) {
  const { t } = useTranslation('auth');
  const { mutate: login, isPending, error } = useLogin(redirect);

  const schema = useMemo(() => createLoginSchema(t), [t]);
  const methods = useForm<LoginFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: LOGIN_DEFAULT_VALUES,
  });

  function onSubmit(data: LoginFormSchema) {
    login(data, {
      onError: (apiError) => {
        applyLoginFieldErrors(apiError, methods.setError, t);
      },
    });
  }

  return (
    <div className="relative box-border flex min-h-screen w-full max-w-[100vw] min-w-0 flex-col items-center justify-center gap-4 overflow-x-hidden bg-background px-4 py-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-6 lg:px-6">
      <Banner />

      <div className="relative flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] min-h-0 w-full min-w-0 flex-col justify-center">
        <div className="mx-auto flex w-full max-w-md flex-col items-stretch justify-center gap-3">
          <LoginFormView
            methods={methods}
            onSubmit={onSubmit}
            isPending={isPending}
            errorMessage={getLoginAlertMessage(error, t)}
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

function isLoginField(field: string): field is LoginFieldName {
  return LOGIN_FIELD_NAMES.some((name) => name === field);
}

function applyLoginFieldErrors(
  error: APIError,
  setError: UseFormSetError<LoginFormSchema>,
  t: TFunction<'auth'>
) {
  if (error.status !== HTTP_UNPROCESSABLE_ENTITY || !error.errors) {
    return;
  }

  for (const [field, messages] of Object.entries(error.errors)) {
    if (!isLoginField(field)) {
      continue;
    }

    setError(field, {
      type: 'server',
      message: messages[0] ?? t('errors.validation'),
    });
  }
}

function getLoginAlertMessage(error: APIError | null, t: TFunction<'auth'>): string | undefined {
  if (!error) {
    return undefined;
  }

  if (error.status === HTTP_UNPROCESSABLE_ENTITY) {
    const hasMappedField = LOGIN_FIELD_NAMES.some((field) => error.errors?.[field]?.[0]);
    return hasMappedField ? undefined : t('errors.validation');
  }

  if (error.status === HTTP_TOO_MANY_REQUESTS) {
    return t('errors.tooManyAttempts');
  }

  return t('errors.loginFailed');
}
