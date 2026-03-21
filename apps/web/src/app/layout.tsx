import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import BoardThemeStyles from "../components/BoardThemeStyles";
import ErrorBoundary from "../components/ErrorBoundary";

export const metadata: Metadata = {
  title: "EyeOnChess",
  description: "Self-hostable chess platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white min-h-screen dark:bg-gray-950 dark:text-white light:bg-white light:text-gray-900">
        <ThemeProvider>
          <BoardThemeStyles />
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
