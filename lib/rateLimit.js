import { createHash } from "crypto";
import { prisma } from "./db";

// Paid AI calls are the only thing that can burn real money, so they get a
// daily cap. Guests get a small trial before being asked to register;
// registered users get a generous cap that still bounds worst-case spend.
export const GUEST_DAILY_LIMIT = Number(process.env.AI_GUEST_DAILY_LIMIT) || 2;
export const USER_DAILY_LIMIT = Number(process.env.AI_USER_DAILY_LIMIT) || 30;

function today() {
  return new Date().toISOString().slice(0, 10); // UTC day
}

// Railway (and most proxies) put the real client IP first in x-forwarded-for.
function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Hashed with AUTH_SECRET as salt so the stored value can't be reversed back
// into an IP address, and isn't comparable across deployments.
function hashIp(ip) {
  return createHash("sha256")
    .update(`${process.env.AUTH_SECRET || ""}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

export function usageKey(req, userId) {
  return userId ? `user:${userId}` : `ip:${hashIp(clientIp(req))}`;
}

// Atomically increments today's counter and reports whether the call is allowed.
// The increment happens before the AI call, so a burst of parallel requests
// can't slip past the cap.
export async function consumeAiQuota(req, userId) {
  const key = usageKey(req, userId);
  const limit = userId ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT;
  const day = today();

  const row = await prisma.aiUsage.upsert({
    where: { key_day: { key, day } },
    create: { key, day, count: 1 },
    update: { count: { increment: 1 } },
  });

  return {
    allowed: row.count <= limit,
    used: row.count,
    limit,
    remaining: Math.max(0, limit - row.count),
    isGuest: !userId,
  };
}

// Read-only check, for showing "N attempts left" without spending one.
export async function peekAiQuota(req, userId) {
  const key = usageKey(req, userId);
  const limit = userId ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT;
  const row = await prisma.aiUsage.findUnique({
    where: { key_day: { key, day: today() } },
  });
  const used = row?.count ?? 0;
  return { used, limit, remaining: Math.max(0, limit - used), isGuest: !userId };
}
