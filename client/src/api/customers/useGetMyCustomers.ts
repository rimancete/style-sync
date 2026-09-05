import { useQuery } from '~/hooks';
import type { CustomerSummary } from '~/store/authStore';

const ENDPOINT = '/api/customers/my-customers';

const MOCK_CUSTOMERS: CustomerSummary[] = [
  {
    id: 'customer-1',
    displayId: 1,
    name: 'StyleSync Salon',
    urlSlug: 'stylesync',
  },
];

export function useGetMyCustomers() {
  return useQuery<CustomerSummary[]>({
    endpoint: ENDPOINT,
    queryKey: ['customers', 'mine'],
    mockData: MOCK_CUSTOMERS,
  });
}
