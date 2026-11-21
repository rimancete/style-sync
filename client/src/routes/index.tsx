import { createFileRoute } from '@tanstack/react-router';

import { redirectRoot } from '~/utils/route-guards';

export const Route = createFileRoute('/')({
  beforeLoad: ({ location }) => {
    redirectRoot(location);
  },
  component: () => null,
});
