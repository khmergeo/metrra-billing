import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meterra - Usage-Based Billing Platform",
  description: "Build your SaaS usage-based billing with Meterra",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
