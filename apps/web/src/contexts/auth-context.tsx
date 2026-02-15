'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  googleId?: string;
  teamMembers: Array<{
    id: string;
    teamId: string;
    role: string;
    team: { id: string; name: string; subscription?: any };
  }>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  currentTeamId: string | null;
  currentRole: string | null;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  currentTeamId: null,
  currentRole: null,
  refreshUser: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiClient.get('/auth/me');
      if (data.success) setUser(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  }, [router]);

  const currentTeamMember = user?.teamMembers?.[0];
  const currentTeamId = currentTeamMember?.teamId ?? null;
  const currentRole = currentTeamMember?.role ?? null;

  return (
    <AuthContext.Provider value={{ user, loading, currentTeamId, currentRole, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
