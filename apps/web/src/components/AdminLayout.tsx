"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "~" },
  { href: "/admin/users", label: "Users", icon: "U" },
  { href: "/admin/games", label: "Games", icon: "G" },
  { href: "/admin/settings", label: "Settings", icon: "S" },
  { href: "/admin/audit-log", label: "Audit Log", icon: "A" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-gray-900 border-r border-gray-800 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-800">
          <Link href="/admin" className="text-lg font-bold">
            Admin Panel
          </Link>
          <p className="text-xs text-gray-500 mt-1">EyeOnChess</p>
        </div>
        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-gray-700 rounded">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <Link href="/play" className="text-sm text-gray-400 hover:text-white transition-colors">
            &larr; Back to app
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-gray-800 rounded">
            <span className="text-sm font-bold">=</span>
          </button>
          <span className="font-bold">Admin</span>
        </div>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
