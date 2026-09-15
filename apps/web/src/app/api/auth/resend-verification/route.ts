import { requireAuth } from '@/lib/server/auth/jwt';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { authService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const user = await requireAuth(req);
  await authService.sendVerificationEmail(user.email);
  return jsonOk({ message: 'Verification email sent' });
});
