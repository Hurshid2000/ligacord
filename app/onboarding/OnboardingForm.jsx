"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

export default function OnboardingForm({ initial }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: initial?.name || "",
    about: initial?.about || "",
    category: initial?.category || "other",
    contact: initial?.contact || "",
    gives: "",
    seeks: "",
    ...(initial?.budget ? {} : {}),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!f.name.trim()) {
      setError("Укажите хотя бы название компании");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error === "name_required" ? "Укажите название компании" : "Не удалось сохранить");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setLoading(false);
    }
  }

  function skip() {
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: "-0.02em",
          marginBottom: 10,
        }}
      >
        Расскажите о компании
      </h1>
      <p style={{ color: "#4a4a44", lineHeight: 1.55, marginBottom: 22 }}>
        Это нужно, чтобы вас находили в каталоге и чтобы AI подбирал вам подходящих
        партнёров. Можно пропустить и заполнить позже.
      </p>

      <form className="panel" onSubmit={submit}>
        <label className="field">
          <span className="label">Название компании *</span>
          <input value={f.name} onChange={set("name")} placeholder="Напр.: Bellissimo" required />
        </label>

        <label className="field">
          <span className="label">Чем занимается</span>
          <textarea
            rows={2}
            value={f.about}
            onChange={set("about")}
            placeholder="Напр.: сеть пиццерий, 40 точек по Ташкенту, аудитория 18–35 лет"
          />
        </label>

        <div className="row2">
          <label className="field">
            <span className="label">Категория</span>
            <select value={f.category} onChange={set("category")}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">Контакт для партнёров</span>
            <input
              value={f.contact}
              onChange={set("contact")}
              placeholder="email или телеграм"
            />
          </label>
        </div>

        <div className="note">
          Заполните оба поля ниже — и ваше первое объявление сразу появится в каталоге.
        </div>

        <div className="row2">
          <label className="field">
            <span className="label">
              <i className="dot dot-give" /> Что даёте в бартер
            </span>
            <textarea
              rows={3}
              value={f.gives}
              onChange={set("gives")}
              placeholder="Напр.: экраны в залах, промо в соцсетях, место под ивенты"
            />
          </label>
          <label className="field">
            <span className="label">
              <i className="dot dot-get" /> Что ищете взамен
            </span>
            <textarea
              rows={3}
              value={f.seeks}
              onChange={set("seeks")}
              placeholder="Напр.: медиа-охваты, спонсоров, площадки"
            />
          </label>
        </div>

        {error && <div className="err">{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn btn-primary" style={{ flex: 1, padding: 13 }} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={17} /> Сохраняю…
              </>
            ) : (
              <>
                Сохранить и продолжить <ChevronRight size={16} />
              </>
            )}
          </button>
          <button type="button" className="btn btn-ghost" onClick={skip} disabled={loading}>
            Пропустить
          </button>
        </div>
      </form>
    </div>
  );
}
