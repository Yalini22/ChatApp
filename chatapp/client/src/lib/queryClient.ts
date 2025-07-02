import { QueryClient, QueryFunction, QueryKey } from "@tanstack/react-query";

// ✅ Your backend base URL
const API_BASE = "http://localhost:5000";

// ✅ Helper to throw error for failed responses
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// ✅ API request for POST/PUT/DELETE with JSON
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// ✅ Behavior for unauthorized requests
type UnauthorizedBehavior = "returnNull" | "throw";

// ✅ Fix: Generic query function with proper typing
export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T, QueryKey> {
  return async ({ queryKey }) => {
    const endpoint = queryKey[0] as string;
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

    const res = await fetch(url, {
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };
}

// ✅ Create query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});


