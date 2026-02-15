'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export function useTeam() {
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/teams/members');
      if (data.success) setMembers(data.data);
      else setError(data.error?.message || 'Failed to fetch members');
    } catch {
      setError('Failed to fetch members');
    }
    setLoading(false);
  }, []);

  const fetchInvites = useCallback(async () => {
    setError(null);
    try {
      const data = await apiClient.get('/teams/invites');
      if (data.success) setInvites(data.data);
      else setError(data.error?.message || 'Failed to fetch invites');
    } catch {
      setError('Failed to fetch invites');
    }
  }, []);

  const sendInvite = useCallback(async (email: string, role: string) => {
    setError(null);
    try {
      const data = await apiClient.post('/teams/invites', { email, role });
      if (data.success) {
        setInvites((prev) => [data.data, ...prev]);
        return data.data;
      } else {
        setError(data.error?.message || 'Failed to send invite');
      }
    } catch {
      setError('Failed to send invite');
    }
    return null;
  }, []);

  const revokeInvite = useCallback(async (inviteId: string) => {
    setError(null);
    try {
      const data = await apiClient.delete(`/teams/invites/${inviteId}`);
      if (data.success) setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      else setError(data.error?.message || 'Failed to revoke invite');
    } catch {
      setError('Failed to revoke invite');
    }
  }, []);

  const updateMemberRole = useCallback(async (memberId: string, role: string) => {
    setError(null);
    try {
      const data = await apiClient.patch(`/teams/members/${memberId}`, { role });
      if (data.success) {
        setMembers((prev) => prev.map((m) => (m.id === memberId ? data.data : m)));
        return data.data;
      } else {
        setError(data.error?.message || 'Failed to update role');
      }
    } catch {
      setError('Failed to update role');
    }
    return null;
  }, []);

  const removeMember = useCallback(async (memberId: string) => {
    setError(null);
    try {
      const data = await apiClient.delete(`/teams/members/${memberId}`);
      if (data.success) setMembers((prev) => prev.filter((m) => m.id !== memberId));
      else setError(data.error?.message || 'Failed to remove member');
    } catch {
      setError('Failed to remove member');
    }
  }, []);

  return {
    members,
    invites,
    loading,
    error,
    fetchMembers,
    fetchInvites,
    sendInvite,
    revokeInvite,
    updateMemberRole,
    removeMember,
  };
}
