import { config } from 'dotenv';
import { resolve } from 'path';

// In production, env vars are set by the platform (Railway) — .env file may not exist
if (process.env.NODE_ENV !== 'production') {
  config({ path: resolve(__dirname, '..', '..', '..', '.env') });
}
