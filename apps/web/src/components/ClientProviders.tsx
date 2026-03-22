"use client";

import { usePathname } from "next/navigation";
import ThemeProvider from "./ThemeProvider";
import BoardThemeStyles from "./BoardThemeStyles";
import ErrorBoundary from "./ErrorBoundary";
import TosGate from "./TosGate";

// Pages that don't require TOS acceptance
const TOS_EXEMPT_PATHS = ["/legal", "/login", "/register", "/board-test"];

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExempt = TOS_EXEMPT_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/";

  return (
    <ThemeProvider>
      <BoardThemeStyles />
      <ErrorBoundary>{isExempt ? children : <TosGate>{children}</TosGate>}</ErrorBoundary>
    </ThemeProvider>
  );
}
