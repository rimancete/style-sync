import { useQuery } from '~/hooks';

export interface Professional {
  id: string;
  name: string;
  avatar?: string;
}

const MOCK_PROFESSIONALS: Professional[] = [
  { id: '1', name: 'Michel' },
  { id: '2', name: 'Luis' },
  { id: '3', name: 'Dario' },
  { id: '4', name: 'Andre' },
];

const ENDPOINT = '/api/professionals';

export const useGetProfessionals = () => {
  return useQuery<Professional[]>({
    endpoint: ENDPOINT,
    queryKey: ['professionals'],
    mockData: MOCK_PROFESSIONALS,
    mockDelay: 1000,
  });
};
