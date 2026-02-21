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
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
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

  // 204 No Content (e.g. DELETE) has no body to parse.
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
