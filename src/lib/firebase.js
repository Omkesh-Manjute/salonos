import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
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

// AUTH ──────────────────────────────────────────────────────────────────────────
export const auth = getAuth(app);

/** Setup reCAPTCHA for phone auth */
export function setupRecaptcha(containerId) {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
  }
  
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
    }
  });
  
  return window.recaptchaVerifier;
}

/** Send OTP via Firebase Phone Auth */
export async function sendFirebaseOtp(phone, containerId) {
  try {
    const verifier = setupRecaptcha(containerId);
    const confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
    window.confirmationResult = confirmationResult;
    return { data: confirmationResult, error: null };
  } catch (error) {
    console.error('Firebase OTP Error:', error);
    return { data: null, error };
  }
}

/** Verify Firebase OTP */
export async function verifyFirebaseOtp(code) {
  try {
    if (!window.confirmationResult) {
      throw new Error('No OTP confirmation result found. Send OTP again.');
    }
    const result = await window.confirmationResult.confirm(code);
    return { data: result.user, error: null };
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return { data: null, error };
  }
}

/** Sign in with Email/Password (Firebase) */
export async function signInWithEmailFirebase(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { data: userCredential.user, error: null };
  } catch (error) {
    console.error('Firebase Sign In Error:', error);
    return { data: null, error };
  }
}

/** Sign up with Email/Password (Firebase) */
export async function signUpWithEmailFirebase(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { data: userCredential.user, error: null };
  } catch (error) {
    console.error('Firebase Sign Up Error:', error);
    return { data: null, error };
  }
}

/** Sign in with Google (Firebase) */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { data: result.user, error: null };
  } catch (error) {
    console.error('Firebase Google Sign In Error:', error);
    return { data: null, error };
  }
}

/** Firebase Sign Out */
export async function signOutFirebase() {
  return firebaseSignOut(auth);
}

// MESSAGING ───────────────────────────────────────────────────────────────────
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

export { app, onAuthStateChanged };
