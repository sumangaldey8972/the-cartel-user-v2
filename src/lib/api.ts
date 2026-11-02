import type { ApiEndpoint } from "@/config/api-endpoints";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

export class ApiClientError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code = "REQUEST_FAILED", details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(path: ApiEndpoint, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...init.headers },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new ApiClientError(
      errorBody.error?.message ?? "Something went wrong. Please try again.",
      errorBody.error?.code,
      errorBody.error?.details,
    );
  }
  return body as T;
}
