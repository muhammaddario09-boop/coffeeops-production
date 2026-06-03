import React from "react";

interface AccessRestrictedProps {
  activeTab: string;
  activeRole: string;
  onLogout: () => void;
  tabLabel: string;
}

export default function AccessRestricted({
  activeTab,
  activeRole,
  onLogout,
  tabLabel,
}: AccessRestrictedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fadeIn text-center max-w-md mx-auto">
      <div className="h-20 w-20 bg-amber-500/10 border border-amber-500/25 rounded-full flex items-center justify-center text-4xl mb-6 relative">
        <span className="animate-pulse">🔒</span>
        <span className="absolute -bottom-1 -right-1 text-lg">🛡️</span>
      </div>
      
      <h3 className="font-serif text-2xl font-bold text-amber-100">
        Akses Terbatas
      </h3>
      
      <p className="text-xs text-amber-100/50 mt-3 leading-relaxed">
        Maaf, halaman <strong className="text-amber-200">"{tabLabel}"</strong> tidak dapat diakses oleh karyawan dengan peran <strong className="text-amber-200 font-bold font-mono">{activeRole}</strong> karena batasan keamanan sistem operasional (RBAC).
      </p>

      <div className="w-full bg-[#1a0a00]/40 border border-amber-500/10 rounded-2xl p-4 mt-6 text-left space-y-2">
        <span className="text-[10px] text-amber-200/40 uppercase tracking-widest font-bold block font-mono">Sebab Batasan Otoritas:</span>
        <p className="text-[11px] text-amber-100/60 leading-normal">
          Menu ini berisi komparasi data finansial, resep krusial (HPP COGS), data kru karyawan, atau kustomisasi branding toko yang memerlukan akses pimpinan untuk keamanan operasional cafe.
        </p>
        <p className="text-[11px] text-[#D4A853] font-semibold">
          🔑 Tingkat Otoritas Minimal: Owner atau Manager.
        </p>
      </div>

      <div className="mt-8 w-full">
        <button
          onClick={onLogout}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-[#D4A853] hover:brightness-110 text-amber-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 duration-200 cursor-pointer"
        >
          🔑 Logout &amp; Masuk Sebagai Owner/Manager
        </button>
      </div>
    </div>
  );
}
