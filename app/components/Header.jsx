"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, LogOut, User, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header({ user, right = null }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  // Polled so a reply shows up without the user reloading the page.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/conversations/unread");
        if (!res.ok) return;
        const d = await res.json();
        if (alive) setUnread(d.unread || 0);
      } catch {}
    };
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <header className="hd">
      <Link href="/" className="hd-brand">
        <span className="hd-logo">
          <ArrowLeftRight size={18} strokeWidth={2.4} />
        </span>
        <span>
          <span className="hd-name">CORD</span>
          <span className="hd-tag">b2b бартер · подбор партнёров</span>
        </span>
      </Link>

      <div className="hd-right">
        {right}
        {user ? (
          <>
            <Link href="/messages" className="btn btn-ghost" title="Переписка" style={{ position: "relative" }}>
              <MessageSquare size={15} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute", top: 2, right: 2, minWidth: 16, height: 16,
                    borderRadius: 20, background: "var(--get)", color: "#fff",
                    fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700,
                    display: "grid", placeItems: "center", padding: "0 4px",
                  }}
                >
                  {unread}
                </span>
              )}
            </Link>
            <Link href="/profile" className="btn btn-ghost" title={user.phone}>
              <User size={15} />
              {user.company?.name || "Профиль"}
            </Link>
            <button className="btn btn-ghost" onClick={logout} title="Выйти">
              <LogOut size={15} />
            </button>
          </>
        ) : (
          <Link href="/auth" className="btn btn-primary">
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}
