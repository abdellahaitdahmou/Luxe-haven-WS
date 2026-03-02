import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { VerificationProvider } from "@/components/providers/VerificationProvider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Luxe Haven | Luxury Property Rentals",
  description: "Discover the world's most exclusive luxury property stays, curated for the discerning traveler.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <VerificationProvider>
            <CurrencyProvider>
              {children}
            </CurrencyProvider>
          </VerificationProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
