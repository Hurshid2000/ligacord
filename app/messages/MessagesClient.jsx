"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

function timeLabel(v) {
  const d = new Date(v);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function MessagesClient({ initialConversationId }) {
  const [convos, setConvos] = useState(null);
  const [openId, setOpenId] = useState(initialConversationId || null);
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const loadConvos = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const d = await res.json();
    setConvos(d.conversations || []);
  }, []);

  const loadThread = useCallback(async (id) => {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) {
      setError("Диалог недоступен");
      setThread(null);
      return;
    }
    const d = await res.json();
    setThread(d);
  }, []);

  useEffect(() => { loadConvos(); }, [loadConvos]);
  useEffect(() => { if (openId) loadThread(openId); }, [openId, loadThread]);

  // Near-realtime without websockets: refresh the open thread and the list
  // every few seconds. Plenty for negotiation, and nothing to operate.
  useEffect(() => {
    const t = setInterval(() => {
      if (openId) loadThread(openId);
      loadConvos();
    }, 4000);
    return () => clearInterval(t);
  }, [openId, loadThread, loadConvos]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  async function send(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/conversations/${openId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error === "too_long" ? "Сообщение слишком длинное" : "Не удалось отправить");
        return;
      }
      setDraft("");
      await loadThread(openId);
      loadConvos();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setSending(false);
    }
  }

  if (convos === null) {
    return <div className="note"><Loader2 className="spin" size={15} /> Загружаю…</div>;
  }

  if (convos.length === 0) {
    return (
      <div className="note">
        <strong>Переписок пока нет.</strong> Найдите подходящее объявление в каталоге и
        нажмите «Написать» — переговоры появятся здесь.
        <div style={{ marginTop: 12 }}>
          <Link href="/" className="btn btn-primary">Открыть каталог</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="chat">
      {/* список диалогов */}
      <aside className={`chat-list ${openId ? "hide-mobile" : ""}`}>
        {convos.map((c) => (
          <button
            key={c.id}
            className={`chat-item ${openId === c.id ? "on" : ""}`}
            onClick={() => setOpenId(c.id)}
          >
            <div className="chat-item-top">
              <span className="chat-partner">{c.partner.name}</span>
              {c.unread > 0 && <span className="chat-unread">{c.unread}</span>}
            </div>
            <span className="chat-listing">{c.listing.title}</span>
            {c.lastMessage && (
              <span className="chat-preview">
                {c.lastMessage.mine && "Вы: "}
                {c.lastMessage.body}
              </span>
            )}
            <span className="chat-time">{timeLabel(c.lastMessageAt)}</span>
          </button>
        ))}
      </aside>

      {/* переписка */}
      <section className={`chat-thread ${openId ? "" : "hide-mobile"}`}>
        {!openId ? (
          <div className="chat-empty">
            <MessageSquare size={28} strokeWidth={1.6} />
            <p>Выберите диалог слева</p>
          </div>
        ) : !thread ? (
          <div className="chat-empty"><Loader2 className="spin" size={20} /></div>
        ) : (
          <>
            <header className="chat-head">
              <button className="btn btn-ghost only-mobile" onClick={() => setOpenId(null)}>
                <ArrowLeft size={16} />
              </button>
              <div style={{ minWidth: 0 }}>
                <div className="chat-partner">{thread.conversation.partner.name}</div>
                <div className="chat-listing">
                  {thread.conversation.iAmOwner ? "по вашему объявлению: " : "по объявлению: "}
                  {thread.conversation.listing.title}
                </div>
              </div>
              {thread.conversation.partner.contact && (
                <span className="chat-contact">{thread.conversation.partner.contact}</span>
              )}
            </header>

            <div className="chat-body">
              {thread.messages.length === 0 && (
                <p className="chat-hint">
                  Напишите первое сообщение — расскажите, что предлагаете и что хотите взамен.
                </p>
              )}
              {thread.messages.map((m) => (
                <div key={m.id} className={`bubble ${m.mine ? "mine" : ""}`}>
                  <p>{m.body}</p>
                  <span className="bubble-time">{timeLabel(m.createdAt)}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {error && <div className="err" style={{ margin: "0 14px" }}>{error}</div>}

            <form className="chat-input" onSubmit={send}>
              <textarea
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  // Enter отправляет, Shift+Enter — перенос строки.
                  if (e.key === "Enter" && !e.shiftKey) send(e);
                }}
                placeholder="Написать сообщение…"
              />
              <button className="btn btn-primary" disabled={sending || !draft.trim()}>
                {sending ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
              </button>
            </form>
          </>
        )}
      </section>

      <style>{`
        .chat{display:grid;grid-template-columns:300px 1fr;gap:16px;height:calc(100vh - 190px);min-height:420px;}
        .chat-list{background:var(--card);border:1px solid var(--line);border-radius:14px;
          overflow-y:auto;display:flex;flex-direction:column;}
        .chat-item{display:flex;flex-direction:column;gap:3px;text-align:left;background:transparent;
          border:0;border-bottom:1px solid var(--line);padding:13px 14px;cursor:pointer;position:relative;}
        .chat-item:hover{background:rgba(27,34,51,.03);}
        .chat-item.on{background:rgba(22,112,107,.07);}
        .chat-item-top{display:flex;align-items:center;justify-content:space-between;gap:8px;}
        .chat-partner{font-family:var(--font-display);font-weight:600;font-size:14.5px;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .chat-unread{font-family:var(--font-mono);font-size:10px;font-weight:700;color:#fff;
          background:var(--get);border-radius:20px;min-width:18px;height:18px;display:grid;
          place-items:center;padding:0 5px;flex-shrink:0;}
        .chat-listing{font-family:var(--font-mono);font-size:10px;color:var(--muted);
          text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .chat-preview{font-size:12.5px;color:#5a5a52;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .chat-time{font-family:var(--font-mono);font-size:9.5px;color:#a8a69c;}

        .chat-thread{background:var(--card);border:1px solid var(--line);border-radius:14px;
          display:flex;flex-direction:column;overflow:hidden;}
        .chat-head{display:flex;align-items:center;gap:10px;padding:13px 16px;
          border-bottom:1px solid var(--line);}
        .chat-contact{margin-left:auto;font-family:var(--font-mono);font-size:11.5px;
          color:var(--get);white-space:nowrap;}
        .chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}
        .chat-hint{font-size:13px;color:var(--muted);text-align:center;margin:auto;max-width:320px;line-height:1.5;}
        .chat-empty{margin:auto;color:var(--muted);display:flex;flex-direction:column;
          align-items:center;gap:10px;font-size:13.5px;}

        .bubble{max-width:76%;background:#fff;border:1px solid var(--line);border-radius:13px;
          padding:9px 12px;align-self:flex-start;}
        .bubble.mine{align-self:flex-end;background:rgba(22,112,107,.09);border-color:rgba(22,112,107,.2);}
        .bubble p{font-size:13.5px;line-height:1.5;margin:0;white-space:pre-wrap;word-break:break-word;}
        .bubble-time{font-family:var(--font-mono);font-size:9.5px;color:#a8a69c;
          display:block;margin-top:4px;text-align:right;}

        .chat-input{display:flex;gap:9px;padding:12px;border-top:1px solid var(--line);align-items:flex-end;}
        .chat-input textarea{flex:1;resize:none;max-height:120px;padding:10px 12px;}
        .chat-input .btn{padding:10px 14px;}

        .only-mobile{display:none;}
        @media (max-width:760px){
          .chat{grid-template-columns:1fr;height:calc(100vh - 160px);}
          .hide-mobile{display:none;}
          .only-mobile{display:inline-flex;}
        }
      `}</style>
    </div>
  );
}
