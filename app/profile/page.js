import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import Header from "../components/Header";
import { CAT_LABEL } from "@/lib/categories";
import ListingsManager from "./ListingsManager";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const company = user.company;

  return (
    <main className="wrap">
      <Header
        user={{ id: user.id, phone: user.phone, company: company ? { name: company.name } : null }}
      />

      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, letterSpacing: "-0.02em", marginBottom: 20 }}>
        Личный кабинет
      </h1>

      {!company ? (
        <div className="panel">
          <div className="note">
            Вы ещё не заполнили данные компании — без них вас не найдут в каталоге.
          </div>
          <Link href="/onboarding" className="btn btn-primary">
            Заполнить профиль компании
          </Link>
        </div>
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20 }}>
                {company.name}
              </h2>
              <Link href="/onboarding" className="btn btn-ghost">Редактировать</Link>
            </div>

            {company.about && (
              <p style={{ fontSize: 14, lineHeight: 1.5, color: "#4a4a44", marginBottom: 10 }}>
                {company.about}
              </p>
            )}

            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
              {CAT_LABEL[company.category] || company.category}
              {" · "}
              {user.phone}
              {company.contact ? ` · ${company.contact}` : ""}
            </div>

            {!company.contact && (
              <div className="note" style={{ marginTop: 12, marginBottom: 0 }}>
                Не указан контакт для партнёров — те, кто найдёт вас в каталоге, не смогут написать.
              </div>
            )}
          </div>

          <ListingsManager
            listings={company.listings.map((l) => ({
              id: l.id,
              title: l.title,
              gives: l.gives,
              seeks: l.seeks,
              category: l.category,
              budget: l.budget,
              timeline: l.timeline,
              venue: l.venue,
              isActive: l.isActive,
            }))}
            defaultCategory={company.category}
          />
        </>
      )}
    </main>
  );
}
