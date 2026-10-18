"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  Cpu,
  History,
  Settings,
  Database,
  Menu,
  X,
  Sliders,
  Activity,
} from "lucide-react";
import { OperatingMode } from "@/types/iot";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mode, setMode] = useState<OperatingMode>("simulation");
  const [dbStatus, setDbStatus] = useState<"CONNECTED" | "DISCONNECTED" | "CHECKING">("CHECKING");
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  // Periksa status sistem berkala untuk indikator navbar
  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setMode(json.mode || "simulation");
            setDbStatus(json.database?.status || "DISCONNECTED");
            setDbLatency(json.database?.latencyMs ?? null);
          }
        }
      } catch {
        if (isMounted) setDbStatus("DISCONNECTED");
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/devices", label: "Perangkat", icon: Cpu },
    { href: "/history/sensors", label: "Riwayat Sensor", icon: Activity },
    { href: "/history/controls", label: "Riwayat Kontrol", icon: History },
    { href: "/settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                  SmartHome <span className="text-blue-600">IoT</span>
                </span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  ESP32 Wi-Fi & MySQL
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Status Badges: Mode & MySQL */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Mode Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                mode === "simulation"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  mode === "simulation" ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                }`}
              />
              {mode === "simulation" ? "MODE SIMULASI" : "MODE REAL ESP32"}
            </span>

            {/* DB Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                dbStatus === "CONNECTED"
                  ? "bg-slate-50 text-slate-700 border-slate-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
              title="Koneksi Database MySQL Hostinger"
            >
              <Database
                className={`w-3.5 h-3.5 ${
                  dbStatus === "CONNECTED" ? "text-blue-600" : "text-rose-600"
                }`}
              />
              <span>
                {dbStatus === "CONNECTED"
                  ? `MySQL Online ${dbLatency ? `(${dbLatency}ms)` : ""}`
                  : "MySQL Offline"}
              </span>
            </span>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                mode === "simulation"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {mode === "simulation" ? "SIM" : "REAL"}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>MySQL Hostinger: {dbStatus}</span>
            <span>Mode: {mode.toUpperCase()}</span>
          </div>
        </div>
      )}
    </header>
  );
}
