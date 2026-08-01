import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { parseExpiry } from "@/lib/listingFilters";

// Loads the listing only if it belongs to the signed-in user's company.
// Everything below goes through this, so one user can never touch another's
// listing by guessing an id.
async function loadOwned(id) {
  const uid = await getSessionUserId();
  if (!uid) return { error: "unauthorized", status: 401 };

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { company: true },
  });
  if (!listing) return { error: "not_found", status: 404 };

  // Same 404 rather than 403: don't reveal that someone else's listing exists.
  if (listing.company.userId !== uid) return { error: "not_found", status: 404 };

  return { listing };
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const owned = await loadOwned(id);
  if (owned.error) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }

  const body = await req.json().catch(() => ({}));
  const data = {};

  if (body.title !== undefined) {
    const t = String(body.title).trim();
    if (t) data.title = t;
  }
  if (body.gives !== undefined) {
    const g = String(body.gives).trim();
    if (!g) return NextResponse.json({ error: "gives_required" }, { status: 400 });
    data.gives = g;
  }
  if (body.seeks !== undefined) {
    const s = String(body.seeks).trim();
    if (!s) return NextResponse.json({ error: "seeks_required" }, { status: 400 });
    data.seeks = s;
  }
  if (body.category !== undefined) data.category = String(body.category).trim();
  if (body.budget !== undefined) data.budget = String(body.budget).trim();
  if (body.venue !== undefined) data.venue = String(body.venue).trim();

  // undefined = not supplied (leave as is); null = user cleared the deadline.
  const expiry = parseExpiry(body.expiresAt);
  if (expiry !== undefined) data.expiresAt = expiry;

  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  const updated = await prisma.listing.update({ where: { id }, data });
  return NextResponse.json({ ok: true, listing: updated });
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const owned = await loadOwned(id);
  if (owned.error) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
