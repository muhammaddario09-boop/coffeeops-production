import React from "react";
import { CoffeeOpsState, IssueItem } from "../types";

interface IssueProps {
  state: CoffeeOpsState;
  onOpenIssue: (editIndex?: number) => void;
  onDeleteIssue: (index: number) => void;
}

export default function BarangKeluar({ state, onOpenIssue, onDeleteIssue }: IssueProps) {
  const { issues } = state;

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Intro section */}
      <div className="flex justify-between items-center bg-[#1a0a00]/30 p-5 border border-amber-500/10 rounded-2xl">
        <div>
          <h3 className="font-serif text-lg font-bold">📤 Catatan Keluar Bahan Baku (Usage Log)</h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Catat setiap bahan baku yang keluar dari bar chiller harian. Membantu menghitung pemakaian real-time.
          </p>
        </div>
        <button
          onClick={() => onOpenIssue()}
          className="bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer shadow active:scale-95"
        >
          ➕ Catat Pemakaian Bahan
        </button>
      </div>

      {/* Main logs card */}
      <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/25 text-[10px] font-mono tracking-wider text-amber-100/40 uppercase border-b border-[#D4A853]/10">
                <th className="py-3 px-6">Waktu Input</th>
                <th className="py-3 px-4">Nama Bahan</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4 text-center">Kategori Keluar</th>
                <th className="py-3 px-4 text-center">Shift Kerja</th>
                <th className="py-3 px-4">Ditulis Oleh</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/5 text-xs">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-amber-100/20">
                    📤 Belum ada log pemakaian bahan tercatat harian.
                  </td>
                </tr>
              ) : (
                [...issues].reverse().map((i, index) => {
                  const realIndex = issues.length - 1 - index;
                  return (
                    <tr key={i.id || index} className="hover:bg-amber-500/5 transition">
                      <td className="py-3.5 px-6 font-mono text-[11px] text-amber-100/40">{i.time}</td>
                      <td className="py-3.5 px-4 font-semibold text-amber-100">{i.name}</td>
                      <td className="py-3.5 px-4 text-right">
                        <strong className="text-amber-300 text-sm font-mono">{i.qty}</strong>{" "}
                        <span className="text-[10px] text-amber-200/40 font-normal">{i.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/10">
                          {i.cat}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-amber-200/60 font-mono text-[11px]">
                        {i.shift}
                      </td>
                      <td className="py-3.5 px-4 text-amber-100/80">{i.by}</td>
                      <td className="py-3.5 px-4 text-amber-100/40 italic truncate max-w-xs">{i.note || "—"}</td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => onOpenIssue(realIndex)}
                            className="bg-[#D4A853]/10 text-amber-300 hover:bg-[#D4A853]/20 border border-[#D4A853]/20 p-1 rounded cursor-pointer transition text-[10.5px]"
                            title="Edit data ini"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDeleteIssue(realIndex)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-1 rounded cursor-pointer transition text-[10.5px]"
                            title="Hapus data pemakaian bahan"
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
