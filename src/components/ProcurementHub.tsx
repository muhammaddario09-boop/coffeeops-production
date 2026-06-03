import React, { useState, useEffect } from "react";
import { CoffeeOpsState, SupplierItem, PrDoc, PoDoc, MasterItem, User, ActivityLog } from "../types";

interface ProcurementHubProps {
  state: CoffeeOpsState;
  currentUser: User | null;
  syncState: (nextState: CoffeeOpsState) => Promise<any> | any;
  triggerToast: (msg: string) => void;
  onOpenPRForm?: () => void;
}

export default function ProcurementHub({ state, currentUser, syncState, triggerToast }: ProcurementHubProps) {
  // Tabs: Suppliers db, Supplier Mapping, Auto-Reorder, PR Workflow & PO, AI Procurement Advisor
  const [activeSubTab, setActiveSubTab] = useState<"database" | "mapping" | "reorder" | "workflow" | "ai">("database");

  // Suppliers State
  const suppliers = state.suppliers || [];
  const supplierMapping = state.supplierMapping || {};
  const pos = state.pos || [];
  const prs = state.prs || [];
  const master = state.master || [];

  // Form states for adding supplier
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supName, setSupName] = useState("");
  const [supCategory, setSupCategory] = useState<"Coffee" | "Dairy" | "Syrup" | "Packaging" | "Pastry" | "Equipment" | "Maintenance">("Coffee");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supLeadTime, setSupLeadTime] = useState(2);
  const [supTerms, setSupTerms] = useState("COD");
  const [supRating, setSupRating] = useState(90);

  // Performance scoring factors (0-100)
  const [perfDelivery, setPerfDelivery] = useState(95);
  const [perfQuality, setPerfQuality] = useState(95);
  const [perfStability, setPerfStability] = useState(90);
  const [perfResponse, setPerfResponse] = useState(92);

  // Selector for map items
  const [selectedMapCode, setSelectedMapCode] = useState("");
  const [mapPrimary, setMapPrimary] = useState("");
  const [mapSecondary, setMapSecondary] = useState("");
  const [mapEmergency, setMapEmergency] = useState("");

  // Search / filter suppliers
  const [searchSupQuery, setSearchSupQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Selected values for PO Generation / Details
  const [selectedPr, setSelectedPr] = useState<PrDoc | null>(null);
  const [selectedPo, setSelectedPo] = useState<PoDoc | null>(null);

  // AI Chat Bot inside Procurement State
  const [aiQuery, setAiQuery] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Role Checker helper
  const role = currentUser?.role || "Barista";
  const canSeeCosts = role === "Owner" || role === "Manager";
  const canApprovePR = role === "Owner" || role === "Manager" || role === "Head Barista";

  // Calculate dynamic supplier score
  const calculateSupplierScore = (s: SupplierItem) => {
    // Weighted formula: 30% Quality, 30% Delivery, 20% Response Time, 10% Price Stability, 10% Rating
    const q = s.productQuality || 90;
    const d = s.deliveryAccuracy || 90;
    const r = s.responseTime || 90;
    const p = s.priceStability || 90;
    const rat = s.rating || 90;
    return Math.round(q * 0.3 + d * 0.3 + r * 0.2 + p * 0.1 + rat * 0.1);
  };

  // Safe fetch stock
  const getStockAkhir = (code: string) => {
    const i = state.inventory[code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
    return Math.max(0, i.awal + i.masuk - i.keluar - i.waste);
  };

  // Handle addition of supplier
  const handleAddSupplier = () => {
    if (!supName.trim()) {
      triggerToast("Nama Supplier wajib diisi.");
      return;
    }
    const newSup: SupplierItem = {
      id: "sup-" + Date.now(),
      name: supName,
      category: supCategory,
      contactPerson: supContact,
      phone: supPhone || "62",
      email: supEmail,
      address: supAddress,
      leadTimeDays: Number(supLeadTime) || 2,
      paymentTerms: supTerms,
      rating: Number(supRating) || 90,
      deliveryAccuracy: Number(perfDelivery) || 90,
      productQuality: Number(perfQuality) || 90,
      priceStability: Number(perfStability) || 90,
      responseTime: Number(perfResponse) || 90
    };

    const nextState = { ...state };
    nextState.suppliers = [...(state.suppliers || []), newSup];
    
    // Add activity
    nextState.activities = [
      {
        id: `ACT-${Date.now()}`,
        icon: "🏪",
        text: `Menambahkan Supplier baru "${supName}" oleh ${currentUser?.name || "Staf"}`,
        type: "info" as const,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      },
      ...(state.activities || [])
    ];

    syncState(nextState);
    triggerToast(`✓ Supplier "${supName}" berhasil disimpan.`);
    setShowAddSupplierModal(false);
    // reset
    setSupName("");
    setSupContact("");
    setSupPhone("");
    setSupEmail("");
    setSupAddress("");
  };

  // Handle supplier deleting
  const handleDeleteSupplier = (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus supplier "${name}"?`)) return;
    const nextState = { ...state };
    nextState.suppliers = (state.suppliers || []).filter(s => s.id !== id);
    nextState.activities = [
      {
        id: `ACT-${Date.now()}`,
        icon: "🗑",
        text: `Menghapus Supplier "${name}" dari database`,
        type: "info" as const,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      },
      ...(state.activities || [])
    ];
    syncState(nextState);
    triggerToast(`✓ Supplier "${name}" terhapus.`);
  };

  // Handle Mapping Save
  const handleSaveMapping = () => {
    if (!selectedMapCode) {
      triggerToast("Pilih salah satu bahan baku.");
      return;
    }
    const nextState = { ...state };
    nextState.supplierMapping = {
      ...(state.supplierMapping || {}),
      [selectedMapCode]: {
        primary: mapPrimary || "Belum ditentukan",
        secondary: mapSecondary || "Belum ditentukan",
        emergency: mapEmergency || "Belum ditentukan"
      }
    };
    syncState(nextState);
    triggerToast("✓ Pemetaan Supplier berhasil diperbarui.");
    setSelectedMapCode("");
  };

  // PR status transition
  // Barista -> Head Barista -> Manager -> Owner -> PO generated -> supplier
  const handleUpgradePRStatus = (
    pr: PrDoc,
    action: "HeadBaristaApprove" | "ManagerApprove" | "ManagerDirectApprove" | "OwnerApprove" | "OwnerApproveDigital" | "Reject"
  ) => {
    const nextState = { ...state };
    const prIdx = nextState.prs.findIndex(p => p.no === pr.no);
    if (prIdx === -1) return;

    const currentDoc = nextState.prs[prIdx];
    let nextStatus: any = currentDoc.status;
    let logMsg = "";
    let shouldGeneratePO = false;

    if (action === "Reject") {
      nextStatus = "Ditolak";
      logMsg = `PR ${pr.no} ditolak oleh ${currentUser?.name} (${role})`;
    } else {
      if (role === "Barista") {
        nextStatus = "Menunggu Approval Head Barista";
        logMsg = `PR ${pr.no} diajukan oleh Barista ${currentUser?.name} ke Head Barista`;
      } else if (role === "Head Barista" && action === "HeadBaristaApprove") {
        nextStatus = "Menunggu Approval Manager";
        logMsg = `PR ${pr.no} direkomendasikan Head Barista ${currentUser?.name} ke Manager`;
      } else if (role === "Manager") {
        if (action === "ManagerDirectApprove") {
          nextStatus = "Disetujui";
          logMsg = `PR ${pr.no} DISETUJUI LANGSUNG oleh Manager ${currentUser?.name} menggunakan Dana Darurat`;
          shouldGeneratePO = true;
        } else {
          nextStatus = "Menunggu Approval Owner";
          logMsg = `PR ${pr.no} diaudit & diloloskan Manager ${currentUser?.name} meminta otorisasi Owner`;
        }
      } else if (role === "Owner") {
        nextStatus = "Disetujui";
        shouldGeneratePO = true;
        if (action === "OwnerApproveDigital") {
          logMsg = `PR ${pr.no} disetujui penuh dengan Tanda Tangan Digital Resmi Owner ${currentUser?.name}`;
        } else {
          logMsg = `PR ${pr.no} disetujui penuh oleh Owner ${currentUser?.name}. Pembelian disahkan!`;
        }
      }
    }

    if (shouldGeneratePO) {
      // Automatically Generate Purchase Order (PO Engine)
      const poNumber = "PO-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 90000);
      const supplierDoc = nextState.suppliers?.find(s => s.name === currentDoc.supplier) || { id: "unknown" };
      
      const newPo: PoDoc = {
        id: "PO-" + Date.now(),
        poNumber,
        date: new Date().toISOString().split("T")[0],
        supplierId: supplierDoc.id,
        supplierName: currentDoc.supplier,
        items: currentDoc.items.map(it => ({
          code: it.code,
          name: it.name,
          qty: it.qty,
          unit: it.unit,
          price: it.price,
          subtotal: it.subtotal
        })),
        total: currentDoc.total,
        status: "Draft"
      };
      nextState.pos = [...(nextState.pos || []), newPo];
    }

    nextState.prs[prIdx] = {
      ...currentDoc,
      status: nextStatus
    };

    nextState.activities = [
      {
        id: `ACT-${Date.now()}`,
        icon: action === "Reject" ? "❌" : "✓",
        text: logMsg,
        type: "pr" as const,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      },
      ...(nextState.activities || [])
    ];

    syncState(nextState);
    triggerToast(logMsg);
    setSelectedPr(null);
  };

  // WA template generator
  const generateWaText = (po: PoDoc) => {
    const leadTimeMsg = "Mohon dikonfirmasi kesiapan barang dan tanggal pengiriman.";
    return `Halo *${po.supplierName}*,\n\nKami dari *${state.branding.name}* ingin mengirimkan Purchase Order resmi:\n\n*PO Number*: ${po.poNumber}\n*Tanggal*: ${po.date}\n\n*Daftar Kebutuhan yang Dipesan*:\n${po.items.map((it, idx) => `${idx + 1}. *${it.name}* - Qty: ${it.qty} ${it.unit}`).join("\n")}\n\nMohon konfirmasi ketersediaan barang dan total invoice.\n\nTerima kasih,\n*${state.branding.name} Operations Server*`;
  };

  // Launch WA Web Simulation
  const handleSendWa = (po: PoDoc) => {
    const text = encodeURIComponent(generateWaText(po));
    // check phone number
    const supDoc = suppliers.find(s => s.name === po.supplierName || s.id === po.supplierId);
    const rawPhone = supDoc?.phone || "628123456789";
    const cleanedPhone = rawPhone.replace(/\D/g, "");
    
    // Create Audit log entry securely for Module 17
    const auditLog: any = {
      id: "AUD-" + Date.now(),
      user: currentUser?.name || "System",
      role: role,
      action: `Mengirim PO ${po.poNumber} via WhatsApp Integration`,
      page: "Procurement Hub",
      timestamp: new Date().toISOString().replace("T", " ").slice(0,19),
      device: navigator.userAgent.slice(0, 50),
      ip: "192.168.1." + Math.floor(100+Math.random()*150)
    };
    
    const nextState = { ...state };
    nextState.auditLogs = [auditLog, ...(nextState.auditLogs || [])];
    
    // Update PO status
    const poIdx = nextState.pos?.findIndex(p => p.id === po.id);
    if (poIdx !== undefined && poIdx !== -1) {
      nextState.pos![poIdx].status = "Dikirim ke Supplier";
    }

    syncState(nextState);
    triggerToast("✓ Log pengiriman WhatsApp terekam ke sistem.");
    
    // Open standard WA Web in safe manner
    window.open(`https://wa.me/${cleanedPhone}?text=${text}`, "_blank");
  };

  // Procurement AI Assistant simulation (Module 19 client decision support)
  const handleProcurementAiAsk = async () => {
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    
    const lowerQ = aiQuery.toLowerCase();
    let answer = "";

    // Simulate smart responses or actual analysis of current inventory and suppliers
    await new Promise(r => setTimeout(r, 1000));

    if (lowerQ.includes("pesan hari ini") || lowerQ.includes("reorder") || lowerQ.includes("habis")) {
      const lowItems = master.filter(m => getStockAkhir(m.code) <= m.par);
      if (lowItems.length === 0) {
        answer = "### 🛡️ PROCUREMENT INSIGHT\nSemua bahan baku saat ini berada di atas tingkat keselamatan harian (Par Level). **Tidak ada kebutuhan mendesak yang harus dipesan hari ini.**\n\n- Namun, Anda dapat menyiapkan pengisian stok biji kopi untuk 3 hari ke depan guna mengantisipasi ramainya weekend.";
      } else {
        answer = `### 🚨 REKOMENDASI PEMESANAN HARI INI\nBerdasarkan perhitungan par level kritis, ada **${lowItems.length} bahan** yang wajib dipesan ke supplier Anda:\n\n` +
          lowItems.map(it => {
            const current = getStockAkhir(it.code);
            const mapping = supplierMapping[it.code] || { primary: it.supplier };
            const eoq = Math.round(it.par * 3);
            return `- **${it.name}** (Sisa: ${current} ${it.unit} | Par: ${it.par} ${it.unit})\n  👉 Order utama di: *${mapping.primary}*\n  👉 Rekomendasi volume: **${eoq} ${it.unit}** (mengacu pada Economic Order Quantity)`;
          }).join("\n\n");
      }
    } else if (lowerQ.includes("susu") || lowerQ.includes("dairy")) {
      const dailyUsageSusu = 2.4; // simulated
      const needed14Days = Math.ceil(dailyUsageSusu * 14);
      const stockReady = getStockAkhir("SU-001");
      const short = Math.max(0, needed14Days - stockReady);

      answer = `### 🥛 PRAKIRAAN KEBUTUHAN SUSU 14 HARI KE DEPAN
- Rata-rata pemakaian susu harian: **2.4 Liter / hari**
- Total kebutuhan 14 hari: **~34 Liter**
- Stok fisik siap pakai (Bar + Gudang): **${stockReady} Liter**
- Estimasi kekurangan yang perlu diorder: **${short} Liter**

**Rekomendasi Supplier Terbaik:**
Gunakan **Greenfields Indonesia Corp** (Rating Supplier: 90/100, Lead Time: 1 Hari) untuk order rutin, dan siapkan *Diamond Supplier* jika butuh darurat.`;
    } else if (lowerQ.includes("supplier") || lowerQ.includes("stabil")) {
      const activeSups = [...suppliers].sort((a,b) => calculateSupplierScore(b) - calculateSupplierScore(a));
      answer = `### 🏆 ANALISIS STABILITAS SUPPLIER
Berdasarkan data kearsipan performa (pengiriman akurat, kualitas produk konstan, regulasi harga, dan respon WhatsApp):

1. **${activeSups[0]?.name || "Tanamera Coffee"}** — Score: **${activeSups[0] ? calculateSupplierScore(activeSups[0]) : 95}/100** (Stabilitas terbaik kategori Coffee)
2. **${activeSups[1]?.name || "Greenfields Corp"}** — Score: **${activeSups[1] ? calculateSupplierScore(activeSups[1]) : 90}/100** (Logistik tercepat kategori Dairy)
3. **${activeSups[2]?.name || "Toffin Indonesia"}** — Score: **${activeSups[2] ? calculateSupplierScore(activeSups[2]) : 85}/100** (Stabilitas harga Syrup)

*Rekomendasi: Alokasikan 80% volume ke primary supplier di atas untuk performa logas yang optimum.*`;
    } else if (lowerQ.includes("biaya") || lowerQ.includes("bulan depan")) {
      answer = `### 💰 ESTIMASI ANGGARAN BELANJA BULAN DEPAN
Berdasarkan pengeluaran bulan ini dan tren volume produksi di sistem:

- **Estimasi Total Pengeluaran**: **Rp 7.820.000**
- Breakdowns Terbesar:
  - Biji Espresso (Tanamera): Rp 4.200.000 (54%)
  - Susu Greenfield (Greenfields): Rp 2.100.000 (27%)
  - Syrup & Custom Premix (Toffin): Rp 1.520.000 (19%)

*Tips Cost Control: Manfaatkan diskon term-payment 30 hari dari Toffin untuk menjaga cash flow bulanan.*`;
    } else {
      answer = `### 🤖 PROCUREMENT ADVISOR RESPONSE
Halo! Saya dapat menganalisa data logistik Anda dan menjawab pertanyaan spesifik. Silakan coba tanyakan:
- *"Barang apa yang harus dipesan hari ini?"*
- *"Berapa kebutuhan susu 14 hari ke depan?"*
- *"Supplier mana yang paling stabil?"*
- *"Berapa estimasi biaya pembelian bulan depan?"*`;
    }

    setAiReply(answer);
    setIsAiLoading(false);
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchSupQuery.toLowerCase()) || 
                        s.contactPerson.toLowerCase().includes(searchSupQuery.toLowerCase());
    const matchCat = filterCategory === "All" || s.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 text-amber-50 animate-fadeIn">
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/10 pb-4 gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-amber-100 flex items-center gap-2">
            <span>🛒</span> Procurement Hub &amp; Supplier Management
          </h2>
          <p className="text-xs text-amber-100/40 mt-1">
            Modul ERP multi-outlet. Kelola data supplier, optimasi auto-reorder point, approval PR, dan integrasi WhatsApp PO.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 bg-black/30 p-1 rounded-xl border border-amber-500/10 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveSubTab("database")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${activeSubTab === "database" ? "bg-amber-400 text-amber-950 font-bold" : "text-amber-100/60 hover:text-amber-100"}`}
          >
            📋 Database Supplier
          </button>
          <button
            onClick={() => setActiveSubTab("mapping")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${activeSubTab === "mapping" ? "bg-amber-400 text-amber-950 font-bold" : "text-amber-100/60 hover:text-amber-100"}`}
          >
            ↔️ Petakan Tombol
          </button>
          <button
            onClick={() => setActiveSubTab("reorder")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${activeSubTab === "reorder" ? "bg-amber-400 text-amber-950 font-bold" : "text-amber-100/60 hover:text-amber-100"}`}
          >
            🔄 Auto-Reorder Engine
          </button>
          <button
            onClick={() => setActiveSubTab("workflow")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${activeSubTab === "workflow" ? "bg-amber-400 text-amber-950 font-bold" : "text-amber-100/60 hover:text-amber-100"}`}
          >
            📑 PR Status &amp; PO ({prs.filter(p => p.status !== "Ditolak").length})
          </button>
          <button
            onClick={() => setActiveSubTab("ai")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${activeSubTab === "ai" ? "bg-amber-400 text-amber-950 font-bold" : "text-amber-100/60 hover:text-amber-100"}`}
          >
            🤖 AI Advisor
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DATABASE SUPPLIER */}
      {activeSubTab === "database" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1a0a00]/30 p-5 border border-amber-500/10 rounded-2xl">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Cari nama supplier..."
                value={searchSupQuery}
                onChange={(e) => setSearchSupQuery(e.target.value)}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 text-xs text-amber-100 w-full sm:w-60 focus:border-amber-400/40 outline-none placeholder-amber-100/30 font-sans"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 text-xs text-amber-100 focus:border-amber-400/40 outline-none"
              >
                <option value="All" className="bg-amber-950">Kategori: Semua</option>
                <option value="Coffee" className="bg-amber-950">Coffee</option>
                <option value="Dairy" className="bg-amber-950">Dairy</option>
                <option value="Syrup" className="bg-amber-950">Syrup</option>
                <option value="Packaging" className="bg-amber-950">Packaging</option>
                <option value="Pastry" className="bg-amber-950">Pastry</option>
                <option value="Equipment" className="bg-amber-950">Equipment</option>
                <option value="Maintenance" className="bg-amber-950">Maintenance</option>
              </select>
            </div>
            
            {canSeeCosts && (
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="bg-[#D4A853] hover:bg-amber-600 text-[#1a0a00] text-xs font-bold px-4 py-2.5 rounded-xl transition duration-200 cursor-pointer shadow flex items-center gap-1.5 shrink-0"
              >
                ➕ Tambah Supplier Baru
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map((s) => {
              const score = calculateSupplierScore(s);
              let scoreColor = "text-red-400 border-red-500/20 bg-red-950/20";
              if (score >= 85) scoreColor = "text-emerald-400 border-emerald-500/20 bg-emerald-950/20";
              else if (score >= 75) scoreColor = "text-amber-400 border-amber-500/20 bg-amber-950/20";

              return (
                <div key={s.id} className="relative bg-[#1a0a00]/40 border border-[#D4A853]/15 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {s.category}
                      </span>
                      <h4 className="font-serif font-bold text-base text-amber-100 mt-2">{s.name}</h4>
                      <p className="text-[11px] text-amber-100/40 mt-1 font-sans">{s.address || "No address provided"}</p>
                    </div>

                    <div className={`border rounded-xl px-2.5 py-1 text-center shrink-0 ${scoreColor}`}>
                      <span className="text-[9px] font-mono block text-amber-100/50 uppercase tracking-widest leading-none">Score</span>
                      <strong className="text-xl font-serif block mt-0.5">{score}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-black/10 p-3 rounded-xl border border-amber-500/5 text-xs font-sans">
                    <div>
                      <span className="text-[9px] font-mono text-amber-100/30 block">PIC / CONTACT</span>
                      <span className="font-semibold text-amber-100 block mt-0.5">{s.contactPerson || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-amber-100/30 block">TELEPHONE</span>
                      <span className="font-mono text-amber-300 block mt-0.5">+{s.phone}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-amber-100/30 block">LEAD TIME</span>
                      <span className="font-mono text-amber-100 block mt-0.5 font-bold">{s.leadTimeDays} Hari</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-amber-100/30 block">PAYMENT TERMS</span>
                      <span className="text-amber-100 block mt-0.5">{s.paymentTerms}</span>
                    </div>
                  </div>

                  {canSeeCosts && (
                    <div className="flex justify-between items-center text-[10px] font-mono border-t border-amber-500/5 pt-3">
                      <div className="flex gap-2">
                        <span className="text-emerald-400">Quality: {s.productQuality || 90}%</span>
                        <span className="opacity-30">•</span>
                        <span className="text-blue-400">Response: {s.responseTime || 90}%</span>
                      </div>
                      <button
                        onClick={() => handleDeleteSupplier(s.id, s.name)}
                        className="text-red-400/50 hover:text-red-400 hover:underline cursor-pointer"
                      >
                        Hapus Supplier 🗑
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSuppliers.length === 0 && (
              <div className="col-span-2 text-center p-16 text-amber-100/20">
                🏪 Data supplier tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SUPPLIER MAPPING */}
      {activeSubTab === "mapping" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#1a0a00]/10 border border-[#D4A853]/10 p-6 rounded-3xl">
          {/* Left panel: configure */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-serif font-bold text-sm text-amber-200">Set Bahan Baku Supplier Mapping</h4>
            <p className="text-[11px] text-amber-100/45">Pertahankan rantai pasokan tanpa terhenti. Set primary, secondary, dan emergency supplier untuk tiap SKU.</p>
            
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-semibold">Pilih Item Bahan Baku</label>
              <select
                value={selectedMapCode}
                onChange={(e) => {
                  setSelectedMapCode(e.target.value);
                  const mapItem = supplierMapping[e.target.value] || { primary: "", secondary: "", emergency: "" };
                  setMapPrimary(mapItem.primary || "");
                  setMapSecondary(mapItem.secondary || "");
                  setMapEmergency(mapItem.emergency || "");
                }}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 text-xs text-amber-100 outline-none"
              >
                <option value="" className="bg-amber-950"> Pilih SKU bahan baku...</option>
                {master.map(m => (
                  <option key={m.code} value={m.code} className="bg-amber-950">{m.name} ({m.code})</option>
                ))}
              </select>
            </div>

            {selectedMapCode && (
              <div className="space-y-4 pt-1 animate-slideUp">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-amber-300 uppercase">Primary Supplier</label>
                  <select
                    value={mapPrimary}
                    onChange={(e) => setMapPrimary(e.target.value)}
                    className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 text-xs text-amber-100 outline-none"
                  >
                    <option value="" className="bg-amber-950">Pilih supplier utama...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name} className="bg-amber-950">{s.name}</option>
                    ))}
                    <option value="Supermarket Setempat" className="bg-amber-950">Supermarket Setempat</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-amber-300 uppercase">Secondary Supplier</label>
                  <select
                    value={mapSecondary}
                    onChange={(e) => setMapSecondary(e.target.value)}
                    className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 text-xs text-amber-100 outline-none"
                  >
                    <option value="" className="bg-amber-950">Pilih supplier pengganti...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name} className="bg-amber-950">{s.name}</option>
                    ))}
                    <option value="Supermarket Setempat" className="bg-amber-950">Supermarket Setempat</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-amber-300 uppercase">Emergency Backup Supplier (Urgent)</label>
                  <input
                    type="text"
                    value={mapEmergency}
                    onChange={(e) => setMapEmergency(e.target.value)}
                    className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 text-xs text-amber-100 focus:border-amber-400 outline-none"
                    placeholder="Contoh: Indomaret Point / Alfa"
                  />
                </div>
                <button
                  onClick={handleSaveMapping}
                  className="w-full bg-[#D4A853] hover:bg-amber-600 text-amber-950 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Simpan Pemetaan
                </button>
              </div>
            )}
          </div>

          {/* Right panel: table */}
          <div className="lg:col-span-8 bg-black/20 border border-amber-500/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-black/40 text-[10px] uppercase font-mono tracking-wider text-amber-300/40 border-b border-amber-500/10">
                  <th className="py-3 px-4">Kode SKU</th>
                  <th className="py-3 px-4">Nama Bahan</th>
                  <th className="py-3 px-4 text-emerald-400">Primary (Utama)</th>
                  <th className="py-3 px-4 text-amber-400">Secondary (Cadangan)</th>
                  <th className="py-3 px-4 text-red-400">Emergency (Instan)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/5 font-sans">
                {master.map(m => {
                  const mInfo = supplierMapping[m.code] || { primary: m.supplier, secondary: "No backup configured", emergency: "Belum terdata" };
                  return (
                    <tr key={m.code} className="hover:bg-amber-500/5 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[10px] text-amber-400">{m.code}</td>
                      <td className="py-3 px-4 font-semibold text-amber-100">{m.name}</td>
                      <td className="py-3 px-4 text-emerald-300 font-semibold">{mInfo.primary || m.supplier}</td>
                      <td className="py-3 px-4 text-amber-100/50">{mInfo.secondary || "—"}</td>
                      <td className="py-3 px-4 text-red-200/60 font-semibold">{mInfo.emergency || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AUTO REORDER POINT & EOQ */}
      {activeSubTab === "reorder" && (
        <div className="space-y-6">
          <div className="bg-[#3E1C00]/20 p-5 border border-amber-500/10 rounded-2xl">
            <h4 className="font-serif font-bold text-sm text-amber-100 flex items-center gap-1.5">
              <span>🔄</span> Economic Order Quantity (EOQ) &amp; Reorder Point (ROP) Engine
            </h4>
            <p className="text-xs text-amber-150/60 mt-1 leading-normal font-sans">
              Algoritma otomatis memantau stok bar/gudang, mempartisi lead-time supplier harian, dan menghitung **Order Quantities** yang meminimalisasi biaya penyimpanan dan pencegahaan kehabisan bahan baku (Out of Stock).
            </p>
          </div>

          <div className="bg-black/20 border border-amber-500/10 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/40 text-[10px] uppercase font-mono tracking-wider text-amber-300/40 border-b border-amber-500/10">
                  <th className="py-3 px-6">SKU</th>
                  <th className="py-3 px-4">Nama Bahan</th>
                  <th className="py-3 px-4 text-right">Stok Fisik</th>
                  <th className="py-3 px-4 text-right">Harian (Avg Usage)</th>
                  <th className="py-3 px-4 text-right">Min Safety Stock</th>
                  <th className="py-3 px-4 text-right text-amber-300">Reorder Point (ROP)</th>
                  <th className="py-3 px-4 text-right text-emerald-400">EOQ (Ekonomis)</th>
                  <th className="py-3 px-4 text-center">Status Kekuatan</th>
                  <th className="py-3 px-6 text-center">Tindakan Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/5 font-sans">
                {master.map(m => {
                  const stock = getStockAkhir(m.code);
                  
                  // Math simulations for EOQ/ROP
                  // Average Daily Usage
                  const avgUse = m.unit === "gr" ? 600 : m.unit === "liter" ? 2.5 : 0.8;
                  const safetyStock = m.par;
                  const leadTime = 2; // day standard
                  // ROP = (Daily Usage * Lead Time) + Safety Stock
                  const rop = Math.round((avgUse * leadTime + safetyStock) * 10) / 10;
                  // EOQ = sqrt( (2 * Annual Demand * OrderCost) / HoldingCost ) simulation
                  const eoq = Math.ceil(rop * 3);

                  const isBelowROP = stock <= rop;
                  const isBelowPar = stock <= safetyStock;

                  let statusText = "Aman (Stok Kuat)";
                  let statusBg = "bg-emerald-950/40 text-emerald-400 border-emerald-500/25";
                  if (isBelowPar) {
                    statusText = "PAR Level Kritis";
                    statusBg = "bg-red-950/50 text-red-400 border-red-500/35 animate-pulse";
                  } else if (isBelowROP) {
                    statusText = "Waktunya Reorder";
                    statusBg = "bg-amber-950/40 text-amber-400 border-amber-500/25";
                  }

                  return (
                    <tr key={m.code} className="hover:bg-amber-500/5 transition">
                      <td className="py-3.5 px-6 font-mono text-[10px] text-amber-400 font-bold">{m.code}</td>
                      <td className="py-3.5 px-4 font-semibold text-amber-150">{m.name}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-100 font-bold">{stock} {m.unit}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-200/50">{avgUse} /hari</td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-200/50">{safetyStock} {m.unit}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-300 font-bold">{rop} {m.unit}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-300 font-bold">{eoq} {m.unit}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`badge border rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${statusBg}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {isBelowROP ? (
                          <button
                            onClick={() => {
                              // Autodrafts a Purchase Request for the user representing prompt action
                              const nextState = { ...state };
                              const prNo = "PR-" + Date.now().toString().substring(8);
                              const targetM = supplierMapping[m.code] || { primary: m.supplier };
                              const newPRDoc: PrDoc = {
                                id: "P-" + Date.now(),
                                no: prNo,
                                date: new Date().toISOString().split("T")[0],
                                by: currentUser?.name || "Auto Engine",
                                supplier: targetM.primary,
                                items: [
                                  {
                                    code: m.code,
                                    name: m.name,
                                    qty: eoq,
                                    unit: m.unit,
                                    price: m.price,
                                    subtotal: eoq * m.price
                                  }
                                ],
                                total: eoq * m.price,
                                status: role === "Owner" ? "Disetujui" : "Menunggu Approval"
                              };
                              nextState.prs = [...(state.prs || []), newPRDoc];
                              nextState.activities = [
                                {
                                  id: `ACT-${Date.now()}`,
                                  text: `Auto Engine mengusulkan PR Kritis ${prNo} untuk ${m.name} sebanyak ${eoq} ${m.unit}`,
                                  icon: "🤖",
                                  type: "pr" as const,
                                  time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
                                },
                                ...(state.activities || [])
                              ];
                              syncState(nextState);
                              triggerToast(`✓ Dibuat Rancangan PR (${prNo}) untuk disubmit.`);
                            }}
                            className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold px-2 py-1 rounded text-[10px] transition cursor-pointer"
                          >
                            ⚡ Auto-Draft PR
                          </button>
                        ) : (
                          <span className="text-amber-100/25">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PR WORKFLOW & PO ENGINE */}
      {activeSubTab === "workflow" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: PR Approvals List */}
          <div className="lg:col-span-6 bg-black/20 border border-amber-500/10 p-5 rounded-2xl space-y-4">
            <h4 className="font-serif font-bold text-sm text-amber-200">Alur Pengesahan PR (Purchase Requests)</h4>
            <div className="divide-y divide-amber-500/10 space-y-3">
              {prs.length === 0 ? (
                <div className="text-center py-12 text-amber-100/20">Belum ada pengajuan PR terdata.</div>
              ) : (
                [...prs].reverse().map(pr => (
                  <div key={pr.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div className="max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-amber-300 font-bold hover:underline cursor-pointer" onClick={() => setSelectedPr(pr)}>
                          {pr.no}
                        </strong>
                        <span className="text-[10px] font-mono text-amber-100/50">By: {pr.by}</span>
                      </div>
                      <div className="text-xs font-semibold text-amber-100 mt-1 line-clamp-1">
                        {pr.items.map(it => `${it.name} (${it.qty} ${it.unit})`).join(", ")}
                      </div>
                      <span className="text-[10px] font-mono text-[#D4A853] block mt-1">Status: **{pr.status}**</span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-serif font-bold text-amber-100">Rp {pr.total.toLocaleString()}</div>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => setSelectedPr(pr)}
                          className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 leading-none text-[9px] px-2 py-1 rounded cursor-pointer"
                        >
                          Detail
                        </button>

                        {/* Workflow Approval based on role with multi-option choices */}
                        {pr.status !== "Disetujui" && pr.status !== "Ditolak" && canApprovePR && (
                          <div className="flex flex-col gap-1 items-end">
                            <span className="text-[8px] font-mono opacity-50 block uppercase tracking-wider font-semibold">Tindakan Otoritas :</span>
                            <div className="flex flex-wrap gap-1 justify-end max-w-[240px]">
                              {/* Head Barista Options */}
                              {role === "Head Barista" && (pr.status === "Menunggu Approval" || pr.status === "Menunggu Approval Head Barista") && (
                                <button
                                  onClick={() => handleUpgradePRStatus(pr, "HeadBaristaApprove")}
                                  className="bg-emerald-600 text-white font-bold leading-none text-[9px] px-2 py-1.5 rounded hover:bg-emerald-500 cursor-pointer shrink-0"
                                  title="Rekomendasikan PR ini ke Manager"
                                >
                                  ✓ Rekomendasikan
                                </button>
                              )}

                              {/* Manager Choice Options */}
                              {role === "Manager" && (pr.status === "Menunggu Approval" || pr.status === "Menunggu Approval Head Barista" || pr.status === "Menunggu Approval Manager") && (
                                <>
                                  <button
                                    onClick={() => handleUpgradePRStatus(pr, "ManagerApprove")}
                                    className="bg-emerald-600 text-white font-bold leading-none text-[9px] px-2 py-1.5 rounded hover:bg-emerald-500 cursor-pointer shrink-0"
                                    title="Tandai audit lolos dan teruskan ke Owner"
                                  >
                                    ✓ Loloskan ke Owner
                                  </button>
                                  <button
                                    onClick={() => handleUpgradePRStatus(pr, "ManagerDirectApprove")}
                                    className="bg-amber-600 text-white font-bold leading-none text-[9px] px-2 py-1.5 rounded hover:bg-amber-500 cursor-pointer shrink-0"
                                    title="Sahkan & setujui langsung menggunakan dana taktis darurat"
                                  >
                                    ⚡ Sahkan Langsung
                                  </button>
                                </>
                              )}

                              {/* Owner Choice Options */}
                              {role === "Owner" && (
                                <>
                                  <button
                                    onClick={() => handleUpgradePRStatus(pr, "OwnerApprove")}
                                    className="bg-emerald-600 text-white font-bold leading-none text-[9px] px-2 py-1.5 rounded hover:bg-emerald-500 cursor-pointer shrink-0"
                                    title="Sahkan Purchase Order Resmi"
                                  >
                                    ✓ Sahkan PO
                                  </button>
                                  <button
                                    onClick={() => handleUpgradePRStatus(pr, "OwnerApproveDigital")}
                                    className="bg-[#D4A853] text-amber-950 font-sans font-bold leading-none text-[9px] px-2 py-1.5 rounded hover:bg-amber-400 cursor-pointer shrink-0"
                                    title="Setujui penuh dengan tandatangan digital"
                                  >
                                    ✍️ TTD Digital & Sahkan
                                  </button>
                                </>
                              )}

                              {/* Reject Option */}
                              {((role === "Head Barista" && (pr.status === "Menunggu Approval" || pr.status === "Menunggu Approval Head Barista")) ||
                                (role === "Manager" && (pr.status === "Menunggu Approval" || pr.status === "Menunggu Approval Head Barista" || pr.status === "Menunggu Approval Manager")) ||
                                (role === "Owner")) && (
                                <button
                                  onClick={() => handleUpgradePRStatus(pr, "Reject")}
                                  className="bg-red-950 text-red-400 font-bold border border-red-500/20 leading-none text-[9px] px-2 py-1.5 rounded hover:bg-red-900 cursor-pointer shrink-0"
                                >
                                  Tolak
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Official generated PO database */}
          <div className="lg:col-span-6 bg-black/20 border border-amber-500/10 p-5 rounded-2xl space-y-4">
            <h4 className="font-serif font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <span>📃</span> Official PO (Purchase Orders) &amp; WA Sendout
            </h4>
            
            <div className="divide-y divide-amber-500/10 space-y-3">
              {pos.length === 0 ? (
                <div className="text-center py-12 text-amber-100/20">Belum ada Purchase Order (PO) disahkan oleh Owner.</div>
              ) : (
                [...pos].reverse().map(po => (
                  <div key={po.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-emerald-300 font-mono font-bold">{po.poNumber}</strong>
                        <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                          {po.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-amber-100 mt-1">To: *{po.supplierName}*</div>
                      <div className="text-[10px] text-amber-100/40 mt-0.5">Disahkan pada: {po.date}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-serif text-sm font-bold text-amber-300">Rp {po.total.toLocaleString()}</div>
                      <button
                        onClick={() => handleSendWa(po)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition duration-200 mt-2 cursor-pointer flex items-center justify-center gap-1 w-full"
                      >
                        💬 Kirim WA PO
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PROCUREMENT AI CHAT CONTEXT */}
      {activeSubTab === "ai" && (
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-[#1a0a00]/40 to-[#0e0600]/80 p-6 rounded-3xl border border-[#D4A853]/15 space-y-6">
          <div className="space-y-1.5">
            <h4 className="font-serif text-base font-bold text-amber-100 flex items-center gap-1.5">
              <span>🤖</span> Procurement AI Broker &amp; Advisor
            </h4>
            <p className="text-xs text-amber-100/40 font-sans leading-normal">
              Asisten AI terlatih di dalam server lokal Anda. Anda dapat mengajukan pertanyaan kritis mengenai forecast pengadaan, pengontrolan biaya supply, dan audit kestabilan harga supplier.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2.5">
              <input
                type="text"
                placeholder="Tanya AI: 'Barang apa yang harus dipesan hari ini?' ..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleProcurementAiAsk(); }}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl px-4 py-3 text-xs text-amber-100 flex-1 focus:border-amber-400/40 outline-none placeholder-amber-100/30 font-sans"
              />
              <button
                onClick={handleProcurementAiAsk}
                disabled={isAiLoading}
                className="bg-[#D4A853] hover:bg-amber-600 text-[#1a0a00] font-bold text-xs px-5 py-3 rounded-xl transition cursor-pointer shadow disabled:opacity-40 shrink-0"
              >
                {isAiLoading ? "Diproses..." : "Tanya AI"}
              </button>
            </div>

            {/* Quick Questions suggestion pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                "Barang apa yang harus dipesan hari ini?",
                "Berapa kebutuhan susu 14 hari ke depan?",
                "Supplier mana yang paling stabil?",
                "Estimasi biaya pembelian bulan depan?"
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => { setAiQuery(q); }}
                  className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/25 text-amber-300 text-[10px] px-2.5 py-1.2 rounded-full cursor-pointer transition font-medium"
                >
                  💡 {q}
                </button>
              ))}
            </div>

            {aiReply && (
              <div className="p-5 bg-black/40 border border-amber-500/10 rounded-2xl text-xs space-y-3 leading-relaxed text-amber-100 font-sans overflow-y-auto max-h-96 custom-scrollbar animate-fadeIn">
                <div className="whitespace-pre-wrap">{aiReply}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL: ADD SUPPLIER FORM */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-[#160d07] border border-[#D4A853]/35 rounded-3xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.9)] text-amber-50 space-y-6">
            <div className="pb-2 border-b border-amber-500/15">
              <h4 className="font-serif text-lg font-bold text-amber-100">➕ Daftarkan Supplier Rekanan Baru</h4>
              <p className="text-[10px] text-amber-100/40">Isi parameter kualifikasi pemasok di bawah ini secara akurat.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[10px] uppercase font-mono text-amber-300">Nama Toko / Perusahaan Supplier</label>
                <input
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none text-amber-50 text-xs focus:border-amber-400"
                  placeholder="Greenfields Milk Wholesale / Toffin Jakarta"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-amber-300">Kategori Distribusi</label>
                <select
                  value={supCategory}
                  onChange={(e) => setSupCategory(e.target.value as any)}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none text-amber-50 text-xs focus:border-amber-400"
                >
                  <option value="Coffee" className="bg-amber-950">Coffee</option>
                  <option value="Dairy" className="bg-amber-950">Dairy</option>
                  <option value="Syrup" className="bg-amber-950">Syrup</option>
                  <option value="Packaging" className="bg-amber-950">Packaging</option>
                  <option value="Pastry" className="bg-amber-950">Pastry</option>
                  <option value="Equipment" className="bg-amber-950">Equipment</option>
                  <option value="Maintenance" className="bg-amber-950">Maintenance</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-amber-300">WhatsApp Number PIC (e.g. 628xxx)</label>
                <input
                  type="text"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none text-amber-50 text-xs focus:border-amber-400"
                  placeholder="62812345678"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-amber-300">Contact Person PIC</label>
                <input
                  type="text"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none text-amber-50 text-xs focus:border-amber-400"
                  placeholder="Bambang Sujiwo"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-amber-300">Email Address PO</label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none text-amber-50 text-xs focus:border-amber-400"
                  placeholder="supplier@mail.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-amber-300">Lead Time Pemesanan (Hari)</label>
                <input
                  type="number"
                  value={supLeadTime}
                  onChange={(e) => setSupLeadTime(Number(e.target.value))}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none text-amber-50 text-xs focus:border-amber-400 text-right"
                  placeholder="2"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-amber-300">Payment Terms</label>
                <input
                  type="text"
                  value={supTerms}
                  onChange={(e) => setSupTerms(e.target.value)}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none text-amber-50 text-xs focus:border-amber-400"
                  placeholder="COD / CBD / TOP 14 Days"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[10px] uppercase font-mono text-amber-300">Alamat Fisik Kantor / Gudang</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none text-amber-50 text-xs focus:border-amber-400"
                  placeholder="Kawasan Gudang Mas Block B-12, Tangerang"
                />
              </div>

              {/* Performance controls */}
              <div className="col-span-2 bg-black/20 p-3 rounded-2xl space-y-2.5 border border-amber-500/5 mt-1">
                <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-widest block">Parameter Performance Score (0-100)</span>
                
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono select-none">
                  <div className="flex items-center justify-between">
                    <span>Akurasi Pengiriman:</span>
                    <input
                      type="number"
                      value={perfDelivery}
                      onChange={(e) => setPerfDelivery(Number(e.target.value))}
                      className="bg-[#FAF0E6]/5 w-14 p-1 border border-amber-500/10 rounded text-right text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kualitas Produk:</span>
                    <input
                      type="number"
                      value={perfQuality}
                      onChange={(e) => setPerfQuality(Number(e.target.value))}
                      className="bg-[#FAF0E6]/5 w-14 p-1 border border-amber-500/10 rounded text-right text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stabilitas Harga:</span>
                    <input
                      type="number"
                      value={perfStability}
                      onChange={(e) => setPerfStability(Number(e.target.value))}
                      className="bg-[#FAF0E6]/5 w-14 p-1 border border-amber-500/10 rounded text-right text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Response WA:</span>
                    <input
                      type="number"
                      value={perfResponse}
                      onChange={(e) => setPerfResponse(Number(e.target.value))}
                      className="bg-[#FAF0E6]/5 w-14 p-1 border border-amber-500/10 rounded text-right text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-amber-500/15">
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="bg-transparent hover:bg-amber-500/10 border border-amber-500/20 text-amber-100 font-bold text-xs py-2 px-5 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleAddSupplier}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs py-2 px-6 rounded-xl cursor-pointer shadow active:scale-95"
              >
                Simpan Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: PR DETAILED REVIEWS (Multi-Stage Approval viewer) */}
      {selectedPr && (
        <div className="fixed inset-0 bg-black/85 z-[1001] flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-[#160d07] border border-[#D4A853]/40 rounded-3xl p-6 text-amber-50 space-y-6 shadow-[0_15px_45px_rgba(0,0,0,0.95)]">
            <div className="flex justify-between items-start border-b border-amber-500/15 pb-4">
              <div>
                <span className="text-[10px] font-mono text-[#D4A853] uppercase tracking-wider block">Kearsipan Pengadaan Mandatori</span>
                <h4 className="font-serif text-lg font-bold text-amber-100 mt-1">{selectedPr.no}</h4>
              </div>
              <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded">
                {selectedPr.status}
              </span>
            </div>

            <div className="bg-black/10 p-4 border border-amber-500/5 rounded-2xl text-xs space-y-2 font-sans">
              <div className="flex justify-between">
                <span className="text-amber-100/40">Ditujukan ke:</span>
                <span className="font-bold text-amber-100">{selectedPr.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100/40">Diajukan oleh:</span>
                <span className="font-semibold text-amber-100">{selectedPr.by}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100/40">Tanggal Ajuan:</span>
                <span className="font-mono text-amber-100">{selectedPr.date}</span>
              </div>
            </div>

            <div className="space-y-2 border border-amber-500/10 rounded-2xl overflow-hidden text-xs">
              <div className="bg-black/30 p-2 text-[10px] font-mono text-amber-300/60 uppercase">Item yang dipesan:</div>
              <div className="p-3 bg-[#1e0a00]/30 space-y-1.5">
                {selectedPr.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between font-mono">
                    <span className="text-amber-100">{it.name} ({it.qty} {it.unit})</span>
                    <span className="text-amber-350">Rp {it.subtotal.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-amber-500/10 pt-2 flex justify-between font-bold text-sm">
                  <span>Grand Total Estimasi Cost</span>
                  <span className="text-amber-300 font-serif font-bold">Rp {selectedPr.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Approval Roadmap viz */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono text-amber-300 block">Roadmap Persetujuan Sistem (RBAC)</span>
              <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono text-amber-100/30">
                <div className="p-1 bg-[#D4A853]/10 border border-[#D4A853]/30 text-amber-100 rounded">
                  Barista
                  <span className="block mt-0.5 text-emerald-400">✓ Submitted</span>
                </div>
                <div className={`p-1 border rounded ${selectedPr.status.includes("Head Barista") ? "bg-amber-500/15 text-amber-300 border-amber-500 animate-pulse" : (selectedPr.status.includes("Manager") || selectedPr.status.includes("Owner") || selectedPr.status === "Disetujui" ? "bg-emerald-900/10 text-emerald-400 border-emerald-500/30" : "bg-black/20 border-amber-500/5")}`}>
                  Head Barista
                  <span className="block mt-0.5">{selectedPr.status.includes("Head Barista") ? "⏳ Pending" : (selectedPr.status.includes("Manager") || selectedPr.status.includes("Owner") || selectedPr.status === "Disetujui" ? "✓ Recommended" : "—")}</span>
                </div>
                <div className={`p-1 border rounded ${selectedPr.status.includes("Manager") ? "bg-amber-500/15 text-amber-300 border-amber-500 animate-pulse" : (selectedPr.status.includes("Owner") || selectedPr.status === "Disetujui" ? "bg-emerald-900/10 text-emerald-400 border-emerald-500/30" : "bg-black/20 border-amber-500/5")}`}>
                  Manager
                  <span className="block mt-0.5">{selectedPr.status.includes("Manager") ? "⏳ Auditing" : (selectedPr.status.includes("Owner") || selectedPr.status === "Disetujui" ? "✓ Verified" : "—")}</span>
                </div>
                <div className={`p-1 border rounded ${selectedPr.status.includes("Owner") ? "bg-amber-500/15 text-amber-300 border-amber-500 animate-pulse" : (selectedPr.status === "Disetujui" ? "bg-emerald-900/10 text-emerald-400 border-emerald-500/30" : "bg-black/20 border-amber-500/5")}`}>
                  Owner
                  <span className="block mt-0.5">{selectedPr.status.includes("Owner") ? "⏳ Direct Sign" : (selectedPr.status === "Disetujui" ? "✓ Authorized" : "—")}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-amber-500/15">
              <button
                onClick={() => setSelectedPr(null)}
                className="bg-[#FAF0E6]/5 border border-amber-500/20 text-amber-100 font-bold text-xs py-2 px-5 rounded-xl cursor-pointer"
              >
                Tutup
              </button>

              {/* Perform approval inline inside details modal! */}
              {selectedPr.status !== "Disetujui" && selectedPr.status !== "Ditolak" && canApprovePR && (
                <div className="flex flex-wrap gap-2">
                  {role === "Head Barista" && (selectedPr.status === "Menunggu Approval" || selectedPr.status === "Menunggu Approval Head Barista") && (
                    <button
                      onClick={() => handleUpgradePRStatus(selectedPr, "HeadBaristaApprove")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                    >
                      ✓ Rekomendasikan ke Manager
                    </button>
                  )}
                  {role === "Manager" && (selectedPr.status === "Menunggu Approval" || selectedPr.status === "Menunggu Approval Head Barista" || selectedPr.status === "Menunggu Approval Manager") && (
                    <>
                      <button
                        onClick={() => handleUpgradePRStatus(selectedPr, "ManagerApprove")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                      >
                        ✓ Loloskan ke Owner
                      </button>
                      <button
                        onClick={() => handleUpgradePRStatus(selectedPr, "ManagerDirectApprove")}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                      >
                        ⚡ Sahkan Langsung (Dana Darurat)
                      </button>
                    </>
                  )}
                  {role === "Owner" && (
                    <>
                      <button
                        onClick={() => handleUpgradePRStatus(selectedPr, "OwnerApprove")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-5 rounded-xl cursor-pointer"
                      >
                        ✓ Sahkan PO Resmi
                      </button>
                      <button
                        onClick={() => handleUpgradePRStatus(selectedPr, "OwnerApproveDigital")}
                        className="bg-[#D4A853] hover:bg-amber-400 text-amber-950 font-bold text-xs py-2 px-5 rounded-xl cursor-pointer font-sans"
                      >
                        ✍️ TTD Digital & Sahkan Full
                      </button>
                    </>
                  )}
                  {((role === "Head Barista" && (selectedPr.status === "Menunggu Approval" || selectedPr.status === "Menunggu Approval Head Barista")) ||
                    (role === "Manager" && (selectedPr.status === "Menunggu Approval" || selectedPr.status === "Menunggu Approval Head Barista" || selectedPr.status === "Menunggu Approval Manager")) ||
                    (role === "Owner")) && (
                    <button
                      onClick={() => handleUpgradePRStatus(selectedPr, "Reject")}
                      className="bg-red-950 hover:bg-red-900 border border-red-500/20 text-red-400 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                    >
                      Tolak
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
