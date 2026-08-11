import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentCompany } from "@/lib/chat";

// Cheap endpoint for the header badge — polled often, so it counts only.
export async function GET() {
  const me = await currentCompany();
  if (!me) return NextResponse.json({ unread: 0 });

  const unread = await prisma.message.count({
    where: {
      conversation: { OR: [{ initiatorId: me.id }, { ownerId: me.id }] },
      senderId: { not: me.id },
      readAt: null,
    },
  });

  return NextResponse.json({ unread });
}
