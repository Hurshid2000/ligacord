import { NextResponse } from "next/server";
import { callClaude, extractJsonArray, hasKey } from "@/lib/claude";
import { companiesForPrompt } from "@/lib/companies";
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
  const { company, give, get, lang = "ru" } = body;

  if (!give?.trim() || !get?.trim()) {
    return NextResponse.json({ error: "give and get are required" }, { status: 400 });
  }

  // No key yet → serve deterministic demo data so the MVP still works.
  if (!hasKey()) {
    return NextResponse.json({ matches: mockMatches(lang), mock: true });
  }

  const base = companiesForPrompt(company);
  const system = `You are Ligacord — an expert B2B barter and partnership matchmaker for the Uzbekistan market (Tashkent), focused on barter for marketing, media, sports, and events.

You are given a REAL database of companies. You MUST pick the 3 best barter partners for the user's company FROM THIS DATABASE ONLY — never invent companies that are not listed. Reason critically about mutual value, audience overlap, timing, and what each side actually gives and gets in a NON-CASH barter deal. Be candid, not a salesperson.

COMPANY DATABASE:
${base}

For EACH of the 3 matches return:
- "title": the partner's exact name from the database plus a 2–4 word descriptor
- "fit": one sentence — why this is a strong barter fit, referencing audience overlap or mutual value concretely
- "give": what OUR company gives this partner (drawn from what the user offers)
- "get": what OUR company receives (tied to what the partner seeks)
- "caveat": one honest, specific risk or thing to verify before pursuing (rights/licensing, budget mismatch, timing, inventory) — never generic
- "score": integer 0–100 barter-fit score, calibrated and honest (not everything is 90+)

Respond ONLY with a valid JSON array of exactly 3 objects with those keys. No markdown, no code fences, no preamble. Write all text values in ${LANG_NAME[lang] || "Russian"}.`;

  try {
    const raw = await callClaude(system, dealContext(body), 2000);
    const matches = extractJsonArray(raw).slice(0, 3);
    return NextResponse.json({ matches });
  } catch (e) {
    return NextResponse.json({ error: e.message || "matching failed" }, { status: 502 });
  }
}
