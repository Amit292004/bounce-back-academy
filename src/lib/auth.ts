import { SignJWT, jwtVerify } from 'jose';

// Fix #1: Throw at startup if JWT_SECRET is missing — never fall back to a hardcoded string
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. The app cannot start without it.');
}
const key = new TextEncoder().encode(JWT_SECRET);

export async function signAdminToken(payload: { adminId: string, username: string, preAuth?: boolean }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.preAuth ? '5m' : '24h')
    .sign(key);
}

export async function signStudentToken(payload: { userId: string, email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}
