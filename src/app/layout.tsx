import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartHome IoT — Sistem Monitoring & Kontrol ESP32",
  description:
    "Sistem Monitoring dan Kontrol Perangkat Rumah Berbasis Website Menggunakan ESP32, Wi-Fi Lokal, dan Database",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 selection:bg-blue-500 selection:text-white">
        <Navbar />
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          {children}
        </main>
        <footer className="border-t border-slate-200/80 bg-white py-4 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-slate-500">
              &copy; {new Date().getFullYear()} <strong className="text-slate-700 font-semibold">SmartHome IoT</strong>. All rights reserved.
            </span>
            <span>
              Sistem Monitoring &amp; Kontrol Cerdas
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
