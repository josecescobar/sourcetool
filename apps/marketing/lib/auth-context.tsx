'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface User {
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = 'sourcetool_users';
const SESSION_KEY = 'sourcetool_session';
const SEED_KEY = 'sourcetool_seeded';

const DEMO_USER = {
  name: 'Jose Escobar',
  email: 'demo@sourcetool.app',
  password: 'sourcetool',
  createdAt: '2026-02-01T00:00:00.000Z',
};

function seedDemoUser() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_KEY)) return;
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  if (!users[DEMO_USER.email]) {
    users[DEMO_USER.email] = DEMO_USER;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  localStorage.setItem(SEED_KEY, '1');
}

function getStoredUsers(): Record<string, { name: string; email: string; password: string; createdAt: string }> {
  if (typeof window === 'undefined') return {};
  seedDemoUser();
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { name: string; email: string; password: string; createdAt: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

function saveSession(email: string) {
  localStorage.setItem(SESSION_KEY, email);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = getSession();
    if (email) {
      const users = getStoredUsers();
      const stored = users[email];
      if (stored) {
        setUser({ email: stored.email, name: stored.name, createdAt: stored.createdAt });
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const users = getStoredUsers();
    const stored = users[email.toLowerCase()];
    if (!stored) {
      return { success: false, error: 'No account found with this email.' };
    }
    if (stored.password !== password) {
      return { success: false, error: 'Incorrect password.' };
    }
    saveSession(email.toLowerCase());
    setUser({ email: stored.email, name: stored.name, createdAt: stored.createdAt });
    return { success: true };
  }, []);

  const signup = useCallback((name: string, email: string, password: string) => {
    const users = getStoredUsers();
    const key = email.toLowerCase();
    if (users[key]) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const newUser = { name, email: key, password, createdAt: new Date().toISOString() };
    users[key] = newUser;
    saveUsers(users);
    saveSession(key);
    setUser({ email: newUser.email, name: newUser.name, createdAt: newUser.createdAt });
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
