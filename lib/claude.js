import Anthropic from "@anthropic-ai/sdk";

// Central model choice. Sonnet keeps running costs low; set
// CORD_MODEL=claude-opus-5 for the strongest reasoning (e.g. a live demo).
export const MODEL = process.env.CORD_MODEL || "claude-sonnet-5";

export const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client = null;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  return client;
}

/**
 * Calls Claude and returns the response text.
 *
 * `maxTokens` budgets thinking AND the answer together — on models with
 * adaptive thinking (Sonnet 5, Opus 5) reasoning eats into the same allowance,
 * so a tight budget silently truncates the answer mid-sentence. Keep it
 * generous and check stop_reason rather than letting callers parse a fragment.
 *
 * Pass `schema` to constrain the reply to a JSON shape, which removes the
 * whole class of "model wrapped the JSON in prose" parse failures.
 */
export async function callClaude(system, user, { maxTokens = 4000, schema, effort } = {}) {
  const outputConfig = {};
  if (effort) outputConfig.effort = effort;
  if (schema) outputConfig.format = { type: "json_schema", schema };

  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
    ...(Object.keys(outputConfig).length ? { output_config: outputConfig } : {}),
  });

  if (res.stop_reason === "max_tokens") {
    // Truncated. Surfacing this beats handing a half-written string to JSON.parse.
    throw new Error("Ответ не поместился в лимит токенов — попробуйте ещё раз");
  }
  if (res.stop_reason === "refusal") {
    throw new Error("Модель отклонила запрос");
  }

  const text = (res.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Пустой ответ модели");
  return text;
}

// Fallback parser for replies not constrained by a schema: models sometimes
// wrap JSON in prose or code fences.
export function extractJsonArray(raw) {
  let s = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  const parsed = JSON.parse(s);
  if (!Array.isArray(parsed)) throw new Error("expected a JSON array");
  return parsed;
}
