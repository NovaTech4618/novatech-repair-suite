import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const spaceMono = Space_Mono({ subsets: ["latin"], variable: "--font-data", weight: ["400", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://novatech-repair-suite-jf8kucdqd-nova-tech-repair-suite.vercel.app"),
  title: { default: "NOVATECH Repair Suite", template: "%s · NOVATECH" },
  description: "Repair-shop management for customers, devices, repairs, inventory, sales, payments and business finances.",
  applicationName: "NOVATECH Repair Suite",
  category: "business",
  verification: { google: "R-XIxwDQvgCpCjwnRcuj9kkfDgnP1TZ4NtDuBDNAQy8" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0f766e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${spaceGrotesk.variable} ${manrope.variable} ${spaceMono.variable}`}><body><TooltipProvider>{children}<Toaster richColors position="top-right" /></TooltipProvider></body></html>;
}
