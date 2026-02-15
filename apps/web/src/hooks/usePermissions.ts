'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';

type TeamRole = 'OWNER' | 'ADMIN' | 'VA' | 'VIEWER';

interface Permissions {
  role: TeamRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isVA: boolean;
  isViewer: boolean;
  canManageTeam: boolean;
  canManageBilling: boolean;
  canAccessAnalytics: boolean;
  canAccessSourced: boolean;
  canExport: boolean;
  canWrite: boolean;
  canManageWatches: boolean;
}

export function usePermissions(): Permissions {
  const { currentRole } = useAuth();

  return useMemo(() => {
    const role = currentRole as TeamRole | null;
    const isOwner = role === 'OWNER';
    const isAdmin = role === 'ADMIN';
    const isVA = role === 'VA';
    const isViewer = role === 'VIEWER';

    return {
      role,
      isOwner,
      isAdmin,
      isVA,
      isViewer,
      canManageTeam: isOwner || isAdmin,
      canManageBilling: isOwner,
      canAccessAnalytics: isOwner || isAdmin,
      canAccessSourced: isOwner || isAdmin,
      canExport: isOwner || isAdmin,
      canWrite: isOwner || isAdmin || isVA,
      canManageWatches: isOwner || isAdmin,
    };
  }, [currentRole]);
}
