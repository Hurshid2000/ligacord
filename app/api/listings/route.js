import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { publicListingWhere, parseExpiry } from "@/lib/listingFilters";

// Public catalog. Contacts are deliberately omitted for guests — signing in is
// what unlocks them, which is the whole point of registering.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(Number(searchParams.get("limit")) || 60, 100);

  const uid = await getSessionUserId();

  const and = [];
  if (category && category !== "all") and.push({ category });
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { gives: { contains: q, mode: "insensitive" } },
        { seeks: { contains: q, mode: "insensitive" } },
        { company: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  const listings = await prisma.listing.findMany({
    where: publicListingWhere(and),
    take,
    orderBy: { createdAt: "desc" },
    include: { company: true },
  });

  return NextResponse.json({
    signedIn: Boolean(uid),
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      gives: l.gives,
      seeks: l.seeks,
      category: l.category,
      budget: l.budget,
      venue: l.venue,
      expiresAt: l.expiresAt,
      createdAt: l.createdAt,
      company: {
        name: l.company.name,
        about: l.company.about,
        isDemo: l.company.isDemo,
        // Gated: guests see null, signed-in users see the real contact.
        contact: uid ? l.company.contact : null,
      },
    })),
  });
}

// Create an additional listing (a company can have several).
export async function POST(req) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { userId: uid } });
  if (!company) {
    return NextResponse.json({ error: "no_company" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const gives = String(body.gives || "").trim();
  const seeks = String(body.seeks || "").trim();
  if (!gives || !seeks) {
    return NextResponse.json({ error: "gives_and_seeks_required" }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      companyId: company.id,
      title: String(body.title || "").trim() || `Бартер: ${company.name}`,
      gives,
      seeks,
      category: String(body.category || company.category || "other").trim(),
      budget: String(body.budget || "").trim(),
      venue: String(body.venue || "").trim(),
      expiresAt: parseExpiry(body.expiresAt) ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: listing.id });
}
