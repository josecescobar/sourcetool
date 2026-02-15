import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LWA_TOKEN_URL } from './amazon-sp-api.constants';
import type { LwaTokenResponse } from './amazon-sp-api.types';

@Injectable()
export class AmazonSpApiAuthService {
  private readonly logger = new Logger(AmazonSpApiAuthService.name);

  private readonly clientId: string | null;
  private readonly clientSecret: string | null;
  private readonly refreshToken: string | null;

  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private configService: ConfigService) {
    this.clientId =
      this.configService.get<string>('AMAZON_SP_API_CLIENT_ID') || null;
    this.clientSecret =
      this.configService.get<string>('AMAZON_SP_API_CLIENT_SECRET') || null;
    this.refreshToken =
      this.configService.get<string>('AMAZON_SP_API_REFRESH_TOKEN') || null;
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.refreshToken);
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.isConfigured()) return null;

    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.accessToken;
    }

    return this.refreshAccessToken();
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken!,
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
      });

      const res = await fetch(LWA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!res.ok) {
        this.logger.error(
          `LWA token refresh failed: HTTP ${res.status} ${res.statusText}`,
        );
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        return null;
      }

      const data = (await res.json()) as LwaTokenResponse;
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

      this.logger.debug('LWA access token refreshed successfully');
      return this.accessToken;
    } catch (error) {
      this.logger.error(`LWA token refresh error: ${error}`);
      this.accessToken = null;
      this.tokenExpiresAt = 0;
      return null;
    }
  }
}
