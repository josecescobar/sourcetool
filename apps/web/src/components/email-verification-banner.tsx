'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function EmailVerificationBanner() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      const data = await apiClient.post('/auth/resend-verification');
      if (data.success) setSent(true);
    } catch {
      // silently fail
    }
    setSending(false);
  };

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3">
      <p className="text-sm text-yellow-800">
        Please verify your email address. Check your inbox for a verification link.
      </p>
      {sent ? (
        <span className="text-sm text-yellow-700">Sent!</span>
      ) : (
        <button
          onClick={handleResend}
          disabled={sending}
          className="ml-4 whitespace-nowrap rounded-md bg-yellow-600 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Resend'}
        </button>
      )}
    </div>
  );
}
