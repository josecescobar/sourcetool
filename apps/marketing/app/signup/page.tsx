'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { APP_URL } from '@/lib/app-url';
import { Logo } from '@/components/Logo';

export default function SignupPage() {
  const { signup, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  if (user) {
    if (typeof window !== 'undefined') window.location.href = APP_URL;
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    const result = signup(name, email, password);
    if (result.success) {
      window.location.href = APP_URL;
    } else {
      setError(result.error || 'Signup failed.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size={36} />
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-8">
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">
            Create your account
          </h1>
          <p className="text-text-muted text-sm text-center mb-6">
            Get started with SourceTool
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="block text-text-muted text-xs font-medium mb-1.5">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-bg border border-card-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-text-muted text-xs font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-bg border border-card-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-text-muted text-xs font-medium mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-bg border border-card-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-text-muted text-xs font-medium mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full bg-bg border border-card-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-gradient text-white font-semibold py-2.5 rounded-lg text-sm mt-1"
            >
              Create Account
            </button>
          </form>
        </div>

        <p className="text-text-dim text-sm text-center mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
