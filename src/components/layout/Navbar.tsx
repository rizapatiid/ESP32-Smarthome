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
  Zap,
  Sparkles,
} from "lucide-react";
import { OperatingMode } from "@/types/iot";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mode, setMode] = useState<OperatingMode>("simulation");
  const [dbStatus, setDbStatus] = useState<"CONNECTED" | "DISCONNECTED" | "CHECKING">("CHECKING");
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [switchingMode, setSwitchingMode] = useState(false);

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
    const interval = setInterval(checkStatus, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Quick mode toggle handler langsung dari navbar
  const handleToggleMode = async () => {
    if (switchingMode) return;
    setSwitchingMode(true);
    const targetMode = mode === "simulation" ? "real" : "simulation";
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: targetMode }),
      });
      if (res.ok) {
        setMode(targetMode);
        window.location.reload();
      }
    } catch (e) {
      console.error("Gagal toggle mode:", e);
    } finally {
      setSwitchingMode(false);
    }
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/devices", label: "Perangkat", icon: Cpu },
    { href: "/history/sensors", label: "Riwayat Sensor", icon: Activity },
    { href: "/history/controls", label: "Riwayat Kontrol", icon: History },
    { href: "/settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[17px] text-slate-900 tracking-tight">
                    SmartHome
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md bg-blue-100/70 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                    IoT
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 -mt-0.5 font-medium">
                  ESP32 • Wi-Fi • Database
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm shadow-slate-200/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Status Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Quick Mode Switcher Button */}
            <button
              onClick={handleToggleMode}
              disabled={switchingMode}
              title="Klik untuk beralih mode antara Simulasi dan Real Hardware"
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                mode === "simulation"
                  ? "bg-amber-50/80 hover:bg-amber-100 text-amber-800 border-amber-200 shadow-sm"
                  : "bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  mode === "simulation" ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                }`}
              />
              <span className="tracking-tight">
                {mode === "simulation" ? "Mode Simulasi" : "Mode Real ESP32"}
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-600 ml-0.5">
                (Ganti)
              </span>
            </button>

            {/* Database Health Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                dbStatus === "CONNECTED"
                  ? "bg-white text-slate-700 border-slate-200 shadow-sm"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
              title="Koneksi Database"
            >
              <Database
                className={`w-3.5 h-3.5 ${
                  dbStatus === "CONNECTED" ? "text-blue-600" : "text-rose-500"
                }`}
              />
              <span className="font-mono text-[11px]">
                {dbStatus === "CONNECTED" ? `Database ${dbLatency ? `${dbLatency}ms` : "OK"}` : "Database Offline"}
              </span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleToggleMode}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                mode === "simulation"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {mode === "simulation" ? "SIMULASI" : "REAL"}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-1.5 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              Database: {dbStatus}
            </span>
            <button
              onClick={handleToggleMode}
              className="font-semibold text-blue-600 hover:underline"
            >
              Ganti ke {mode === "simulation" ? "Real ESP32" : "Simulasi"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
