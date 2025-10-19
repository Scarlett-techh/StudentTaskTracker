import { queryClient } from "./queryClient";

// Session-based authentication functions
export const login = async (email: string, password: string) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include", // Important for sessions
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  return data;
};

export const register = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: string;
  userType?: "student" | "coach";
}) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "include", // Important for sessions
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }

  const data = await response.json();
  return data;
};

export const logout = async (): Promise<void> => {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  // Clear all React Query cache
  queryClient.clear();

  // Force reload to clear any state
  window.location.href = "/";
};

export const isUnauthorizedError = (error: Error): boolean => {
  return (
    /^401: .*Unauthorized/.test(error.message) ||
    error.message === "Not authenticated"
  );
};

// API client with session credentials
export const apiClient = async (url: string, options: RequestInit = {}) => {
  const config = {
    credentials: "include" as RequestCredentials,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP error! status: ${response.status} - ${error}`);
  }

  return response.json();
};

// Check if user is authenticated (you'll need to call this via the useAuth hook)
export const getCurrentUser = async () => {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
};
