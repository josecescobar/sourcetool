import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { prisma } from '@sourcetool/db';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async () => {
        const request = context.switchToHttp().getRequest();
        const teamId = request.body?.teamId || request.query?.teamId;
        if (!teamId) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const url = request.url as string;
        const updateField = this.getUpdateField(url);
        if (!updateField) return;

        try {
          await prisma.usageRecord.upsert({
            where: { teamId_date: { teamId, date: today } },
            create: { teamId, date: today, [updateField]: 1 },
            update: { [updateField]: { increment: 1 } },
          });
        } catch {
          // Non-critical — don't fail the request
        }
      }),
    );
  }

  private getUpdateField(url: string): string | null {
    if (url.includes('/products/lookup') || url.includes('/analysis/calculate')) return 'lookupCount';
    if (url.includes('/bulk-scan')) return 'bulkScanCount';
    if (url.includes('/ai/deal-score')) return 'aiVerdictCount';
    if (url.includes('/export')) return 'exportCount';
    return null;
  }
}
