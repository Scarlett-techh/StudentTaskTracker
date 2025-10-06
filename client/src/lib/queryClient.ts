// lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  // Ensure URL is a string and starts with / for proper routing
  const normalizedUrl =
    typeof url === "string" && url.startsWith("/") ? url : `/${url}`;

  console.log("🌐 [API REQUEST] Making request to:", normalizedUrl);
  console.log("📦 [API REQUEST] Method:", method);
  console.log("📤 [API REQUEST] Data being sent:", data);

  // Handle FormData objects differently (don't set Content-Type or stringify)
  const isFormData = data instanceof FormData;

  const options: RequestInit = {
    method,
    headers: {},
    credentials: "include",
  };

  // Set headers and body
  if (data) {
    if (isFormData) {
      options.body = data;
    } else {
      options.headers = {
        "Content-Type": "application/json",
      };
      options.body = JSON.stringify(data);
    }
  }

  console.log("🔧 [API REQUEST] Request options:", {
    method: options.method,
    headers: options.headers,
    hasBody: !!options.body,
    bodyType: typeof options.body,
  });

  const res = await fetch(normalizedUrl, options);

  console.log("📨 [API REQUEST] Response status:", res.status, res.statusText);

  await throwIfResNotOk(res);

  // Parse JSON response for non-empty responses
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const jsonResponse = await res.json();
    console.log("✅ [API REQUEST] JSON response:", jsonResponse);
    return jsonResponse;
  }

  // For empty responses (like 204 No Content), return nothing
  console.log("📭 [API REQUEST] Empty response received");
  return;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Ensure queryKey[0] is a valid string URL
    const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
    if (typeof url !== "string") {
      throw new Error(`Invalid URL parameter: ${JSON.stringify(url)}`);
    }

    const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

    const res = await fetch(normalizedUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

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
