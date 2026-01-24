import { useQuery } from '~/hooks';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Social + Beard', price: 85.0, duration: 60 },
  { id: '2', name: 'Social (Scissors or Clipper)', price: 40.0, duration: 45 },
  { id: '3', name: 'Eyebrow', price: 15.0, duration: 15 },
  { id: '4', name: 'Full Clipper + Beard', price: 65.0, duration: 50 },
  { id: '5', name: 'Full Clipper', price: 25.0, duration: 30 },
  { id: '6', name: 'Razor Shave + Beard', price: 80.0, duration: 55 },
  { id: '7', name: 'Razor Shave', price: 40.0, duration: 40 },
];

const ENDPOINT = '/api/services';

export const useGetServices = () => {
  return useQuery<Service[]>({
    endpoint: ENDPOINT,
    queryKey: ['services'],
    mockData: MOCK_SERVICES,
    mockDelay: 1000,
  });
};
