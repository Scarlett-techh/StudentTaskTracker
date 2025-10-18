import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to force refetch
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch, // Export refetch function to manually trigger revalidation
  };
}
