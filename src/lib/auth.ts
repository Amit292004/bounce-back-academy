import { SignJWT, jwtVerify } from 'jose';

// Fix #1: Throw at startup if JWT_SECRET is missing — never fall back to a hardcoded string
function getKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is not set.');
    }
    return new TextEncoder().encode('dev-fallback-secret');
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(payload: { adminId: string, username: string, preAuth?: boolean }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.preAuth ? '5m' : '24h')
    .sign(getKey());
}

export async function signStudentToken(payload: { userId: string, email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getKey());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getKey());
    return payload;
  } catch {
    return null;
  }
}
