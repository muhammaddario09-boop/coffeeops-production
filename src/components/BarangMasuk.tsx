import React from "react";
import { CoffeeOpsState, GrnDoc } from "../types";

interface ReceivingProps {
  state: CoffeeOpsState;
  onOpenGRN: () => void;
  onDeleteGRN: (index: number) => void;
}

export default function BarangMasuk({ state, onOpenGRN, onDeleteGRN }: ReceivingProps) {
  const { grns, branding } = state;

  const getDestLabel = (dest: string) => {
    switch (dest) {
      case "gudang":
        return `🏗️ ${branding.storageGudangName}`;
      case "bar":
        return `❄️ ${branding.storageBarName}`;
      case "both":
        return "Keduanya (50/50)";
      default:
        return "—";
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Intro block */}
      <div className="flex justify-between items-center bg-[#1a0a00]/30 p-5 border border-amber-500/10 rounded-2xl">
        <div>
          <h3 className="font-serif text-lg font-bold">📥 Catatan Penerimaan Barang Masuk (GRN)</h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Penerimaan supply bahan baku dari supplier. Stok Gudang/Bar Chiller serta batch FIFO akan bertambah otomatis.
          </p>
        </div>
        <button
          onClick={onOpenGRN}
          className="bg-[#D4A853] hover:bg-amber-600 text-[#1a0a00] text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer shadow active:scale-95"
          style={{ backgroundColor: branding.primaryColor }}
        >
          ➕ Catat Barang Masuk
        </button>
      </div>

      {/* Main list */}
      <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/25 text-[10px] font-mono tracking-wider text-amber-100/40 uppercase border-b border-[#D4A853]/10">
                <th className="py-3 px-6">No. GRN</th>
                <th className="py-3 px-4">Tanggal Masuk</th>
                <th className="py-3 px-4">Nama Supplier</th>
                <th className="py-3 px-4">Bahan Diterima</th>
                <th className="py-3 px-4 text-right">Total Qty</th>
                <th className="py-3 px-4 text-center">Lokasi Simpan</th>
                <th className="py-3 px-4">Penerima</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/5 text-xs">
              {grns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-amber-100/20">
                    📥 Belum ada data penerimaan supply masuk tercatat harian.
                  </td>
                </tr>
              ) : (
                [...grns].reverse().map((g, index) => {
                  const realIndex = grns.length - 1 - index;
                  return (
                    <tr key={g.id || index} className="hover:bg-amber-500/5 transition">
                      <td className="py-4 px-6 font-mono text-[11px] text-amber-300 font-semibold">{g.no}</td>
                      <td className="py-4 px-4 text-amber-200/50">{g.date}</td>
                      <td className="py-4 px-4 font-semibold text-amber-100">{g.supplier}</td>
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-semibold text-amber-100 leading-normal line-clamp-1">
                          {g.items.map((it) => `${it.name} (${it.qty} ${it.unit})`).join(", ")}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-amber-200 font-mono font-bold text-sm">
                        {g.totalQty.toFixed(1)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-teal-500/15 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-500/10">
                          {getDestLabel(g.dest)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-amber-100/80">{g.by}</td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => onDeleteGRN(realIndex)}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-2.5 py-1 rounded cursor-pointer transition text-[10px] font-bold"
                          title="Batalkan GRN & kurangkan kembali stok"
                        >
                          ✕ Hapus
                        </button>
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
export {};
