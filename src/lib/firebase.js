import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { supabase } from './supabase';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Init Firebase app only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messaging = null;

/** Initialize FCM messaging (browser-only, requires HTTPS) */
export async function initMessaging() {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    messaging = getMessaging(app);
    return messaging;
  } catch {
    return null;
  }
}

/** Request notification permission and get FCM token */
export async function requestNotificationPermission(userId) {
  try {
    const m = await initMessaging();
    if (!m) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(m, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (token && userId) {
      // Store FCM token in users table
      await supabase.from('users').update({ fcm_token: token }).eq('id', userId);
    }

    return token;
  } catch (err) {
    console.warn('FCM token error:', err.message);
    return null;
  }
}

/** Listen to foreground messages */
export async function onForegroundMessage(callback) {
  const m = await initMessaging();
  if (!m) return () => {};
  return onMessage(m, callback);
}

// ─── Notification helpers ────────────────────────────────────────────────────

/**
 * Send a notification by writing to the notifications table.
 * A Supabase Edge Function / server-side function would then
 * call the FCM HTTP API to push to the device.
 */
export async function sendNotification({ userId, tenantId, type, message, data = {} }) {
  const TEMPLATES = {
    booking_confirmed: {
      title: '✅ Booking Confirmed!',
      body: message || 'Your salon appointment has been confirmed.',
    },
    appointment_reminder: {
      title: '⏰ Appointment Reminder',
      body: message || 'Your appointment is coming up soon.',
    },
    your_turn_next: {
      title: '💈 Your Turn is Next!',
      body: message || 'Please head to the salon — you\'re up next.',
    },
    queue_update: {
      title: '📍 Queue Update',
      body: message || 'Your queue position has been updated.',
    },
    payment_success: {
      title: '💳 Payment Successful',
      body: message || 'Your subscription payment was received.',
    },
  };

  const tpl = TEMPLATES[type] || { title: 'SalonOS', body: message };

  // Store in DB — server-side trigger picks this up for FCM dispatch
  await supabase.from('notifications').insert({
    user_id: userId,
    tenant_id: tenantId,
    title: tpl.title,
    message: tpl.body,
    type,
    data,
    read_status: false,
  });
}

export { app };
