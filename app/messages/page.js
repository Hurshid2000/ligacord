import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import Header from "../components/Header";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const { c } = await searchParams;

  return (
    <main className="wrap">
      <Header
        user={{
          id: user.id,
          phone: user.phone,
          company: user.company ? { name: user.company.name } : null,
        }}
      />

      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, letterSpacing: "-0.02em", marginBottom: 20 }}>
        Переписка
      </h1>

      {!user.company ? (
        <div className="note">
          Чтобы вести переговоры, заполните профиль компании — партнёр должен видеть,
          с кем имеет дело.
          <div style={{ marginTop: 12 }}>
            <Link href="/onboarding" className="btn btn-primary">Заполнить профиль</Link>
          </div>
        </div>
      ) : (
        <MessagesClient initialConversationId={c || null} />
      )}
    </main>
  );
}
