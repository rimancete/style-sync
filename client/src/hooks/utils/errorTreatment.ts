/**
 * Interprets a `Response` produced by `request`.
 *
 * The backend wraps every success payload in `{ data: ... }` via its
 * `ResponseTransformInterceptor`, and formats failures as
 * `{ status, message }` — with `errors` added on 422 validation responses.
 */

const HTTP_NO_CONTENT = 204;

export class ApiError extends Error implements APIError {
  readonly status: number;
  readonly errors?: Record<string, string[]>;

  constructor({ status, message, errors }: APIError) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type ErrorTreatmentParams = {
  response: Response;
};

export async function errorTreatment<T>({ response }: ErrorTreatmentParams): Promise<T> {
  if (response.status === HTTP_NO_CONTENT) {
    return null as T;
  }

  const payload = await readBody(response);

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: extractMessage(payload, response),
      errors: extractValidationErrors(payload),
    });
  }

  return unwrapEnvelope<T>(payload);
}

/**
 * Reads the body once as text so a non-JSON payload can still be surfaced as an
 * error message instead of failing with a parse error.
 */
async function readBody(response: Response): Promise<unknown> {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (isRecord(payload) && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
}

function extractMessage(payload: unknown, response: Response): string {
  if (typeof payload === 'string' && payload.length > 0) {
    return payload;
  }

  if (isRecord(payload) && typeof payload.message === 'string') {
    return payload.message;
  }

  return response.statusText || `Request failed with status ${response.status}`;
}

function extractValidationErrors(payload: unknown): Record<string, string[]> | undefined {
  if (!isRecord(payload) || !isRecord(payload.errors)) {
    return undefined;
  }

  const entries = Object.entries(payload.errors).filter(isStringArrayEntry);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function isStringArrayEntry(entry: [string, unknown]): entry is [string, string[]] {
  const [, value] = entry;
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
