import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "lc_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    // Fail loudly rather than silently signing sessions with a guessable key.
    throw new Error("AUTH_SECRET is not set (min 16 chars)");
  }
  return new TextEncoder().encode(s);
}

// --- Phone normalization -----------------------------------------------
// Uzbek numbers are entered many ways: 901234567, 90 123 45 67, +998901234567.
// Everything is stored as E.164 (+998XXXXXXXXX) so logins are unambiguous.
export function normalizePhone(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function isValidPassword(pw) {
  return typeof pw === "string" && pw.length >= 6;
}

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);

// --- Session -----------------------------------------------------------
export async function createSession(userId) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true, // JS on the page cannot read it → XSS can't steal the session
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

// Returns the user id from a valid session cookie, or null.
export async function getSessionUserId() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.uid || null;
  } catch {
    return null; // expired or tampered
  }
}
