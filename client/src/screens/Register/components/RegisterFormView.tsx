import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

import { FormElements } from '~/components/form-elements';
import { Icon } from '~/components/Icon';
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
import { Input } from '~/components/ui/input';
import { LoginViewAlert } from '~/screens/Login/components/LoginViewAlert';

import type { RegisterFormSchema } from '../constants';
import {
  formatPhoneInput,
  isSupportedPhoneCountry,
  phoneCountryOptionLabel,
  phoneExampleNational,
  SUPPORTED_PHONE_COUNTRIES,
} from '../phone';

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
  const { handleSubmit, control, setValue, watch } = methods;
  const phoneCountry = watch('phoneCountry');
  const phoneExample = phoneExampleNational(phoneCountry);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function handlePhoneChange(value: string, previous: string) {
    const formatted = formatPhoneInput(value, phoneCountry, previous);
    setValue('phone', formatted.text, { shouldDirty: true });
    if (formatted.country !== phoneCountry) {
      setValue('phoneCountry', formatted.country);
    }
  }

  function handleCountryChange(nextCountry: string) {
    if (!isSupportedPhoneCountry(nextCountry)) {
      return;
    }

    setValue('phoneCountry', nextCountry);
    setValue('phone', '', {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

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
          <FormField
            name="phone"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('register.phoneNumber')}</FormLabel>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={t('register.phoneCountry')}
                    className="h-10 w-[5.75rem] shrink-0 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={phoneCountry}
                    disabled={isPending}
                    onChange={(event) => handleCountryChange(event.target.value)}
                  >
                    {SUPPORTED_PHONE_COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {phoneCountryOptionLabel(country)}
                      </option>
                    ))}
                  </select>
                  <FormControl>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder={phoneExample}
                      disabled={isPending}
                      {...field}
                      onChange={(event) => {
                        handlePhoneChange(event.target.value, field.value);
                      }}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormElements.Input
            control={control}
            required
            name="password"
            type={isPasswordVisible ? 'text' : 'password'}
            autoComplete="new-password"
            label={t('register.password')}
            placeholder={t('register.placeholders.password')}
            disabled={isPending}
            endIcon={
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                disabled={isPending}
                aria-label={isPasswordVisible ? t('login.hidePassword') : t('login.showPassword')}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
              >
                <Icon name={isPasswordVisible ? 'EyeOff' : 'Eye'} className="h-4 w-4" />
              </button>
            }
          />
          <FormElements.Input
            control={control}
            required
            name="confirmPassword"
            type={isPasswordVisible ? 'text' : 'password'}
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
