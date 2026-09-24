/**
 * Browser calls must stay same-origin. Production used to bake in
 * NEXT_PUBLIC_API_URL=https://….up.railway.app/api. That host is gone, and
 * iPhone Safari treats the cross-origin failure as a network error, so
 * sign-in never completes. Relative `/api` hits the Next.js routes on the
 * page's own origin.
 */
export function resolveApiBaseUrl(configured: string | undefined, pageOrigin?: string): string {
  const fallback = '/api';
  if (!configured) return fallback;
  if (configured.startsWith('/')) {
    const relative = configured.replace(/\/$/, '');
    return relative || fallback;
  }
  try {
    const url = new URL(configured);
    if (pageOrigin && url.origin === new URL(pageOrigin).origin) {
      return configured.replace(/\/$/, '');
    }
  } catch {
    return fallback;
  }
  return fallback;
}

class ApiClient {
  private baseUrl(): string {
    return resolveApiBaseUrl(
      process.env.NEXT_PUBLIC_API_URL,
      typeof window !== 'undefined' ? window.location.origin : undefined,
    );
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private handlePlanLimit(data: any) {
    if (data?.error === 'Plan limit reached' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('plan-limit-reached', { detail: data }));
    }
  }

  async get(path: string) {
    const response = await fetch(`${this.baseUrl()}${path}`, {
      headers: this.getHeaders(),
    });

    if (response.status === 401) {
      await this.refreshAuth();
      const retryResponse = await fetch(`${this.baseUrl()}${path}`, {
        headers: this.getHeaders(),
      });
      return retryResponse.json();
    }

    if (response.status === 403) {
      const data = await response.json();
      this.handlePlanLimit(data);
      return data;
    }

    return response.json();
  }

  async post(path: string, body?: any) {
    const response = await fetch(`${this.baseUrl()}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      await this.refreshAuth();
      const retryResponse = await fetch(`${this.baseUrl()}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return retryResponse.json();
    }

    if (response.status === 403) {
      const data = await response.json();
      this.handlePlanLimit(data);
      return data;
    }

    return response.json();
  }

  async patch(path: string, body?: any) {
    const response = await fetch(`${this.baseUrl()}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.json();
  }

  async delete(path: string) {
    const response = await fetch(`${this.baseUrl()}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return response.json();
  }

  private async refreshAuth() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;

    try {
      const response = await fetch(`${this.baseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }
}

export const apiClient = new ApiClient();
