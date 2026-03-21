import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import BoardThemeStyles from "../components/BoardThemeStyles";
import ErrorBoundary from "../components/ErrorBoundary";

export const metadata: Metadata = {
  title: "EyeOnChess",
  description: "Self-hostable chess platform — play, analyze, compete",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EyeOnChess",
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="bg-gray-950 text-white min-h-screen dark:bg-gray-950 dark:text-white light:bg-white light:text-gray-900">
        <ThemeProvider>
          <BoardThemeStyles />
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
