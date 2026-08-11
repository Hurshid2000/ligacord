import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentCompany, counterpart } from "@/lib/chat";

// All conversations this company takes part in, newest activity first,
// each with the unread count and a preview of the last message.
export async function GET() {
  const me = await currentCompany();
  if (!me) return NextResponse.json({ error: "no_company" }, { status: 401 });

  const convos = await prisma.conversation.findMany({
    where: { OR: [{ initiatorId: me.id }, { ownerId: me.id }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      listing: true,
      initiator: true,
      owner: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Unread = sent by the other side and not yet read.
  const counts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversation: { OR: [{ initiatorId: me.id }, { ownerId: me.id }] },
      senderId: { not: me.id },
      readAt: null,
    },
    _count: { _all: true },
  });
  const unreadBy = Object.fromEntries(counts.map((c) => [c.conversationId, c._count._all]));

  return NextResponse.json({
    conversations: convos.map((c) => {
      const other = counterpart(c, me.id);
      const last = c.messages[0];
      return {
        id: c.id,
        listing: { id: c.listing.id, title: c.listing.title },
        partner: { name: other.name },
        lastMessage: last
          ? { body: last.body.slice(0, 120), createdAt: last.createdAt, mine: last.senderId === me.id }
          : null,
        lastMessageAt: c.lastMessageAt,
        unread: unreadBy[c.id] || 0,
      };
    }),
  });
}

// Opens (or reopens) the conversation about a listing. Idempotent: clicking
// "Написать" twice lands in the same thread rather than creating duplicates.
export async function POST(req) {
  const me = await currentCompany();
  if (!me) return NextResponse.json({ error: "no_company" }, { status: 401 });

  const { listingId } = await req.json().catch(() => ({}));
  if (!listingId) return NextResponse.json({ error: "listing_required" }, { status: 400 });

  const listing = await prisma.listing.findUnique({
    where: { id: String(listingId) },
    include: { company: true },
  });
  if (!listing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (listing.companyId === me.id) {
    return NextResponse.json({ error: "own_listing" }, { status: 400 });
  }
  // Seeded example companies have no owner to reply, so don't pretend otherwise.
  if (listing.company.isDemo) {
    return NextResponse.json({ error: "demo_listing" }, { status: 400 });
  }

  const convo = await prisma.conversation.upsert({
    where: { listingId_initiatorId: { listingId: listing.id, initiatorId: me.id } },
    create: { listingId: listing.id, initiatorId: me.id, ownerId: listing.companyId },
    update: {},
  });

  return NextResponse.json({ ok: true, id: convo.id });
}
