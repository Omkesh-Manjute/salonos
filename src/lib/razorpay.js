import { upsertSubscription } from './supabase';
import { sendNotification } from './firebase';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_demo';

const PLAN_PRICES = {
  basic: { amount: 99900, label: 'Basic Plan – ₹999/mo' },       // paise
  pro: { amount: 149900, label: 'Pro Plan – ₹1,499/mo' },
  enterprise: { amount: 0, label: 'Enterprise – Contact Us' },
};

/** Dynamically load the Razorpay checkout script */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay checkout for a subscription plan.
 * @param {object} opts
 * @param {string} opts.plan  - 'basic' | 'pro' | 'enterprise'
 * @param {string} opts.tenantId
 * @param {string} opts.userId
 * @param {string} opts.email
 * @param {string} opts.phone
 * @param {string} opts.salonName
 * @returns {Promise<{success: boolean, paymentId?: string}>}
 */
export async function openSubscriptionCheckout({ plan, tenantId, userId, email, phone, salonName }) {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error('Razorpay failed to load');

  const planData = PLAN_PRICES[plan];
  if (!planData || planData.amount === 0) {
    // Enterprise → contact sales
    return { success: false, reason: 'contact_sales' };
  }

  return new Promise((resolve) => {
    const options = {
      key: RAZORPAY_KEY,
      amount: planData.amount,
      currency: 'INR',
      name: 'SalonOS',
      description: planData.label,
      image: '/favicon.svg',
      prefill: { email, contact: phone },
      notes: { tenant_id: tenantId, salon_name: salonName, plan },
      theme: { color: '#a325c4' },

      handler: async (response) => {
        // Payment successful → update subscription in DB
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await upsertSubscription({
          tenant_id: tenantId,
          plan,
          payment_id: response.razorpay_payment_id,
          expiry_date: expiryDate.toISOString(),
          status: 'active',
        });

        // Send confirmation notification
        await sendNotification({
          userId,
          tenantId,
          type: 'payment_success',
          message: `${planData.label} activated successfully!`,
        });

        resolve({ success: true, paymentId: response.razorpay_payment_id });
      },

      modal: {
        ondismiss: () => resolve({ success: false, reason: 'dismissed' }),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      resolve({ success: false, reason: response.error.description });
    });
    rzp.open();
  });
}

export { PLAN_PRICES };
