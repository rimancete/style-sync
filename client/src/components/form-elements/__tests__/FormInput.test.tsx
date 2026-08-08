import { describe, expect, it } from 'vitest';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import userEvent from '@testing-library/user-event';

import { render, screen } from '~/test/utils';
import { FormElements } from '~/components/form-elements';
import { Form } from '~/components/ui/form';
import { Button } from '~/components/ui/button';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormValues = z.infer<typeof schema>;

function TestForm() {
  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)}>
        <FormElements.Input control={methods.control} name="email" label="Email" required />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

describe('FormElements.Input', () => {
  it('wires id, htmlFor and aria-describedby for field errors', async () => {
    const user = userEvent.setup();
    render(<TestForm />);

    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute('id');

    const label = screen.getByText('Email', { selector: 'label' });
    expect(label).toHaveAttribute('for', input.id);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    const message = await screen.findByText('Invalid email address');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby') ?? '').toContain(message.id);
  });
});
