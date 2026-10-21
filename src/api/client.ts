export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type HttpRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
};

export type HttpTransport = (request: HttpRequest) => Promise<{ status: number; body: unknown }>;

export type ApiRequest = {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  skipAuthRedirect?: boolean;
};

const messageFrom = (body: unknown, fallback: string) => {
  if (!body || typeof body !== "object" || !("message" in body)) return fallback;
  const message = (body as { message: unknown }).message;
  return typeof message === "string" && message.trim() ? message : fallback;
};

export const createApiClient = ({
  baseUrl,
  getToken,
  onUnauthorized,
  transport,
}: {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized: () => void;
  transport: HttpTransport;
}) => {
  const root = baseUrl.replace(/\/$/, "");

  return {
    async request<T>({ path, method, body, auth = true, skipAuthRedirect = false }: ApiRequest): Promise<T> {
      const normalized = path.startsWith("/") ? path : `/${path}`;
      const headers: Record<string, string> = {};
      if (body !== undefined) headers["Content-Type"] = "application/json";
      const token = auth ? getToken() : null;
      if (token) headers.Authorization = `Bearer ${token}`;

      let response: { status: number; body: unknown };
      try {
        response = await transport({
          url: `${root}${normalized}`,
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
      } catch {
        throw new ApiError("Could not reach the server. Check your connection.", 0);
      }

      if (response.status === 401 && !skipAuthRedirect) onUnauthorized();
      if (response.status < 200 || response.status >= 300) {
        throw new ApiError(messageFrom(response.body, "Request failed"), response.status);
      }
      return response.body as T;
    },
  };
};

export type ApiClient = ReturnType<typeof createApiClient>;

export const fetchTransport: HttpTransport = async (request) => {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  const text = await response.text();
  if (!text) return { status: response.status, body: null };
  try {
    return { status: response.status, body: JSON.parse(text) as unknown };
  } catch {
    return { status: response.status, body: { message: text } };
  }
};
