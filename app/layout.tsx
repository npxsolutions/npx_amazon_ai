import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NPX Amazon Control Center",
  description: "Live operations dashboard for the NPX Amazon wholesale business.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
