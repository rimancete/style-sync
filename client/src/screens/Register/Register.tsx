import { useMemo, useRef, useState } from 'react';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { useRegister, type RegisterPayload } from '~/api/auth';
import { ConfirmDialog } from '~/components/dialogs';

import { Banner } from './components/Banner/Banner';
import { RegisterFormView } from './components/RegisterFormView';
import {
  createRegisterSchema,
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_PRECONDITION_REQUIRED,
  HTTP_UNPROCESSABLE_ENTITY,
  REGISTER_DEFAULT_VALUES,
  REGISTER_FIELD_NAMES,
  type RegisterFieldName,
  type RegisterFormSchema,
} from './constants';

type RegisterScreenProps = {
  slug: string;
};

export function RegisterScreen({ slug }: RegisterScreenProps) {
  const { t } = useTranslation('auth');
  const { mutate: register, isPending, error } = useRegister(slug);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const pendingPayload = useRef<RegisterPayload | null>(null);

  const schema = useMemo(() => createRegisterSchema(t), [t]);
  const methods = useForm<RegisterFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: REGISTER_DEFAULT_VALUES,
  });

  function handleError(apiError: APIError) {
    if (apiError.status === HTTP_PRECONDITION_REQUIRED) {
      setIsLinkDialogOpen(true);
      return;
    }

    applyRegisterFieldErrors(apiError, methods.setError, t);
  }

  function onSubmit(data: RegisterFormSchema) {
    const payload = toRegisterPayload(data);
    pendingPayload.current = payload;
    register(payload, { onError: handleError });
  }

  function confirmLink() {
    const payload = pendingPayload.current;
    if (!payload) {
      return;
    }

    register({ ...payload, confirmLink: true }, { onError: handleError });
  }

  return (
    <div className="relative box-border flex min-h-screen w-full max-w-[100vw] min-w-0 flex-col items-center justify-center gap-4 overflow-x-hidden bg-background px-4 py-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-6 lg:px-6">
      <Banner />

      <div className="relative flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] min-h-0 w-full min-w-0 flex-col justify-center overflow-y-auto">
        <div className="mx-auto flex w-full max-w-md flex-col items-stretch justify-center gap-3">
          <RegisterFormView
            methods={methods}
            onSubmit={onSubmit}
            isPending={isPending}
            errorMessage={getRegisterAlertMessage(error, t)}
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

      <ConfirmDialog
        open={isLinkDialogOpen}
        isPending={isPending}
        title={t('register.linkTitle')}
        description={t('register.linkDescription')}
        cancelLabel={t('register.linkCancel')}
        confirmLabel={t('register.linkConfirm')}
        onOpenChange={setIsLinkDialogOpen}
        onConfirm={confirmLink}
      />
    </div>
  );
}

function toRegisterPayload(values: RegisterFormSchema): RegisterPayload {
  const phone = values.phone.trim();

  return {
    name: values.name.trim(),
    email: values.email.trim(),
    password: values.password,
    ...(phone.length > 0 ? { phone } : {}),
  };
}

function isRegisterField(field: string): field is RegisterFieldName {
  return REGISTER_FIELD_NAMES.some((name) => name === field);
}

function applyRegisterFieldErrors(
  error: APIError,
  setError: UseFormSetError<RegisterFormSchema>,
  t: TFunction<'auth'>
) {
  if (error.status !== HTTP_UNPROCESSABLE_ENTITY || !error.errors) {
    return;
  }

  for (const [field, messages] of Object.entries(error.errors)) {
    if (!isRegisterField(field)) {
      continue;
    }

    setError(field, {
      type: 'server',
      message: messages[0] ?? t('errors.validation'),
    });
  }
}

function getRegisterAlertMessage(error: APIError | null, t: TFunction<'auth'>): string | undefined {
  if (!error || error.status === HTTP_PRECONDITION_REQUIRED) {
    return undefined;
  }

  if (error.status === HTTP_UNPROCESSABLE_ENTITY) {
    const hasMappedField = REGISTER_FIELD_NAMES.some((field) => error.errors?.[field]?.[0]);
    return hasMappedField ? undefined : t('errors.validation');
  }

  if (error.status === HTTP_CONFLICT) {
    return t('errors.alreadyLinked');
  }

  if (error.status === HTTP_BAD_REQUEST) {
    return t('errors.salonUnavailable');
  }

  return t('errors.registerFailed');
}
