import { prisma } from "./db";
import { getSessionUserId } from "./auth";

// Every chat route goes through this. Returns the signed-in user's company, or
// null — a user without a company profile can't take part in negotiations.
export async function currentCompany() {
  const uid = await getSessionUserId();
  if (!uid) return null;
  return prisma.company.findUnique({ where: { userId: uid } });
}

// Loads a conversation only if the given company is one of its two sides.
// Returns null otherwise, so callers answer 404 and never confirm that a
// conversation with that id exists.
export async function loadParticipantConversation(conversationId, companyId) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { include: { company: true } },
      initiator: true,
      owner: true,
    },
  });
  if (!convo) return null;
  if (convo.initiatorId !== companyId && convo.ownerId !== companyId) return null;
  return convo;
}

// The other side of a conversation, from `companyId`'s point of view.
export function counterpart(convo, companyId) {
  return convo.initiatorId === companyId ? convo.owner : convo.initiator;
}

export function serializeMessage(m, myCompanyId) {
  return {
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    readAt: m.readAt,
    mine: m.senderId === myCompanyId,
  };
}

export const MAX_MESSAGE_LENGTH = 4000;
