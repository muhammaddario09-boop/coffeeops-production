import React from "react";
import { CoffeeOpsState, MasterItem } from "../types";

interface MasterProps {
  state: CoffeeOpsState;
  onOpenMaster: (editCode?: string) => void;
  onDeleteMaster: (code: string) => void;
}

export default function MasterBahan({ state, onOpenMaster, onDeleteMaster }: MasterProps) {
  const { master, branding } = state;

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Intro and actions */}
      <div className="flex justify-between items-center bg-[#1a0a00]/30 p-5 border border-amber-500/10 rounded-2xl">
        <div>
          <h3 className="font-serif text-lg font-bold">📋 Database Master Bahan Baku Cafe</h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Konfigurasi par level minimum harian, harga beli satuan default, supplier andalan, serta lokasi penyimpanan.
          </p>
        </div>
        <button
          onClick={() => onOpenMaster()}
          className="bg-[#D4A853] hover:bg-amber-600 text-[#1a0a00] text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer shadow active:scale-95"
          style={{ backgroundColor: branding.primaryColor }}
        >
          ➕ Tambah Bahan Baku Baru
        </button>
      </div>

      {/* Database list table */}
      <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/25 text-[10px] font-mono tracking-wider text-amber-100/40 uppercase border-b border-[#D4A853]/10">
                <th className="py-3.5 px-6 font-semibold">Kode BK</th>
                <th className="py-3.5 px-4 font-semibold">Nama Bahan Baku</th>
                <th className="py-3.5 px-4 font-semibold">Satuan</th>
                <th className="py-3.5 px-4 font-semibold text-right">Par level (Min)</th>
                <th className="py-3.5 px-4 text-right">Harga Beli Default</th>
                <th className="py-3.5 px-4">Distributor Utama</th>
                <th className="py-3.5 px-4 text-center">Default Area</th>
                <th className="py-3.5 px-4">Ketahanan (Shelf Life)</th>
                <th className="py-3.5 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/5 text-xs">
              {master.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-amber-100/20">
                    📋 Belum ada bahan baku terdaftar di Master Database.
                  </td>
                </tr>
              ) : (
                master.map((m) => (
                  <tr key={m.code} className="hover:bg-amber-500/5 transition">
                    <td className="py-3 px-6 font-mono text-[11px] text-amber-300 font-bold">{m.code}</td>
                    <td className="py-3 px-4 font-semibold text-amber-100">{m.name}</td>
                    <td className="py-3 px-4 text-amber-200/55">{m.unit}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-300 font-mono">{m.par}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-100/80">
                      Rp {m.price.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-amber-100/90">{m.supplier}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${
                          m.loc === "bar"
                            ? "bg-sky-500/10 text-sky-400"
                            : m.loc === "both"
                            ? "bg-teal-500/10 text-teal-400"
                            : "bg-orange-500/10 text-orange-400"
                        }`}
                      >
                        {m.loc === "bar" ? branding.storageBarName : m.loc === "both" ? "Keduanya" : branding.storageGudangName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-amber-200/40 italic">{m.shelf}</td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => onOpenMaster(m.code)}
                          className="bg-[#D4A853]/10 hover:bg-[#D4A853]/20 border border-[#D4A853]/30 text-amber-300 px-2 py-1 rounded cursor-pointer transition text-[10.5px] font-bold"
                          title="Edit spesifikasi bahan"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => onDeleteMaster(m.code)}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-2.5 py-1 rounded cursor-pointer transition text-[10.5px] font-bold"
                          title="Hapus dari database"
                        >
                          ✕ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export {};
