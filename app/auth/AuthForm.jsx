"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

const ERRORS = {
  invalid_phone: "Неверный формат номера. Пример: 90 123 45 67",
  weak_password: "Пароль должен быть не короче 6 символов",
  phone_taken: "Этот номер уже зарегистрирован — войдите",
  bad_credentials: "Неверный номер или пароль",
};

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(ERRORS[data.error] || "Что-то пошло не так, попробуйте ещё раз");
        return;
      }
      router.push(data.needsOnboarding ? "/onboarding" : "/");
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <Link href="/" className="hd-brand" style={{ justifyContent: "center", marginBottom: 28 }}>
        <span className="hd-logo">
          <ArrowLeftRight size={18} strokeWidth={2.4} />
        </span>
        <span>
          <span className="hd-name">CORD</span>
          <span className="hd-tag">b2b бартер · подбор партнёров</span>
        </span>
      </Link>

      <div className="panel">
        <div className="seg" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={mode === "login" ? "on" : ""}
            onClick={() => { setMode("login"); setError(""); }}
            style={{ flex: 1 }}
          >
            ВХОД
          </button>
          <button
            type="button"
            className={mode === "register" ? "on" : ""}
            onClick={() => { setMode("register"); setError(""); }}
            style={{ flex: 1 }}
          >
            РЕГИСТРАЦИЯ
          </button>
        </div>

        <form onSubmit={submit}>
          <label className="field">
            <span className="label">Номер телефона</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="90 123 45 67"
              required
            />
          </label>

          <label className="field">
            <span className="label">Пароль</span>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "минимум 6 символов" : "••••••"}
              required
            />
          </label>

          {error && <div className="err">{error}</div>}

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={17} /> Подождите…
              </>
            ) : mode === "login" ? (
              "Войти"
            ) : (
              "Создать аккаунт"
            )}
          </button>
        </form>
      </div>

      <p className="foot" style={{ marginTop: 18, lineHeight: 1.6 }}>
        Каталог можно смотреть без входа.
        <br />
        Вход нужен, чтобы разместить объявление и увидеть контакты.
      </p>
    </div>
  );
}
