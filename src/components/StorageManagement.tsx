import React, { useState } from "react";
import { CoffeeOpsState, MasterItem } from "../types";

interface StorageProps {
  state: CoffeeOpsState;
  onOpenAddStock: (loc: "gudang" | "bar") => void;
  onOpenTransfer: (from: "gudang" | "bar", to: "gudang" | "bar", preCode?: string) => void;
  onEditStock: (loc: "gudang" | "bar", code: string) => void;
}

export default function StorageManagement({ state, onOpenAddStock, onOpenTransfer, onEditStock }: StorageProps) {
  const { master, storage, branding, fifo } = state;
  const [activeSubTab, setActiveSubTab] = useState<"gudang" | "bar">("gudang");

  const getStorStatus = (qty: number, par: number) => {
    if (qty <= 0) return { label: "Habis", cls: "bg-red-950/40 text-red-400 border border-red-500/30" };
    if (qty <= par) return { label: "Kritis", cls: "bg-red-900/20 text-orange-400 border border-orange-500/20" };
    if (qty <= par * 1.5) return { label: "Rendah", cls: "bg-amber-900/20 text-amber-300 border border-amber-500/10" };
    return { label: "Aman", cls: "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20" };
  };

  const getStor = (loc: "gudang" | "bar", code: string) => {
    return (storage[loc] && storage[loc][code]) || 0;
  };

  const getIngredientCostPerUnit = (code: string): number => {
    if (code.startsWith("HM-")) {
      const hmList = state.homemadeIngredients || [];
      const hm = hmList.find((h) => h.id === code);
      if (!hm) return 0;
      
      let formulaTotalCost = 0;
      hm.ingredients.forEach((ing) => {
        formulaTotalCost += getIngredientCostPerUnit(ing.code) * ing.qty;
      });
      
      return hm.yieldQty > 0 ? formulaTotalCost / hm.yieldQty : 0;
    }

    const item = master.find((m) => m.code === code);
    if (!item) return 0;
    return item.price;
  };

  // Gudang calculations - raw foods + homemade items for tracking
  const gudangItems = [
    ...master.filter((m) => m.loc === "gudang" || m.loc === "both").map(m => ({ ...m, isHomemade: false })),
    ...(state.homemadeIngredients || []).map((hm) => ({
      code: hm.id,
      name: hm.name,
      unit: hm.yieldUnit,
      par: 500, // safety par limit
      price: getIngredientCostPerUnit(hm.id),
      supplier: "Produksi Internal",
      temp: "Suhu Ruang 20-25°C",
      shelf: "2 minggu",
      loc: "both",
      isHomemade: true
    }))
  ];
  const gTotalCount = gudangItems.length;
  const gCriticalCount = gudangItems.filter((m) => getStorStatus(getStor("gudang", m.code), m.par).label === "Kritis" || getStorStatus(getStor("gudang", m.code), m.par).label === "Habis").length;
  const gEstimatedValue = gudangItems.reduce((acc, m) => acc + getStor("gudang", m.code) * m.price, 0);

  // Bar calculations - raw foods + homemade items for tracking
  const barItems = [
    ...master.filter((m) => m.loc === "bar" || m.loc === "both").map(m => ({ ...m, isHomemade: false })),
    ...(state.homemadeIngredients || []).map((hm) => ({
      code: hm.id,
      name: hm.name,
      unit: hm.yieldUnit,
      par: 500,
      price: getIngredientCostPerUnit(hm.id),
      supplier: "Produksi Internal",
      temp: "2-8°C Chiller",
      shelf: "3 hari",
      loc: "both",
      isHomemade: true
    }))
  ];
  const bTotalCount = barItems.length;
  const bCriticalCount = barItems.filter((m) => getStorStatus(getStor("bar", m.code), m.par).label === "Kritis" || getStorStatus(getStor("bar", m.code), m.par).label === "Habis").length;

  const today = new Date();
  const expiringShortList = master.reduce((acc, m) => {
    const batches = (fifo[m.code] || []).filter((b) => !b.used && b.expDate);
    const nearlyExpiring = batches.filter((b) => {
      const expD = new Date(b.expDate);
      const timeDiff = expD.getTime() - today.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      return daysDiff >= 0 && daysDiff < 3;
    });
    return acc + nearlyExpiring.length;
  }, 0);

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Tab select bar */}
      <div className="flex border-b border-amber-500/10">
        <button
          onClick={() => setActiveSubTab("gudang")}
          className={`px-6 py-3 font-serif font-bold text-sm transition tracking-wide cursor-pointer flex items-center gap-2 ${
            activeSubTab === "gudang"
              ? "text-amber-400 border-b-2 border-amber-400"
              : "text-amber-100/40 hover:text-amber-100"
          }`}
        >
          🏗️ {branding.storageGudangName || "Gudang Utama"}
        </button>
        <button
          onClick={() => setActiveSubTab("bar")}
          className={`px-6 py-3 font-serif font-bold text-sm transition tracking-wide cursor-pointer flex items-center gap-2 ${
            activeSubTab === "bar"
              ? "text-sky-400 border-b-2 border-sky-400"
              : "text-amber-100/40 hover:text-amber-100"
          }`}
        >
          ❄️ {branding.storageBarName || "Bar Chiller"}
        </button>
      </div>

      {/* Gudang Details Content */}
      {activeSubTab === "gudang" && (
        <div className="space-y-6">
          {/* Banner */}
          <div className="bg-gradient-to-r from-orange-950/20 to-black/30 border border-orange-500/20 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-serif text-base font-bold text-orange-400">🏗️ {branding.storageGudangName}</h4>
              <p className="text-xs text-amber-100/45 mt-1">
                Kondisi: Suhu ruang 20–25°C • Kering &amp; Kedap Udara. Sesuai untuk biji kopi kering, packaging, kemasan, syrup dus, bubuk.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenAddStock("gudang")}
                className="bg-amber-500/10 border border-amber-400/20 text-amber-300 hover:bg-amber-500/20 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer transition active:scale-95"
              >
                + Tambah Stok
              </button>
              <button
                onClick={() => onOpenTransfer("gudang", "bar")}
                className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 rounded-xl px-3.5 py-2 text-xs font-bold shadow cursor-pointer transition active:scale-95"
              >
                ↔️ Transfer ke Bar Chiller
              </button>
            </div>
          </div>

          {/* Stats Mini Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-5 rounded-xl">
              <div className="text-[10px] text-amber-100/40 uppercase font-semibold font-mono">Total Item Terdaftar</div>
              <div className="text-2xl font-serif font-bold text-amber-100 mt-1">{gTotalCount} <span className="font-sans text-xs font-normal text-amber-100/50">bahan</span></div>
            </div>
            <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-5 rounded-xl">
              <div className="text-[10px] text-amber-100/40 uppercase font-semibold font-mono text-orange-400">Stok Kritis / Habis</div>
              <div className="text-2xl font-serif font-bold text-orange-400 mt-1">{gCriticalCount} <span className="font-sans text-xs font-normal text-orange-400/50">bahan</span></div>
            </div>
            <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-5 rounded-xl">
              <div className="text-[10px] text-amber-100/40 uppercase font-semibold font-mono text-amber-300">Estimasi Nilai Aset Gudang</div>
              <div className="text-lg font-serif font-bold text-amber-300 mt-1.5">Rp {gEstimatedValue.toLocaleString("id-ID")}</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/25 text-[10px] font-mono tracking-wider text-amber-100/40 uppercase border-b border-[#D4A853]/10">
                    <th className="py-4 px-6 font-semibold">Nama Bahan</th>
                    <th className="py-4 px-4 font-semibold">Kode</th>
                    <th className="py-4 px-4 font-semibold">Satuan</th>
                    <th className="py-4 px-4 font-semibold text-right text-orange-400">Stok Gudang</th>
                    <th className="py-4 px-4 font-semibold text-right">Par Level</th>
                    <th className="py-4 px-4 font-semibold text-center">Status</th>
                    <th className="py-4 px-4 font-semibold">Suhu Simpan</th>
                    <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/5 text-xs">
                  {gudangItems.map((item) => {
                    const s = getStor("gudang", item.code);
                    const status = getStorStatus(s, item.par);

                    return (
                      <tr key={item.code} className="hover:bg-amber-500/5 transition">
                        <td className="py-3.5 px-6 font-semibold text-amber-100">
                          <div className="flex items-center gap-1.5">
                            {(item as any).isHomemade && <span className="bg-[#D4A853]/20 text-[#D4A853] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#D4A853]/30">RACIKAN</span>}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-amber-300">{item.code}</td>
                        <td className="py-3.5 px-4 text-amber-200/50">{item.unit}</td>
                        <td className="py-3.5 px-4 text-right">
                          <strong className="text-orange-400 text-sm font-mono">{s}</strong>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-amber-200/60">{item.par}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`badge px-2 py-0.5 rounded-full text-[10px] font-bold ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-amber-200/40 italic">{item.temp}</td>
                        <td className="py-3.5 px-6 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => onEditStock("gudang", item.code)}
                              className="bg-[#D4A853]/10 text-amber-300 hover:bg-[#D4A853]/20 border border-[#D4A853]/30 px-2 py-1 rounded cursor-pointer transition text-[10px] font-bold"
                              title="Koreksi manual kuantitas"
                            >
                              ✏️ Edit Qty
                            </button>
                            <button
                              onClick={() => onOpenTransfer("gudang", "bar", item.code)}
                              className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded cursor-pointer transition text-[10px] font-bold"
                              title="Kirim ke chiller bar"
                            >
                              ↔️ Kirim Bar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bar Chiller Content */}
      {activeSubTab === "bar" && (
        <div className="space-y-6">
          {/* Banner */}
          <div className="bg-gradient-to-r from-sky-950/20 to-black/30 border border-sky-500/20 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-serif text-base font-bold text-sky-400">❄️ {branding.storageBarName}</h4>
              <p className="text-xs text-amber-100/45 mt-1">
                Kondisi: Dingin 2–8°C. Sesuai untuk susu fresh milk, sirup terbuka, sauce, buah segar, lemon, cold brew concentrate.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenAddStock("bar")}
                className="bg-sky-500/10 border border-sky-400/20 text-sky-300 hover:bg-sky-500/20 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer transition active:scale-95"
              >
                + Tambah Stok Bar
              </button>
              <button
                onClick={() => onOpenTransfer("bar", "gudang")}
                className="bg-orange-500 hover:bg-orange-600 text-orange-950 rounded-xl px-3.5 py-2 text-xs font-bold shadow cursor-pointer transition active:scale-95"
              >
                ↩️ Kembalikan ke Gudang
              </button>
            </div>
          </div>

          {/* Stats Mini Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-5 rounded-xl">
              <div className="text-[10px] text-amber-100/40 uppercase font-semibold font-mono">Bahan Operasional Bar Chiller</div>
              <div className="text-2xl font-serif font-bold text-amber-100 mt-1">{bTotalCount} <span className="font-sans text-xs font-normal text-amber-100/50">bahan</span></div>
            </div>
            <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-5 rounded-xl">
              <div className="text-[10px] text-amber-100/40 uppercase font-semibold font-mono text-orange-400">Batasan Kritis Chiller</div>
              <div className="text-2xl font-serif font-bold text-orange-400 mt-1">{bCriticalCount} <span className="font-sans text-xs font-normal text-orange-400/50">bahan</span></div>
            </div>
            <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-5 rounded-xl">
              <div className="text-[10px] text-amber-100/40 uppercase font-semibold font-mono text-[#ef9a9a]">Kadaluarsa &lt; 3 Hari</div>
              <div className="text-2xl font-serif font-bold text-red-400 mt-1">{expiringShortList} <span className="font-sans text-xs font-normal text-red-500/50">batch</span></div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/25 text-[10px] font-mono tracking-wider text-amber-100/40 uppercase border-b border-[#D4A853]/10">
                    <th className="py-4 px-6 font-semibold">Nama Bahan</th>
                    <th className="py-4 px-4 font-semibold">Kode</th>
                    <th className="py-4 px-4 font-semibold">Satuan</th>
                    <th className="py-4 px-4 font-semibold text-right text-sky-400">Stok Chiller</th>
                    <th className="py-4 px-4 font-semibold text-right">Par Level</th>
                    <th className="py-4 px-4 font-semibold text-center">Status</th>
                    <th className="py-4 px-4">Tgl Antrean Batch Pertama</th>
                    <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/5 text-xs">
                  {barItems.map((item) => {
                    const s = getStor("bar", item.code);
                    const status = getStorStatus(s, item.par);

                    // first active batch in FIFO
                    const activeBatches = (fifo[item.code] || []).filter((b) => !b.used);
                    const firstBatchInDate = activeBatches[0] ? activeBatches[0].inDate : "—";

                    return (
                      <tr key={item.code} className="hover:bg-sky-500/5 transition">
                        <td className="py-3.5 px-6 font-semibold text-amber-100">
                          <div className="flex items-center gap-1.5">
                            {(item as any).isHomemade && <span className="bg-sky-500/20 text-sky-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-sky-500/30">RACIKAN</span>}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-amber-300">{item.code}</td>
                        <td className="py-3.5 px-4 text-amber-200/50">{item.unit}</td>
                        <td className="py-3.5 px-4 text-right">
                          <strong className="text-sky-400 text-sm font-mono">{s}</strong>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-amber-200/60">{item.par}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`badge px-2 py-0.5 rounded-full text-[10px] font-bold ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-amber-200/40 italic">{firstBatchInDate}</td>
                        <td className="py-3.5 px-6 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => onEditStock("bar", item.code)}
                              className="bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/30 px-2 py-1 rounded cursor-pointer transition text-[10px] font-bold"
                              title="Koreksi manual kuantitas"
                            >
                              ✏️ Edit Qty
                            </button>
                            <button
                              onClick={() => onOpenTransfer("bar", "gudang", item.code)}
                              className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 px-2.5 py-1 rounded cursor-pointer transition text-[10px] font-bold"
                              title="Kembalikan sisa ke gudang"
                            >
                              ↩ Kembali Gudang
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
