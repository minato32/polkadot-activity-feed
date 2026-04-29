"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/auth/ConnectButton";
import { useAuthContext } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/search", label: "Search", always: true },
  { href: "/my-feed", label: "My Feed", authOnly: true },
  { href: "/wallets", label: "Wallets", authOnly: true },
  { href: "/settings", label: "Settings", authOnly: true },
];

export function TopNav() {
  const { isAuthenticated } = useAuthContext();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = NAV_LINKS.filter(
    (l) => l.always || (l.authOnly && isAuthenticated),
  );

  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-gray-100 hover:text-white"
          >
            <span className="hidden sm:inline">Polkadot Activity Feed</span>
            <span className="sm:hidden font-bold">PAF</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-4 sm:flex">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm transition-colors",
                  pathname === link.href
                    ? "text-gray-100"
                    : "text-gray-400 hover:text-gray-100",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Search icon (mobile shortcut) */}
          <Link
            href="/search"
            className="sm:hidden p-2 text-gray-400 hover:text-gray-100"
            aria-label="Search"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
          </Link>

          <ConnectButton />

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="sm:hidden p-2 text-gray-400 hover:text-gray-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-800 bg-gray-950 px-4 py-3">
          <nav className="flex flex-col gap-3">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "py-1 text-sm transition-colors",
                  pathname === link.href
                    ? "text-gray-100 font-medium"
                    : "text-gray-400 hover:text-gray-100",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
