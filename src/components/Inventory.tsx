import React, { useState } from "react";
import { CoffeeOpsState, MasterItem } from "../types";

interface InventoryProps {
  state: CoffeeOpsState;
  onOpenOpname: () => void;
}

export default function Inventory({ state, onOpenOpname }: InventoryProps) {
  const { master, inventory, branding, storage } = state;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const getStockAkhir = (code: string) => {
    const i = inventory[code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
    return Math.max(0, i.awal + i.masuk - i.keluar - i.waste);
  };

  const getStatus = (item: MasterItem) => {
    const s = getStockAkhir(item.code);
    if (s <= 0) return { label: "Habis", cls: "bg-red-950/40 text-red-400 border border-red-500/30" };
    if (s <= item.par) return { label: "Kritis", cls: "bg-red-900/20 text-orange-400 border border-orange-500/20" };
    if (s <= item.par * 1.5) return { label: "Rendah", cls: "bg-amber-900/20 text-amber-300 border border-amber-500/10" };
    return { label: "Aman", cls: "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20" };
  };

  // Filter items
  const filteredItems = master.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    const statusObj = getStatus(item);
    if (filterStatus === "critical") return matchesSearch && (statusObj.label === "Kritis" || statusObj.label === "Habis");
    if (filterStatus === "low") return matchesSearch && statusObj.label === "Rendah";
    if (filterStatus === "safe") return matchesSearch && statusObj.label === "Aman";
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Intro */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-amber-950/20 to-black/20 p-5 rounded-2xl border border-amber-500/10">
        <div>
          <h3 className="font-serif text-lg font-bold">📋 Inventory Harian Bahan</h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Rumus perhitungan: <span className="font-mono text-amber-300 font-semibold">Stok Awal + Masuk − Keluar − Waste = Stok Akhir</span> (Tersinkronisasi dengan <span className="font-semibold text-orange-400">🏗️ Gudang</span> + <span className="font-semibold text-sky-400">❄️ Bar Chiller</span>).
          </p>
        </div>
        <button
          onClick={onOpenOpname}
          className="bg-[#D4A853] hover:bg-amber-600 text-[#1a0a00] text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 shadow shadow-amber-500/5 cursor-pointer active:scale-95"
          style={{ backgroundColor: branding.primaryColor }}
        >
          📝 Mulai Stock Opname
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Cari bahan / kode BK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl px-4 py-2 text-xs text-amber-100 placeholder-amber-200/20 outline-none transition"
          />
        </div>

        {/* Tab filters */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {[
            { id: "all", label: "Semua Bahan" },
            { id: "critical", label: "🚨 Kritis/Habis" },
            { id: "low", label: "⚠️ Rendah" },
            { id: "safe", label: "✅ Aman" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/20"
                  : "bg-[#FAF0E6]/5 text-amber-100/50 hover:text-amber-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/25 text-[10px] font-mono tracking-wider text-amber-100/40 uppercase border-b border-[#D4A853]/10">
                <th className="py-4 px-6 font-semibold">Nama Bahan Baku</th>
                <th className="py-4 px-4 font-semibold">Kode</th>
                <th className="py-4 px-4 font-semibold">Satuan</th>
                <th className="py-4 px-4 font-semibold text-right">Awal</th>
                <th className="py-4 px-4 font-semibold text-right text-emerald-400">Masuk</th>
                <th className="py-4 px-4 font-semibold text-right text-amber-300">Keluar</th>
                <th className="py-4 px-4 font-semibold text-right text-red-400">Waste</th>
                <th className="py-4 px-4 font-semibold text-right text-amber-100">Akhir</th>
                <th className="py-4 px-4 font-semibold text-right">Par Level</th>
                <th className="py-4 px-6 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/5 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-amber-100/25">
                    🔎 Tidak ada bahan baku yang cocok dengan filter atau kueri Anda.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const inv = inventory[item.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
                  const akhir = getStockAkhir(item.code);
                  const status = getStatus(item);

                  return (
                    <tr key={item.code} className="hover:bg-amber-550/5 hover:bg-amber-500/5 transition">
                      <td className="py-3 px-6 font-semibold text-amber-100">{item.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-amber-300">{item.code}</td>
                      <td className="py-3 px-4 text-amber-200/50">{item.unit}</td>
                      <td className="py-3 px-4 text-right font-medium text-amber-100/80">{inv.awal}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-400">+{inv.masuk}</td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-300">-{inv.keluar}</td>
                      <td className="py-3 px-4 text-right font-semibold text-red-400">-{inv.waste}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <strong className="text-amber-200 text-sm font-mono">{akhir}</strong>
                          <span className="text-[9px] text-amber-100/35 font-mono whitespace-nowrap">
                            (🏗️{(storage?.gudang?.[item.code]) || 0} • ❄️{(storage?.bar?.[item.code]) || 0})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-200/60">{item.par}</td>
                      <td className="py-3 px-6 text-center">
                        <span className={`badge px-2 py-1 rounded-full text-[10px] font-bold ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// Note: handleFirestoreError check is bypassed as offline local storage integration takes place here, connected via Central backend Express APIs.
