import React from "react";
import { CoffeeOpsState, FifoBatch } from "../types";

interface FifoTrackerProps {
  state: CoffeeOpsState;
  onOpenAddBatch: () => void;
  onMarkBatchUsed: (code: string, batchIndex: number) => void;
}

export default function FifoTracker({ state, onOpenAddBatch, onMarkBatchUsed }: FifoTrackerProps) {
  const { master, fifo } = state;

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Intro info card */}
      <div className="bg-blue-950/20 border-l-4 border-blue-400 p-4 rounded-xl flex items-start gap-3">
        <span className="text-xl">ℹ️</span>
        <div>
          <h4 className="text-blue-300 font-semibold text-xs uppercase tracking-wider">Aturan FIFO (First In First Out)</h4>
          <p className="text-[11px] text-blue-200/60 mt-0.5">
            Gunakan bahan di batch lama (<span className="text-orange-400 font-bold">ORANGE</span>) sebelum berpindah ke batch baru (<span className="text-blue-400 font-bold">BIRU</span>).
            Selalu periksa label tanggal terima di chiller bar atau rak untuk meminimalisasi kerugian (spoiled).
          </p>
        </div>
      </div>

      {/* Title block */}
      <div className="flex justify-between items-center bg-[#1a0a00]/30 p-4 border border-amber-500/10 rounded-xl">
        <div>
          <h3 className="font-serif text-sm font-bold">🔁 Monitoring Queue Batch FIFO</h3>
          <p className="text-[11px] text-amber-100/40 mt-1">
            Pantau perputaran bahan baku perishable (susu, konsentrat kopi, syrup, cup).
          </p>
        </div>
        <button
          onClick={onOpenAddBatch}
          className="bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer shadow active:scale-95"
        >
          ➕ Tambah Batch Baru
        </button>
      </div>

      {/* FIFO list */}
      <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden divide-y divide-amber-500/10">
        {master.slice(0, 15).map((m) => {
          // get active (not used) batches sorted
          const allBatches = fifo[m.code] || [];
          const activeBatches = allBatches.filter((b) => !b.used);
          const old = activeBatches[0];
          const next = activeBatches[1];

          return (
            <div key={m.code} className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Product title */}
              <div className="md:w-56 shrink-0">
                <h4 className="font-semibold text-xs text-amber-100">{m.name}</h4>
                <div className="text-[10px] text-amber-300 font-semibold font-mono mt-0.5">{m.code}</div>
              </div>

              {/* Batches mapping */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                
                {/* Oldest Batch (Orange) */}
                <div className="sm:col-span-5 bg-orange-950/20 border border-orange-500/20 p-3 rounded-xl flex flex-col justify-between min-h-[90px]">
                  <div>
                    <div className="text-[9px] text-orange-400 uppercase tracking-widest font-semibold font-mono">
                      🟠 Batch Tertua (Gunakan Dulu)
                    </div>
                    {old ? (
                      <div className="mt-1.5">
                        <div className="font-mono text-xs font-bold text-orange-300">
                          {old.qty} <span className="text-[10px] text-orange-100/50">{m.unit}</span>
                        </div>
                        <div className="text-[9px] text-orange-200/40 mt-1 font-mono flex flex-wrap gap-1">
                          <span>Masuk: {old.inDate}</span>
                          <span>•</span>
                          <span>Exp: {old.expDate || "—"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-orange-200/20 mt-3 font-medium">Tidak ada antrean batch</div>
                    )}
                  </div>
                  {old && (
                    <button
                      onClick={() => onMarkBatchUsed(m.code, allBatches.indexOf(old))}
                      className="mt-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 border border-orange-500/20 rounded-lg text-[9px] font-bold py-1 px-2.5 transition cursor-pointer self-start"
                    >
                      ✓ Tandai Habis
                    </button>
                  )}
                </div>

                {/* Arrow */}
                <div className="sm:col-span-1 text-center text-amber-400 font-bold hidden sm:block">➡️</div>

                {/* New Batch (Blue) */}
                <div className="sm:col-span-6 bg-blue-950/20 border border-blue-500/20 p-3 rounded-xl flex flex-col justify-between min-h-[90px]">
                  <div>
                    <div className="text-[9px] text-blue-400 uppercase tracking-widest font-semibold font-mono">
                      🔵 Batch Antrean Berikutnya
                    </div>
                    {next ? (
                      <div className="mt-1.5">
                        <div className="font-mono text-xs font-bold text-blue-300">
                          {next.qty} <span className="text-[10px] text-blue-100/50">{m.unit}</span>
                        </div>
                        <div className="text-[9px] text-blue-200/40 mt-1 font-mono">
                          Masuk: {next.inDate} | Exp: {next.expDate || "—"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-blue-200/20 mt-3 font-medium">Belum ada batch berikutnya</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
