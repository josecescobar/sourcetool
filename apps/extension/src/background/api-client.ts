const DEFAULT_API_URL = 'http://localhost:3001/api';

export class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private apiBaseUrl: string = DEFAULT_API_URL;

  constructor() {
    this.loadTokens();
    this.loadApiUrl();
  }

  private async loadTokens() {
    const result = await chrome.storage.local.get(['accessToken', 'refreshToken']);
    this.accessToken = result.accessToken || null;
    this.refreshToken = result.refreshToken || null;
  }

  private async loadApiUrl() {
    const result = await chrome.storage.local.get(['apiUrl']);
    this.apiBaseUrl = result.apiUrl || DEFAULT_API_URL;
  }

  async setAuthToken(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    await chrome.storage.local.set({ accessToken, refreshToken });
  }

  async getAuthToken() {
    return { accessToken: this.accessToken };
  }

  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    await chrome.storage.local.remove(['accessToken', 'refreshToken']);
  }

  async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.success && data.data?.accessToken) {
      await this.setAuthToken(data.data.accessToken, data.data.refreshToken);
    }
    return data;
  }

  async get(path: string): Promise<any> {
    return this.request('GET', path);
  }

  async post(path: string, data?: any): Promise<any> {
    return this.request('POST', path, data);
  }

  async delete(path: string): Promise<any> {
    return this.request('DELETE', path);
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAuth();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${this.apiBaseUrl}${path}`, {
          method, headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        return retryResponse.json();
      }
    }

    return response.json();
  }

  private async refreshAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.data) {
        await this.setAuthToken(data.data.accessToken, data.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
