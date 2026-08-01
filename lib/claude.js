import Anthropic from "@anthropic-ai/sdk";

// Central model choice. Swap to "claude-sonnet-5" to cut cost, or keep
// "claude-opus-5" for the strongest reasoning in the AI-award demo.
export const MODEL = process.env.LIGACORD_MODEL || "claude-opus-5";

export const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client = null;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  return client;
}

// Calls Claude and returns the concatenated text of the response.
export async function callClaude(system, user, maxTokens = 1500) {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = (res.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("empty response from model");
  return text;
}

// Robust JSON extraction — models sometimes wrap output in prose or fences.
export function extractJsonArray(raw) {
  let s = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  const parsed = JSON.parse(s);
  if (!Array.isArray(parsed)) throw new Error("expected a JSON array");
  return parsed;
}
