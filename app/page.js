import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { publicListingWhere } from "@/lib/listingFilters";
import CatalogClient from "./CatalogClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  const listings = await prisma.listing.findMany({
    where: publicListingWhere(),
    take: 60,
    orderBy: { createdAt: "desc" },
    include: { company: true },
  });

  return (
    <CatalogClient
      user={
        user
          ? { id: user.id, phone: user.phone, company: user.company ? { name: user.company.name } : null }
          : null
      }
      initialListings={listings.map((l) => ({
        id: l.id,
        title: l.title,
        gives: l.gives,
        seeks: l.seeks,
        category: l.category,
        company: {
          name: l.company.name,
          about: l.company.about,
          isDemo: l.company.isDemo,
          // Same gating as the API: contacts only for signed-in users.
          contact: user ? l.company.contact : null,
        },
      }))}
    />
  );
}
