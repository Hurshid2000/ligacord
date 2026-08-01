import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import Header from "../components/Header";
import { CAT_LABEL } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const company = user.company;

  return (
    <main className="wrap">
      <Header user={{ id: user.id, phone: user.phone, company: company ? { name: company.name } : null }} />

      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, letterSpacing: "-0.02em", marginBottom: 20 }}>
        Профиль
      </h1>

      <div className="panel" style={{ marginBottom: 22 }}>
        <div className="label" style={{ marginBottom: 8 }}>Телефон</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 15 }}>{user.phone}</div>
      </div>

      {!company ? (
        <div className="panel">
          <div className="note">Вы ещё не заполнили данные компании — без них вас не найдут в каталоге.</div>
          <Link href="/onboarding" className="btn btn-primary">Заполнить профиль компании</Link>
        </div>
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20 }}>{company.name}</h2>
              <Link href="/onboarding" className="btn btn-ghost">Редактировать</Link>
            </div>
            {company.about && <p style={{ fontSize: 14, lineHeight: 1.5, color: "#4a4a44", marginBottom: 10 }}>{company.about}</p>}
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
              {CAT_LABEL[company.category] || company.category}
              {company.contact ? ` · ${company.contact}` : " · контакт не указан"}
            </div>
          </div>

          <h2 className="sect">Мои объявления <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "none" }}>{company.listings.length}</span></h2>

          {company.listings.length === 0 ? (
            <div className="note">У вас пока нет объявлений. Добавьте их в профиле компании.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {company.listings.map((l) => (
                <article className="panel" key={l.id} style={{ padding: 18 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 10 }}>{l.title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 6px" }}>
                    <strong style={{ color: "var(--give)" }}>Даёт:</strong> {l.gives}
                  </p>
                  <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    <strong style={{ color: "var(--get)" }}>Ищет:</strong> {l.seeks}
                  </p>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
