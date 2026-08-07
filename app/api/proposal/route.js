import { NextResponse } from "next/server";
import { callClaude, hasKey } from "@/lib/claude";
import { getSessionUserId } from "@/lib/auth";
import { consumeAiQuota } from "@/lib/rateLimit";
import { mockProposal } from "@/lib/mock";

const LANG_NAME = { ru: "Russian", uz: "Uzbek" };
const TONE_INSTR = {
  formal: "Use a formal, businesslike register. Address the partner respectfully with 'Вы'/formal forms.",
  warm: "Use a warm but professional register — friendly, human, still credible.",
  short: "Keep it very short and punchy — under 90 words, no filler, straight to the exchange and the ask.",
};

function dealContext({ company, give, get, budget, timeline, venue }) {
  let s = `Company: ${company || "(not specified)"}\nGives in barter: ${give}\nSeeks in return: ${get}`;
  if (budget?.trim()) s += `\nBudget / cash top-up: ${budget}`;
  if (timeline?.trim()) s += `\nTimeline: ${timeline}`;
  if (venue?.trim()) s += `\nVenue / format: ${venue}`;
  return s;
}

export async function POST(req) {
  const body = await req.json();
  const { match, tone = "warm", lang = "ru" } = body;

  if (!match?.title) {
    return NextResponse.json({ error: "match is required" }, { status: 400 });
  }

  // Writing a proposal is a paid call too — same daily budget as matching.
  const uid = await getSessionUserId();
  const quota = await consumeAiQuota(req, uid);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.isGuest ? "guest_limit" : "user_limit", limit: quota.limit },
      { status: 429 }
    );
  }

  if (!hasKey()) {
    return NextResponse.json({ text: mockProposal(lang), mock: true });
  }

  const lenNote = tone === "short" ? "under 90 words" : "120-170 words";
  const system = `You write ready-to-send B2B barter proposals (commercial proposals / КП) for the Uzbekistan market — marketing, media, sports, and events. Write a proposal of ${lenNote} from OUR company to the chosen partner. ${TONE_INSTR[tone] || TONE_INSTR.warm} Structure: brief greeting, the barter offer stated as a clear reciprocal exchange (what each side gives and gets), one line on why it is mutually valuable, and a concrete call to action with a next step. If timing or budget details are given, weave them in naturally. Plain text, no markdown headers, no placeholders like [Name]. Write entirely in ${LANG_NAME[lang] || "Russian"}.`;

  const user = `${dealContext(body)}

Proposed partner: ${match.title}
Why it fits: ${match.fit}
We give them: ${match.give}
We get from them: ${match.get}`;

  try {
    const text = await callClaude(system, user, 800);
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: e.message || "generation failed" }, { status: 502 });
  }
}
