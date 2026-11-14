import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
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
    <Select value={activeCustomerId ?? undefined} onValueChange={handleValueChange}>
      <SelectTrigger aria-label={label} className="h-9 w-40 sm:w-52">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {customers.map((customer) => (
          <SelectItem key={customer.id} value={customer.id}>
            {customer.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
