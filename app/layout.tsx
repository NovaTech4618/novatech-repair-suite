import type { Metadata, Viewport } from "next";
import { Sora, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

// Space Grotesk swapped for Sora - it's one of the most recognizable
// "default AI-tool font" tells (named directly by reviewers). Manrope
// stays for body copy, Space Mono stays for numeric/data display since
// monospace-for-figures is a deliberate, non-generic choice in serious
// financial UI, not the same thing being flagged.
const sora = Sora({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const spaceMono = Space_Mono({ subsets: ["latin"], variable: "--font-data", weight: ["400", "700"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://novatech-repair-suite-piiy.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "NOVATECH Repair Suite", template: "%s · NOVATECH" },
  description: "Repair-shop management for customers, devices, repairs, inventory, sales, payments and business finances.",
  applicationName: "NOVATECH Repair Suite",
  category: "business",
  verification: { google: "R-XIxwDQvgCpCjwnRcuj9kkfDgnP1TZ4NtDuBDNAQy8" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable} ${spaceMono.variable}`}>
      <body className="min-w-0 overflow-x-hidden">
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
