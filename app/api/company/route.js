import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// Creates or updates the signed-in user's company profile (the onboarding step).
// Optionally creates a first listing in the same call when gives/seeks are filled.
export async function POST(req) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const data = {
    name,
    about: String(body.about || "").trim(),
    category: String(body.category || "other").trim(),
    contact: String(body.contact || "").trim(),
  };

  const company = await prisma.company.upsert({
    where: { userId: uid },
    create: { ...data, userId: uid },
    update: data,
  });

  // Onboarding asks what the company offers and seeks — that becomes listing #1.
  const gives = String(body.gives || "").trim();
  const seeks = String(body.seeks || "").trim();
  let listing = null;
  if (gives && seeks) {
    listing = await prisma.listing.create({
      data: {
        companyId: company.id,
        title: String(body.title || "").trim() || `Бартер: ${name}`,
        gives,
        seeks,
        category: data.category,
        budget: String(body.budget || "").trim(),
        timeline: String(body.timeline || "").trim(),
        venue: String(body.venue || "").trim(),
      },
    });
  }

  return NextResponse.json({ ok: true, companyId: company.id, listingId: listing?.id ?? null });
}
