import { describe, expect, it } from 'vitest';

import { ApiError, errorTreatment } from '~/hooks/utils/errorTreatment';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('errorTreatment', () => {
  it('returns null for a 204 response without parsing a body', async () => {
    const response = new Response(null, { status: 204 });

    await expect(errorTreatment({ response })).resolves.toBeNull();
  });

  it('unwraps the data envelope on success', async () => {
    const response = jsonResponse({ data: { id: '1', name: 'Branch' } });

    await expect(errorTreatment({ response })).resolves.toEqual({
      id: '1',
      name: 'Branch',
    });
  });

  it('returns the payload as-is when there is no data envelope', async () => {
    const response = jsonResponse({ status: 'ok' });

    await expect(errorTreatment({ response })).resolves.toEqual({ status: 'ok' });
  });

  it('throws an ApiError with status, message and field errors on 422', async () => {
    const response = jsonResponse(
      {
        status: 422,
        message: 'Validation failed',
        errors: { email: ['email must be an email'] },
      },
      422
    );

    const error = await errorTreatment({ response }).then(
      () => {
        throw new Error('Expected errorTreatment to reject');
      },
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      message: 'Validation failed',
      errors: { email: ['email must be an email'] },
    });
  });

  it('preserves 428 so the register flow can react to it', async () => {
    const response = jsonResponse(
      {
        status: 428,
        message: 'User already exists. Please confirm to link this account to the customer.',
      },
      428
    );

    const error = await errorTreatment({ response }).then(
      () => {
        throw new Error('Expected errorTreatment to reject');
      },
      (caught: unknown) => caught
    );

    expect(error).toMatchObject({
      status: 428,
      message: 'User already exists. Please confirm to link this account to the customer.',
    });
  });

  it('falls back to the raw text when the body is not JSON', async () => {
    const response = new Response('gateway timeout', { status: 504 });

    const error = await errorTreatment({ response }).then(
      () => {
        throw new Error('Expected errorTreatment to reject');
      },
      (caught: unknown) => caught
    );

    expect(error).toMatchObject({
      status: 504,
      message: 'gateway timeout',
    });
  });
});
