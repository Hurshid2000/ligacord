import "./globals.css";

export const metadata = {
  title: "Cord — B2B бартер · подбор партнёров с AI",
  description:
    "Cord находит бизнесу нужного бартерного партнёра и приносит сделку наполовину закрытой: каталог бартер-объявлений и AI-подбор с обоснованием и готовым КП. RU / UZ.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
