'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'info' | 'accepting' | 'success' | 'error'>('loading');
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid invite link.');
      return;
    }

    apiClient.get(`/invites/${token}`).then((data) => {
      if (data.success) {
        setInviteInfo(data.data);
        setStatus('info');
      } else {
        setStatus('error');
        setError(data.error?.message || 'This invite link is invalid or expired.');
      }
    }).catch(() => {
      setStatus('error');
      setError('Network error.');
    });
  }, [token]);

  const handleAccept = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push(`/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`);
      return;
    }

    setStatus('accepting');
    try {
      const data = await apiClient.post(`/invites/${token}/accept`);
      if (data.success) {
        setStatus('success');
        setTimeout(() => router.push('/team'), 2000);
      } else {
        setStatus('error');
        setError(data.error?.message || 'Failed to accept invite.');
      }
    } catch {
      setStatus('error');
      setError('Network error.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-3xl font-bold text-primary">SourceTool</h1>

        {status === 'loading' && (
          <p className="text-sm text-muted-foreground">Loading invite details...</p>
        )}

        {status === 'info' && inviteInfo && (
          <>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Team Invitation</h2>
              <p className="text-sm text-muted-foreground">
                You&apos;ve been invited to join <strong>{inviteInfo.teamName}</strong> as{' '}
                <span className="font-medium capitalize">{inviteInfo.role.toLowerCase()}</span>.
              </p>
            </div>
            <button
              onClick={handleAccept}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Accept Invitation
            </button>
            <p className="text-xs text-muted-foreground">
              Invitation sent to {inviteInfo.email}
            </p>
          </>
        )}

        {status === 'accepting' && (
          <p className="text-sm text-muted-foreground">Accepting invite...</p>
        )}

        {status === 'success' && (
          <div className="space-y-2">
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
              You&apos;ve joined the team! Redirecting...
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            <Link href="/login" className="text-sm text-primary hover:underline">
              Go to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
