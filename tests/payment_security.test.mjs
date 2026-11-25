import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

import {
  verifyCashfreeWebhookSignature,
  verifyOrderAmountMatch,
  generateSecureOrderId,
  sanitizeOrderId,
  validateCustomerDetails,
} from '../src/lib/paymentSecurity.ts';

describe('Payment Section Security & Anti-Hacking Test Suite', () => {
  const TEST_SECRET = 'test_cashfree_secret_key_849204918230912';

  // ─── 1. Webhook HMAC Cryptographic Verification ──────────────────────────

  test('accepts valid Cashfree webhook signature with fresh timestamp', () => {
    const rawBody = JSON.stringify({
      data: {
        order: {
          order_id: 'bba_ord_test_123',
          order_status: 'PAID',
          order_amount: 499,
          order_currency: 'INR',
        },
      },
    });

    const timestamp = String(Date.now());
    const payloadToSign = `${timestamp}${rawBody}`;
    const validSignature = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(payloadToSign)
      .digest('base64');

    const result = verifyCashfreeWebhookSignature({
      rawBody,
      signature: validSignature,
      timestamp,
      secretKey: TEST_SECRET,
    });

    assert.equal(result, true, 'Valid signature must be verified successfully');
  });

  test('strictly rejects webhook payload if even 1 byte was altered (Tampering Protection)', () => {
    const originalBody = JSON.stringify({
      data: {
        order: {
          order_id: 'bba_ord_test_123',
          order_status: 'PAID',
          order_amount: 499,
        },
      },
    });

    const timestamp = String(Date.now());
    const payloadToSign = `${timestamp}${originalBody}`;
    const validSignature = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(payloadToSign)
      .digest('base64');

    // Hacker tries to tamper order_id or order_amount
    const tamperedBody = JSON.stringify({
      data: {
        order: {
          order_id: 'bba_ord_test_999',
          order_status: 'PAID',
          order_amount: 499,
        },
      },
    });

    const result = verifyCashfreeWebhookSignature({
      rawBody: tamperedBody,
      signature: validSignature,
      timestamp,
      secretKey: TEST_SECRET,
    });

    assert.equal(result, false, 'Tampered body must fail HMAC verification');
  });

  test('strictly rejects webhook if signature is signed with wrong key', () => {
    const rawBody = JSON.stringify({ test: 'data' });
    const timestamp = String(Date.now());
    const fakeSignature = crypto
      .createHmac('sha256', 'wrong_fake_secret_key')
      .update(`${timestamp}${rawBody}`)
      .digest('base64');

    const result = verifyCashfreeWebhookSignature({
      rawBody,
      signature: fakeSignature,
      timestamp,
      secretKey: TEST_SECRET,
    });

    assert.equal(result, false, 'Invalid secret key must fail verification');
  });

  // ─── 2. Replay Attack & Timestamp Expiration Defense ──────────────────────

  test('rejects expired webhook timestamp to prevent replay attacks (> 5 minutes old)', () => {
    const rawBody = JSON.stringify({ test: 'replay' });
    // 10 minutes ago
    const expiredTimestamp = String(Date.now() - 10 * 60 * 1000);
    const signature = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(`${expiredTimestamp}${rawBody}`)
      .digest('base64');

    const result = verifyCashfreeWebhookSignature({
      rawBody,
      signature,
      timestamp: expiredTimestamp,
      secretKey: TEST_SECRET,
    });

    assert.equal(result, false, 'Expired webhook must be rejected to prevent replay attacks');
  });

  test('rejects future webhook timestamp with excessive clock drift (> 5 minutes into future)', () => {
    const rawBody = JSON.stringify({ test: 'future' });
    const futureTimestamp = String(Date.now() + 10 * 60 * 1000);
    const signature = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(`${futureTimestamp}${rawBody}`)
      .digest('base64');

    const result = verifyCashfreeWebhookSignature({
      rawBody,
      signature,
      timestamp: futureTimestamp,
      secretKey: TEST_SECRET,
    });

    assert.equal(result, false, 'Future timestamp drift must be rejected');
  });

  test('gracefully rejects missing or malformed signature/timestamp parameters', () => {
    assert.equal(
      verifyCashfreeWebhookSignature({ rawBody: '', signature: 'abc', timestamp: '123', secretKey: 'k' }),
      false
    );
    assert.equal(
      verifyCashfreeWebhookSignature({ rawBody: '{}', signature: '', timestamp: '123', secretKey: 'k' }),
      false
    );
    assert.equal(
      verifyCashfreeWebhookSignature({ rawBody: '{}', signature: 'abc', timestamp: '', secretKey: 'k' }),
      false
    );
    assert.equal(
      verifyCashfreeWebhookSignature({ rawBody: '{}', signature: 'abc', timestamp: 'not-a-number', secretKey: 'k' }),
      false
    );
  });

  // ─── 3. Authoritative Order Amount Matching (Cent-Level Validation) ────────

  test('validates exact order amounts matching DB totals', () => {
    assert.equal(verifyOrderAmountMatch(499, 499), true);
    assert.equal(verifyOrderAmountMatch(499.0, 499), true);
    assert.equal(verifyOrderAmountMatch(148.5, 148.5), true);
    assert.equal(verifyOrderAmountMatch(0, 0), true);
  });

  test('rejects tampered amounts (cent tampering & price spoofing)', () => {
    assert.equal(verifyOrderAmountMatch(499, 1), false, '1 rupee payment for 499 order must fail');
    assert.equal(verifyOrderAmountMatch(499, 498.99), false, 'Underpayment by 1 paisa must fail');
    assert.equal(verifyOrderAmountMatch(499, 499.01), false, 'Overpayment or altered amount must fail');
    assert.equal(verifyOrderAmountMatch(100, 0), false, 'Zero payment for paid order must fail');
  });

  // ─── 4. Cryptographic Order ID Generator & Sanitizer ──────────────────────

  test('generates cryptographically unguessable order IDs', () => {
    const id1 = generateSecureOrderId('bba_ord');
    const id2 = generateSecureOrderId('bba_ord');

    assert.notEqual(id1, id2, 'Generated order IDs must be unique');
    assert.match(id1, /^bba_ord_\d+_[a-f0-9]{12}$/, 'Order ID must follow secure pattern');
    assert.match(id2, /^bba_ord_\d+_[a-f0-9]{12}$/, 'Order ID must follow secure pattern');
  });

  test('sanitizes and validates order IDs against injection attacks', () => {
    // Valid order IDs
    assert.equal(sanitizeOrderId('bba_ord_1732529000_a3f9e8712c9b'), 'bba_ord_1732529000_a3f9e8712c9b');
    assert.equal(sanitizeOrderId('order-123456'), 'order-123456');

    // Malicious injection attempts
    assert.equal(sanitizeOrderId("bba'; DROP TABLE orders; --"), null);
    assert.equal(sanitizeOrderId('../../../etc/passwd'), null);
    assert.equal(sanitizeOrderId('<script>alert(1)</script>'), null);
    assert.equal(sanitizeOrderId('short'), null); // too short
    assert.equal(sanitizeOrderId('a'.repeat(70)), null); // too long
    assert.equal(sanitizeOrderId(null), null);
    assert.equal(sanitizeOrderId(12345), null);
  });

  // ─── 5. Customer Details Input Validation ──────────────────────────────────

  test('validates customer details properly', () => {
    const valid = validateCustomerDetails({
      name: 'John Doe',
      email: 'student@example.com',
      mobile: '9876543210',
    });
    assert.equal(valid.valid, true);

    const invalidEmail = validateCustomerDetails({
      email: 'not-an-email',
    });
    assert.equal(invalidEmail.valid, false);

    const invalidMobile = validateCustomerDetails({
      mobile: '1234', // too short
    });
    assert.equal(invalidMobile.valid, false);
  });
});
