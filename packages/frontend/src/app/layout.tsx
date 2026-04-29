import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { TopNav } from "@/components/layout/TopNav";
import { MobileNav } from "@/components/layout/MobileNav";

export const metadata: Metadata = {
  title: "Polkadot Activity Feed",
  description:
    "Cross-chain real-time activity feed for the Polkadot ecosystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">
        <AuthProvider>
          <TopNav />
          {/* pb-16 reserves space for MobileNav on small screens */}
          <div className="pb-16 sm:pb-0">{children}</div>
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
