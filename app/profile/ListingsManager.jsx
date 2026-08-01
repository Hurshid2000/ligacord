"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Loader2, Pencil, Trash2, Eye, EyeOff, X, Check,
} from "lucide-react";
import { CATEGORIES, CAT_LABEL } from "@/lib/categories";
import { isExpired } from "@/lib/listingFilters";

const EMPTY = {
  title: "", gives: "", seeks: "", category: "other", budget: "", expiresAt: "", venue: "",
};

// <input type="date"> needs a plain YYYY-MM-DD value.
function toDateInput(v) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function formatDate(v) {
  return new Date(v).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function ListingsManager({ listings, defaultCategory }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState("");

  async function send(url, method, body) {
    setError("");
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "request_failed");
    return d;
  }

  async function create(form) {
    await send("/api/listings", "POST", form);
    setCreating(false);
    router.refresh();
  }

  async function update(id, form) {
    await send(`/api/listings/${id}`, "PATCH", form);
    setEditingId(null);
    router.refresh();
  }

  async function toggle(l) {
    setBusyId(l.id);
    try {
      await send(`/api/listings/${l.id}`, "PATCH", { isActive: !l.isActive });
      router.refresh();
    } catch {
      setError("Не удалось изменить статус");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id) {
    setBusyId(id);
    try {
      await send(`/api/listings/${id}`, "DELETE");
      setConfirmId(null);
      router.refresh();
    } catch {
      setError("Не удалось удалить объявление");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <h2 className="sect">
        Мои объявления
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "none", letterSpacing: 0 }}>
          {listings.length}
        </span>
      </h2>

      {error && <div className="err">{error}</div>}

      {listings.length === 0 && !creating && (
        <div className="note">
          У вас пока нет объявлений. Добавьте первое — и вас начнут находить в каталоге.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
        {listings.map((l) =>
          editingId === l.id ? (
            <ListingForm
              key={l.id}
              initial={l}
              submitLabel="Сохранить"
              onCancel={() => setEditingId(null)}
              onSubmit={(form) => update(l.id, form)}
            />
          ) : (
            <article
              className="panel"
              key={l.id}
              style={{ padding: 18, opacity: l.isActive && !isExpired(l) ? 1 : 0.62 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, lineHeight: 1.3 }}>
                    {l.title}{" "}
                    {isExpired(l) && <span className="badge badge-demo">срок истёк</span>}
                  </h3>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                    {CAT_LABEL[l.category] || l.category}
                    {!l.isActive && " · скрыто из каталога"}
                    {l.expiresAt && !isExpired(l) && ` · до ${formatDate(l.expiresAt)}`}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button className="btn btn-ghost" onClick={() => setEditingId(l.id)} title="Редактировать">
                    <Pencil size={15} />
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => toggle(l)}
                    disabled={busyId === l.id}
                    title={l.isActive ? "Скрыть из каталога" : "Показать в каталоге"}
                  >
                    {l.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setConfirmId(l.id)} title="Удалить">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 6px" }}>
                <strong style={{ color: "var(--give)" }}>Даёт:</strong> {l.gives}
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                <strong style={{ color: "var(--get)" }}>Ищет:</strong> {l.seeks}
              </p>

              {isExpired(l) && (
                <div className="note" style={{ marginTop: 12, marginBottom: 0 }}>
                  Срок истёк {formatDate(l.expiresAt)} — объявление скрыто из каталога.
                  Чтобы вернуть его, нажмите «Редактировать» и поставьте новую дату.
                </div>
              )}

              {confirmId === l.id && (
                <div className="note" style={{ marginTop: 14, marginBottom: 0, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ flex: 1 }}>Удалить объявление? Это действие необратимо.</span>
                  <button className="btn" onClick={() => remove(l.id)} disabled={busyId === l.id}>
                    {busyId === l.id ? <Loader2 className="spin" size={14} /> : <Check size={14} />} Удалить
                  </button>
                  <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>
                    <X size={14} /> Отмена
                  </button>
                </div>
              )}
            </article>
          )
        )}
      </div>

      {creating ? (
        <ListingForm
          initial={{ ...EMPTY, category: defaultCategory || "other" }}
          submitLabel="Опубликовать"
          onCancel={() => setCreating(false)}
          onSubmit={create}
        />
      ) : (
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Добавить объявление
        </button>
      )}
    </>
  );
}

function ListingForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!f.gives.trim() || !f.seeks.trim()) {
      setErr("Заполните оба поля: что даёте и что ищете.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      await onSubmit({
        title: f.title,
        gives: f.gives,
        seeks: f.seeks,
        category: f.category,
        budget: f.budget,
        expiresAt: f.expiresAt,
        venue: f.venue,
      });
    } catch {
      setErr("Не удалось сохранить. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit} style={{ borderColor: "var(--ink)" }}>
      <label className="field">
        <span className="label">Заголовок</span>
        <input
          value={f.title}
          onChange={set("title")}
          placeholder="Напр.: Экраны в залах в обмен на медиа-охваты"
        />
      </label>

      <div className="row2">
        <label className="field">
          <span className="label"><i className="dot dot-give" /> Что даёте *</span>
          <textarea rows={3} value={f.gives} onChange={set("gives")}
            placeholder="Напр.: экраны в 40 залах, промо в соцсетях" />
        </label>
        <label className="field">
          <span className="label"><i className="dot dot-get" /> Что ищете *</span>
          <textarea rows={3} value={f.seeks} onChange={set("seeks")}
            placeholder="Напр.: медиа-охваты, спонсоров" />
        </label>
      </div>

      <div className="row2">
        <label className="field">
          <span className="label">Категория</span>
          <select value={f.category} onChange={set("category")}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">Актуально до</span>
          <input
            type="date"
            value={toDateInput(f.expiresAt)}
            onChange={set("expiresAt")}
            min={new Date().toISOString().slice(0, 10)}
          />
          <span style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.4 }}>
            После этой даты объявление скроется из каталога. Оставьте пустым — будет висеть бессрочно.
          </span>
        </label>
      </div>

      <div className="row2">
        <label className="field">
          <span className="label">Бюджет / доплата</span>
          <input value={f.budget} onChange={set("budget")} placeholder="Чистый бартер или + доплата" />
        </label>
        <label className="field">
          <span className="label">Площадка / формат</span>
          <input value={f.venue} onChange={set("venue")} placeholder="Напр.: офлайн-точки + digital" />
        </label>
      </div>

      {err && <div className="err">{err}</div>}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-primary" style={{ flex: 1, padding: 12 }} disabled={loading}>
          {loading ? <><Loader2 className="spin" size={16} /> Сохраняю…</> : submitLabel}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Отмена
        </button>
      </div>
    </form>
  );
}
