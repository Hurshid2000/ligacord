import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callClaude, hasKey } from "@/lib/claude";
import { getSessionUserId } from "@/lib/auth";
import { publicListingWhere } from "@/lib/listingFilters";
import { PARTNERSHIP_LABEL } from "@/lib/partnershipTypes";
import { consumeAiQuota } from "@/lib/rateLimit";
import { mockMatches } from "@/lib/mock";

const LANG_NAME = { ru: "Russian", uz: "Uzbek" };

function dealContext({ company, give, get, budget, venue, partnershipType }) {
  let s = `Company: ${company || "(not specified)"}\nOffers: ${give}\nSeeks in return: ${get}`;
  if (partnershipType) {
    s += `\nWanted partnership format: ${PARTNERSHIP_LABEL[partnershipType] || partnershipType}`;
  }
  if (budget?.trim()) s += `\nBudget / cash top-up: ${budget}`;
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

  // Charged before the AI call, so parallel requests can't slip past the cap.
  const quota = await consumeAiQuota(req, uid);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.isGuest ? "guest_limit" : "user_limit", limit: quota.limit },
      { status: 429 }
    );
  }

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
    return NextResponse.json({
      matches: mockMatches(lang),
      mock: true,
      quota: { remaining: quota.remaining, limit: quota.limit, isGuest: quota.isGuest },
    });
  }

  const catalog = listings
    .map(
      (l) =>
        `- [id:${l.id}] ${l.company.name} [${l.category}] — ${l.company.about}\n  Формат партнёрства: ${PARTNERSHIP_LABEL[l.partnershipType] || l.partnershipType}\n  Отдаёт: ${l.gives}\n  Ищет: ${l.seeks}`
    )
    .join("\n");

  const system = `You are Cord — an expert B2B barter and partnership matchmaker for the Uzbekistan market (Tashkent), focused on barter for marketing, media, sports, and events.

You are given the platform's REAL catalog of partnership listings. Each one states its partnership format: Бартер (non-cash exchange), Спонсорство, Кросс-промо, Аффилейт, Дистрибуция or Реферальная программа. You MUST pick the 3 best partners for the user's company FROM THIS CATALOG ONLY — never invent companies. Reason critically about mutual value, audience overlap, timing, and what each side actually gives and gets under that specific format. If the user asked for a particular format, strongly prefer listings offering it, and say so in the caveat when a strong match uses a different format. Be candid, not a salesperson.

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

Keep every text value to one sentence. Write all text values in ${LANG_NAME[lang] || "Russian"}.`;

  // Constraining the reply to this shape means the API guarantees parseable
  // JSON — no prose wrappers, no fenced code blocks, no half-written objects.
  const schema = {
    type: "object",
    properties: {
      matches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            listingId: { type: "string" },
            title: { type: "string" },
            fit: { type: "string" },
            give: { type: "string" },
            get: { type: "string" },
            caveat: { type: "string" },
            score: { type: "integer" },
          },
          required: ["listingId", "title", "fit", "give", "get", "caveat", "score"],
          additionalProperties: false,
        },
      },
    },
    required: ["matches"],
    additionalProperties: false,
  };

  try {
    const raw = await callClaude(system, dealContext(body), {
      // Thinking and the answer share this budget — keep it roomy so a long
      // reasoning pass can't truncate the JSON.
      maxTokens: 8000,
      schema,
      effort: "medium",
    });
    const parsed = (JSON.parse(raw).matches || []).slice(0, 3);

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

    return NextResponse.json({
      matches,
      signedIn: Boolean(uid),
      quota: { remaining: quota.remaining, limit: quota.limit, isGuest: quota.isGuest },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "matching failed" }, { status: 502 });
  }
}
