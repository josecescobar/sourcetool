'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Trash2, X, Clock } from 'lucide-react';
import { useTeam } from '@/hooks/useTeam';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/auth-context';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  VA: 'VA',
  VIEWER: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  VA: 'bg-green-100 text-green-800',
  VIEWER: 'bg-gray-100 text-gray-800',
};

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TeamPage() {
  const { members, invites, loading, error, fetchMembers, fetchInvites, sendInvite, revokeInvite, updateMemberRole, removeMember } = useTeam();
  const { canManageTeam, isOwner } = usePermissions();
  const { user } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VA');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
    if (canManageTeam) fetchInvites();
  }, [fetchMembers, fetchInvites, canManageTeam]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteSuccess(null);
    const result = await sendInvite(inviteEmail, inviteRole);
    if (result) {
      setInviteEmail('');
      setInviteRole('VA');
      setShowInviteForm(false);
      if (result.inviteLink) {
        setInviteSuccess(result.inviteLink);
      }
    }
    setInviteLoading(false);
  };

  const canChangeRole = (memberRole: string) => {
    if (memberRole === 'OWNER') return false;
    if (isOwner) return true;
    // ADMIN can only manage VA/VIEWER
    return memberRole === 'VA' || memberRole === 'VIEWER';
  };

  const availableRoles = (currentRole: string) => {
    if (isOwner) return ['ADMIN', 'VA', 'VIEWER'].filter((r) => r !== currentRole);
    return ['VA', 'VIEWER'].filter((r) => r !== currentRole);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        {canManageTeam && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showInviteForm ? 'Cancel' : 'Invite Member'}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">{error}</div>
      )}

      {inviteSuccess && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800 mb-4 flex items-start justify-between">
          <div>
            <p className="font-medium">Invite sent!</p>
            <p className="mt-1 text-xs break-all">{inviteSuccess}</p>
          </div>
          <button onClick={() => setInviteSuccess(null)} className="ml-2 text-green-600 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Invite Form */}
      {showInviteForm && canManageTeam && (
        <div className="rounded-xl border bg-white shadow-sm p-6 mb-6">
          <h2 className="font-medium mb-4">Send Invitation</h2>
          <form onSubmit={handleSendInvite} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="team@example.com"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="w-36">
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ADMIN">Admin</option>
                <option value="VA">VA</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviteLoading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {inviteLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-xl border bg-white shadow-sm mb-6">
        <div className="p-6 border-b">
          <h2 className="font-medium">Members ({members.length})</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No team members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  {canManageTeam && <th className="px-6 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((member: any) => (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="px-6 py-4">
                      <span className="font-medium">{member.user?.name || '—'}</span>
                      {member.userId === user?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{member.user?.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role] || ''}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(member.joinedAt)}</td>
                    {canManageTeam && (
                      <td className="px-6 py-4">
                        {canChangeRole(member.role) && (
                          <div className="flex items-center gap-2">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) updateMemberRole(member.id, e.target.value);
                              }}
                              className="rounded-md border px-2 py-1 text-xs"
                            >
                              <option value="">Change role...</option>
                              {availableRoles(member.role).map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                              ))}
                            </select>
                            {confirmRemove === member.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { removeMember(member.id); setConfirmRemove(null); }}
                                  className="rounded px-2 py-1 text-xs bg-destructive text-white hover:bg-destructive/90"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmRemove(null)}
                                  className="rounded px-2 py-1 text-xs border hover:bg-muted"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmRemove(member.id)}
                                className="text-muted-foreground hover:text-destructive"
                                title="Remove member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invites */}
      {canManageTeam && invites.length > 0 && (
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="p-6 border-b">
            <h2 className="font-medium">Pending Invites ({invites.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Expires</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite: any) => (
                  <tr key={invite.id} className="border-b last:border-0">
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {invite.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[invite.role] || ''}`}>
                        {ROLE_LABELS[invite.role] || invite.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(invite.expiresAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => revokeInvite(invite.id)}
                        className="text-sm text-destructive hover:underline"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
