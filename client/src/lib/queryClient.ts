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

// ✅ FIXED: Updated QueryClient with proper caching configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Changed to true for better UX
      staleTime: 1000 * 60 * 2, // 2 minutes - reduced from Infinity
      gcTime: 1000 * 60 * 10, // 10 minutes - cache time
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (
          error?.message?.includes("401") ||
          error?.message?.includes("403") ||
          error?.message?.includes("Not authenticated") ||
          error?.message?.includes("Unauthorized")
        ) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnMount: true, // Always refetch when component mounts
      refetchOnReconnect: true, // Refetch when internet reconnects
    },
    mutations: {
      retry: false,
    },
  },
});
