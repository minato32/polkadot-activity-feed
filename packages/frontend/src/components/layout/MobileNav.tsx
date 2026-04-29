"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  authOnly?: boolean;
}

function FeedIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function MyFeedIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm4 6l2 2 4-4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function WalletsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 7h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm16 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7zm7.6-2.4a7.6 7.6 0 0 0 .07-1.1c0-.37-.03-.74-.07-1.1l2.36-1.85a.55.55 0 0 0 .13-.71l-2.23-3.87a.55.55 0 0 0-.68-.24l-2.79 1.12c-.58-.44-1.22-.81-1.91-1.08L14.09 2.1a.54.54 0 0 0-.54-.47h-4.1a.54.54 0 0 0-.54.47L8.5 5.22c-.69.27-1.33.64-1.9 1.08L3.8 5.18a.55.55 0 0 0-.68.24L.9 9.29a.54.54 0 0 0 .13.71L3.4 11.9c-.04.36-.07.73-.07 1.1s.03.74.07 1.1L1.03 15.95a.55.55 0 0 0-.13.71l2.23 3.87c.14.24.43.33.68.24l2.79-1.12c.57.44 1.21.81 1.9 1.08l.42 3.12c.06.27.3.47.54.47h4.1c.24 0 .48-.2.54-.47l.41-3.12c.7-.27 1.33-.64 1.91-1.08l2.79 1.12c.25.09.54 0 .68-.24l2.23-3.87a.55.55 0 0 0-.13-.71l-2.37-1.85z" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Feed", icon: <FeedIcon /> },
  { href: "/my-feed", label: "My Feed", icon: <MyFeedIcon />, authOnly: true },
  { href: "/search", label: "Search", icon: <SearchIcon /> },
  { href: "/wallets", label: "Wallets", icon: <WalletsIcon />, authOnly: true },
  { href: "/settings", label: "Settings", icon: <SettingsIcon />, authOnly: true },
];

export function MobileNav() {
  const { isAuthenticated } = useAuthContext();
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.authOnly || isAuthenticated,
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm sm:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 transition-colors",
                isActive ? "text-pink-400" : "text-gray-500 hover:text-gray-300",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
