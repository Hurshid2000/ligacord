import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  normalizePhone,
  isValidPassword,
  hashPassword,
  createSession,
} from "@/lib/auth";

export async function POST(req) {
  const { phone, password } = await req.json().catch(() => ({}));

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone: normalized } });
  if (existing) {
    return NextResponse.json({ error: "phone_taken" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { phone: normalized, passwordHash: await hashPassword(password) },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true, needsOnboarding: true });
}
