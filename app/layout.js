import "./globals.css";

export const metadata = {
  title: "Ligacord — B2B бартер · подбор партнёров с AI",
  description:
    "Ligacord находит бизнесу нужного бартерного партнёра и приносит сделку наполовину закрытой: AI-подбор с обоснованием и готовым КП. RU / UZ.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
