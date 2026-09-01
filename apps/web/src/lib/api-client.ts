const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
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
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: this.getHeaders(),
    });

    if (response.status === 401) {
      await this.refreshAuth();
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
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
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      await this.refreshAuth();
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
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
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.json();
  }

  async delete(path: string) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return response.json();
  }

  private async refreshAuth() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
