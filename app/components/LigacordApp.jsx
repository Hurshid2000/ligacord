"use client";

import { useState, useEffect } from "react";
import { ArrowLeftRight, Loader2, Sparkles, AlertTriangle, ChevronRight, Copy, Check, ChevronDown } from "lucide-react";

// ---- Interface copy (bilingual) ----
const T = {
  ru: {
    tagline: "b2b бартер · подбор партнёров",
    heroA: "Найдите, с кем",
    heroB: "обменяться.",
    heroSub: "Опишите компанию, что готовы отдать в бартер и что ищете. Агент подберёт партнёров из базы, объяснит логику и напишет готовое КП.",
    company: "Компания и чем занимается",
    companyPh: "Напр.: Bellissimo — сеть пиццерий, 40 точек по Ташкенту, аудитория 18–35 лет.",
    give: "Что даёте в бартер",
    givePh: "Напр.: QR-столы, экраны в залах, промо в соцсетях (120k подписчиков), место под ивенты.",
    get: "Что ищете взамен",
    getPh: "Напр.: медиа-охваты под запуск, трансляции спорта, аудиторию футбольных фанатов.",
    moreFields: "Детали сделки (необязательно)",
    budget: "Бюджет / доплата",
    budgetPh: "Чистый бартер или + доплата до 5 млн сум",
    timeline: "Сроки",
    timelinePh: "К старту сезона, ~3 недели",
    venue: "Площадка / формат",
    venuePh: "Точки Bellissimo + digital",
    toneLabel: "Тон КП",
    tones: { formal: "Деловой", warm: "Тёплый", short: "Короткий" },
    cta: "Подобрать партнёров",
    ctaLoading: "Агент думает…",
    resultsTitle: "Подобранные партнёры",
    fit: "совместимость",
    youGive: "Вы даёте",
    youGet: "Вы получаете",
    caveat: "Что проверить",
    genKp: "Сгенерировать КП",
    genKpLoading: "Пишу КП…",
    kpTitle: "Готовое КП",
    copy: "Копировать",
    copied: "Скопировано",
    errEmpty: "Заполните хотя бы поле «что даёте» и «что ищете».",
    errPrefix: "Ошибка",
    footer: "Демо · подбор не гарантирует сделку · КП — черновик для проверки",
    demoBadge: "демо-режим (без ключа)",
  },
  uz: {
    tagline: "b2b barter · hamkor tanlash",
    heroA: "Kim bilan almashishni",
    heroB: "toping.",
    heroSub: "Kompaniyangizni, barterga nima berishingiz va nima izlayotganingizni yozing. Agent bazadan hamkorlarni tanlab, mantiqni tushuntirib, tayyor taklif yozadi.",
    company: "Kompaniya va faoliyati",
    companyPh: "Masalan: Bellissimo — pitseriyalar tarmog‘i, Toshkentda 40 nuqta, auditoriya 18–35 yosh.",
    give: "Barterga nima berasiz",
    givePh: "Masalan: QR-stollar, zallardagi ekranlar, ijtimoiy tarmoqda promo (120k obunachi), tadbir uchun joy.",
    get: "Evaziga nima izlaysiz",
    getPh: "Masalan: mahsulot uchun media-qamrov, sport translyatsiyalari, futbol muxlislari auditoriyasi.",
    moreFields: "Bitim tafsilotlari (ixtiyoriy)",
    budget: "Byudjet / qo‘shimcha to‘lov",
    budgetPh: "Sof barter yoki + 5 mln so‘mgacha",
    timeline: "Muddat",
    timelinePh: "Mavsum boshiga, ~3 hafta",
    venue: "Maydon / format",
    venuePh: "Bellissimo nuqtalari + digital",
    toneLabel: "Taklif ohangi",
    tones: { formal: "Rasmiy", warm: "Samimiy", short: "Qisqa" },
    cta: "Hamkorlarni tanlash",
    ctaLoading: "Agent o‘ylayapti…",
    resultsTitle: "Tanlangan hamkorlar",
    fit: "moslik",
    youGive: "Siz berasiz",
    youGet: "Siz olasiz",
    caveat: "Nimani tekshirish kerak",
    genKp: "Taklif yozish",
    genKpLoading: "Taklif yozilyapti…",
    kpTitle: "Tayyor taklif",
    copy: "Nusxa olish",
    copied: "Nusxa olindi",
    errEmpty: "Kamida «nima berasiz» va «nima izlaysiz» maydonlarini to‘ldiring.",
    errPrefix: "Xatolik",
    footer: "Demo · tanlov bitimni kafolatlamaydi · taklif — tekshirish uchun qoralama",
    demoBadge: "demo-rejim (kalitsiz)",
  },
};

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

