import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string | null;
  dateOfBirth?: string;
  userType?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !user, // Only fetch if we don't have user data
  });

  // Update user state when query returns data
  useEffect(() => {
    if (userData && !user) {
      setUser(userData);
    }
  }, [userData, user]);

  const logout = () => {
    setUser(null);
    queryClient.clear();
    window.location.href = "/api/auth/logout";
  };

  const value = {
    user,
    isLoading: isLoading && !user,
    isAuthenticated: !!user,
    setUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}