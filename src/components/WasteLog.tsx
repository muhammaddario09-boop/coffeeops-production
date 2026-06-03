import React from "react";
import { CoffeeOpsState, WasteItem } from "../types";

interface WasteProps {
  state: CoffeeOpsState;
  onOpenWaste: (editIndex?: number) => void;
  onDeleteWaste: (index: number) => void;
}

export default function WasteLog({ state, onOpenWaste, onDeleteWaste }: WasteProps) {
  const { wastes } = state;

  // Calculators
  const totalKerugianVal = wastes.reduce((sum, w) => sum + (w.loss || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Mini overview with input */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-red-950/20 to-black/20 p-5 border border-red-500/10 rounded-2xl">
        <div>
          <h3 className="font-serif text-lg font-bold text-red-300">🗑 Waste &amp; Loss Log (Kerugian)</h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Catat pembuangan bahan, tumpah, susu basi, atau kusam. Total kerugian saat ini:{" "}
            <span className="font-serif text-red-400 font-bold text-sm">Rp {totalKerugianVal.toLocaleString("id-ID")}</span>
          </p>
        </div>
        <button
          onClick={() => onOpenWaste()}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer shadow-md shadow-red-950/10 active:scale-95"
        >
          ➕ Catat Waste / Loss
        </button>
      </div>

      {/* Main card list */}
      <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/25 text-[10px] font-mono tracking-wider text-amber-100/40 uppercase border-b border-[#D4A853]/10">
                <th className="py-3 px-6">Waktu Input</th>
                <th className="py-3 px-4">Nama Bahan</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4 text-center">Penyebab Waste</th>
                <th className="py-3 px-4 text-right">Kerugian (Rp)</th>
                <th className="py-3 px-4">Dicatat Oleh</th>
                <th className="py-3 px-4">Tindakan Koreksi</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/5 text-xs">
              {wastes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-amber-100/20">
                    🗑 Belum ada data kerugian waste tercatat. Sempurna!
                  </td>
                </tr>
              ) : (
                [...wastes].reverse().map((w, index) => {
                  const realIndex = wastes.length - 1 - index;
                  return (
                    <tr key={w.id || index} className="hover:bg-amber-500/5 transition">
                      <td className="py-3.5 px-6 font-mono text-[11px] text-amber-100/40">{w.time}</td>
                      <td className="py-3.5 px-4 font-semibold text-amber-100">{w.name}</td>
                      <td className="py-3.5 px-4 text-right text-red-300 font-bold font-mono">
                        {w.qty} <span className="text-[10px] text-amber-200/40 font-normal">{w.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-red-500/15 text-red-400 text-[10px] font-bold px-2.5 py-0.5 rounded border border-red-500/10">
                          {w.cause}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-red-300 font-mono font-bold">
                        Rp {w.loss.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-amber-100/80">{w.by}</td>
                      <td className="py-3.5 px-4 text-amber-200/45 italic truncate max-w-xs">{w.action || "—"}</td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => onOpenWaste(realIndex)}
                            className="bg-[#D4A853]/10 text-amber-300 hover:bg-[#D4A853]/20 border border-[#D4A853]/20 p-1 rounded cursor-pointer transition text-[10.5px]"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDeleteWaste(realIndex)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-1 rounded cursor-pointer transition text-[10.5px]"
                          >
                            🗑
                          </button>
                        </div>
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
