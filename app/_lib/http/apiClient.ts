import type { ApiResponse } from "@/app/_dtos";

const BASE = "/api";

type RequestOpts = {
  signal?: AbortSignal;
};

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  opts: RequestOpts = {},
): Promise<ApiResponse<T>> {
  const init: RequestInit = {
    method,
    headers: { "content-type": "application/json" },
    cache: "no-store",
    signal: opts.signal,
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { status: "ERROR", errorMessage: message };
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return (await res.json()) as ApiResponse<T>;
    } catch {
      return {
        status: "ERROR",
        errorMessage: `Invalid JSON response (HTTP ${res.status})`,
      };
    }
  }

  if (!res.ok) {
    return {
      status: "ERROR",
      errorMessage: `HTTP ${res.status} ${res.statusText}`,
    };
  }

  return {
    status: "ERROR",
    errorMessage: "Unexpected non-JSON response",
  };
}

export const apiClient = {
  get<T>(path: string, opts?: RequestOpts) {
    return request<T>("GET", path, undefined, opts);
  },
  post<T>(path: string, body?: unknown, opts?: RequestOpts) {
    return request<T>("POST", path, body, opts);
  },
  put<T>(path: string, body?: unknown, opts?: RequestOpts) {
    return request<T>("PUT", path, body, opts);
  },
  del<T>(path: string, opts?: RequestOpts) {
    return request<T>("DELETE", path, undefined, opts);
  },
};
