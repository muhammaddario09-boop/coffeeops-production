import React, { useState } from "react";
import { CoffeeOpsState, PrDoc } from "../types";

interface PurchaseProps {
  state: CoffeeOpsState;
  onOpenPRForm: () => void;
  onApprovePR: (no: string) => void;
  onDeletePR: (index: number) => void;
}

export default function PurchaseRequest({ state, onOpenPRForm, onApprovePR, onDeletePR }: PurchaseProps) {
  const { prs } = state;
  const [selectedPr, setSelectedPr] = useState<PrDoc | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Menunggu Approval":
        return "bg-amber-950/40 text-amber-300 border border-amber-500/30";
      case "Disetujui":
        return "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20";
      case "Ditolak":
        return "bg-red-950/40 text-red-400 border border-red-500/25";
      case "Selesai Order":
        return "bg-blue-950/40 text-blue-300 border border-blue-500/30";
      default:
        return "bg-amber-100/5 text-amber-100/40";
    }
  };

  // Export all PR records into Excel-friendly CSV
  const handleExportAllPRs = () => {
    const headers = [
      "No. PR",
      "Tanggal Diajukan",
      "Supplier",
      "Diajukan Oleh",
      "Status",
      "Kode Bahan",
      "Nama Bahan Baku",
      "Jumlah Qty",
      "Satuan",
      "Estimasi Harga Satuan (Rp)",
      "Estimasi Subtotal (Rp)",
      "Total Biaya PR (Rp)"
    ];

    const rows: string[][] = [];
    prs.forEach((p) => {
      p.items.forEach((item, idx) => {
        rows.push([
          p.no,
          p.date,
          p.supplier || "Multi-Supplier",
          p.by,
          p.status,
          item.code,
          item.name,
          item.qty.toString(),
          item.unit,
          item.price.toString(),
          item.subtotal.toString(),
          idx === 0 ? p.total.toString() : ""
        ]);
      });
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Sistem_Semua_PR_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export a single detailed PR document to CSV
  const handleExportSinglePR = (p: PrDoc) => {
    const headers = [
      "No. PR",
      "Tanggal Diajukan",
      "Supplier",
      "Diajukan Oleh",
      "Status",
      "Kode Bahan",
      "Nama Bahan Baku",
      "Jumlah Qty",
      "Satuan",
      "Estimasi Harga Satuan (Rp)",
      "Estimasi Subtotal (Rp)",
      "Total Biaya PR (Rp)"
    ];

    const rows = p.items.map((item, idx) => [
      p.no,
      p.date,
      p.supplier || "Multi-Supplier",
      p.by,
      p.status,
      item.code,
      item.name,
      item.qty.toString(),
      item.unit,
      item.price.toString(),
      item.subtotal.toString(),
      idx === 0 ? p.total.toString() : ""
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_PR_${p.no}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#1a0a00]/30 p-5 border border-amber-500/10 rounded-2xl gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold">🛒 Purchase Request Form (PR)</h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Ajukan pengadaan bahan baku ke pemilik cafe atau finance luar. Status approval tersinkron online.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleExportAllPRs}
            disabled={prs.length === 0}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer shadow disabled:opacity-40"
          >
            📥 Ekspor Semua (.CSV)
          </button>
          <button
            onClick={onOpenPRForm}
            className="bg-[#D4A853] hover:bg-amber-600 text-[#1a0a00] text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer shadow active:scale-95"
          >
            ➕ Buat PR Baru
          </button>
        </div>
      </div>

      {/* Main card table list */}
      <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden">
        <div className="p-4 bg-black/10 border-b border-amber-500/10 flex justify-between items-center text-xs text-amber-200/60 font-mono">
          <span>Daftar Purchase Request</span>
          <span className="text-[10px] text-amber-100/30">💡 Klik No. PR atau tombol "👁 Detail" untuk rekapitulasi terperinci.</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/25 text-[10px] font-mono tracking-wider text-amber-100/40 uppercase border-b border-[#D4A853]/10">
                <th className="py-3 px-6">No. PR</th>
                <th className="py-3 px-4">Tanggal Diajukan</th>
                <th className="py-3 px-4">Tujuan Supplier</th>
                <th className="py-3 px-4">Bahan Pengadaan</th>
                <th className="py-3 px-4 text-right">Perkiraan Biaya</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Diajukan Oleh</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-500/5 text-xs">
              {prs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-amber-100/20">
                    🛒 Belum ada pengajuan Purchase Request terdata.
                  </td>
                </tr>
              ) : (
                [...prs].reverse().map((p, index) => {
                  const realIndex = prs.length - 1 - index;
                  return (
                    <tr key={p.id || index} className="hover:bg-amber-500/5 transition">
                      <td className="py-4 px-6 font-mono text-[11px]">
                        <button
                          onClick={() => setSelectedPr(p)}
                          className="text-amber-300 font-bold hover:text-amber-100 hover:underline cursor-pointer flex items-center gap-1.5 focus:outline-none"
                        >
                          🔍 {p.no}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-amber-200/50">{p.date}</td>
                      <td className="py-4 px-4 font-semibold text-amber-100">{p.supplier || "Multi-Supplier"}</td>
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-semibold text-amber-100 leading-normal line-clamp-1">
                          {p.items.map((it) => `${it.name} (${it.qty} ${it.unit})`).join(", ")}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-serif text-amber-300 font-bold text-sm">
                        Rp {p.total.toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`badge px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-amber-100/80">{p.by}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            onClick={() => setSelectedPr(p)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-1 rounded text-[10px] font-semibold cursor-pointer active:scale-95 transition"
                            title="Lihat Detail PR"
                          >
                            👁 Detail
                          </button>

                          {p.status === "Menunggu Approval" && (
                            <button
                              onClick={() => onApprovePR(p.no)}
                              className="bg-emerald-500 text-emerald-950 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition hover:bg-emerald-400 active:scale-95"
                            >
                              ✓ Setujui
                            </button>
                          )}
                          <button
                            onClick={() => onDeletePR(realIndex)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-2.5 py-1 rounded cursor-pointer transition text-[10px] font-bold active:scale-95"
                            title="Hapus form PR"
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

      {/* POPUP MODAL: PURCHASE DETAIL VIEWER */}
      {selectedPr && (
        <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#160d07] border border-[#D4A853]/35 rounded-3xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.9)] text-amber-50 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-amber-500/15 pb-4">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-semibold">🔍 Detail Kearsipan Pengadaan (PR)</span>
                <h4 className="font-serif text-xl font-bold text-amber-100 mt-1">{selectedPr.no}</h4>
                <p className="text-[11px] text-amber-100/40 font-mono mt-0.5">Diajukan Tanggal: {selectedPr.date}</p>
              </div>
              <span className={`badge px-3.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(selectedPr.status)}`}>
                {selectedPr.status}
              </span>
            </div>

            {/* Information Grid Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/20 p-4 rounded-2xl border border-amber-500/5 font-sans text-xs">
              <div>
                <span className="text-[10px] font-mono text-amber-300/50 block">SUPPLIER TUJUAN</span>
                <strong className="text-amber-100 text-sm mt-0.5 block">{selectedPr.supplier || "Multi-Supplier"}</strong>
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-300/50 block">DIAJUKAN OLEH</span>
                <strong className="text-amber-100 text-sm mt-0.5 block">{selectedPr.by || "Sistem / Staf"}</strong>
              </div>
            </div>

            {/* Itemized Table Details */}
            <div className="space-y-2">
              <div className="text-xs font-bold font-mono text-amber-300 tracking-wider">📦 ITEM BAHAN BAKU YANG DIAJUKAN:</div>
              <div className="overflow-hidden border border-amber-500/10 rounded-xl bg-black/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-black/40 text-[10px] font-mono text-amber-300/40 uppercase tracking-wider border-b border-amber-500/10">
                      <th className="py-2.5 px-4">Kode SKU</th>
                      <th className="py-2.5 px-4">Nama Bahan Baku</th>
                      <th className="py-2.5 px-4 text-center">Jumlah Qty</th>
                      <th className="py-2.5 px-4 text-right">Est. Harga Satuan</th>
                      <th className="py-2.5 px-4 text-right">Est. Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/5">
                    {selectedPr.items.map((row, idx) => (
                      <tr key={idx} className="hover:bg-amber-500/5 transition">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-amber-400">{row.code}</td>
                        <td className="py-2.5 px-4 font-semibold text-amber-150">{row.name}</td>
                        <td className="py-2.5 px-4 text-center font-bold">
                          {row.qty} <span className="text-amber-200/40 font-normal">{row.unit}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-amber-200/60">
                          Rp {row.price.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-amber-300 font-bold">
                          Rp {row.subtotal.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-500/5 font-semibold text-amber-100 border-t border-amber-500/10">
                      <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider font-mono text-[10px] text-amber-300/70">
                        TOTAL ESTIMASI BIAYA PENGADAAN:
                      </td>
                      <td className="py-3 px-4 text-right font-serif text-base text-amber-300 font-bold">
                        Rp {selectedPr.total.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Actions Footer inside modal */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 pt-3 border-t border-amber-500/10">
              <button
                onClick={() => handleExportSinglePR(selectedPr)}
                className="w-full sm:w-auto bg-[#D4A853]/10 hover:bg-[#D4A853]/25 border border-[#D4A853]/30 text-[#D4A853] text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                📥 Unduh Form PR (.CSV / Excel)
              </button>
              <button
                onClick={() => setSelectedPr(null)}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold px-6 py-2.5 rounded-xl transition cursor-pointer active:scale-95 text-center"
              >
                ❌ Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export {};
