import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  currentCompany,
  loadParticipantConversation,
  counterpart,
  serializeMessage,
  MAX_MESSAGE_LENGTH,
} from "@/lib/chat";

// Reads one thread. Opening it marks the other side's messages as read.
export async function GET(_req, { params }) {
  const { id } = await params;
  const me = await currentCompany();
  if (!me) return NextResponse.json({ error: "no_company" }, { status: 401 });

  const convo = await loadParticipantConversation(id, me.id);
  // 404 rather than 403: never confirm someone else's conversation exists.
  if (!convo) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { conversationId: convo.id },
    orderBy: { createdAt: "asc" },
    take: 300,
  });

  await prisma.message.updateMany({
    where: { conversationId: convo.id, senderId: { not: me.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const other = counterpart(convo, me.id);
  return NextResponse.json({
    conversation: {
      id: convo.id,
      partner: { name: other.name, contact: other.contact || null },
      listing: {
        id: convo.listing.id,
        title: convo.listing.title,
        gives: convo.listing.gives,
        seeks: convo.listing.seeks,
      },
      // The listing owner sees an incoming enquiry; the initiator sees their own.
      iAmOwner: convo.ownerId === me.id,
    },
    messages: messages.map((m) => serializeMessage(m, me.id)),
  });
}

// Sends a message into the thread.
export async function POST(req, { params }) {
  const { id } = await params;
  const me = await currentCompany();
  if (!me) return NextResponse.json({ error: "no_company" }, { status: 401 });

  const convo = await loadParticipantConversation(id, me.id);
  if (!convo) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { body } = await req.json().catch(() => ({}));
  const text = String(body || "").trim();
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: convo.id, senderId: me.id, body: text },
    }),
    // Keeps the conversation list ordered by real activity.
    prisma.conversation.update({
      where: { id: convo.id },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, message: serializeMessage(message, me.id) });
}
