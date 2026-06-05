import React from "react";
import { CoffeeOpsState, User } from "../types";

interface SidebarProps {
  state: CoffeeOpsState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lastUpdate: string;
  activeRole: string;
  currentUser: User | null;
  onLogout: () => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
}

export default function Sidebar({
  state,
  activeTab,
  setActiveTab,
  lastUpdate,
  activeRole,
  currentUser,
  onLogout,
  isSidebarOpen = false,
  setIsSidebarOpen,
}: SidebarProps) {
  const branding = state.branding;
  const pendingPrCount = state.prs.filter((p) => p.status.includes("Approval") || p.status.includes("Menunggu")).length;

  const isTabRestricted = (tabId: string, role: string) => {
    if (tabId === "midtrans_setup" || tabId === "qris_tester") {
      return role !== "Owner";
    }
    if (tabId === "system_mgmt") {
      return !["Owner", "Manager"].includes(role);
    }
    if (role === "Owner" || role === "Manager") return false;

    // Global tabs accessible to ALL roles
    if (tabId === "sop_mgmt" || tabId === "kpi") return false;

    // Analytics (Business Intelligence) is strictly for Owner and Manager
    if (tabId === "analytics") return true;

    // Equipment asset control is accessible to Owner, Manager, and Supervisor
    if (tabId === "equipment") {
      return !["Owner", "Manager", "Supervisor"].includes(role);
    }

    if (role === "Waiter" || role === "Head Waiter" || role === "Front of House") {
      return !["foh", "sop_mgmt", "shift_mgmt", "smallwares_mgmt"].includes(tabId);
    }
    if (tabId === "foh") {
      return !["Owner", "Manager", "Supervisor", "Head Waiter", "Waiter", "Front of House"].includes(role);
    }

    if (role === "Service Staff") {
      return !["service_dept", "sop_mgmt", "shift_mgmt", "smallwares_mgmt"].includes(tabId);
    }
    if (tabId === "service_dept") return true;
    
    if (role === "Head Barista") {
      return ["users", "branding", "report", "analytics", "users"].includes(tabId);
    }
    if (role === "Barista") {
      return ["users", "branding", "report", "cogs", "procurement", "analytics"].includes(tabId);
    }
    if (role === "Cashier") {
      const allowedCashierTabs = ["dashboard", "cashier_pos", "sop_mgmt", "kpi", "dailysop", "midtrans_setup", "qris_tester"];
      return !allowedCashierTabs.includes(tabId);
    }
    if (role === "Kitchen") {
      return ["users", "branding", "report", "cogs", "procurement", "master", "storage", "receiving", "issue", "transfer", "fifo", "waste", "analytics"].includes(tabId);
    }
    return false;
  };

  const defaultNavItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", section: "Utama" },
    { id: "cashier_pos", label: "Cashier POS Center", icon: "💵", section: "Utama" },
    { id: "foh", label: "Front of House (FOH)", icon: "🍽️", section: "Utama" },
    { id: "shift_mgmt", label: "Jadwal Shift & Absen", icon: "📅", section: "Utama" },
    { id: "smallwares_mgmt", label: "Smallwares & Glassware", icon: "🥛", section: "Utama" },
    { id: "sop_mgmt", label: "SOP Panduan Kerja", icon: "📚", section: "Utama" },
    { id: "service_dept", label: "Service Department", icon: "🛠️", section: "Utama" },
    { id: "inventory", label: "Inventory Harian", icon: "📦", section: "Utama" },
    { id: "dailysop", label: "Daily SOP & Ops", icon: "✅", section: "Utama" },
    { id: "kpi", label: "KPI & Performa", icon: "🏆", section: "Utama" },
    { id: "fifo", label: "FIFO Tracker", icon: "🔄", section: "Utama" },

    { id: "storage", label: `${branding.storageGudangName} & ${branding.storageBarName}`, icon: "🏪", section: "Storage" },
    { id: "transfer", label: "Transfer Barang", icon: "↔️", section: "Storage" },
    { id: "equipment", label: "Equipment Asset Center", icon: "⚙️", section: "Storage" },

    { id: "procurement", label: "Procurement & Supplier", icon: "🤝", section: "Pengadaan", badge: pendingPrCount },
    { id: "receiving", label: "Barang Masuk (GRN)", icon: "📥", section: "Pengadaan" },
    { id: "issue", label: "Barang Keluar", icon: "📤", section: "Pengadaan" },

    { id: "waste", label: "Waste & Loss Log", icon: "🗑", section: "Monitoring" },
    { id: "cogs", label: "Resep & COGS (HPP)", icon: "☕", section: "Monitoring" },
    { id: "analytics", label: "Kecerdasan Bisnis (BI)", icon: "📈", section: "Monitoring" },
    { id: "report", label: "Laporan Bulanan", icon: "📅", section: "Monitoring" },
    { id: "master", label: "Master Bahan Baku", icon: "📋", section: "Monitoring" },
    { id: "users", label: "Akses Login & Kru", icon: "👥", section: "System" },
    { id: "branding", label: "Kustomisasi Brand", icon: "🎨", section: "System" },
    { id: "midtrans_setup", label: "Payment Gateway Setup", icon: "💳", section: "System" },
    { id: "qris_tester", label: "QRIS Test Center", icon: "⚡", section: "System" },
    { id: "system_mgmt", label: "System Management", icon: "🛡️", section: "System" },
  ];

  const customNavs = state.navigationSettings || [];
  const navItems = defaultNavItems.map((def) => {
    const custom = customNavs.find((c) => c.id === def.id);
    if (custom) {
      return { 
        ...def, 
        label: custom.label || def.label, 
        icon: custom.icon || def.icon, 
        isDeleted: !!custom.isDeleted 
      };
    }
    return { ...def, isDeleted: false };
  }).filter((item) => !item.isDeleted);

  const sections = ["Utama", "Storage", "Pengadaan", "Monitoring", "System"];

  return (
    <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-[#1a0a00]/95 backdrop-blur-md border-r border-[#D4A853]/15 z-50 flex flex-col h-screen text-amber-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      {/* Sidebar Header / Logo */}
      <div className="p-6 border-b border-[#D4A853]/10 relative">
        {setIsSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-amber-100/50 hover:text-amber-100 transition p-1 font-mono text-base font-bold outline-none cursor-pointer"
            title="Sembunyikan Menu"
          >
            ✕
          </button>
        )}
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow-[0_2px_8px_rgba(212,168,83,0.3)]">
            {branding.logo || "☕"}
          </span>
          <div>
            <h1 className="font-serif font-bold text-xl tracking-wide text-amber-100 line-clamp-1">
              {branding.name || "CoffeeOps"}
            </h1>
            <p className="text-[10px] text-amber-200/40 uppercase tracking-widest font-mono mt-0.5 line-clamp-1">
              {branding.tagline || "Cafe Operations Hub"}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Locked User Profile Badge */}
      <div className="px-5 py-3.5 bg-[#291404]/60 border-b border-[#D4A853]/10 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#D4A853] font-mono tracking-wider font-semibold uppercase animate-pulse flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block"></span>
            TERVERIFIKASI REAL
          </span>
          <button
            onClick={onLogout}
            className="text-[9px] text-red-400 hover:text-red-300 transition hover:underline font-bold font-mono"
            title="Keluar untuk mengganti peran"
          >
            🔒 KELUAR (SWITCH)
          </button>
        </div>
        
        <div className="flex items-center gap-2 mt-1.5">
          <div className="h-8 w-8 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center font-bold text-xs text-amber-250 font-serif">
            {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : "CO"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-amber-100 truncate">{currentUser?.name || "Sistem"}</div>
            <div className="text-[10px] text-amber-100/40 font-mono flex items-center gap-1 mt-0.5">
              <span>Peran:</span> 
              <span className="text-amber-300 font-bold uppercase text-[9px] tracking-tight bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/10">
                {activeRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav list */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar">
        {sections.map((section) => {
          const items = navItems.filter((item) => item.section === section);
          if (items.length === 0) return null;

          return (
            <div key={section} className="space-y-1">
              <div className="text-[10px] text-amber-100/30 font-semibold uppercase tracking-widest px-3 mb-1">
                {section}
              </div>
              {items.map((item) => {
                const isLocked = isTabRestricted(item.id, activeRole);
                if (isLocked) return null; // Hide restricted tabs from non-authorized roles
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (setIsSidebarOpen) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition duration-200 group relative ${
                      isActive
                        ? "bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-400"
                        : "text-amber-100/60 hover:text-amber-100 hover:bg-amber-500/5"
                    }`}
                  >
                    <span className="text-sm shrink-0 group-hover:scale-110 transition-transform duration-200">
                      {item.icon}
                    </span>
                    <span className="truncate flex-1 flex items-center gap-1.5">
                      <span className={isLocked ? "opacity-60" : ""}>{item.label}</span>
                      {isLocked && (
                        <span className="text-[10px] filter drop-shadow opacity-75" title="Akses Terkunci untuk Peran Ini">🔒</span>
                      )}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && !isLocked && (
                      <span className="bg-red-600 outline outline-red-700/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 bg-black/20 border-t border-[#D4A853]/10 text-[11px] text-amber-100/30">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-amber-100/50 truncate">
            {branding.name}
          </span>
          <span className="font-semibold text-[9px] bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded">
            ONLINE
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1 font-mono text-[10px] text-amber-200/40">
          <span>Synced:</span>
          <span className="text-amber-100/50">{lastUpdate || "Beberapa saat lalu"}</span>
        </div>
      </div>
    </aside>
  );
}