function scoreColor(s) {
  if (s >= 80) return "#16706B";
  if (s >= 60) return "#5E8A3A";
  return "#B06A2C";
}

export default function LigacordApp() {
  const [lang, setLang] = useState("ru");
  const [company, setCompany] = useState("");
  const [give, setGive] = useState("");
  const [get, setGet] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [venue, setVenue] = useState("");
  const [tone, setTone] = useState("warm");
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState("");
  const [isMock, setIsMock] = useState(false);
  const [kp, setKp] = useState({});
  const [copiedIdx, setCopiedIdx] = useState(null);
  const t = T[lang];

  useEffect(() => {
    const id = "lc-fonts";
    if (!document.getElementById(id)) {
      const l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      l.href =
        "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  async function findPartners() {
    setError("");
    if (!give.trim() || !get.trim()) {
      setError(t.errEmpty);
      return;
    }
    setLoading(true);
    setMatches(null);
    setKp({});
    try {
      const data = await postJson("/api/match", { company, give, get, budget, timeline, venue, lang });
      setIsMock(Boolean(data.mock));
      setMatches((data.matches || []).slice(0, 3));
    } catch (e) {
      setError(`${t.errPrefix}: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function generateKp(idx, m) {
    setKp((prev) => ({ ...prev, [idx]: { loading: true, text: "" } }));
    try {
      const data = await postJson("/api/proposal", { match: m, company, give, get, budget, timeline, venue, tone, lang });
      setKp((prev) => ({ ...prev, [idx]: { loading: false, text: (data.text || "").trim() } }));
    } catch (e) {
      setKp((prev) => ({ ...prev, [idx]: { loading: false, text: `${t.errPrefix}: ${e.message}` } }));
    }
  }

  function copyKp(idx, text) {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1600);
  }

  return (
    <>
      <style>{css}</style>
      <div className="lc">
        <header className="lc-head">
          <div className="lc-brand">
            <span className="lc-logo">
              <ArrowLeftRight size={18} strokeWidth={2.4} />
            </span>
            <div className="lc-brandtext">
              <span className="lc-name">LIGACORD</span>
              <span className="lc-tag">{t.tagline}</span>
            </div>
          </div>
          <div className="lc-toggle" role="group" aria-label="Language">
            <button className={lang === "ru" ? "on" : ""} onClick={() => setLang("ru")}>RU</button>
            <button className={lang === "uz" ? "on" : ""} onClick={() => setLang("uz")}>UZ</button>
          </div>
        </header>

        <section className="lc-hero">
          <h1>
            {t.heroA} <span className="lc-hi">{t.heroB}</span>
          </h1>
          <p className="lc-sub">{t.heroSub}</p>
        </section>

        <section className="lc-panel">
          <label className="lc-field">
            <span className="lc-label">{t.company}</span>
            <textarea rows={2} value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t.companyPh} />
          </label>
          <div className="lc-row">
            <label className="lc-field give">
              <span className="lc-label"><i className="dot give-dot" /> {t.give}</span>
              <textarea rows={3} value={give} onChange={(e) => setGive(e.target.value)} placeholder={t.givePh} />
            </label>
            <label className="lc-field get">
              <span className="lc-label"><i className="dot get-dot" /> {t.get}</span>
              <textarea rows={3} value={get} onChange={(e) => setGet(e.target.value)} placeholder={t.getPh} />
            </label>
          </div>

          <button className="lc-more" onClick={() => setShowMore((v) => !v)} aria-expanded={showMore}>
            <ChevronDown size={15} className={showMore ? "rot" : ""} /> {t.moreFields}
          </button>

          {showMore && (
            <div className="lc-details">
              <label className="lc-mini">
                <span className="lc-minilbl">{t.budget}</span>
                <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={t.budgetPh} />
              </label>
              <label className="lc-mini">
                <span className="lc-minilbl">{t.timeline}</span>
                <input value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder={t.timelinePh} />
              </label>
              <label className="lc-mini">
                <span className="lc-minilbl">{t.venue}</span>
                <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={t.venuePh} />
              </label>
            </div>
          )}

          <div className="lc-tonerow">
            <span className="lc-tonelbl">{t.toneLabel}</span>
            <div className="lc-toneseg">
              {["warm", "formal", "short"].map((k) => (
                <button key={k} className={tone === k ? "on" : ""} onClick={() => setTone(k)}>
                  {t.tones[k]}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="lc-err">{error}</div>}

          <button className="lc-cta" onClick={findPartners} disabled={loading}>
            {loading ? (<><Loader2 className="spin" size={18} /> {t.ctaLoading}</>) : (<><Sparkles size={18} /> {t.cta}</>)}
          </button>
        </section>

        {matches && (
          <section className="lc-results">
            <h2 className="lc-restitle">
              {t.resultsTitle}
              {isMock && <span className="lc-demo">{t.demoBadge}</span>}
            </h2>
            <div className="lc-cards">
              {matches.map((m, i) => (
                <article className="lc-card" key={i}>
                  <div className="lc-cardtop">
                    <h3>{m.title}</h3>
                    <div className="lc-score">
                      <span className="lc-scorenum" style={{ color: scoreColor(m.score) }}>{m.score}</span>
                      <span className="lc-scorelbl">{t.fit}</span>
                    </div>
                  </div>
                  <p className="lc-fit">{m.fit}</p>

                  <div className="lc-exchange">
                    <div className="lc-lane give">
                      <span className="lc-lanelbl">{t.youGive}</span>
                      <p>{m.give}</p>
                    </div>
                    <div className="lc-swap"><ArrowLeftRight size={16} strokeWidth={2.2} /></div>
                    <div className="lc-lane get">
                      <span className="lc-lanelbl">{t.youGet}</span>
                      <p>{m.get}</p>
                    </div>
                  </div>

                  <div className="lc-caveat">
                    <AlertTriangle size={14} strokeWidth={2.2} />
                    <div>
                      <span className="lc-caveatlbl">{t.caveat}</span>
                      <p>{m.caveat}</p>
                    </div>
                  </div>

                  {kp[i]?.text ? (
                    <div className="lc-kp">
                      <div className="lc-kphead">
                        <span>{t.kpTitle}</span>
                        <button onClick={() => copyKp(i, kp[i].text)}>
                          {copiedIdx === i ? (<><Check size={13} /> {t.copied}</>) : (<><Copy size={13} /> {t.copy}</>)}
                        </button>
                      </div>
                      <p className="lc-kptext">{kp[i].text}</p>
                    </div>
                  ) : (
                    <button className="lc-kpbtn" onClick={() => generateKp(i, m)} disabled={kp[i]?.loading}>
                      {kp[i]?.loading ? (<><Loader2 className="spin" size={15} /> {t.genKpLoading}</>) : (<>{t.genKp} <ChevronRight size={15} /></>)}
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="lc-foot">{t.footer}</footer>
      </div>
    </>
  );
}

const css = `
.lc{
  --paper:#F1EFE9; --card:#FBFAF7; --ink:#1B2233; --muted:#6B6B63;
  --line:#E3E0D6; --give:#B06A2C; --get:#16706B;
  font-family:'Inter',system-ui,sans-serif; color:var(--ink);
  background:var(--paper); min-height:100vh;
  padding:28px 20px 40px; box-sizing:border-box;
  max-width:920px; margin:0 auto; -webkit-font-smoothing:antialiased;
}
.lc *{box-sizing:border-box;}
.lc-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:34px;}
.lc-brand{display:flex; align-items:center; gap:11px;}
.lc-logo{width:34px; height:34px; border-radius:9px; background:var(--ink); color:var(--paper);
  display:grid; place-items:center;}
.lc-brandtext{display:flex; flex-direction:column; line-height:1;}
.lc-name{font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:19px; letter-spacing:.14em;}
.lc-tag{font-family:'Space Mono',monospace; font-size:10.5px; color:var(--muted); margin-top:4px; letter-spacing:.02em;}
.lc-toggle{display:flex; background:#E7E4DA; border-radius:8px; padding:3px;}
.lc-toggle button{font-family:'Space Mono',monospace; font-size:12px; font-weight:700; border:0;
  background:transparent; color:var(--muted); padding:5px 11px; border-radius:6px; cursor:pointer; transition:all .15s;}
.lc-toggle button.on{background:var(--ink); color:var(--paper);}

.lc-hero{margin-bottom:26px;}
.lc-hero h1{font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:40px; line-height:1.02;
  letter-spacing:-.02em; margin:0 0 14px;}
.lc-hi{color:var(--give); font-style:italic;}
.lc-sub{font-size:15px; line-height:1.55; color:#4A4A44; max-width:560px; margin:0;}

.lc-panel{background:var(--card); border:1px solid var(--line); border-radius:16px; padding:22px;
  box-shadow:0 1px 0 rgba(0,0,0,.02);}
.lc-field{display:flex; flex-direction:column; gap:8px; margin-bottom:14px;}
.lc-label{font-family:'Space Mono',monospace; font-size:11px; font-weight:700; text-transform:uppercase;
  letter-spacing:.05em; color:#555; display:flex; align-items:center; gap:7px;}
.dot{width:8px; height:8px; border-radius:50%; display:inline-block;}
.give-dot{background:var(--give);} .get-dot{background:var(--get);}
.lc textarea, .lc input{font-family:'Inter',sans-serif; font-size:14px; color:var(--ink); line-height:1.5;
  border:1px solid var(--line); border-radius:10px; padding:11px 13px; background:#fff; outline:none;
  transition:border-color .15s, box-shadow .15s; width:100%;}
.lc textarea{resize:vertical;}
.lc textarea::placeholder, .lc input::placeholder{color:#A8A69C;}
.lc textarea:focus-visible, .lc input:focus-visible{border-color:var(--ink); box-shadow:0 0 0 3px rgba(27,34,51,.09);}
.lc-field.give textarea:focus-visible{border-color:var(--give); box-shadow:0 0 0 3px rgba(176,106,44,.12);}
.lc-field.get textarea:focus-visible{border-color:var(--get); box-shadow:0 0 0 3px rgba(22,112,107,.12);}
.lc-row{display:grid; grid-template-columns:1fr 1fr; gap:14px;}

.lc-more{font-family:'Space Mono',monospace; font-size:11px; font-weight:700; text-transform:uppercase;
  letter-spacing:.04em; color:var(--muted); background:transparent; border:0; cursor:pointer;
  display:inline-flex; align-items:center; gap:6px; padding:2px 0 0; margin-bottom:4px;}
.lc-more svg{transition:transform .18s;} .lc-more svg.rot{transform:rotate(180deg);}
.lc-details{display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin:12px 0 4px;}
.lc-mini{display:flex; flex-direction:column; gap:6px;}
.lc-minilbl{font-family:'Space Mono',monospace; font-size:10px; font-weight:700; text-transform:uppercase;
  letter-spacing:.04em; color:#7A796F;}
.lc-mini input{font-size:13px; padding:9px 11px;}

.lc-tonerow{display:flex; align-items:center; gap:12px; margin:16px 0 4px; flex-wrap:wrap;}
.lc-tonelbl{font-family:'Space Mono',monospace; font-size:10.5px; font-weight:700; text-transform:uppercase;
  letter-spacing:.04em; color:#7A796F;}
.lc-toneseg{display:flex; background:#EEEBE2; border-radius:8px; padding:3px;}
.lc-toneseg button{font-family:'Inter',sans-serif; font-size:12.5px; font-weight:600; border:0; background:transparent;
  color:var(--muted); padding:6px 13px; border-radius:6px; cursor:pointer; transition:all .15s;}
.lc-toneseg button.on{background:#fff; color:var(--ink); box-shadow:0 1px 2px rgba(0,0,0,.08);}

.lc-err{background:#FBEEE6; color:#9A4B1B; font-size:12.5px; line-height:1.45; padding:10px 12px; border-radius:8px;
  margin:14px 0 12px; border:1px solid #F0D9C9; font-family:'Space Mono',monospace; word-break:break-word;}

.lc-cta{width:100%; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:15px; color:var(--paper);
  background:var(--ink); border:0; border-radius:11px; padding:14px; display:flex; align-items:center;
  justify-content:center; gap:9px; cursor:pointer; transition:transform .12s, background .15s; margin-top:14px;}
.lc-cta:hover:not(:disabled){background:#0F1626;}
.lc-cta:active:not(:disabled){transform:translateY(1px);}
.lc-cta:disabled{opacity:.72; cursor:default;}

.lc-results{margin-top:32px;}
.lc-restitle{font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:15px; text-transform:uppercase;
  letter-spacing:.08em; color:var(--muted); margin:0 0 16px; display:flex; align-items:center; gap:10px;}
.lc-restitle::after{content:""; flex:1; height:1px; background:var(--line);}
.lc-demo{font-family:'Space Mono',monospace; font-size:9.5px; font-weight:700; text-transform:none; letter-spacing:0;
  color:#9A4B1B; background:#FBEEE6; border:1px solid #F0D9C9; padding:3px 8px; border-radius:20px; flex:0 0 auto;}
.lc-restitle::after{order:3;}
.lc-cards{display:flex; flex-direction:column; gap:16px;}
.lc-card{background:var(--card); border:1px solid var(--line); border-radius:15px; padding:20px;}
.lc-cardtop{display:flex; justify-content:space-between; align-items:flex-start; gap:14px;}
.lc-card h3{font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:18px; margin:0; line-height:1.25;}
.lc-score{display:flex; flex-direction:column; align-items:center; flex-shrink:0;}
.lc-scorenum{font-family:'Space Mono',monospace; font-weight:700; font-size:23px; line-height:1;}
.lc-scorelbl{font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:.06em;
  color:var(--muted); margin-top:3px;}
.lc-fit{font-size:14px; line-height:1.5; color:#43433D; margin:10px 0 16px;}

.lc-exchange{display:grid; grid-template-columns:1fr auto 1fr; align-items:stretch; border:1px solid var(--line);
  border-radius:11px; overflow:hidden; margin-bottom:14px;}
.lc-lane{padding:12px 14px;}
.lc-lane.give{background:rgba(176,106,44,.06);}
.lc-lane.get{background:rgba(22,112,107,.06);}
.lc-lanelbl{font-family:'Space Mono',monospace; font-size:9.5px; font-weight:700; text-transform:uppercase;
  letter-spacing:.05em; display:block; margin-bottom:5px;}
.lc-lane.give .lc-lanelbl{color:var(--give);}
.lc-lane.get .lc-lanelbl{color:var(--get);}
.lc-lane p{font-size:13px; line-height:1.45; margin:0; color:#3D3D37;}
.lc-swap{display:grid; place-items:center; padding:0 10px; color:var(--muted); background:#fff;
  border-left:1px solid var(--line); border-right:1px solid var(--line);}

.lc-caveat{display:flex; gap:9px; background:#FBF6EC; border:1px solid #EFE4CE; border-radius:10px;
  padding:11px 13px; margin-bottom:16px; color:#7A5A22;}
.lc-caveat svg{flex-shrink:0; margin-top:2px;}
.lc-caveatlbl{font-family:'Space Mono',monospace; font-size:9.5px; font-weight:700; text-transform:uppercase;
  letter-spacing:.05em; display:block; margin-bottom:3px;}
.lc-caveat p{font-size:13px; line-height:1.45; margin:0; color:#5C4A2A;}

.lc-kpbtn{font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:13.5px; color:var(--ink);
  background:#fff; border:1px solid var(--ink); border-radius:9px; padding:10px 15px; cursor:pointer;
  display:inline-flex; align-items:center; gap:5px; transition:all .14s;}
.lc-kpbtn:hover:not(:disabled){background:var(--ink); color:var(--paper);}
.lc-kpbtn:disabled{opacity:.65; cursor:default;}

.lc-kp{border-top:1px dashed var(--line); padding-top:14px; margin-top:2px;}
.lc-kphead{display:flex; justify-content:space-between; align-items:center; margin-bottom:9px;}
.lc-kphead span{font-family:'Space Mono',monospace; font-size:10px; font-weight:700; text-transform:uppercase;
  letter-spacing:.05em; color:var(--muted);}
.lc-kphead button{font-family:'Space Mono',monospace; font-size:11px; font-weight:700; color:var(--get);
  background:transparent; border:0; cursor:pointer; display:inline-flex; align-items:center; gap:4px;}
.lc-kptext{font-size:13.5px; line-height:1.62; color:#33332E; margin:0; white-space:pre-wrap;}

.lc-foot{font-family:'Space Mono',monospace; font-size:10.5px; color:#9C9A90; text-align:center;
  margin-top:34px; letter-spacing:.01em;}

.spin{animation:lcspin 1s linear infinite;}
@keyframes lcspin{to{transform:rotate(360deg);}}

@media (max-width:640px){
  .lc-hero h1{font-size:31px;}
  .lc-row{grid-template-columns:1fr;}
  .lc-details{grid-template-columns:1fr;}
  .lc-exchange{grid-template-columns:1fr;}
  .lc-swap{border:0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:6px;}
}
@media (prefers-reduced-motion:reduce){
  .spin{animation:none;} .lc-cta,.lc-kpbtn,.lc-toggle button,.lc-toneseg button,.lc-more svg{transition:none;}
}
`;
