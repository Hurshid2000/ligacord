import { prisma } from "./db";
import { getSessionUserId } from "./auth";

// Loads the signed-in user together with their company. Returns null for guests
// (the catalog is public, so "no user" is a normal state, not an error).
export async function getCurrentUser() {
  const uid = await getSessionUserId();
  if (!uid) return null;
  return prisma.user.findUnique({
    where: { id: uid },
    // Stable order — without it the list reshuffles after every edit.
    include: {
      company: { include: { listings: { orderBy: { createdAt: "desc" } } } },
    },
  });
}
