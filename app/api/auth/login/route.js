import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone, verifyPassword, createSession } from "@/lib/auth";

export async function POST(req) {
  const { phone, password } = await req.json().catch(() => ({}));

  const normalized = normalizePhone(phone);
  if (!normalized || typeof password !== "string") {
    return NextResponse.json({ error: "bad_credentials" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { phone: normalized },
    include: { company: true },
  });

  // Same generic error whether the phone is unknown or the password is wrong —
  // otherwise the response tells an attacker which numbers are registered.
  const ok = user && (await verifyPassword(password, user.passwordHash));
  if (!ok) {
    return NextResponse.json({ error: "bad_credentials" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, needsOnboarding: !user.company });
}
