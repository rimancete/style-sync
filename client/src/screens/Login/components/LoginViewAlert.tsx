import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { cn } from '~/lib/utils';
import type { LoginViewAlertVariant } from '../types';

type LoginViewAlertProps = {
  variant?: LoginViewAlertVariant;
  title?: string;
  description: string;
  className?: string;
};

export function LoginViewAlert({
  variant = 'destructive',
  title,
  description,
  className,
}: LoginViewAlertProps) {
  return (
    <Alert variant={variant} className={cn('w-full text-left', className)}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
