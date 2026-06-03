import React from "react";
import { CoffeeOpsState, User } from "../types";

interface TopbarProps {
  state: CoffeeOpsState;
  activeTab: string;
  onOpenQuickInput: () => void;
  onOpenAiAssistant: () => void;
  isConnected: boolean;
  currentUser: User | null;
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

export default function Topbar({
  state,
  activeTab,
  onOpenQuickInput,
  onOpenAiAssistant,
  isConnected,
  currentUser,
  onLogout,
  onToggleSidebar,
}: TopbarProps) {
  const branding = state.branding;

  // Render descriptive header names
  const tabTitles: { [key: string]: string } = {
    dashboard: "Dashboard",
    inventory: "Inventory Harian (Stok Akhir)",
    fifo: "FIFO Tracker (First In First Out)",
    storage: `Stok ${branding.storageGudangName} & ${branding.storageBarName}`,
    transfer: "Transfer Barang (Mutasi Internal)",
    purchase: "Purchase Request (Pengadaan)",
    receiving: "Barang Masuk (GRN)",
    issue: "Barang Keluar (Usage Log)",
    waste: "Waste & Loss Log (Kerugian)",
    report: "Laporan Bulanan",
    master: "Master Database Bahan Baku",
    branding: "Kustomisasi Brand & Sistem",
    absensi: "Presensi & Absensi Karyawan",
    users: "Manajemen Karyawan & Hak Akses",
  };

  const currentDay = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 h-16 bg-[#1a0a00]/70 backdrop-blur-md border-b border-[#D4A853]/10 flex items-center justify-between px-3 sm:px-8 z-40">
      {/* Title & Network State */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="text-amber-100/75 hover:text-amber-300 p-1.5 rounded-lg lg:hidden transition focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold text-amber-50 truncate max-w-[100px] xs:max-w-none">
          {tabTitles[activeTab] || "CoffeeOps"}
        </h2>
        <span
          className={`h-2 w-2 rounded-full filter drop-shadow animate-pulse shrink-0 ${
            isConnected ? "bg-emerald-500" : "bg-red-500"
          }`}
          title={isConnected ? "Koneksi Sinkronisasi Online Lancar" : "Terputus dari Server Cloud"}
        />
        <span className="text-[10px] text-amber-100/30 uppercase font-semibold font-mono tracking-wider hidden md:inline">
          {isConnected ? "online" : "offline"}
        </span>
      </div>

      {/* Date, AI Button & Inputs */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Date display */}
        <div className="text-[11px] font-mono font-medium text-amber-300 bg-amber-500/10 border border-amber-500/10 px-3 py-1.5 rounded-lg hidden lg:block">
          📅 {currentDay}
        </div>

        {/* Active Session Info */}
        {currentUser && (
          <div className="flex items-center gap-1.5 sm:gap-2.5 bg-amber-500/5 border border-amber-500/10 pl-2 pr-1.5 sm:pl-3 sm:pr-2 py-1.5 rounded-xl shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-bold text-amber-100 leading-tight">
                {currentUser.name.split(" ")[0]}
              </div>
              <div className="text-[8.5px] font-mono text-[#D4A853]/60 uppercase tracking-widest font-semibold mt-0.5">
                {currentUser.role}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="py-1 px-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-300 rounded-lg text-[9px] uppercase font-bold tracking-wider cursor-pointer transition active:scale-95"
              title="Lock Screen / Keluar"
            >
              🔒 <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        )}

        {/* AI Assistant Button */}
        <button
          onClick={onOpenAiAssistant}
          className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-purple-950 to-amber-950 border border-purple-500/30 rounded-lg hover:border-purple-400 text-xs font-semibold text-purple-200 hover:text-white transition duration-200 cursor-pointer shadow-lg shadow-purple-950/20 group shrink-0"
        >
          <span className="text-sm group-hover:animate-bounce">✨</span>
          <span className="hidden xs:inline">Tanya AI</span>
          <span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span></span>
        </button>

        {/* Quick input button */}
        <button
          onClick={onOpenQuickInput}
          className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold px-2.5 sm:px-4 py-1.5 rounded-lg text-xs transition duration-200 cursor-pointer shadow-md shadow-amber-500/10 active:scale-95 shrink-0"
          style={{ backgroundColor: branding.primaryColor }}
        >
          ➕ <span className="hidden xs:inline">Input Cepat</span><span className="xs:inline sm:hidden">Input</span>
        </button>
      </div>
    </header>
  );
}
