'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    apiClient.post('/auth/verify-email', { email, token }).then((data) => {
      if (data.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully.');
      } else {
        setStatus('error');
        setMessage(data.error?.message || 'Verification failed. The link may be expired.');
      }
    }).catch(() => {
      setStatus('error');
      setMessage('Network error. Please try again.');
    });
  }, [searchParams]);

  return (
    <>
      {status === 'loading' && (
        <p className="text-sm text-muted-foreground">Verifying your email...</p>
      )}

      {status === 'success' && (
        <>
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{message}</div>
          <Link href="/login" className="inline-block text-sm text-primary hover:underline">
            Go to login
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{message}</div>
          <Link href="/login" className="inline-block text-sm text-primary hover:underline">
            Back to login
          </Link>
        </>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-3xl font-bold text-primary">SourceTool</h1>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
