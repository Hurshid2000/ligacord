import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: user.id,
      phone: user.phone,
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            listingCount: user.company.listings.length,
          }
        : null,
    },
  });
}
