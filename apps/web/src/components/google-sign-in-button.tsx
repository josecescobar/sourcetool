'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { apiClient } from '@/lib/api-client';

export function GoogleSignInButton() {
  const router = useRouter();
  const [error, setError] = useState('');

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async (response) => {
            setError('');
            if (!response.credential) {
              setError('Google sign-in failed. Please try again.');
              return;
            }
            try {
              const data = await apiClient.post('/auth/google', {
                credential: response.credential,
              });
              if (data.success) {
                localStorage.setItem('accessToken', data.data.accessToken);
                localStorage.setItem('refreshToken', data.data.refreshToken);
                router.push('/products');
              } else {
                setError(data.error?.message || 'Google sign-in failed.');
              }
            } catch {
              setError('Network error. Please try again.');
            }
          }}
          onError={() => {
            setError('Google sign-in failed. Please try again.');
          }}
        />
      </div>
    </div>
  );
}
