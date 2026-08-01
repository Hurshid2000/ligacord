"use client";

import { ArrowLeftRight, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header({ user, right = null }) {
  const router = useRouter();

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
          <span className="hd-name">LIGACORD</span>
          <span className="hd-tag">b2b бартер · подбор партнёров</span>
        </span>
      </Link>

      <div className="hd-right">
        {right}
        {user ? (
          <>
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
