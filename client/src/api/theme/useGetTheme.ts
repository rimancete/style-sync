import { useQuery } from '~/hooks';

export interface ThemeConfig {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
}

const ENDPOINT = '/api/theme';

export const useGetTheme = () => {
  return useQuery<ThemeConfig>({
    endpoint: ENDPOINT,
    queryKey: ['theme'],
  });
};
