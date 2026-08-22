/**
 * Normalised shape of every API failure, as produced by `errorTreatment`.
 * `errors` is only present on 422 validation responses.
 */
declare type APIError = {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
};

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}
