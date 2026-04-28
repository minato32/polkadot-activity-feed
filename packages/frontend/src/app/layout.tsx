import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
