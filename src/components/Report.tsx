import React, { useRef, useState } from "react";
import { CoffeeOpsState } from "../types";

interface ReportProps {
  state: CoffeeOpsState;
  onImportBackup: (importedState: CoffeeOpsState) => void;
}

export default function Report({ state, onImportBackup }: ReportProps) {
  const { master, inventory, wastes, prs, grns, transfers, attendance, issues } = state;
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automated Email Report settings states
  const [managerEmail, setManagerEmail] = useState(state.reportSettings?.managerEmail || "mega.manager@leparla-cafe.com");
  const [managerWhatsapp, setManagerWhatsapp] = useState(state.reportSettings?.managerWhatsapp || "6282123456789");
  const [isManagerEmailEnabled, setIsManagerEmailEnabled] = useState(state.reportSettings?.isManagerEmailEnabled ?? true);
  const [isManagerWhatsappEnabled, setIsManagerWhatsappEnabled] = useState(state.reportSettings?.isManagerWhatsappEnabled ?? true);
  const [ownerEmail, setOwnerEmail] = useState(state.reportSettings?.ownerEmail || "owner@leparla-group.com");
  const [isOwnerEmailEnabled, setIsOwnerEmailEnabled] = useState(state.reportSettings?.isOwnerEmailEnabled ?? true);
  const [emailService, setEmailService] = useState<"Gmail" | "SendGrid" | "LocalProxy" | "SMTP" | "EmailJS" | "Webhook">(state.reportSettings?.emailService || "Gmail");

  // SMTP credentials states
  const [smtpHost, setSmtpHost] = useState(state.reportSettings?.smtpHost || "");
  const [smtpPort, setSmtpPort] = useState(state.reportSettings?.smtpPort || 587);
  const [smtpUser, setSmtpUser] = useState(state.reportSettings?.smtpUser || "");
  const [smtpPassword, setSmtpPassword] = useState(state.reportSettings?.smtpPassword || "");
  const [smtpFrom, setSmtpFrom] = useState(state.reportSettings?.smtpFrom || "");

  // EmailJS and Webhook states
  const [emailjsServiceId, setEmailjsServiceId] = useState(state.reportSettings?.emailjsServiceId || "");
  const [emailjsTemplateId, setEmailjsTemplateId] = useState(state.reportSettings?.emailjsTemplateId || "");
  const [emailjsPublicKey, setEmailjsPublicKey] = useState(state.reportSettings?.emailjsPublicKey || "");
  const [emailjsPrivateKey, setEmailjsPrivateKey] = useState(state.reportSettings?.emailjsPrivateKey || "");
  const [webhookUrl, setWebhookUrl] = useState(state.reportSettings?.webhookUrl || "");

  const [isSending, setIsSending] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveReportSettings = () => {
    const nextState = {
      ...state,
      reportSettings: {
        managerEmail,
        managerWhatsapp,
        isManagerEmailEnabled,
        isManagerWhatsappEnabled,
        ownerEmail,
        isOwnerEmailEnabled,
        emailService,
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpUser,
        smtpPassword,
        smtpFrom,
        emailjsServiceId,
        emailjsTemplateId,
        emailjsPublicKey,
        emailjsPrivateKey,
        webhookUrl
      }
    };
    onImportBackup(nextState);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleTestDispatch = async (type: "weekly_manager" | "monthly_owner") => {
    setIsSending(true);
    setTerminalOutput(null);
    try {
      const recipient = type === "weekly_manager" ? managerEmail : ownerEmail;
      
      const smtpPayload = {
        host: smtpHost,
        port: Number(smtpPort),
        user: smtpUser,
        password: smtpPassword,
        from: smtpFrom
      };

      const emailjsConfigPayload = {
        serviceId: emailjsServiceId,
        templateId: emailjsTemplateId,
        publicKey: emailjsPublicKey,
        privateKey: emailjsPrivateKey
      };

      const webhookConfigPayload = {
        url: webhookUrl
      };

      const res = await fetch("/api/send-report-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          recipient,
          emailService,
          smtpConfig: smtpPayload,
          emailjsConfig: emailjsConfigPayload,
          webhookConfig: webhookConfigPayload,
          origin: window.location.origin,
          subject: type === "weekly_manager" 
            ? `Laporan Operasional Mingguan ${state.branding.name} [Automated]`
            : `Laporan Konsolidasi Finansial Bulanan - Periode Baru [Automated]`
        })
      });
      const data = await res.json();
      if (res.ok && (data.status === "success" || data.message)) {
        setTerminalOutput(`✓ PROSES PENGIRIMAN BERHASIL!\n\nSaluran Pengiriman: ${emailService.toUpperCase()}\nStatus Server: Sukses.\nDetail Status Pengantaran:\n${data.emailBody || data.message || "Laporan berhasil ditransmit."}`);
        
        // Propagate state change & auto-save settings
        const nextState = {
          ...state,
          reportQueue: data.reportQueue || state.reportQueue,
          activities: data.activities || state.activities,
          reportSettings: {
            ...state.reportSettings,
            managerEmail,
            isManagerEmailEnabled,
            managerWhatsapp,
            isManagerWhatsappEnabled,
            ownerEmail,
            isOwnerEmailEnabled,
            emailService,
            smtpHost,
            smtpPort: Number(smtpPort),
            smtpUser,
            smtpPassword,
            smtpFrom,
            emailjsServiceId,
            emailjsTemplateId,
            emailjsPublicKey,
            emailjsPrivateKey,
            webhookUrl
          }
        };
        onImportBackup(nextState);
      } else {
        setTerminalOutput(`❌ ERROR RESPOND SERVER:\n${data.error || "Gagal mengirimkan laporan."}`);
      }
    } catch (err: any) {
      setTerminalOutput(`❌ ERROR JARINGAN / KLIEN:\nTidak dapat terhubung dengan server: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Dynamically synthesize list of months from data
  const availableMonths = React.useMemo(() => {
    const monthsSet = new Set<string>();
    
    wastes.forEach((w) => { if (w.rawDate && w.rawDate.match(/^\d{4}-\d{2}/)) monthsSet.add(w.rawDate.substring(0, 7)); });
    grns.forEach((g) => { if (g.date && g.date.match(/^\d{4}-\d{2}/)) monthsSet.add(g.date.substring(0, 7)); });
    transfers.forEach((t) => { if (t.date && t.date.match(/^\d{4}-\d{2}/)) monthsSet.add(t.date.substring(0, 7)); });
    attendance.forEach((a) => { if (a.date && a.date.match(/^\d{4}-\d{2}/)) monthsSet.add(a.date.substring(0, 7)); });
    issues.forEach((i) => { if (i.isoDate && i.isoDate.match(/^\d{4}-\d{2}/)) monthsSet.add(i.isoDate.substring(0, 7)); });
    
    // Fallbacks
    monthsSet.add("2026-06");
    monthsSet.add("2026-05");
    
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [wastes, grns, transfers, attendance, issues]);

  const formatMonthLabel = (ym: string) => {
    if (ym === "all") return "Semua Waktu";
    const [year, month] = ym.split("-");
    const monthNames: { [k: string]: string } = {
      "01": "Januari", "02": "Februari", "03": "Maret", "04": "April",
      "05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus",
      "09": "September", "10": "Oktober", "11": "November", "12": "Desember"
    };
    return `${monthNames[month] || month} ${year}`;
  };

  // Filtered lists
  const filteredWastes = React.useMemo(() => {
    return selectedMonthFilter === "all" ? wastes : wastes.filter((w) => w.rawDate?.startsWith(selectedMonthFilter));
  }, [wastes, selectedMonthFilter]);

  const filteredGrns = React.useMemo(() => {
    return selectedMonthFilter === "all" ? grns : grns.filter((g) => g.date?.startsWith(selectedMonthFilter));
  }, [grns, selectedMonthFilter]);

  const filteredTransfers = React.useMemo(() => {
    return selectedMonthFilter === "all" ? transfers : transfers.filter((t) => t.date?.startsWith(selectedMonthFilter));
  }, [transfers, selectedMonthFilter]);

  const filteredAttendance = React.useMemo(() => {
    return selectedMonthFilter === "all" ? attendance : attendance.filter((a) => a.date?.startsWith(selectedMonthFilter));
  }, [attendance, selectedMonthFilter]);

  const filteredIssues = React.useMemo(() => {
    return selectedMonthFilter === "all" ? issues : issues.filter((i) => i.isoDate?.startsWith(selectedMonthFilter) || i.time?.startsWith(selectedMonthFilter));
  }, [issues, selectedMonthFilter]);

  const filteredDailyChecklists = React.useMemo(() => {
    const list = state.dailyChecklists || [];
    return selectedMonthFilter === "all" ? list : list.filter((d) => d.date?.startsWith(selectedMonthFilter));
  }, [state.dailyChecklists, selectedMonthFilter]);

  const filteredPrs = React.useMemo(() => {
    return selectedMonthFilter === "all" ? prs : prs.filter((p) => p.date?.startsWith(selectedMonthFilter));
  }, [prs, selectedMonthFilter]);

  const getStockAkhir = (code: string) => {
    const i = inventory[code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
    return Math.max(0, i.awal + i.masuk - i.keluar - i.waste);
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

  const calculateIngredientCost = (code: string, qty: number): number => {
    return getIngredientCostPerUnit(code) * qty;
  };

  const calculateRecipeTotalCost = (recipe: any): number => {
    return (recipe.ingredients || []).reduce((sum: number, ing: any) => {
      return sum + calculateIngredientCost(ing.code, ing.qty);
    }, 0);
  };

  const totalPR = filteredPrs.length;
  const approvedPR = filteredPrs.filter((p) => p.status === "Disetujui" || p.status === "Selesai Order").length;
  const prApprRate = totalPR ? Math.round((approvedPR / totalPR) * 100) : 0;

  const totalWasteQty = filteredWastes.reduce((acc, w) => acc + (w.qty || 0), 0);
  const totalWasteLoss = filteredWastes.reduce((acc, w) => acc + (w.loss || 0), 0);
  const grnCount = filteredGrns.length;

  const totalCritical = master.filter((m) => getStockAkhir(m.code) <= m.par).length;
  const totalSafe = master.filter((m) => getStockAkhir(m.code) > m.par * 1.5).length;

  // Top spent and consumed mapping
  const issuesMap: { [name: string]: number } = {};
  filteredIssues.forEach((i) => {
    issuesMap[i.name] = (issuesMap[i.name] || 0) + (i.qty || 0);
  });
  const topIssues = Object.entries(issuesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const testMap: { [name: string]: number } = {};
  filteredWastes.forEach((w) => {
    testMap[w.name] = (testMap[w.name] || 0) + (w.loss || 0);
  });
  const topWasteLosses = Object.entries(testMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Helper to download content as a blob
  const downloadBlob = (content: string, mimeType: string, filename: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Export entire Database.json
  const handleExportDatabase = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const cafeName = state.branding.name.toLowerCase().replace(/\s+/g, "_");
    downloadBlob(jsonStr, "application/json;charset=utf-8", `coffeeops_db_${cafeName}.json`);
  };

  // 2. Import entire Database.json
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.readAsText(files[0], "UTF-8");
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.branding && parsed.master) {
            onImportBackup(parsed as CoffeeOpsState);
            alert("✓ Berhasil! Cadangan database berhasil dipulihkan.");
          } else {
            alert("Gagal: Format file JSON tidak valid untuk database CoffeeOps.");
          }
        } catch (err) {
          alert("Gagal mengurai file JSON. Pastikan format file benar.");
        }
      };
    }
  };

  // 3. Export Inventory Reports in CSV
  const handleExportInventoryCSV = () => {
    const headers = [
      "Kode Bahan",
      "Nama Bahan Baku",
      "Satuan",
      "Par Level Level",
      "Harga Satuan (Rp)",
      "Supplier",
      "Lokasi",
      "Stok Gudang",
      "Stok Bar",
      "Total Stok Akhir",
      "Status Stok"
    ];

    const rows = master.map((m) => {
      const gudangQty = state.storage.gudang[m.code] || 0;
      const barQty = state.storage.bar[m.code] || 0;
      const totalAkhir = getStockAkhir(m.code);
      const isCritical = totalAkhir <= m.par;
      const statusText = isCritical ? "CRITICAL (Di bawah PAR)" : "SAFE (Aman)";

      return [
        m.code,
        m.name,
        m.unit,
        m.par.toString(),
        m.price.toString(),
        m.supplier,
        m.loc,
        gudangQty.toString(),
        barQty.toString(),
        totalAkhir.toString(),
        statusText
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(","))].join("\n");
    downloadBlob(csvContent, "text/csv;charset=utf-8;", "Laporan_Aman_Stok_BahanBaku.csv");
  };

  // 4. Export Usage Log (Issues) CSV
  const handleExportIssuesCSV = () => {
    const headers = [
      "ID Transaksi",
      "Waktu Pencatatan",
      "Kode Bahan",
      "Nama Bahan Baku",
      "Jumlah Keluar",
      "Satuan",
      "Kategori",
      "Operator Keluar",
      "Shift",
      "Catatan/Note"
    ];

    const rows = issues.map((i) => [
      i.id,
      i.time,
      i.code,
      i.name,
      i.qty.toString(),
      i.unit,
      i.cat,
      i.by,
      i.shift,
      i.note || ""
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(","))].join("\n");
    downloadBlob(csvContent, "text/csv;charset=utf-8;", "Laporan_Pemakaian_Barang_Keluar.csv");
  };

  // 5. Export Attendance Log CSV
  const handleExportAttendanceCSV = () => {
    const headers = [
      "Tanggal",
      "Nama Karyawan",
      "Jabatan/Role",
      "Check-In",
      "Check-Out",
      "Nama Shift Shift",
      "Status Kehadiran",
      "Jam Kerja Terakumulasi"
    ];

    const logs = attendance || [];
    const rows = logs.map((a) => [
      a.date,
      a.userName,
      a.role,
      a.checkIn,
      a.checkOut || "Active",
      a.shift,
      a.status,
      a.hoursWorked ? `${a.hoursWorked.toFixed(1)} jam` : "—"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(","))].join("\n");
    downloadBlob(csvContent, "text/csv;charset=utf-8;", "Laporan_Absensi_Kehadiran_Karyawan.csv");
  };

  // 6. Export Waste & Loss CSV
  const handleExportWasteCSV = () => {
    const headers = [
      "ID",
      "Waktu Pembuangan",
      "Tanggal Mentah",
      "Kode Bahan",
      "Nama Bahan",
      "Qty Dibuang",
      "Satuan",
      "Penyebab Pemborosan",
      "Kerugian Finansial (Rupiah)",
      "Kru yang Melapor",
      "Tindakan Aliansi"
    ];

    const rows = wastes.map((w) => [
      w.id,
      w.time,
      w.rawDate,
      w.code,
      w.name,
      w.qty.toString(),
      w.unit,
      w.cause,
      w.loss.toString(),
      w.by,
      w.action || ""
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(","))].join("\n");
    downloadBlob(csvContent, "text/csv;charset=utf-8;", "Laporan_Kerugian_Waste_Loss.csv");
  };

  // 7. Export Purchase Request CSV formatted beautifully for Excel
  const handleExportPurchaseCSV = () => {
    const headers = [
      "No. PR",
      "Tanggal Diajukan",
      "Supplier",
      "Diajukan Oleh",
      "Status",
      "Kode Bahan",
      "Nama Bahan Baku",
      "Jumlah Pengadaan (Qty)",
      "Satuan",
      "Estimasi Harga Satuan (Rp)",
      "Subtotal Item (Rp)",
      "Total Belanja PR (Rp)"
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
    downloadBlob(csvContent, "text/csv;charset=utf-8;", "Laporan_Aman_Purchase_Request.csv");
  };

  if (isPrintPreviewOpen) {
    const recipesList = state.recipes || [];
    const homemadeList = state.homemadeIngredients || [];
    const wastesList = filteredWastes;
    const grnsList = filteredGrns;
    const issuesList = filteredIssues;
    const transfersList = filteredTransfers;
    const attendanceList = filteredAttendance;
    const dailyOpsList = filteredDailyChecklists;
    const masterItems = state.master || [];

    // Calculations
    const totalWastesLoss = wastesList.reduce((acc, w) => acc + (w.loss || 0), 0);

    return (
      <div className="bg-[#05180c] min-h-screen text-amber-50 p-6 space-y-12 animate-fadeIn font-sans selection:bg-amber-500/30">
        {/* Style block for print layout customization */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            aside, header, #sidebar, .sidebar-nav, .no-print-control {
              display: none !important;
            }
            .pl-64 {
              padding-left: 0 !important;
            }
            main {
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }
            .print-bg-white {
              background: white !important;
              background-color: white !important;
              color: black !important;
              border-color: #ddd !important;
            }
            .print-text-dark {
              color: #111 !important;
            }
            .print-border-grey {
              border-color: #ccc !important;
            }
            .print-shadow-none {
              box-shadow: none !important;
            }
            .page-break {
              page-break-before: always;
              break-before: page;
              padding-top: 1.5rem;
            }
          }
        ` }} />

        {/* Floating Screen Command Bar */}
        <div className="bg-[#0c2e17] border border-[#D4A853]/30 p-4 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-4 no-print shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="font-serif font-bold text-amber-100 text-sm">Mode Pratinjau Presentasi Laporan Eksekutif</h4>
              <p className="text-[10px] text-amber-100/50">Laporan terintegrasi siap cetak / simpan sebagai file PDF digital.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-amber-500/10">
              <span className="text-[11px] text-amber-300 font-medium font-sans">Pilih Bulan:</span>
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="bg-[#1a0a00] border border-amber-500/20 text-amber-100 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#D4A853] font-sans"
              >
                <option value="all">Semua Waktu</option>
                {availableMonths.map(ym => (
                  <option key={ym} value={ym}>{formatMonthLabel(ym)}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-gradient-to-r from-amber-500 to-[#D4A853] hover:from-amber-600 hover:to-[#c5a880] text-amber-950 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow active:scale-95 transition"
            >
              🖨️ Cetak / Ekspor ke PDF
            </button>
            <button
              onClick={() => setIsPrintPreviewOpen(false)}
              className="bg-[#04150b] border border-amber-500/20 hover:bg-emerald-950/40 text-amber-300 text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition"
            >
              ⬅️ Kembali ke Laporan Hub
            </button>
          </div>
        </div>

        {/* PAGES WRAPPER */}
        <div className="max-w-5xl mx-auto space-y-16 print-bg-white print-text-dark">
          
          {/* PAGE 1: COVER SLIDE */}
          <div className="bg-gradient-to-br from-[#0c2e17] to-[#041d0e] border border-amber-500/25 p-12 rounded-3xl min-h-[640px] flex flex-col justify-between shadow-2xl print-bg-white print-border-grey print-shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-3xl text-[#D4A853]">⚜️</span>
                <h1 className="font-serif text-3xl font-extrabold tracking-tight text-amber-100 mt-2 print-text-dark">{state.branding.name}</h1>
                <p className="text-xs text-amber-300/80 font-mono tracking-wider uppercase mt-1">Pusat Pangkalpinang (HQ)</p>
              </div>
              <div className="text-right">
                <span className="bg-[#D4A853]/20 border border-[#D4A853]/30 text-[#D4A853] font-mono text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-bold">Laporan Eksekutif Konsolidasi</span>
              </div>
            </div>

            <div className="my-12 space-y-4">
              <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-[#D4A853]" />
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-amber-50 leading-tight print-text-dark">
                LAPORAN REKAPITULASI<br />OPERASIONAL &amp; KINERJA KAFE
              </h2>
              <p className="text-xs text-white/50 leading-relaxed font-sans max-w-xl">
                Dokumen komprehensif ini mengonsolidasikan rancangan resep, analisis Cost of Goods Sold (COGS), pemborosan atau kerugian terinfestasi (waste), mutasi barang keluar masuk antara Gudang Utama dengan Bar Chiller, hasil stok harian (inventory harian), serta performa absensi kehadiran staf bar.
              </p>
            </div>

            <div className="border-t border-emerald-950/40 pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-[11px] print-border-grey">
              <div>
                <span className="text-white/40 block font-sans">Periode Laporan:</span>
                <span className="font-semibold text-amber-100 print-text-dark">
                  {selectedMonthFilter === "all" ? "Semua Transaksi" : formatMonthLabel(selectedMonthFilter)}
                </span>
              </div>
              <div>
                <span className="text-white/40 block font-sans">Total Resep SKU:</span>
                <span className="font-semibold text-amber-100 print-text-dark">{recipesList.length} Formula Menu</span>
              </div>
              <div>
                <span className="text-white/40 block font-sans">Status Logistik:</span>
                <span className="font-semibold text-amber-100 print-text-dark">{masterItems.length} SKU Bahan Baku</span>
              </div>
              <div>
                <span className="text-white/40 block font-sans">Kehadiran Staf:</span>
                <span className="font-semibold text-amber-100 print-text-dark">{(attendanceList || []).length} Log Shift Absen</span>
              </div>
            </div>

            {/* Validation Stamps Area */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[10px] border-t border-emerald-950/40 mt-8 print-border-grey">
              <div className="space-y-12">
                <p className="text-white/40">Dibuat Oleh:</p>
                <div className="border-b border-amber-500/30 w-32 mx-auto" />
                <p className="font-bold text-amber-100 print-text-dark">Mega Manager</p>
                <p className="text-white/30 text-[9px]">Store Manager HQ</p>
              </div>
              <div className="space-y-12">
                <p className="text-white/40">Diperiksa Oleh:</p>
                <div className="border-b border-amber-500/30 w-32 mx-auto" />
                <p className="font-bold text-amber-100 print-text-dark">Hendra Head Barista</p>
                <p className="text-white/30 text-[9px]">Supervisor Bar &amp; Formula</p>
              </div>
              <div className="space-y-12">
                <p className="text-white/40">Disetujui Oleh:</p>
                <div className="border-b border-[#D4A853]/40 w-32 mx-auto" />
                <p className="font-bold text-[#D4A853]">Dario Owner</p>
                <p className="text-white/30 text-[9px]">Founder / Owner Le Parla</p>
              </div>
            </div>
          </div>

          {/* PAGE 2: RESEP & COGS ANALYSIS */}
          <div className="page-break bg-[#051c0f]/80 border border-amber-500/10 p-8 rounded-3xl space-y-6 shadow-xl print-bg-white print-border-grey print-shadow-none">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-4 print-border-grey">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📜</span>
                <div>
                  <h3 className="font-serif font-bold text-amber-100 text-lg print-text-dark">Bagian I - Rancangan Resep &amp; Matriks COGS (HPP)</h3>
                  <p className="text-[10px] text-amber-100/40 print-text-dark">Struktur laba kotor per SKU menu berdasarkan kalkulasi real-time bahan baku aktif.</p>
                </div>
              </div>
              <span className="font-mono text-xs text-amber-400">Halaman 2 / 6</span>
            </div>

            {/* Homemade / Pre-rebus details */}
            {homemadeList.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#D4A853] uppercase tracking-wider font-mono">1. Biaya Formulasi Racikan / Rebus Batch Mandiri</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-amber-500/10 text-amber-100/60 print-text-dark">
                        <th className="py-2">Kode Racikan</th>
                        <th className="py-2">Nama Formulasi Racikan</th>
                        <th className="py-2">Standard Yield Kemasan</th>
                        <th className="py-2">Struktur Bahan Baku Racikan</th>
                        <th className="py-2 text-right">HPP / Unit Hasil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {homemadeList.map((hm) => {
                        const cost = (hm.ingredients || []).reduce((sum, ing) => sum + calculateIngredientCost(ing.code, ing.qty), 0);
                        const costPerUnit = hm.yieldQty > 0 ? cost / hm.yieldQty : 0;
                        return (
                          <tr key={hm.id} className="border-b border-amber-500/5 hover:bg-amber-500/5 transition py-1">
                            <td className="py-2 font-mono text-amber-300 font-semibold">{hm.id}</td>
                            <td className="py-2 font-semibold text-amber-100 print-text-dark">{hm.name}</td>
                            <td className="py-2 text-amber-200/70">{hm.yieldQty} {hm.yieldUnit}</td>
                            <td className="py-2 text-[10px] text-amber-200/50 max-w-xs truncate">
                              {(hm.ingredients || []).map(ing => {
                                const m = master.find(item => item.code === ing.code);
                                return `${m?.name || ing.code} (${ing.qty})`;
                              }).join(", ")}
                            </td>
                            <td className="py-2 text-right font-semibold text-[#D4A853] font-mono">
                              Rp {costPerUnit.toLocaleString("id-ID")} / {hm.yieldUnit === "ml" ? "ml" : hm.yieldUnit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recipes Table */}
            <div className="space-y-3 pt-4">
              <h4 className="text-xs font-bold text-[#D4A853] uppercase tracking-wider font-mono">2. Analisis Margin Profit SKU Minuman Aktif</h4>
              {recipesList.length === 0 ? (
                <p className="text-[11px] text-amber-100/35 italic">Belum ada rancangan resep terdefinisi di sistem.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-amber-500/15 text-amber-100/60 print-text-dark">
                        <th className="py-2">Nama SKU Minuman</th>
                        <th className="py-2">Kategori</th>
                        <th className="py-2 text-right">Harga Jual (Rp)</th>
                        <th className="py-2 text-right">Total HPP COGS (Rp)</th>
                        <th className="py-2 text-right">Laba Kotor (Rp)</th>
                        <th className="py-2 text-right">Margin (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipesList.map((rec) => {
                        const hpp = calculateRecipeTotalCost(rec);
                        const grossProfit = rec.sellPrice - hpp;
                        const marginPercent = rec.sellPrice > 0 ? Math.round((grossProfit / rec.sellPrice) * 100) : 0;
                        const isSecret = rec.isSecret;

                        return (
                          <tr key={rec.id} className="border-b border-amber-500/5 hover:bg-amber-500/5 py-1">
                            <td className="py-2 font-bold text-amber-100 print-text-dark flex items-center gap-1.5">
                              {isSecret && <span className="bg-red-950/40 text-red-400 text-[8px] font-mono font-bold px-1 py-0.5 rounded border border-red-500/30">RAHASIA</span>}
                              <span>{rec.name}</span>
                            </td>
                            <td className="py-2 text-amber-200/50">{rec.category}</td>
                            <td className="py-2 text-right font-mono text-amber-100 print-text-dark">Rp {rec.sellPrice.toLocaleString("id-ID")}</td>
                            <td className="py-2 text-right font-mono text-amber-300">Rp {hpp.toLocaleString("id-ID")}</td>
                            <td className="py-2 text-right font-mono text-emerald-400">Rp {grossProfit.toLocaleString("id-ID")}</td>
                            <td className="py-2 text-right font-mono font-bold text-emerald-400">
                              <span className={`px-1.5 py-0.5 rounded ${marginPercent >= 70 ? 'bg-emerald-950/40 border border-emerald-950' : marginPercent >= 50 ? 'bg-amber-950/40 text-amber-300' : 'bg-red-950/40 text-red-400'}`}>
                                {marginPercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* PAGE 3: WASTE & LOSS LOG */}
          <div className="page-break bg-[#051c0f]/80 border border-amber-500/10 p-8 rounded-3xl space-y-6 shadow-xl print-bg-white print-border-grey print-shadow-none">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-4 print-border-grey">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🗑</span>
                <div>
                  <h3 className="font-serif font-bold text-amber-100 text-lg print-text-dark">Bagian II - Audit &amp; Analisis Kerugian Akibat Waste / Spoiled</h3>
                  <p className="text-[10px] text-amber-100/40 print-text-dark">Log kejadian salah tuang, tumpah, tanggal kedaluwarsa cepat, dan evaluasi kerugian finansial bersih.</p>
                </div>
              </div>
              <span className="font-mono text-xs text-amber-400">Halaman 3 / 6</span>
            </div>

            {/* Waste statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#03140a] border border-emerald-900 p-3.5 rounded-2xl print-bg-white">
                <span className="text-[10px] text-white/40 block">Total Kejadian Spoiled:</span>
                <span className="text-lg font-mono font-bold text-red-400">{wastesList.length} Transaksi</span>
              </div>
              <div className="bg-[#03140a] border border-emerald-900 p-3.5 rounded-2xl print-bg-white">
                <span className="text-[10px] text-white/40 block">Kerugian Finansial Terakumulasi:</span>
                <span className="text-lg font-serif font-bold text-[#D4A853]">Rp {totalWastesLoss.toLocaleString("id-ID")}</span>
              </div>
              <div className="bg-[#03140a] border border-emerald-900 p-3.5 rounded-2xl print-bg-white col-span-2">
                <span className="text-[10px] text-white/40 block">Penyebab Kerugian Terbanyak:</span>
                <span className="text-xs font-semibold text-amber-100 truncate block print-text-dark">{topWasteLosses[0] ? `${topWasteLosses[0][0]} (Loss: Rp ${topWasteLosses[0][1].toLocaleString("id-ID")})` : "—"}</span>
              </div>
            </div>

            {/* Waste table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">Detil Riwayat Kejadian Pemborosan / Waste</h4>
              {wastesList.length === 0 ? (
                <p className="text-[11px] text-amber-100/35 italic">Bagus sekali! Belum ada pemborosan waste yang tercatat dalam sistem.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-amber-500/15 text-amber-100/60 print-text-dark">
                        <th className="py-2">Waktu Log</th>
                        <th className="py-2">Bahan Baku / Racikan</th>
                        <th className="py-2">Jumlah</th>
                        <th className="py-2">Penyebab (Masalah)</th>
                        <th className="py-2">Dilaporkan Oleh</th>
                        <th className="py-2">Tindakan Mitigasi</th>
                        <th className="py-2 text-right">Rugi (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wastesList.map((w) => (
                        <tr key={w.id} className="border-b border-amber-500/5 hover:bg-amber-500/5 py-1">
                          <td className="py-2 text-amber-200/50 font-mono text-[10px]">{w.rawDate} {w.time}</td>
                          <td className="py-2 font-semibold text-amber-100 print-text-dark">
                            <div>{w.name}</div>
                            <span className="text-[9px] font-mono text-amber-200/40">{w.code}</span>
                          </td>
                          <td className="py-2 font-mono text-amber-250">{w.qty} {w.unit}</td>
                          <td className="py-2 text-amber-100/70 max-w-[150px] truncate">{w.cause}</td>
                          <td className="py-2">{w.by}</td>
                          <td className="py-2 italic text-amber-200/40 text-[10px] max-w-[140px] truncate">{w.action || "Tindakan Standar Barista"}</td>
                          <td className="py-2 text-right font-mono font-bold text-red-400">Rp {w.loss.toLocaleString("id-ID")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* PAGE 4: ARUS LOGISTIK GUDANG & BAR */}
          <div className="page-break bg-[#051c0f]/80 border border-amber-500/10 p-8 rounded-3xl space-y-8 shadow-xl print-bg-white print-border-grey print-shadow-none">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-4 print-border-grey">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="font-serif font-bold text-amber-100 text-lg print-text-dark">Bagian III - Arus Logistik: Barang Masuk, Keluar, &amp; Mutasi Transfer</h3>
                  <p className="text-[10px] text-amber-100/40 print-text-dark">Dokumentasi transaksi perpindahan barang antara distributor ke Gudang Utama, pemakaian bar, dan mutasi internal.</p>
                </div>
              </div>
              <span className="font-mono text-xs text-amber-400">Halaman 4 / 6</span>
            </div>

            {/* A. Barang Masuk (GRN) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#D4A853] uppercase tracking-wider font-mono">1. Pengadaan Masuk - Penerimaan Fisik Barang (GRN)</h4>
              {grnsList.length === 0 ? (
                <p className="text-[11px] text-amber-100/35 italic">Belum ada penerimaan GRN yang dicatat.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-amber-500/10 text-amber-100/60 print-text-dark">
                        <th className="py-2">No. Dokumen GRN</th>
                        <th className="py-2">Tanggal</th>
                        <th className="py-2">Distributor / Supplier</th>
                        <th className="py-2">Ditransaksikan Ke</th>
                        <th className="py-2">Penerima Staf</th>
                        <th className="py-2 text-right">Volume Penerimaan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grnsList.map((g) => (
                        <tr key={g.id} className="border-b border-amber-500/5 hover:bg-amber-500/5 py-1">
                          <td className="py-2 font-mono text-amber-300 font-semibold">{g.no}</td>
                          <td className="py-2 text-amber-200/50">{g.date}</td>
                          <td className="py-2 font-semibold text-amber-100 print-text-dark">{g.supplier}</td>
                          <td className="py-2">
                             <span className="bg-emerald-950/40 text-emerald-300 text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-900 border-[#D4A853]/20 uppercase">
                               {g.dest === "gudang" ? state.branding.storageGudangName : g.dest === "bar" ? state.branding.storageBarName : "Both (Split)"}
                             </span>
                          </td>
                          <td className="py-2">{g.by}</td>
                          <td className="py-2 text-right font-semibold text-amber-250">{g.totalQty || g.totalItems} Unit SKU</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* B. Barang Keluar (Issues) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider font-mono">2. Arus Pemakaian Keluar (Log Pemakaian Bahan Baku Bar)</h4>
              {issuesList.length === 0 ? (
                <p className="text-[11px] text-amber-100/35 italic">Belum ada pemakaian bahan keluar yang dicatat.</p>
              ) : (
                <div className="overflow-x-auto max-h-[180px] overflow-y-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-amber-500/10 text-amber-100/60 print-text-dark">
                        <th className="py-2">Waktu Log</th>
                        <th className="py-2">Item Bahan Baku</th>
                        <th className="py-2">Volume</th>
                        <th className="py-2">Kru Barista</th>
                        <th className="py-2">Shift Kerja</th>
                        <th className="py-2">Keterangan / Alasan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issuesList.slice(-10).map((i) => (
                        <tr key={i.id} className="border-b border-amber-500/5 hover:bg-amber-500/5 py-1">
                          <td className="py-2 text-amber-200/40 font-mono text-[10px]">{i.isoDate || i.time}</td>
                          <td className="py-2 font-semibold text-amber-100 print-text-dark">{i.name} ({i.code})</td>
                          <td className="py-2 font-mono text-amber-250 font-bold">{i.qty} {i.unit}</td>
                          <td className="py-2">{i.by}</td>
                          <td className="py-2 text-amber-200/70">{i.shift}</td>
                          <td className="py-2 italic text-amber-250/50 max-w-xs truncate">{i.note || "Standar Restock Harian"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* C. Transfer Barang */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">3. Internal Mutasi Stok (Pindah Antara Gudang Utama ➡️ Bar Chiller)</h4>
              {transfersList.length === 0 ? (
                <p className="text-[11px] text-amber-100/35 italic">Belum ada transfer internal mutasi terdaftar di kafe ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-amber-500/10 text-amber-100/60 print-text-dark">
                        <th className="py-2">Transaksi ID</th>
                        <th className="py-2">Tanggal / Jam</th>
                        <th className="py-2">Nama Bahan Baku</th>
                        <th className="py-2">Volume Pinjam</th>
                        <th className="py-2">Arah Mutasi Internal</th>
                        <th className="py-2">Operator</th>
                        <th className="py-2">Kebutuhan Alasan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfersList.map((t) => (
                        <tr key={t.id} className="border-b border-amber-500/5 hover:bg-amber-500/5 py-1">
                          <td className="py-2 font-mono text-indigo-300 text-[10px]">{t.id}</td>
                          <td className="py-2 font-mono text-[10px] text-amber-200/55">{t.date} {t.time}</td>
                          <td className="py-2 font-bold text-amber-100 print-text-dark">{t.name}</td>
                          <td className="py-2 font-mono text-indigo-200">{t.qty} {t.unit}</td>
                          <td className="py-2 text-[10px] font-semibold text-indigo-300">
                            {t.from === "gudang" ? "Gudang Utama ➡️ Bar Chiller" : "Bar Chiller ➡️ Gudang Utama"}
                          </td>
                          <td className="py-2">{t.by}</td>
                          <td className="py-2 italic text-amber-200/50 max-w-[150px] truncate">{t.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* PAGE 5: STOCK OPNAME INVENTORY HARIAN */}
          <div className="page-break bg-[#051c0f]/80 border border-amber-500/10 p-8 rounded-3xl space-y-6 shadow-xl print-bg-white print-border-grey print-shadow-none">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-4 print-border-grey">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="font-serif font-bold text-amber-100 text-lg print-text-dark">Bagian IV - Inventory Harian &amp; Status Aman Posisi Stok</h3>
                  <p className="text-[10px] text-amber-100/40 print-text-dark">Nilai stok riil, par limit safety, dan status fisik barang pada Gudang Utama serta Bar Chiller.</p>
                </div>
              </div>
              <span className="font-mono text-xs text-amber-400">Halaman 5 / 6</span>
            </div>

            {/* Items table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#D4A853] uppercase tracking-wider font-mono">Status SKU &amp; Stok Fisik Aman Kafe</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-amber-500/15 text-amber-100/60 print-text-dark">
                      <th className="py-2">Kode SKU</th>
                      <th className="py-2">Nama Bahan Baku</th>
                      <th className="py-2">Satuan</th>
                      <th className="py-2 text-right">Stok Gudang</th>
                      <th className="py-2 text-right">Stok Bar</th>
                      <th className="py-2 text-right">Total Akumulasi</th>
                      <th className="py-2 text-right">Min Par Level</th>
                      <th className="py-2 text-right">Status Kesehatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterItems.map((m) => {
                      const gQty = state.storage.gudang[m.code] || 0;
                      const bQty = state.storage.bar[m.code] || 0;
                      const tot = gQty + bQty;
                      const isCritical = tot <= m.par;
                      const statusLabel = tot === 0 ? "Kritis/Habis" : isCritical ? "Restock" : "Aman";

                      return (
                        <tr key={m.code} className="border-b border-amber-500/5 hover:bg-amber-500/5 py-1">
                          <td className="py-2 font-mono text-[#D4A853]">{m.code}</td>
                          <td className="py-2 font-semibold text-amber-100 print-text-dark">{m.name}</td>
                          <td className="py-2 text-amber-200/50">{m.unit}</td>
                          <td className="py-2 text-right font-mono text-amber-100/70">{gQty}</td>
                          <td className="py-2 text-right font-mono text-amber-100/70">{bQty}</td>
                          <td className="py-2 text-right font-bold font-mono text-amber-250">{tot}</td>
                          <td className="py-2 text-right font-mono text-amber-200/60">{m.par}</td>
                          <td className="py-2 text-right">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${tot === 0 ? 'bg-red-950/40 text-red-400 border border-red-900/30' : isCritical ? 'bg-amber-950/40 text-amber-300 border border-amber-900/30' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-900/30'}`}>
                               {statusLabel}
                             </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PAGE 6: ABSENSI STAFF & DAILY SOP CHECKLIST */}
          <div className="page-break bg-[#051c0f]/80 border border-amber-500/10 p-8 rounded-3xl space-y-6 shadow-xl print-bg-white print-border-grey print-shadow-none">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-4 print-border-grey">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="font-serif font-bold text-amber-100 text-lg print-text-dark">Bagian V - Kehadiran Presensi Absensi Staf &amp; Checklist Daily Ops</h3>
                  <p className="text-[10px] text-amber-100/40 print-text-dark">Analisis ketepatan waktu jam kerja kru bar kafe Le Parla serta tingkat penyelesaian SOP opening/closing.</p>
                </div>
              </div>
              <span className="font-mono text-xs text-amber-400">Halaman 6 / 6</span>
            </div>

            {/* A. Daily SOP Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider font-mono">1. Kinerja SOP Operasional Harian Harian (Daily Ops)</h4>
              {dailyOpsList.length === 0 ? (
                <p className="text-[11px] text-amber-100/35 italic">Belum ada riwayat aktivitas Checklist SOP hari ini yang tersimpan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-amber-500/10 text-amber-100/60 print-text-dark">
                        <th className="py-2">Tanggal</th>
                        <th className="py-2">Kategori Shift</th>
                        <th className="py-2">Tipe Checklist SOP</th>
                        <th className="py-2">Petugas Bertanggungjawab</th>
                        <th className="py-2 text-right">Penyelesaian Task SOP</th>
                        <th className="py-2 text-right">Status Kelulusan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyOpsList.map((d: any) => {
                        const totalTasks = d.items?.length || 0;
                        const completedTasks = (d.items || []).filter((x: any) => x.completed).length;
                        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                        return (
                          <tr key={d.id} className="border-b border-amber-500/5 hover:bg-amber-500/5 py-1">
                            <td className="py-2 text-amber-200/50">{d.date}</td>
                            <td className="py-2 font-mono text-amber-100 print-text-dark">{d.shift}</td>
                            <td className="py-2 font-bold uppercase text-teal-300 text-[10px]">📋 Checklist {d.type}</td>
                            <td className="py-2">{d.staff}</td>
                            <td className="py-2 text-right font-mono text-amber-250 font-bold">{completedTasks} / {totalTasks} ({completionRate}%)</td>
                            <td className="py-2 text-right">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${completionRate === 100 ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/30' : 'bg-amber-950/40 text-amber-300 border border-amber-900/30'}`}>
                                {completionRate === 100 ? "LULUS 100%" : "DALAM PROSES"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* B. Attendance Staff */}
            <div className="space-y-3 pt-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">2. Detil Laporan Presensi Hadir Staff Kafe</h4>
              {attendanceList.length === 0 ? (
                <p className="text-[11px] text-amber-100/35 italic">Belum ada log data presensi kehadiran yang tersimpan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-amber-500/10 text-amber-100/60 print-text-dark">
                        <th className="py-2">Tanggal</th>
                        <th className="py-2">Nama Karyawan</th>
                        <th className="py-2">Jabatan / Role</th>
                        <th className="py-2">Nama Shift</th>
                        <th className="py-2">Jam Check-In</th>
                        <th className="py-2">Jam Check-Out</th>
                        <th className="py-2 text-right">Jam Kerja Terlaksana</th>
                        <th className="py-2 text-right">Status Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceList.map((a) => (
                        <tr key={a.id} className="border-b border-amber-500/5 hover:bg-amber-500/5 py-1">
                          <td className="py-2 text-amber-200/50 font-mono text-[10px]">{a.date}</td>
                          <td className="py-2 font-bold text-amber-100 print-text-dark">{a.userName}</td>
                          <td className="py-2 text-amber-250 text-[10px] uppercase font-semibold">{a.role}</td>
                          <td className="py-2">{a.shift}</td>
                          <td className="py-2 font-mono text-emerald-400">{a.checkIn}</td>
                          <td className="py-2 font-mono text-amber-200">{a.checkOut || "Active Shift"}</td>
                          <td className="py-2 text-right font-mono text-amber-100 print-text-dark">{a.hoursWorked ? `${a.hoursWorked.toFixed(1)} jam` : "—"}</td>
                          <td className="py-2 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${a.status === "Terlambat" ? "bg-red-950/40 text-red-550 border border-red-900/30" : "bg-emerald-950/40 text-emerald-350 border border-emerald-900/30"}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* PAGE FOOTER - SIGN OFF BRAND */}
          <div className="text-center pt-16 pb-8 border-t border-emerald-950/40 space-y-2 text-[10px] text-amber-100/30 font-sans print-border-grey">
             <p className="font-serif italic font-bold text-amber-100/50 print-text-dark">⚜️ Le Parla Café Enterprise Smart Portal - Pusat Pangkalpinang (HQ) ⚜️</p>
             <p>Laporan konsolidasi otomatis diunduh pada {new Date().toLocaleString("id-ID")} WIB • Bebas Bias &amp; 100% Akurat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Intro */}
      <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-5 rounded-2xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 no-print">
        <div>
          <h3 className="font-serif text-lg font-bold">📅 Laporan Rekapitulasi &amp; Database Hub</h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Unduh laporan ekspor berupa format CSV tabel rapi (kompatibel Excel / Google Sheets) serta buat laporan ringkasan bulanan (PDF) untuk kebutuhan presentasi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 bg-black/35 px-3 py-1.5 rounded-xl border border-amber-500/10">
            <span className="text-[11px] text-amber-300 font-medium font-sans whitespace-nowrap">Rentang Laporan:</span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="bg-[#1a0a00] border border-amber-500/20 text-amber-100 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-[#D4A853] font-sans"
            >
              <option value="all">Semua Waktu</option>
              {availableMonths.map(ym => (
                <option key={ym} value={ym}>{formatMonthLabel(ym)}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex-1 xl:flex-initial bg-gradient-to-r from-amber-500 to-[#D4A853] hover:from-amber-600 hover:to-[#c5a880] text-amber-950 font-sans font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition active:scale-95 shadow-lg flex items-center justify-center gap-1.5 focus:outline-none whitespace-nowrap"
          >
            <span>✨</span> Laporan Bulanan (PDF Presentasi)
          </button>
        </div>
      </div>

      {/* NEW: AUTOMATED DISPATCH & EMAIL INTEGRATION CENTER */}
      <div className="bg-[#1c0d02]/85 border border-[#D4A853]/35 rounded-2xl p-6 space-y-6 shadow-2xl no-print">
        <div className="flex xl:flex-row flex-col justify-between items-start xl:items-center gap-4 border-b border-amber-500/15 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📬</span>
            <div>
              <h4 className="font-serif font-bold text-base text-yellow-100">Integrasi Layanan Email &amp; Otomatisasi Laporan (PDF)</h4>
              <p className="text-[10.5px] text-amber-200/50 mt-0.5 leading-relaxed">
                Kirimkan buku ringkasan terintegrasi (menggabungkan resep, waste, dan inventory harian) secara terjadwal otomatis ke manajer, head barista, dan pemilik brand.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[#FAF0E6]/5 px-3 py-1.5 rounded-xl border border-amber-500/10">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold block">Engine Status:</span>
            <span className="h-2 w-2 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">SMTP/API ACTIVE</span>
          </div>
        </div>

        {/* Configuration grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings panel */}
          <div className="lg:col-span-7 space-y-4">
            <h5 className="text-xs uppercase font-mono tracking-widest text-[#D4A853] font-bold">⚙️ Pengaturan Jadwal &amp; Penerima</h5>
            
            <div className="space-y-3.5">
              {/* Manager & Head Barista Schedule */}
              <div className="bg-black/35 p-4 rounded-xl border border-amber-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🤵</span>
                    <strong className="text-xs text-amber-100">Laporan Mingguan Manajer &amp; Head Barista</strong>
                  </div>
                  <input
                    type="checkbox"
                    checked={isManagerEmailEnabled}
                    onChange={(e) => setIsManagerEmailEnabled(e.target.checked)}
                    className="accent-amber-500 h-4 w-4 rounded cursor-pointer"
                  />
                </div>
                
                <p className="text-[10px] text-amber-100/45 leading-normal">
                  Sistem otomatis mengompilasi dan mengirim berkas PDF ringkasan performa kafe setiap tanggal 8, 15, 22, dan 29 (setiap 1 minggu berjalan berikutnya).
                </p>

                {isManagerEmailEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[9px] font-mono text-amber-400/70 block mb-1">Email Penerima (Manajer / Head Barista):</label>
                      <input
                        type="email"
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        placeholder="ekslusif-manager@leparla.com"
                        className="w-full bg-[#110702] border border-amber-500/20 text-amber-100 placeholder-amber-100/20 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D4A853]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-amber-400/70 block mb-1">Tujuan WA Backup (Notifikasi Ringkas):</label>
                      <input
                        type="text"
                        value={managerWhatsapp}
                        onChange={(e) => setManagerWhatsapp(e.target.value)}
                        placeholder="62821..."
                        className="w-full bg-[#110702] border border-amber-500/20 text-amber-100 placeholder-amber-100/20 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D4A853]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Owner Schedule */}
              <div className="bg-black/35 p-4 rounded-xl border border-amber-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👑</span>
                    <strong className="text-xs text-amber-100">Laporan Bulanan Konsolidasi Owner Group</strong>
                  </div>
                  <input
                    type="checkbox"
                    checked={isOwnerEmailEnabled}
                    onChange={(e) => setIsOwnerEmailEnabled(e.target.checked)}
                    className="accent-amber-500 h-4 w-4 rounded cursor-pointer"
                  />
                </div>
                
                <p className="text-[10px] text-amber-100/45 leading-normal">
                  Sistem otomatis mengompilasi dan mengirim PDF bundle yang memuat resep lengkap, cogs, profit margin, waste loss, pos logistik, absensi dan SOP audit ke email owner setiap tanggal 1 bulan berikutnya.
                </p>

                {isOwnerEmailEnabled && (
                  <div className="pt-1">
                    <label className="text-[9px] font-mono text-amber-400/70 block mb-1">Email Penerima Owner:</label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="owner-leparla@grup.com"
                      className="w-[70%] max-w-sm bg-[#110702] border border-amber-500/20 text-amber-100 placeholder-amber-100/20 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D4A853]"
                    />
                  </div>
                )}
              </div>

              {/* Server Integration Pick */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FAF0E6]/5 p-3 rounded-xl border border-amber-500/10">
                <div>
                  <span className="text-xs font-bold text-amber-200 block">Gerbang Pengiriman (Provider):</span>
                  <span className="text-[9px] text-amber-100/45">Semua pengiriman diamankan dengan TLS 1.3 Encryption.</span>
                </div>
                
                <select
                  value={emailService}
                  onChange={(e) => setEmailService(e.target.value as any)}
                  className="bg-[#110702] border border-amber-500/30 text-amber-100 text-xs rounded px-2 py-1 focus:outline-none"
                >
                  <option value="SMTP">SMTP Server Kustom (Direkomendasikan)</option>
                  <option value="EmailJS">EmailJS API Integration (Sangat Stabil &amp; Mudah)</option>
                  <option value="Webhook">Webhook Custom API / Zapier / Make.com</option>
                  <option value="Gmail">Gmail API Integration</option>
                  <option value="SendGrid">SendGrid Web API</option>
                  <option value="LocalProxy">Local System Proxy (Simulasi) / Ethereal</option>
                </select>
              </div>

              {/* SMTP Credentials Expansion Box */}
              {["SMTP", "Gmail", "SendGrid", "LocalProxy"].includes(emailService) && (
                <div className="bg-black/45 border border-[#D4A853]/15 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono uppercase text-[#D4A853] block tracking-wider font-bold">📧 Kredensial SMTP Pengirim (Sender SMTP Server Details)</span>
                  <p className="text-[9px] text-amber-100/40 leading-snug">
                    Kosongkan kredensial di bawah untuk menggunakan <strong>Ethereal Sandbox SMTP default</strong> secara otomatis, yang akan memproduksi link pratinjau pesan asli langsung ke web inbox Anda.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[9px] font-mono text-amber-400/70 block mb-1">Host SMTP Server:</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.mailtrap.io atau smtp.gmail.com"
                        className="w-full bg-[#110702] border border-[#D4A853]/20 text-amber-100 placeholder-amber-100/20 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D4A853]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-amber-400/70 block mb-1">Port SMTP (Default: 587):</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value) || 587)}
                        placeholder="587 atau 465 untuk SSL"
                        className="w-full bg-[#110702] border border-[#D4A853]/20 text-amber-100 placeholder-amber-100/20 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D4A853]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-amber-400/70 block mb-1">SMTP Username / Email:</label>
                      <input
                        type="text"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full bg-[#110702] border border-[#D4A853]/20 text-amber-100 placeholder-amber-100/20 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D4A853]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-amber-400/70 block mb-1">SMTP Password:</label>
                      <input
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder="••••••••••••••"
                        className="w-full bg-[#110702] border border-[#D4A853]/20 text-amber-100 placeholder-amber-100/20 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D4A853]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[9px] font-mono text-amber-400/70 block mb-1">Format Nama Pengirim (Contoh: "Le Parla Café" &lt;test@gmail.com&gt;):</label>
                      <input
                        type="text"
                        value={smtpFrom}
                        onChange={(e) => setSmtpFrom(e.target.value)}
                        placeholder='"Le Parla Café Laporan" <management@leparla.com>'
                        className="w-full bg-[#110702] border border-[#D4A853]/20 text-amber-100 placeholder-amber-100/20 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D4A853]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* EmailJS Credentials Expansion Box */}
              {emailService === "EmailJS" && (
                <div className="bg-black/45 border border-emerald-500/15 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">🚀</span>
                    <span className="text-[10px] font-mono uppercase text-[#4ade80] block tracking-wider font-bold">INTEGRASI EMAILJS REST GATEWAY</span>
                  </div>
                  <p className="text-[9px] text-emerald-100/45 leading-snug">
                    Hubungkan langsung ke service EmailJS Anda untuk jaminan pengiriman 100% sampai ke Gmail. Anda dapat mendefinisikan template berisi placeholder <code>{"{{message_html}}"}</code> atau parameter laporan terperinci lainnya.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[9px] font-mono text-[#4ade80]/70 block mb-1">EmailJS Service ID:</label>
                      <input
                        type="text"
                        value={emailjsServiceId}
                        onChange={(e) => setEmailjsServiceId(e.target.value)}
                        placeholder="service_xxxx"
                        className="w-full bg-[#110702] border border-emerald-500/20 text-emerald-100 placeholder-emerald-100/10 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-[#4ade80]/70 block mb-1">EmailJS Template ID:</label>
                      <input
                        type="text"
                        value={emailjsTemplateId}
                        onChange={(e) => setEmailjsTemplateId(e.target.value)}
                        placeholder="template_xxxx"
                        className="w-full bg-[#110702] border border-emerald-500/20 text-emerald-100 placeholder-emerald-100/10 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-[#4ade80]/70 block mb-1">EmailJS Public Key (User ID):</label>
                      <input
                        type="text"
                        value={emailjsPublicKey}
                        onChange={(e) => setEmailjsPublicKey(e.target.value)}
                        placeholder="user_xxxx atau PK_xxxx"
                        className="w-full bg-[#110702] border border-emerald-500/20 text-emerald-100 placeholder-emerald-100/10 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-[#4ade80]/70 block mb-1">EmailJS Private Key (Access Token - Opsional):</label>
                      <input
                        type="password"
                        value={emailjsPrivateKey}
                        onChange={(e) => setEmailjsPrivateKey(e.target.value)}
                        placeholder="Opsional jika tidak diaktifkan di dasbor"
                        className="w-full bg-[#110702] border border-emerald-500/20 text-emerald-100 placeholder-emerald-100/10 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Webhook Configuration Box */}
              {emailService === "Webhook" && (
                <div className="bg-black/45 border border-sky-500/15 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 text-xs">🔗</span>
                    <span className="text-[10px] font-mono uppercase text-sky-400 block tracking-wider font-bold">INTEGRASI WEBHOOK &amp; AUTOMATION WEB-SERVICE</span>
                  </div>
                  <p className="text-[9px] text-sky-100/45 leading-snug">
                    Kirimkan data laporan mentah diringkas beserta formatted HTML string langsung ke webhook URL Anda di <strong>Zapier, Make.com, n8n, Discord, Slack,</strong> atau microservice kustom Anda sendiri.
                  </p>
                  <div>
                    <label className="text-[9px] font-mono text-sky-400/70 block mb-1">Target Webhook POST URL:</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.zapier.com/hooks/catch/xxxxxx"
                      className="w-full bg-[#110702] border border-sky-500/20 text-sky-100 placeholder-sky-100/15 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveReportSettings}
                  className="bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold py-2.5 px-5 rounded-lg cursor-pointer transition active:scale-95 shadow"
                >
                  💾 Simpan Konfigurasi Otomatisasi
                </button>
                {saveSuccess && (
                  <span className="text-xs text-emerald-450 font-bold animate-pulse">✓ Pengaturan berhasil disimpan ke database.json!</span>
                )}
              </div>
            </div>
          </div>

          {/* Testing and simulation logs console */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h5 className="text-xs uppercase font-mono tracking-widest text-red-400 font-bold">🧪 Uji Coba Pengiriman &amp; Live Terminal</h5>
              <p className="text-[10px] text-amber-100/40 leading-normal">
                Gunakan tombol uji coba di bawah untuk menguji keabsahan templating data PDF dan server pengiriman sekarang tanpa menunggu jadwal sistem.
              </p>

              <div className="flex gap-2">
                <button
                  disabled={isSending}
                  onClick={() => handleTestDispatch("weekly_manager")}
                  className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-[10.5px] font-semibold py-2 px-3 rounded-lg cursor-pointer transition active:scale-95 disabled:opacity-50 text-center"
                >
                  {isSending ? "🔄 Menyusun..." : "🤵 Uji Ops Mingguan"}
                </button>
                
                <button
                  disabled={isSending}
                  onClick={() => handleTestDispatch("monthly_owner")}
                  className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[10.5px] font-semibold py-2 px-3 rounded-lg cursor-pointer transition active:scale-95 disabled:opacity-50 text-center"
                >
                  {isSending ? "🔄 Menyusun..." : "👑 Uji Finansial Owner"}
                </button>
              </div>
            </div>

            {/* Live terminal feedback box */}
            <div className="bg-black/60 border border-amber-500/15 p-4 rounded-xl flex-1 min-h-[160px] flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-amber-500/5 pb-2 mb-2">
                <span className="text-[9.5px] font-mono text-amber-400">CONSOLE LOG &amp; EMAIL PREVIEW</span>
                <span className="text-[8px] font-mono text-amber-100/30">UTF-8 SSL</span>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[180px] font-mono text-[9px] text-[#A7C7E7] leading-relaxed whitespace-pre-wrap select-text">
                {isSending ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-amber-300 gap-2 animate-pulse">
                    <span>📡 COMPILING REPORTS &amp; ESTABLISHING SMTP ENVELOPE...</span>
                    <span className="text-[8px] text-amber-100/35">Menghitung total, merekonstruksi master, inventory, waste, dan enkapsulasi PDF...</span>
                  </div>
                ) : terminalOutput ? (
                  terminalOutput
                ) : (
                  <span className="text-amber-100/25 block py-4 text-center">
                    [Belum ada log pengujian baru]. Silakan klik salah satu tombol uji coba di atas untuk melihat isi email laporan yang dikirimkan.
                  </span>
                )}
              </div>
              
              {terminalOutput && (
                <button
                  onClick={() => setTerminalOutput(null)}
                  className="text-right text-[8px] font-mono text-amber-400/50 hover:text-amber-400 mt-2 hover:underline self-end"
                >
                  [Bersihkan Terminal]
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dispatch Logs Table */}
        <div className="pt-2 border-t border-amber-500/15">
          <strong className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-2.5">📅 RIWAYAT &amp; JADWAL PENGIRIMAN DIGITAL SECARA MANDIRI</strong>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[9.5px]">
              <thead>
                <tr className="bg-black/35 text-amber-100/55 border-b border-amber-500/15">
                  <th className="p-2">ID Log</th>
                  <th className="p-2">Jenis Laporan</th>
                  <th className="p-2">Penerima (Recipient)</th>
                  <th className="p-2">Jadwal / Dikirim</th>
                  <th className="p-2 text-center">Status</th>
                  <th className="p-2 text-right">Layanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/5">
                {(state.reportQueue || []).map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-black/20 text-amber-100/70">
                    <td className="p-2 font-bold text-amber-300">{log.id}</td>
                    <td className="p-2 font-sans font-medium">
                      {log.type === "weekly_manager" ? "🤵 Laporan Ops Mingguan (Weekly)" : "👑 Laba Finansial (Monthly Owner)"}
                    </td>
                    <td className="p-2 text-[#FAF0E6]/90 font-sans">{log.recipient}</td>
                    <td className="p-2 text-amber-200/55">
                      {log.sentDate ? (
                        <span className="text-emerald-400">Selesai • {log.sentDate}</span>
                      ) : (
                        <span className="text-amber-400">Scheduled • {log.scheduleDate}</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {log.status === "Terkirim" ? (
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full text-[8.5px]">SUCCESS / INBOX</span>
                      ) : (
                        <span className="bg-amber-500/10 border border-amber-300/20 text-amber-300 px-1.5 py-0.5 rounded-full text-[8.5px]">WAITING CRON</span>
                      )}
                    </td>
                    <td className="p-2 text-right font-bold text-yellow-150/70">{emailService}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NEW: Export Database Card Section (EXPORT ONLY) */}
      <div className="bg-gradient-to-r from-amber-950/20 to-stone-900/60 border border-[#D4A853]/25 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-amber-500/10 pb-2.5">
          <span className="text-xl">🗄️</span>
          <div>
            <h4 className="font-serif font-bold text-sm text-yellow-150">Ekspor Seluruh Database (EXPORT ONLY)</h4>
            <p className="text-[10px] text-amber-200/50">Unduh cadangan data kafe Axes Coffee secara aman. Fitur restorasi melalui import dinonaktifkan demi stabilitas database relasional.</p>
          </div>
        </div>

        <div className="bg-black/25 rounded-xl p-4 border border-amber-500/5 flex flex-col justify-between space-y-3">
          <div>
            <h5 className="text-xs font-bold text-amber-200">备份 / Backup Database (.JSON)</h5>
            <p className="text-[10px] text-amber-100/35 mt-1 leading-normal">
              Unduh salinan cadangan lengkap database berisi daftar bahan baku, absensi, stok gudang harian, dan mutasi internal.
            </p>
          </div>
          <button
            onClick={handleExportDatabase}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold py-2.5 px-6 rounded-lg cursor-pointer transition active:scale-95 text-center inline-block shadow"
          >
            📥 Ekspor &amp; Unduh Database (.json)
          </button>
        </div>
      </div>

      {/* NEW: Export Specific CSV Module Reports Card Section */}
      <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3 border-b border-amber-500/10 pb-2.5">
          <span className="text-xl">📊</span>
          <div>
            <h4 className="font-serif font-bold text-sm text-amber-100">Ekspor Laporan Transaksional (.CSV / Excel)</h4>
            <p className="text-[10px] text-amber-100/40">Gunakan file ini untuk diproses ke Spreadsheet, Google Sheets, ataupun pelaporan pajak / manajerial.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={handleExportInventoryCSV}
            className="p-3 bg-[#FAF0E6]/5 hover:bg-[#FAF0E6]/10 border border-amber-500/10 hover:border-amber-500/25 rounded-xl text-center cursor-pointer transition space-y-2 group"
          >
            <div className="text-xl group-hover:scale-110 transition">📦</div>
            <div className="font-bold text-xs text-amber-100">Stok &amp; Bahan Baku</div>
            <p className="text-[9px] text-amber-100/30">Total {master.length} jenis SKU bahan</p>
          </button>

          <button
            onClick={handleExportIssuesCSV}
            className="p-3 bg-[#FAF0E6]/5 hover:bg-[#FAF0E6]/10 border border-amber-500/10 hover:border-amber-500/25 rounded-xl text-center cursor-pointer transition space-y-2 group"
          >
            <div className="text-xl group-hover:scale-110 transition">📤</div>
            <div className="font-bold text-xs text-amber-100">Log Pemakaian (Barat)</div>
            <p className="text-[9px] text-amber-100/30">Total {issues.length} transaksi keluar</p>
          </button>

          <button
            onClick={handleExportAttendanceCSV}
            className="p-3 bg-[#FAF0E6]/5 hover:bg-[#FAF0E6]/10 border border-amber-500/10 hover:border-amber-500/25 rounded-xl text-center cursor-pointer transition space-y-2 group"
          >
            <div className="text-xl group-hover:scale-110 transition">📋</div>
            <div className="font-bold text-xs text-amber-100">Presensi &amp; Absensi</div>
            <p className="text-[9px] text-amber-100/30">Total {(attendance || []).length} riwayat shift</p>
          </button>

          <button
            onClick={handleExportWasteCSV}
            className="p-3 bg-[#FAF0E6]/5 hover:bg-[#FAF0E6]/10 border border-amber-500/10 hover:border-amber-500/25 rounded-xl text-center cursor-pointer transition space-y-2 group"
          >
            <div className="text-xl group-hover:scale-110 transition">🗑</div>
            <div className="font-bold text-xs text-amber-100">Laporan Waste &amp; Loss</div>
            <p className="text-[9px] text-amber-100/30">Total {wastes.length} kejadian kecelakaan</p>
          </button>

          <button
            onClick={handleExportPurchaseCSV}
            className="p-3 bg-[#FAF0E6]/5 hover:bg-[#FAF0E6]/10 border border-[#D4A853]/25 hover:border-[#D4A853]/45 rounded-xl text-center cursor-pointer transition space-y-2 col-span-2 lg:col-span-1 bg-amber-500/5 group"
          >
            <div className="text-xl group-hover:scale-110 transition">🛒</div>
            <div className="font-bold text-xs text-[#D4A853]">Purchase Request (PR)</div>
            <p className="text-[9px] text-[#D4A853]/60">Total {prs.length} pengadaan bahan</p>
          </button>
        </div>
      </div>

      {/* Grid: Procurements vs Waste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Row 1: Procurement */}
        <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex justify-between items-center bg-black/10 p-2.5 rounded-lg border-b border-amber-500/5">
            <h4 className="font-serif font-bold text-sm text-amber-100">💰 Ringkasan Pengadaan &amp; Belanja</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-amber-500/5 pb-2">
              <span className="text-xs text-amber-100/50">Total PR Diajukan</span>
              <strong className="text-sm font-mono text-amber-100">{totalPR} Dok</strong>
            </div>
            <div className="flex justify-between border-b border-amber-500/5 pb-2">
              <span className="text-xs text-amber-100/50">PR Disetujui</span>
              <strong className="text-sm font-mono text-emerald-400">{approvedPR} PR</strong>
            </div>
            <div className="flex justify-between border-b border-amber-500/5 pb-2">
              <span className="text-xs text-amber-100/50">Presentase Approval PR</span>
              <strong className="text-sm font-mono text-amber-300">{prApprRate}%</strong>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-xs text-amber-100/50">Total GRN Terlayani</span>
              <strong className="text-sm font-mono text-teal-400">{grnCount} Penerimaan</strong>
            </div>
          </div>
        </div>

        {/* Card Row 2: Waste */}
        <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex justify-between items-center bg-black/10 p-2.5 rounded-lg border-b border-amber-500/5">
            <h4 className="font-serif font-bold text-sm text-red-300">🗑 Analisis Waste &amp; Spoiled</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-amber-500/5 pb-2">
              <span className="text-xs text-amber-100/50">Total Kejadian Dibuang</span>
              <strong className="text-sm font-mono text-amber-100">{wastes.length} Kali</strong>
            </div>
            <div className="flex justify-between border-b border-amber-500/5 pb-2">
              <span className="text-xs text-amber-100/50">Total Volume Bahan Waste</span>
              <strong className="text-sm font-mono text-red-400">{totalWasteQty.toFixed(1)} Unit</strong>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-xs text-amber-100/50">Kerugian Finansial Ditanggung</span>
              <strong className="text-sm font-serif text-red-400 text-base">
                Rp {totalWasteLoss.toLocaleString("id-ID")}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 2: top items & status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI stock levels */}
        <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4">
          <h5 className="font-serif font-bold text-xs text-amber-100">✅ Keamanan Stok &amp; KPI</h5>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-amber-500/5 pb-1">
              <span className="text-xs text-amber-100/50">Item Stok Kritis</span>
              <strong className="text-sm font-mono text-red-400">{totalCritical}</strong>
            </div>
            <div className="flex justify-between border-b border-amber-500/5 pb-1">
              <span className="text-xs text-amber-100/50">Item Stok Aman</span>
              <strong className="text-sm font-mono text-emerald-400">{totalSafe}</strong>
            </div>
            <div className="flex justify-between border-b border-amber-500/5 pb-1">
              <span className="text-xs text-amber-100/50">Total Catatan Keluar</span>
              <strong className="text-sm font-mono text-amber-300">{issues.length}</strong>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-xs text-amber-100/50">Total Internal Mutasi</span>
              <strong className="text-sm font-mono text-sky-400">{transfers.length}</strong>
            </div>
          </div>
        </div>

        {/* Top spent items */}
        <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4">
          <h5 className="font-serif font-bold text-xs text-amber-100">📤 Top 5 Bahan Paling Banyak Dipakai</h5>
          <div className="space-y-1">
            {topIssues.length === 0 ? (
              <div className="text-xs text-amber-100/30 font-medium">Belum ada data keluar.</div>
            ) : (
              topIssues.map(([name, qty]) => (
                <div key={name} className="flex justify-between border-b border-amber-500/5 pb-1 last:border-0">
                  <span className="text-xs text-amber-100/50 truncate max-w-[160px]">{name}</span>
                  <strong className="text-xs font-mono text-amber-300">{qty.toFixed(1)}</strong>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top spent losses in waste */}
        <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4">
          <h5 className="font-serif font-bold text-xs text-red-300">🗑 Top 5 Pemborosan Tertinggi</h5>
          <div className="space-y-1">
            {topWasteLosses.length === 0 ? (
              <div className="text-xs text-amber-100/30 font-medium">Bagus! Belum ada pemborosan waste terdokumentasi.</div>
            ) : (
              topWasteLosses.map(([name, loss]) => (
                <div key={name} className="flex justify-between border-b border-amber-500/5 pb-1 last:border-0">
                  <span className="text-xs text-amber-100/50 truncate max-w-[160px]">{name}</span>
                  <strong className="text-xs font-mono text-red-400">Rp {loss.toLocaleString("id-ID")}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
