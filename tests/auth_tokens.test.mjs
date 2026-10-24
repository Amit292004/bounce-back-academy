import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT, jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode('test-jwt-secret-key-32-characters-min');

async function signStudentToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

async function signAdminToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.preAuth ? '5m' : '24h')
    .sign(secretKey);
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}

describe('Authentication & JWT Cryptographic Token Suite', () => {
  test('signs and verifies student JWT token correctly', async () => {
    const studentPayload = {
      userId: 'test-student-id-123',
      email: 'student@example.com',
    };

    const token = await signStudentToken(studentPayload);
    assert.equal(typeof token, 'string');
    assert.equal(token.split('.').length, 3);

    const verified = await verifyToken(token);
    assert.equal(verified?.userId, studentPayload.userId);
    assert.equal(verified?.email, studentPayload.email);
  });

  test('signs and verifies admin JWT token correctly', async () => {
    const adminPayload = {
      adminId: 'admin-id-456',
      username: 'bba_admin',
    };

    const token = await signAdminToken(adminPayload);
    assert.equal(typeof token, 'string');

    const verified = await verifyToken(token);
    assert.equal(verified?.adminId, adminPayload.adminId);
    assert.equal(verified?.username, adminPayload.username);
  });

  test('rejects tampered or malformed tokens safely without throwing unhandled exceptions', async () => {
    const bogusToken = 'header.maliciouspayload.invalidsignature';
    const result = await verifyToken(bogusToken);
    assert.equal(result, null);
  });

  test('rejects empty or null tokens gracefully', async () => {
    assert.equal(await verifyToken(''), null);
    assert.equal(await verifyToken(null), null);
    assert.equal(await verifyToken(undefined), null);
  });
});
