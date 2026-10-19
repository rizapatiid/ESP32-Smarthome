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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0B1220] via-[#141f36] to-[#1e3355] text-white flex items-center justify-center shadow-md shadow-[#0B1220]/25 group-hover:scale-105 transition-transform duration-200 border border-[#1b2a47]/50">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[17px] text-slate-900 tracking-tight">
                  SmartHome
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#0B1220]/10 text-[#0B1220] text-[10px] font-extrabold uppercase tracking-wider">
                  IoT
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
              className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 shadow-xs ${
                mode === "simulation"
                  ? "bg-gradient-to-r from-amber-50 to-amber-100/70 hover:from-amber-100 hover:to-amber-200/80 text-amber-900 border-amber-300 shadow-amber-500/5"
                  : "bg-gradient-to-r from-emerald-50 to-emerald-100/70 hover:from-emerald-100 hover:to-emerald-200/80 text-emerald-900 border-emerald-300 shadow-emerald-500/5"
              }`}
            >
              {mode === "real" ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
                  <span className="tracking-tight">Mode Real ESP32</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 stroke-[2.2]" />
                  <span className="tracking-tight">Mode Simulasi</span>
                </>
              )}
              <span className="text-[10px] text-slate-400 group-hover:text-slate-600 ml-0.5 font-normal">
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
              disabled={switchingMode}
              title="Klik untuk beralih mode"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-wider uppercase border transition-all active:scale-95 shadow-xs ${
                mode === "simulation"
                  ? "bg-gradient-to-r from-amber-50 to-amber-100/80 hover:from-amber-100 text-amber-800 border-amber-300 shadow-amber-500/10"
                  : "bg-gradient-to-r from-emerald-50 to-emerald-100/80 hover:from-emerald-100 text-emerald-800 border-emerald-300 shadow-emerald-500/10"
              }`}
            >
              {mode === "real" ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
                  <span>REAL</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 stroke-[2.2]" />
                  <span>SIMULASI</span>
                </>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors shadow-xs"
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
