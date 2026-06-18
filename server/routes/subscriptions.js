import express from 'express';
import Stripe from 'stripe';
import { verifyToken } from './auth.js';
import { getDb } from '../db/init.js';

export const subscriptionRouter = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_test';

subscriptionRouter.post('/create-checkout', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?');
    const user = stmt.get(req.userId);

    const session = await stripe.checkout.sessions.create({
      customer: user?.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        user_id: req.userId
      }
    });

    res.json({ session_id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

subscriptionRouter.get('/status', verifyToken, (req, res) => {
  const db = getDb();
  const stmt = db.prepare('SELECT subscription_status FROM users WHERE id = ?');

  try {
    const user = stmt.get(req.userId);
    res.json({
      status: user?.subscription_status || 'free',
      is_subscriber: user?.subscription_status === 'active'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching subscription' });
  }
});

subscriptionRouter.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'
    );

    const db = getDb();

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const subscription = event.data.object;
      const userId = subscription.metadata.user_id;
      const updateStmt = db.prepare('UPDATE users SET subscription_status = ?, stripe_customer_id = ? WHERE id = ?');
      updateStmt.run(subscription.status === 'active' ? 'active' : 'inactive', subscription.customer, userId);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const userId = subscription.metadata.user_id;
      const updateStmt = db.prepare('UPDATE users SET subscription_status = ? WHERE id = ?');
      updateStmt.run('free', userId);
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
