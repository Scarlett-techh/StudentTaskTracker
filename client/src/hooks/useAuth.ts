import { useQuery } from "@tanstack/react-query";
import React from "react"; // ✅ ADDED: Import React

// ✅ ADDED: Custom API client with proper credentials and error handling
async function apiClient(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  console.log("🌐 [API CLIENT] Making request to:", url);
  console.log("📦 [API CLIENT] Method:", options.method || "GET");

  if (options.body) {
    console.log("📤 [API CLIENT] Data being sent:", options.body);
  }

  const response = await fetch(`/api${url}`, {
    ...options,
    credentials: "include", // This is crucial for session cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  console.log(
    "📨 [API CLIENT] Response status:",
    response.status,
    response.statusText,
  );

  if (!response.ok) {
    if (response.status === 401) {
      console.log("🔐 [API CLIENT] 401 Unauthorized - redirecting to login");
      // Don't throw here, let the component handle it
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unauthorized" }));
      throw new Error(errorData.error || "Not authenticated");
    }

    const errorData = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    console.error("❌ [API CLIENT] API Error:", errorData);
    throw new Error(
      errorData.error || `Request failed with status ${response.status}`,
    );
  }

  const data = await response.json();
  console.log("✅ [API CLIENT] Request successful:", data);
  return data;
}

// ✅ ADDED: Enhanced user fetching with retry logic
async function fetchUser() {
  try {
    console.log("🔐 [AUTH] Fetching user data...");
    const data = await apiClient("/auth/user");
    return data.user || data; // Handle both {user} and direct user response
  } catch (error) {
    console.error("❌ [AUTH] Failed to fetch user:", error);
    throw error;
  }
}

// ✅ ADDED: Session check function
async function checkSession() {
  try {
    const data = await apiClient("/auth/session-check");
    return data;
  } catch (error) {
    console.error("❌ [AUTH] Session check failed:", error);
    throw error;
  }
}

// ✅ ADDED: Logout function
async function logout() {
  try {
    await apiClient("/auth/logout", { method: "POST" });
    console.log("✅ [AUTH] Logout successful");
    return true;
  } catch (error) {
    console.error("❌ [AUTH] Logout failed:", error);
    throw error;
  }
}

export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (
        error.message.includes("Not authenticated") ||
        error.message.includes("Unauthorized")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ ADDED: Session validation on mount
  React.useEffect(() => {
    const validateSession = async () => {
      try {
        const session = await checkSession();
        console.log("🔐 [AUTH] Session validation:", session);

        if (!session.authenticated && user) {
          console.log("🔄 [AUTH] Session mismatch, refetching user...");
          refetch();
        }
      } catch (error) {
        console.error("❌ [AUTH] Session validation failed:", error);
      }
    };

    validateSession();
  }, [user, refetch]);

  return {
    user: user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
    logout: async () => {
      await logout();
      // Clear the query cache
      refetch();
    },
    apiClient, // ✅ ADDED: Export apiClient for use in components
  };
}

// ✅ ADDED: Export the apiClient for use in other components
export { apiClient, checkSession };
