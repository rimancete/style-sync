import { Select } from '~/components/ui/select';
import type { CustomerSummary } from '~/store/authStore';

type CustomerSwitcherProps = {
  label: string;
  customers: CustomerSummary[];
  activeCustomerId: string | null;
  onChange: (customer: CustomerSummary) => void;
};

/** Salon (CLIENT) or company (ADMIN, STAFF) picker; only rendered with two or more options. */
export function CustomerSwitcher({
  label,
  customers,
  activeCustomerId,
  onChange,
}: CustomerSwitcherProps) {
  if (customers.length < 2) {
    return null;
  }

  function handleValueChange(customerId: string) {
    const customer = customers.find(({ id }) => id === customerId);

    if (customer && customer.id !== activeCustomerId) {
      onChange(customer);
    }
  }

  return (
    <Select
      items={customers.map((customer) => ({ value: customer.id, label: customer.name }))}
      value={activeCustomerId ?? undefined}
      onValueChange={handleValueChange}
      placeholder={label}
      aria-label={label}
      triggerClassName="h-9 w-40 sm:w-52"
    />
  );
}
