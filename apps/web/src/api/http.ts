export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly error: ApiError,
  ) {
    super(error.message);
    this.name = "HttpError";
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...init?.headers },
      ...init,
    });
  } catch (cause) {
    throw new HttpError(0, {
      code: "NETWORK_ERROR",
      message: "Unable to reach the server. Check your connection.",
      details: { cause: String(cause) },
    });
  }

  if (!response.ok) {
    let error: ApiError;
    try {
      const body = await response.json();
      error = body?.error ?? {
        code: "HTTP_ERROR",
        message: `Request failed with status ${response.status}`,
      };
    } catch {
      error = {
        code: "HTTP_ERROR",
        message: `Request failed with status ${response.status}`,
      };
    }
    throw new HttpError(response.status, error);
  }

  return response.json() as Promise<T>;
}
