import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

import { FormElements } from '~/components/form-elements';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { LoginViewAlert } from '~/screens/Login/components/LoginViewAlert';

import type { RegisterFormSchema } from '../constants';

type RegisterFormViewProps = {
  methods: UseFormReturn<RegisterFormSchema>;
  onSubmit: (data: RegisterFormSchema) => void;
  isPending: boolean;
  errorMessage?: string;
};

export function RegisterFormView({
  methods,
  onSubmit,
  isPending,
  errorMessage,
}: RegisterFormViewProps) {
  const { t } = useTranslation('auth');
  const { handleSubmit, control } = methods;

  return (
    <div className="flex w-full max-w-md flex-col items-stretch gap-6 text-left">
      <div>
        <h1 className="text-3xl font-bold">{t('register.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('register.subtitle')}</p>
      </div>

      {errorMessage ? <LoginViewAlert description={errorMessage} /> : null}

      <Form {...methods}>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormElements.Input
            control={control}
            required
            name="name"
            autoComplete="name"
            label={t('register.fullName')}
            placeholder={t('register.placeholders.name')}
            disabled={isPending}
          />
          <FormElements.Input
            control={control}
            required
            name="email"
            type="email"
            autoComplete="email"
            label={t('register.email')}
            placeholder={t('register.placeholders.email')}
            disabled={isPending}
          />
          <FormElements.Input
            control={control}
            name="phone"
            type="tel"
            autoComplete="tel"
            label={t('register.phoneNumber')}
            placeholder={t('register.placeholders.phone')}
            disabled={isPending}
          />
          <FormElements.Input
            control={control}
            required
            name="password"
            type="password"
            autoComplete="new-password"
            label={t('register.password')}
            placeholder={t('register.placeholders.password')}
            disabled={isPending}
          />
          <FormElements.Input
            control={control}
            required
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            label={t('register.confirmPassword')}
            placeholder={t('register.placeholders.password')}
            disabled={isPending}
          />

          <FormField
            name="acceptedTerms"
            control={control}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal leading-snug text-muted-foreground">
                    {t('register.terms')}{' '}
                    <a href="#terms" className="text-primary hover:underline">
                      {t('register.termsOfService')}
                    </a>{' '}
                    {t('register.and')}{' '}
                    <a href="#privacy" className="text-primary hover:underline">
                      {t('register.privacyPolicy')}
                    </a>
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t('register.creatingAccount') : t('register.createAccount')}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        {t('register.alreadyHaveAccount')}{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          {t('register.signIn')}
        </Link>
      </p>
    </div>
  );
}
