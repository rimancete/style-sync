import { useQuery } from '~/hooks';

export interface Branch {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
}

const MOCK_BRANCHES: Branch[] = [
  {
    id: '1',
    name: 'Unit 1',
    address: '98 Mario Pedro Vercellino Avenue',
    phoneNumber: '+1 (555) 123-4567',
  },
  {
    id: '2',
    name: 'Unit 2',
    address: '152 Professor José Assad Atalla Júnior Street',
    phoneNumber: '+1 (555) 987-6543',
  },
];

const ENDPOINT = '/api/branches';

export const useGetBranches = () => {
  return useQuery<Branch[]>({
    endpoint: ENDPOINT,
    queryKey: ['branches'],
    mockData: MOCK_BRANCHES,
    mockDelay: 1000,
  });
};
