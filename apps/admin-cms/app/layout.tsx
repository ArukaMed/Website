import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin CMS | Aegis-B2B Multi-Tenant Platform",
  description: "Enterprise administration portal for digital business cards, print QR generation, and B2B wholesale.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
