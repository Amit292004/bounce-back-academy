import crypto from 'crypto';

/**
 * Payment Security Utility Library
 * Provides cryptographic verification, replay-attack prevention,
 * timing-safe comparisons, and authoritative gateway validations.
 */

export interface CashfreeSignatureParams {
  rawBody: string;
  signature: string;
  timestamp: string;
  secretKey: string;
}

/**
 * Verifies the Cashfree webhook cryptographic HMAC-SHA256 signature
 * and validates that the webhook timestamp is fresh (prevents replay attacks).
 */
export function verifyCashfreeWebhookSignature({
  rawBody,
  signature,
  timestamp,
  secretKey,
}: CashfreeSignatureParams): boolean {
  if (!rawBody || !signature || !timestamp || !secretKey) {
    return false;
  }

  // 1. Replay Attack Prevention: Validate timestamp freshness (max 5 minutes window)
  const now = Date.now();
  const rawTs = Number(timestamp);
  if (isNaN(rawTs) || rawTs <= 0) {
    return false;
  }

  // Cashfree timestamp can be seconds (10 digits) or milliseconds (13 digits)
  const webhookTimeMs = rawTs < 1e11 ? rawTs * 1000 : rawTs;
  const timeDifferenceMs = Math.abs(now - webhookTimeMs);
  const MAX_ALLOWED_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

  if (timeDifferenceMs > MAX_ALLOWED_DRIFT_MS) {
    return false;
  }

  // 2. Compute HMAC-SHA256 signature
  const payloadToSign = `${timestamp}${rawBody}`;
  const computedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(payloadToSign)
    .digest('base64');

  // 3. Timing-Safe Comparison to eliminate side-channel timing leaks
  try {
    const providedBuffer = Buffer.from(signature, 'base64');
    const computedBuffer = Buffer.from(computedSignature, 'base64');

    if (providedBuffer.length !== computedBuffer.length) {
      // Also check if provided signature was hex-encoded
      const computedHex = crypto
        .createHmac('sha256', secretKey)
        .update(payloadToSign)
        .digest('hex');
      const providedHexBuffer = Buffer.from(signature, 'utf-8');
      const computedHexBuffer = Buffer.from(computedHex, 'utf-8');
      if (providedHexBuffer.length === computedHexBuffer.length) {
        return crypto.timingSafeEqual(providedHexBuffer, computedHexBuffer);
      }
      return false;
    }

    return crypto.timingSafeEqual(providedBuffer, computedBuffer);
  } catch {
    return false;
  }
}

/**
 * Checks whether Cashfree gateway credentials are fully configured on the server.
 */
export function isCashfreeConfigured(): boolean {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
  return Boolean(appId && secretKey && appId.length > 3 && secretKey.length > 5);
}

/**
 * Returns the authoritative Cashfree API Base URL based on environment.
 */
export function getCashfreeBaseUrl(): string {
  const env = (process.env.CASHFREE_ENV || 'production').toLowerCase();
  return env === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

/**
 * Returns true if running in production mode.
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Determines whether test/simulated payment mode is legally allowed.
 * STRICT SECURITY INVARIANT: Simulated payments are NEVER allowed in production
 * unless explicitly authorized by an admin via ALLOW_SIMULATED_PURCHASE="true".
 */
export function isSimulationAllowed(): boolean {
  if (isProductionEnvironment()) {
    return process.env.ALLOW_SIMULATED_PURCHASE === 'true';
  }
  return true;
}

/**
 * Validates that the amount paid at the gateway strictly matches the database order amount.
 * Prevents cent-tampering and rounding exploits.
 */
export function verifyOrderAmountMatch(expectedAmount: number, gatewayAmount: number): boolean {
  const expected = Math.round(Number(expectedAmount) * 100);
  const actual = Math.round(Number(gatewayAmount) * 100);
  return expected === actual;
}

/**
 * Generates an unguessable, cryptographically secure Order ID.
 * Format: [prefix]_[timestamp]_[12 random hex chars]
 */
export function generateSecureOrderId(prefix = 'bba_ord'): string {
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(6).toString('hex');
  return `${prefix}_${timestamp}_${randomHex}`;
}

/**
 * Sanitizes and validates Order ID formats.
 */
export function sanitizeOrderId(orderId: unknown): string | null {
  if (typeof orderId !== 'string') return null;
  const clean = orderId.trim();
  // Valid characters: alphanumeric, underscores, hyphens, length 6 to 64
  if (!/^[a-zA-Z0-9_-]{6,64}$/.test(clean)) {
    return null;
  }
  return clean;
}

/**
 * Validates customer details structure for payment submission.
 */
export function validateCustomerDetails(details?: {
  name?: string;
  email?: string;
  mobile?: string;
}): { valid: boolean; error?: string } {
  if (!details) {
    return { valid: true };
  }

  if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    return { valid: false, error: 'Invalid customer email address format' };
  }

  if (details.mobile) {
    const cleanPhone = details.mobile.replace(/[\s+-]/g, '');
    if (!/^\d{10,15}$/.test(cleanPhone)) {
      return { valid: false, error: 'Mobile number must be between 10 and 15 digits' };
    }
  }

  return { valid: true };
}
