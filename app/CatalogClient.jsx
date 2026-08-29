"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, ArrowLeftRight, AlertTriangle, Search, Lock, X, Copy, Check, ChevronRight,
  MessageSquare,
} from "lucide-react";
import Header from "./components/Header";
import { CATEGORIES, CAT_LABEL } from "@/lib/categories";
import { PARTNERSHIP_TYPES, PARTNERSHIP_LABEL } from "@/lib/partnershipTypes";

function scoreColor(s) {
  if (s >= 80) return "var(--get)";
  if (s >= 60) return "#5e8a3a";
  return "var(--give)";
}

export default function CatalogClient({ user, initialListings }) {
  const router = useRouter();
  const [startingChat, setStartingChat] = useState(null);
  const [listings, setListings] = useState(initialListings);
  const [category, setCategory] = useState("all");
  const [partnership, setPartnership] = useState("all");
  const [q, setQ] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  // AI search panel
  const [aiOpen, setAiOpen] = useState(false);
  const [give, setGive] = useState("");
  const [seek, setSeek] = useState("");
  const [matches, setMatches] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [limitHit, setLimitHit] = useState(false);
  const [quota, setQuota] = useState(null);
  const [isMock, setIsMock] = useState(false);
  const [kp, setKp] = useState({});
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    setLoadingList(true);
    try {
      const p = new URLSearchParams();
      if (category !== "all") p.set("category", category);
      if (partnership !== "all") p.set("partnership", partnership);
      if (q.trim()) p.set("q", q.trim());
      const res = await fetch(`/api/listings?${p}`);
      const d = await res.json();
      setListings(d.listings || []);
    } finally {
      setLoadingList(false);
    }
  }, [category, partnership, q]);

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function runAi(e) {
    e?.preventDefault();
    if (!give.trim() || !seek.trim()) {
      setAiError("Заполните оба поля — что даёте и что ищете.");
      return;
    }
    setAiError("");
    setLimitHit(false);
    setAiLoading(true);
    setMatches(null);
    setKp({});
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ give, get: seek, company: user?.company?.name || "", lang: "ru" }),
      });
      const d = await res.json();
      if (res.status === 429) {
        setLimitHit(true);
        return;
      }
      if (!res.ok) {
        setAiError(d.error || "Не удалось подобрать");
        return;
      }
      setIsMock(Boolean(d.mock));
      setQuota(d.quota || null);
      setMatches(d.matches || []);
    } catch {
      setAiError("Нет связи с сервером");
    } finally {
      setAiLoading(false);
    }
  }

  // Opens (or reopens) the negotiation thread for a listing.
  async function writeTo(listingId) {
    if (!user) { router.push("/auth"); return; }
    setStartingChat(listingId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (d.error === "no_company") router.push("/onboarding");
        return;
      }
      router.push(`/messages?c=${d.id}`);
    } finally {
      setStartingChat(null);
    }
  }

  async function genKp(i, m) {
    setKp((p) => ({ ...p, [i]: { loading: true, text: "" } }));
    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match: m, company: user?.company?.name || "", give, get: seek, tone: "warm", lang: "ru",
        }),
      });
      if (res.status === 429) {
        setKp((p) => ({ ...p, [i]: { loading: false, text: "" } }));
        setLimitHit(true);
        return;
      }
      const d = await res.json();
      setKp((p) => ({ ...p, [i]: { loading: false, text: (d.text || d.error || "").trim() } }));
    } catch {
      setKp((p) => ({ ...p, [i]: { loading: false, text: "Ошибка соединения" } }));
    }
  }

  return (
    <main className="wrap">
      <Header user={user} />

      <section style={{ marginBottom: 26 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 38,
            lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 12px",
          }}
        >
          Найдите, с кем{" "}
          <span style={{ color: "var(--give)", fontStyle: "italic" }}>обменяться.</span>
        </h1>
        <p style={{ color: "#4a4a44", lineHeight: 1.55, maxWidth: 620, margin: 0 }}>
          Каталог партнёрских предложений: бартер, спонсорство, кросс-промо, аффилейт,
          дистрибуция и рефералы. Найдите партнёра сами через поиск — или доверьте это
          AI-агенту: он разберёт, кому вы подходите, и напишет готовое КП.
        </p>
      </section>

      {/* --- controls --- */}
      <div className="panel" style={{ marginBottom: 22, padding: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search
              size={16}
              style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "#a8a69c", pointerEvents: "none",
              }}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по объявлениям…"
              style={{ paddingLeft: 36 }}
            />
          </div>
          <select
            value={partnership}
            onChange={(e) => setPartnership(e.target.value)}
            style={{ width: "auto", minWidth: 165 }}
          >
            <option value="all">Любой формат</option>
            {PARTNERSHIP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "auto", minWidth: 165 }}
          >
            <option value="all">Все категории</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setAiOpen((v) => !v)}>
            {aiOpen ? <X size={16} /> : <Sparkles size={16} />}
            {aiOpen ? "Закрыть" : "Подобрать через AI"}
          </button>
        </div>

        {aiOpen && (
          <form onSubmit={runAi} style={{ marginTop: 16, borderTop: "1px dashed var(--line)", paddingTop: 16 }}>
            <div className="row2">
              <label className="field">
                <span className="label"><i className="dot dot-give" /> Что даёте в бартер</span>
                <textarea rows={3} value={give} onChange={(e) => setGive(e.target.value)}
                  placeholder="Напр.: экраны в залах, промо в соцсетях 120k подписчиков" />
              </label>
              <label className="field">
                <span className="label"><i className="dot dot-get" /> Что ищете взамен</span>
                <textarea rows={3} value={seek} onChange={(e) => setSeek(e.target.value)}
                  placeholder="Напр.: медиа-охваты под запуск, аудиторию болельщиков" />
              </label>
            </div>
            {aiError && <div className="err">{aiError}</div>}

            {limitHit ? (
              <div className="note" style={{ marginBottom: 0 }}>
                {user ? (
                  <>
                    <strong>Дневной лимит AI-запросов исчерпан.</strong> Лимит обновится
                    завтра. Каталог и поиск по-прежнему доступны без ограничений.
                  </>
                ) : (
                  <>
                    <strong>Пробные запросы закончились.</strong> Зарегистрируйтесь, чтобы
                    продолжить пользоваться AI-подбором, разместить свои объявления и
                    видеть контакты компаний.
                    <div style={{ marginTop: 12 }}>
                      <Link href="/auth" className="btn btn-primary">
                        Зарегистрироваться
                      </Link>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button className="btn btn-primary btn-block" disabled={aiLoading}>
                  {aiLoading
                    ? <><Loader2 className="spin" size={17} /> Агент анализирует каталог…</>
                    : <><Sparkles size={17} /> Подобрать партнёров</>}
                </button>
                {!user && quota?.isGuest && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 10 }}>
                    осталось пробных запросов: {quota.remaining} из {quota.limit} ·{" "}
                    <Link href="/auth" style={{ color: "var(--get)" }}>зарегистрироваться</Link>
                  </p>
                )}
              </>
            )}
          </form>
        )}
      </div>

      {/* --- AI results --- */}
      {matches && (
        <section style={{ marginBottom: 34 }}>
          <h2 className="sect">
            Подобрано агентом
            {isMock && <span className="badge badge-demo">демо-режим (без ключа)</span>}
          </h2>

          {matches.length === 0 && (
            <div className="note">Пока нет подходящих объявлений. Каталог ещё наполняется.</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {matches.map((m, i) => (
              <article className="panel" key={i} style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, lineHeight: 1.25 }}>
                    {m.title}{" "}
                    {m.company?.isDemo && <span className="badge badge-demo">демо</span>}
                  </h3>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 23, lineHeight: 1, color: scoreColor(m.score) }}>
                      {m.score}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginTop: 3 }}>
                      совместимость
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 14, lineHeight: 1.5, color: "#43433d", margin: "10px 0 16px" }}>{m.fit}</p>

                <div className="exch">
                  <div className="exch-lane give">
                    <span className="exch-lbl">Вы даёте</span>
                    <p>{m.give}</p>
                  </div>
                  <div className="exch-mid"><ArrowLeftRight size={16} strokeWidth={2.2} /></div>
                  <div className="exch-lane get">
                    <span className="exch-lbl">Вы получаете</span>
                    <p>{m.get}</p>
                  </div>
                </div>

                <div className="note" style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <AlertTriangle size={14} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 3 }}>
                      Что проверить
                    </span>
                    <p style={{ fontSize: 13, lineHeight: 1.45, margin: 0 }}>{m.caveat}</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {kp[i]?.text ? null : (
                    <button className="btn" onClick={() => genKp(i, m)} disabled={kp[i]?.loading}>
                      {kp[i]?.loading
                        ? <><Loader2 className="spin" size={15} /> Пишу КП…</>
                        : <>Сгенерировать КП <ChevronRight size={15} /></>}
                    </button>
                  )}
                  <ContactSlot contact={m.company?.contact} signedIn={Boolean(user)} />
                </div>

                {kp[i]?.text && (
                  <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 14, marginTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--muted)" }}>
                        Готовое КП
                      </span>
                      <button
                        className="btn btn-ghost"
                        style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--get)", padding: "4px 8px" }}
                        onClick={() => { navigator.clipboard?.writeText(kp[i].text); setCopied(i); setTimeout(() => setCopied(null), 1600); }}
                      >
                        {copied === i ? <><Check size={13} /> Скопировано</> : <><Copy size={13} /> Копировать</>}
                      </button>
                    </div>
                    <p style={{ fontSize: 13.5, lineHeight: 1.62, whiteSpace: "pre-wrap", margin: 0, color: "#33332e" }}>
                      {kp[i].text}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* --- catalog --- */}
      <h2 className="sect">
        Каталог объявлений
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "none", letterSpacing: 0 }}>
          {loadingList ? "…" : `${listings.length}`}
        </span>
      </h2>

      {listings.length === 0 && !loadingList && (
        <div className="note">Ничего не найдено. Попробуйте изменить запрос или категорию.</div>
      )}

      <div className="grid">
        {listings.map((l) => (
          <article className="panel card" key={l.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, lineHeight: 1.3 }}>
                {l.company.name}
              </h3>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <span className="badge badge-type">
                  {PARTNERSHIP_LABEL[l.partnershipType] || "Бартер"}
                </span>
                {l.company.isDemo && <span className="badge badge-demo">демо</span>}
              </div>
            </div>

            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
              {CAT_LABEL[l.category] || l.category}
              {l.expiresAt &&
                ` · до ${new Date(l.expiresAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`}
            </span>

            {l.company.about && (
              <p style={{ fontSize: 13, lineHeight: 1.45, color: "#5a5a52", margin: "8px 0 0" }}>{l.company.about}</p>
            )}

            <div className="exch" style={{ margin: "14px 0 12px" }}>
              <div className="exch-lane give">
                <span className="exch-lbl">Даёт</span>
                <p>{l.gives}</p>
              </div>
              <div className="exch-mid"><ArrowLeftRight size={14} strokeWidth={2.2} /></div>
              <div className="exch-lane get">
                <span className="exch-lbl">Ищет</span>
                <p>{l.seeks}</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <ContactSlot contact={l.company.contact} signedIn={Boolean(user)} />
              {/* Seeded example companies have nobody to answer, so no button. */}
              {!l.company.isDemo && (
                <button
                  className="btn"
                  style={{ fontSize: 13, padding: "7px 12px" }}
                  onClick={() => writeTo(l.id)}
                  disabled={startingChat === l.id}
                >
                  {startingChat === l.id
                    ? <Loader2 className="spin" size={14} />
                    : <MessageSquare size={14} />}
                  Написать
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="foot">
        Cord · подбор не гарантирует сделку · КП — черновик для проверки
      </p>

      <style>{`
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
        .card{padding:18px;}
        .exch{display:grid;grid-template-columns:1fr auto 1fr;border:1px solid var(--line);
          border-radius:11px;overflow:hidden;margin-bottom:14px;}
        .exch-lane{padding:11px 13px;}
        .exch-lane.give{background:rgba(176,106,44,.06);}
        .exch-lane.get{background:rgba(22,112,107,.06);}
        .exch-lbl{font-family:var(--font-mono);font-size:9.5px;font-weight:700;text-transform:uppercase;
          letter-spacing:.05em;display:block;margin-bottom:5px;}
        .exch-lane.give .exch-lbl{color:var(--give);}
        .exch-lane.get .exch-lbl{color:var(--get);}
        .exch-lane p{font-size:12.5px;line-height:1.45;margin:0;color:#3d3d37;}
        .exch-mid{display:grid;place-items:center;padding:0 9px;background:#fff;
          border-left:1px solid var(--line);border-right:1px solid var(--line);color:var(--muted);}
        @media (max-width:640px){
          .grid{grid-template-columns:1fr;}
          .exch{grid-template-columns:1fr;}
          .exch-mid{border:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:5px;}
        }
      `}</style>
    </main>
  );
}

function ContactSlot({ contact, signedIn }) {
  if (signedIn && contact) {
    return (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--get)", wordBreak: "break-all" }}>
        {contact}
      </span>
    );
  }
  if (signedIn) return null;
  return (
    <Link
      href="/auth"
      style={{
        fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted)",
        display: "inline-flex", alignItems: "center", gap: 5,
      }}
    >
      <Lock size={12} /> войдите, чтобы увидеть контакт
    </Link>
  );
}
