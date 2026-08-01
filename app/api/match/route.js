import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callClaude, extractJsonArray, hasKey } from "@/lib/claude";
import { getSessionUserId } from "@/lib/auth";
import { publicListingWhere } from "@/lib/listingFilters";
import { mockMatches } from "@/lib/mock";

const LANG_NAME = { ru: "Russian", uz: "Uzbek" };

function dealContext({ company, give, get, budget, timeline, venue }) {
  let s = `Company: ${company || "(not specified)"}\nGives in barter: ${give}\nSeeks in return: ${get}`;
  if (budget?.trim()) s += `\nBudget / cash top-up: ${budget}`;
  if (timeline?.trim()) s += `\nTimeline: ${timeline}`;
  if (venue?.trim()) s += `\nVenue / format: ${venue}`;
  return s;
}

export async function POST(req) {
  const body = await req.json();
  const { give, get, lang = "ru" } = body;

  if (!give?.trim() || !get?.trim()) {
    return NextResponse.json({ error: "give and get are required" }, { status: 400 });
  }

  const uid = await getSessionUserId();

  // Exclude the searcher's own listings — matching a company with itself is noise.
  const own = uid ? await prisma.company.findUnique({ where: { userId: uid } }) : null;

  const listings = await prisma.listing.findMany({
    // Expired offers must never be proposed as matches.
    where: publicListingWhere(own ? [{ NOT: { companyId: own.id } }] : []),
    take: 80,
    orderBy: { createdAt: "desc" },
    include: { company: true },
  });

  if (listings.length === 0) {
    return NextResponse.json({ matches: [], empty: true });
  }

  // No key yet → deterministic demo data so the flow still demonstrates.
  if (!hasKey()) {
    return NextResponse.json({ matches: mockMatches(lang), mock: true });
  }

  const catalog = listings
    .map(
      (l) =>
        `- [id:${l.id}] ${l.company.name} [${l.category}] — ${l.company.about}\n  Отдаёт: ${l.gives}\n  Ищет: ${l.seeks}`
    )
    .join("\n");

  const system = `You are Ligacord — an expert B2B barter and partnership matchmaker for the Uzbekistan market (Tashkent), focused on barter for marketing, media, sports, and events.

You are given the platform's REAL catalog of barter listings. You MUST pick the 3 best partners for the user's company FROM THIS CATALOG ONLY — never invent companies. Reason critically about mutual value, audience overlap, timing, and what each side actually gives and gets in a NON-CASH barter deal. Be candid, not a salesperson.

CATALOG:
${catalog}

For EACH of the 3 matches return:
- "listingId": the exact id from the catalog entry you chose (the value inside [id:...])
- "title": the partner company's name plus a 2-4 word descriptor
- "fit": one sentence — why this is a strong barter fit, referencing audience overlap or mutual value concretely
- "give": what OUR company gives this partner (drawn from what the user offers)
- "get": what OUR company receives (tied to what the partner seeks)
- "caveat": one honest, specific risk or thing to verify before pursuing (rights/licensing, budget mismatch, timing, inventory) — never generic
- "score": integer 0-100 barter-fit score, calibrated and honest (not everything is 90+)

If fewer than 3 listings are genuinely relevant, return only the ones that are — do not pad with weak matches.

Respond ONLY with a valid JSON array. No markdown, no code fences, no preamble. Write all text values in ${LANG_NAME[lang] || "Russian"}.`;

  try {
    const raw = await callClaude(system, dealContext(body), 2000);
    const parsed = extractJsonArray(raw).slice(0, 3);

    // Attach the real contact from the DB (only for signed-in users) rather than
    // trusting the model to reproduce it.
    const byId = new Map(listings.map((l) => [l.id, l]));
    const matches = parsed.map((m) => {
      const src = byId.get(m.listingId);
      return {
        ...m,
        company: src
          ? {
              name: src.company.name,
              isDemo: src.company.isDemo,
              contact: uid ? src.company.contact : null,
            }
          : null,
      };
    });

    return NextResponse.json({ matches, signedIn: Boolean(uid) });
  } catch (e) {
    return NextResponse.json({ error: e.message || "matching failed" }, { status: 502 });
  }
}
