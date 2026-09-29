import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aruka Med | Wholesale Pharmaceutical Distribution",
  description:
    "Licensed wholesale pharmaceutical distributor supplying pharmacies, hospitals and healthcare institutions with genuine, batch-tracked medicines and cold chain biologics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
