import { toast } from '~/hooks/use-toast';
import i18n from '~/i18n/config';

/**
 * User-facing feedback for callers outside the React tree (mutation facades).
 * Titles fall back to translated defaults so no call site hardcodes copy.
 */
export const notify = {
  error(title?: string, description?: string): void {
    toast({
      variant: 'destructive',
      title: title ?? i18n.t('common.error'),
      description,
    });
  },

  success(title?: string, description?: string): void {
    toast({
      title: title ?? i18n.t('common.success'),
      description,
    });
  },
};
