import React from "react";
import { CoffeeOpsState, TransferLog } from "../types";

interface TransferProps {
  state: CoffeeOpsState;
  onOpenTransfer: (from: "gudang" | "bar", to: "gudang" | "bar") => void;
  onDeleteTransfer: (index: number) => void;
}

export default function TransferBarang({ state, onOpenTransfer, onDeleteTransfer }: TransferProps) {
  const { transfers, branding } = state;

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Mutasi Directions cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1a0a00]/30 border border-orange-500/20 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-sm font-bold text-orange-400">🏗️ {branding.storageGudangName} ➡️ ❄️ {branding.storageBarName}</h4>
            <p className="text-xs text-amber-100/40 mt-1 lines-clamp-2">
              Ambil stock bulk dari area penyimpanan utama untuk ditaruh di chiller barista bar sebagai stock siap saji harian.
            </p>
          </div>
          <button
            onClick={() => onOpenTransfer("gudang", "bar")}
            className="mt-6 bg-[#D4A853] hover:bg-amber-600 text-amber-950 font-bold px-4 py-2 rounded-xl text-xs transition duration-200 cursor-pointer shadow active:scale-95 self-start"
            style={{ backgroundColor: branding.primaryColor }}
          >
            Buka Form Transfer ➡️
          </button>
        </div>

        <div className="bg-[#1a0a00]/30 border border-sky-500/20 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-sm font-bold text-sky-400">❄️ {branding.storageBarName} ➡️ 🏗️ {branding.storageGudangName}</h4>
            <p className="text-xs text-amber-100/40 mt-1 lines-clamp-2">
              Kembalikan material bar lebih atau berlebih ke gudang utama (stok return closing shift).
            </p>
          </div>
          <button
            onClick={() => onOpenTransfer("bar", "gudang")}
            className="mt-6 bg-[#FAF0E6]/5 border border-sky-500/30 text-sky-300 hover:bg-sky-500/10 font-semibold px-4 py-2 rounded-xl text-xs transition duration-200 cursor-pointer active:scale-95 self-start"
          >
            ↩️ Kembalikan Sisa Bar
          </button>
        </div>
      </div>

      {/* History log block */}
      <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#D4A853]/10 bg-black/10">
          <h4 className="font-serif font-bold text-sm text-amber-100">📋 Catatan Riwayat Mutasi / Transfer Internal</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/15 text-[10px] font-mono tracking-wider text-amber-100/40 uppercase border-b border-[#D4A853]/10">
                <th className="py-3 px-6">Waktu Input</th>
                <th className="py-3 px-4">Bahan Baku</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4 text-center">Asal</th>
                <th className="py-3 px-4 text-center">Tujuan</th>
                <th className="py-3 px-4">Keterangan / Alasan</th>
                <th className="py-3 px-4">Pelaksana</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/5 text-xs">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-amber-100/20">
                    ↔️ Belum ada riwayat transfer barang tercatat hari ini.
                  </td>
                </tr>
              ) : (
                [...transfers].reverse().map((t, index) => {
                  const realIndex = transfers.length - 1 - index;
                  return (
                    <tr key={t.id || index} className="hover:bg-amber-500/5 transition">
                      <td className="py-3 px-6 font-mono text-[11px] text-amber-100/40">{t.time}</td>
                      <td className="py-3 px-4 font-semibold text-amber-100">{t.name}</td>
                      <td className="py-3 px-4 text-right text-amber-300 font-bold font-mono">
                        {t.qty} <span className="text-[10px] text-amber-200/40 font-normal font-sans">{t.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-orange-500/10 text-orange-400 text-[10px] uppercase font-bold tracking-wider font-mono px-2 py-0.5 rounded">
                          {t.from === "gudang" ? "GUDANG" : "BAR"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-sky-500/10 text-sky-400 text-[10px] uppercase font-bold tracking-wider font-mono px-2 py-0.5 rounded">
                          {t.to === "gudang" ? "GUDANG" : "BAR"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-amber-200/50 italic max-w-xs truncate">{t.reason}</td>
                      <td className="py-3 px-4 text-amber-100/80">{t.by}</td>
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => onDeleteTransfer(realIndex)}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-2 py-1 rounded cursor-pointer transition text-[10px] font-bold"
                          title="Rollback dan batalkan mutasi"
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
