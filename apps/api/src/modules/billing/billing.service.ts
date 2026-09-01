import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { prisma } from '@sourcetool/db';
import { SUBSCRIPTION_PLANS } from '@sourcetool/shared';
import type { PlanTier } from '@sourcetool/shared';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const key = this.configService.get('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(key || 'sk_test_placeholder', { apiVersion: '2025-02-24.acacia' });
  }

  async createCheckoutSession(teamId: string, planTier: PlanTier) {
    const plan = SUBSCRIPTION_PLANS[planTier];
    if (!plan || plan.price === 0) {
      throw new Error('Invalid plan for checkout');
    }

    const subscription = await prisma.subscription.findUnique({ where: { teamId } });

    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        metadata: { teamId },
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `SourceTool ${plan.name}` },
          unit_amount: plan.price,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${this.configService.get('WEB_URL')}/settings?tab=billing&success=true`,
      cancel_url: `${this.configService.get('WEB_URL')}/settings?tab=billing&canceled=true`,
      metadata: { teamId, planTier },
    });

    return { url: session.url };
  }

  async createPortalSession(teamId: string) {
    const subscription = await prisma.subscription.findUnique({ where: { teamId } });
    if (!subscription?.stripeCustomerId) throw new Error('No billing account');

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${this.configService.get('WEB_URL')}/settings?tab=billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET', '');
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { teamId, planTier } = session.metadata || {};
        if (teamId && planTier) {
          // Fetch the Stripe subscription to get period dates
          const stripeSub = await this.stripe.subscriptions.retrieve(session.subscription as string);
          await prisma.subscription.upsert({
            where: { teamId },
            update: {
              planTier: planTier as any,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: 'ACTIVE',
              currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            },
            create: {
              teamId,
              planTier: planTier as any,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: 'ACTIVE',
              currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            },
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const unitAmount = sub.items.data[0]?.price?.unit_amount;
        const planTier = this.planTierFromAmount(unitAmount);
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            planTier,
            status: sub.status === 'active' ? 'ACTIVE' : sub.status === 'past_due' ? 'PAST_DUE' : 'ACTIVE',
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELED', planTier: 'FREE' },
        });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }
    }
  }

  private planTierFromAmount(unitAmount: number | null | undefined): PlanTier {
    if (!unitAmount) return 'FREE';
    for (const [tier, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (plan.price === unitAmount) return tier as PlanTier;
    }
    return 'FREE';
  }

  async getSubscription(teamId: string): Promise<any> {
    return prisma.subscription.findUnique({ where: { teamId } });
  }

  async getStatus(teamId: string) {
    const subscription = await prisma.subscription.findUnique({ where: { teamId } });
    const planTier = (subscription?.planTier || 'FREE') as PlanTier;
    const plan = SUBSCRIPTION_PLANS[planTier];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's usage (for daily limits)
    const todayUsage = await prisma.usageRecord.findUnique({
      where: { teamId_date: { teamId, date: today } },
    });

    // Period usage (for monthly limits)
    const periodStart = subscription?.currentPeriodStart || new Date(today.getFullYear(), today.getMonth(), 1);
    const periodUsage = await prisma.usageRecord.aggregate({
      where: {
        teamId,
        date: { gte: periodStart },
      },
      _sum: {
        lookupCount: true,
        bulkScanCount: true,
        aiVerdictCount: true,
        exportCount: true,
      },
    });

    // Team member count
    const memberCount = await prisma.teamMember.count({ where: { teamId } });

    return {
      subscription: subscription ? {
        planTier: subscription.planTier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      } : { planTier: 'FREE', status: 'ACTIVE' },
      todayUsage: {
        lookupCount: todayUsage?.lookupCount || 0,
        bulkScanCount: todayUsage?.bulkScanCount || 0,
        aiVerdictCount: todayUsage?.aiVerdictCount || 0,
        exportCount: todayUsage?.exportCount || 0,
      },
      periodUsage: {
        lookupCount: periodUsage._sum.lookupCount || 0,
        bulkScanCount: periodUsage._sum.bulkScanCount || 0,
        aiVerdictCount: periodUsage._sum.aiVerdictCount || 0,
        exportCount: periodUsage._sum.exportCount || 0,
      },
      memberCount,
      limits: {
        lookupsPerDay: plan.lookupsPerDay,
        bulkScansPerMonth: plan.bulkScansPerMonth,
        aiVerdicts: plan.aiVerdicts,
        maxTeamMembers: plan.maxTeamMembers,
      },
      plan: {
        name: plan.name,
        tier: plan.tier,
        price: plan.price,
      },
    };
  }
}
