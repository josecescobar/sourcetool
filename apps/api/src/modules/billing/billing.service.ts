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
      const team = await prisma.team.findUnique({ where: { id: teamId } });
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
      success_url: `${this.configService.get('WEB_URL')}/settings/billing?success=true`,
      cancel_url: `${this.configService.get('WEB_URL')}/settings/billing?canceled=true`,
      metadata: { teamId, planTier },
    });

    return { url: session.url };
  }

  async createPortalSession(teamId: string) {
    const subscription = await prisma.subscription.findUnique({ where: { teamId } });
    if (!subscription?.stripeCustomerId) throw new Error('No billing account');

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${this.configService.get('WEB_URL')}/settings/billing`,
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
          await prisma.subscription.update({
            where: { teamId },
            data: {
              planTier: planTier as any,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: 'ACTIVE',
            },
          });
        }
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
    }
  }

  async getSubscription(teamId: string): Promise<any> {
    return prisma.subscription.findUnique({ where: { teamId } });
  }
}
