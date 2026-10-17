import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';

type LinkAccountDialogProps = {
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function LinkAccountDialog({
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: LinkAccountDialogProps) {
  const { t } = useTranslation('auth');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('register.linkTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('register.linkDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('register.linkCancel')}</AlertDialogCancel>
          <AlertDialogAction type="button" disabled={isPending} onClick={onConfirm}>
            {t('register.linkConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
