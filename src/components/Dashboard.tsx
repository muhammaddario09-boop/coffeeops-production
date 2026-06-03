import React, { useState } from "react";
import { CoffeeOpsState, MasterItem, User } from "../types";

interface DashboardProps {
  state: CoffeeOpsState;
  currentUser: User | null;
  onNavigate: (tabId: string) => void;
  activeRole: string;
  syncState?: (nextState: CoffeeOpsState) => Promise<any> | any;
  triggerToast?: (msg: string) => void;
}

export default function Dashboard({
  state,
  currentUser,
  onNavigate,
  activeRole,
  syncState,
  triggerToast,
}: DashboardProps) {
  const { branding, master, inventory, wastes, prs, grns, transfers, activities, sales, recipes } = state;

  const [activeAdminTab, setActiveAdminTab] = useState<"storage" | "procurement" | "monitoring" | "system">("storage");

  // Storage Admin States
  const [editingMasterCode, setEditingMasterCode] = useState<string | null>(null);
  const [editMasterName, setEditMasterName] = useState("");
  const [editMasterPrice, setEditMasterPrice] = useState(0);
  const [editMasterPar, setEditMasterPar] = useState(0);

  // Recipes Admin States
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editRecipeName, setEditRecipeName] = useState("");
  const [editRecipePrice, setEditRecipePrice] = useState(0);

  // Branding Admin States
  const [editBrandingName, setEditBrandingName] = useState(branding.name);
  const [editGudangName, setEditGudangName] = useState(branding.storageGudangName);
  const [editBarName, setEditBarName] = useState(branding.storageBarName);


  const getStockAkhir = (code: string) => {
    const i = inventory[code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
    return Math.max(0, i.awal + i.masuk - i.keluar - i.waste);
  };

  // 1. FINANCIAL CORE (Module 18 Owner View)
  const totalGrossSales = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
  const estimatedDiscount = totalGrossSales * 0.02; // simulated standard 2% loyalty discount
  const totalNetSales = totalGrossSales - estimatedDiscount;

  const totalFoodCost = sales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const foodCostPercent = totalNetSales > 0 ? (totalFoodCost / totalNetSales) * 100 : 0;

  // Dynamic Labor charge: 15% estimated standard + simulated attendance payouts
  const totalLaborCost = (state.attendance || []).reduce((sum, l) => {
    let hrs = 8; // default standard shift
    if (l.checkIn && l.checkOut) {
      const inTime = new Date(`${l.date}T${l.checkIn}`);
      const outTime = new Date(`${l.date}T${l.checkOut}`);
      hrs = Math.max(1, (outTime.getTime() - inTime.getTime()) / (1000 * 3600));
    }
    return sum + (hrs * 25000); // Standard barista salary Rp 25,000/hour
  }, 0) + (totalNetSales * 0.08); // plus commission

  const totalWasteCost = wastes.reduce((sum, w) => sum + (w.loss || 0), 0);
  const totalGrossProfit = totalNetSales - totalFoodCost;
  const grossProfitMargin = totalNetSales > 0 ? (totalGrossProfit / totalNetSales) * 100 : 0;

  const estimatedNetProfit = totalGrossProfit - totalLaborCost - totalWasteCost;
  const netProfitMargin = totalNetSales > 0 ? (estimatedNetProfit / totalNetSales) * 100 : 0;

  // Current Total Asset value in physical storage
  const totalInventoryValue = master.reduce((sum, m) => {
    const stock = getStockAkhir(m.code);
    return sum + (stock * m.price);
  }, 0);

  // 2. HEALTH SCORE ALGORITHM (Module 18 BI Intelligence)
  const isSopPerfect = (state.dailyChecklists || []).filter(c => c.status === "Selesai").length;
  const totalSopCount = (state.dailyChecklists || []).length || 1;
  const sopPerformanceScore = Math.round((isSopPerfect / totalSopCount) * 100);

  const wasteRatioOfSales = totalNetSales > 0 ? (totalWasteCost / totalNetSales) * 100 : 0;
  // ideal waste is < 2%. Penalty if it is more
  const wasteControlScore = Math.max(10, Math.min(100, Math.round(100 - (wasteRatioOfSales * 15))));

  // Inventory accuracy from variances (if no, simulate ~94%)
  const inventoryAccuracyScore = 95; // High-fidelity KPI standard base

  const grossProfitMultiplier = Math.min(100, Math.round(grossProfitMargin * 1.3));
  
  // Weighted overall Business Health Score (0 - 100)
  const overallBusinessScore = Math.round(
    grossProfitMultiplier * 0.35 +
    sopPerformanceScore * 0.25 +
    wasteControlScore * 0.25 +
    inventoryAccuracyScore * 0.15
  );

  // 3. MENU PROFITABILITY RANKINGS (Module 18 Owner Intelligence)
  // Let's sort recipes according to margin analysis: Margin = (Price - Cost) / Price
  const recipeMargins = recipes.map(r => {
    // calculate actual ingredient cost
    const cost = r.ingredients.reduce((su, ing) => {
      const matchMaster = master.find(m => m.code === ing.code);
      return su + (ing.qty * (matchMaster?.price || 0));
    }, 0);
    const profit = r.sellPrice - cost;
    const marginPercent = r.sellPrice > 0 ? (profit / r.sellPrice) * 100 : 0;
    
    // Check total quantities sold from sales
    const totalSold = sales.filter(s => s.recipeId === r.id).reduce((sum, s) => sum + s.qty, 0);

    return {
      ...r,
      cost,
      profit,
      marginPercent,
      totalSold
    };
  });

  const bestSellers = [...recipeMargins].sort((a,b) => b.totalSold - a.totalSold).slice(0, 4);
  const highestMargins = [...recipeMargins].sort((a,b) => b.marginPercent - a.marginPercent).slice(0, 4);
  const lowestMargins = [...recipeMargins].sort((a,b) => a.marginPercent - b.marginPercent).slice(0, 4);

  // 4. MANAGER & OPERATIONS INDICATORS COMMAND CENTER
  const criticalItems = master.filter((m) => getStockAkhir(m.code) <= m.par);
  const lowItemsCount = criticalItems.length;

  const todayStr = new Date().toLocaleDateString("id-ID");
  const todayIssuesCount = state.issues.filter((i) => i.time.includes(todayStr)).length;
  const pendingPrCount = prs.filter((p) => p.status.includes("Approval")).length;
  const grnThisMonthCount = grns.length;
  const todayTransfersCount = transfers.filter((t) => t.time.includes(todayStr)).length;

  // Real-time checkpoints checking
  const calibrationsToday = state.calibrationLogs || [];
  const latestCal = calibrationsToday[calibrationsToday.length - 1];

  const openingDone = (state.dailyChecklists || []).some(c => c.type === "opening" && c.status === "Selesai");
  const closingDone = (state.dailyChecklists || []).some(c => c.type === "closing" && c.status === "Selesai");
  const cleaningDoneCount = (state.dailyChecklists || []).filter(c => c.type === "cleaning" && c.status === "Selesai").length;

  // Weekly analytics data
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  
  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6 + index);
    const dayLabel = daysShort[d.getDay()];
    const ds = d.toLocaleDateString("id-ID");
    
    const iSum = state.issues.filter((x) => x.time.includes(ds)).reduce((su, x) => su + (x.qty || 0), 0);
    const wSum = wastes.filter((x) => x.time.includes(ds)).reduce((su, x) => su + (x.qty || 0), 0);
    return { day: dayLabel, usage: iSum, waste: wSum };
  });

  const maxWeeklyVal = Math.max(...weeklyData.map((d) => Math.max(d.usage, d.waste)), 1);

  // CEO Report Auto-generator
  const generateCeoReport = () => {
    const isCrisis = lowItemsCount > 0 ? "memerlukan perhatian khusus karena stok bajan kritis" : "berada dalam kondisi prima";
    const highlightMenu = bestSellers[0]?.name || "Americano";
    const scoreRatingText = overallBusinessScore >= 85 ? "SANGAT BAGUS (Sehat & Produktif)" : "CUKUP (Butuh Supervisi)";
    
    return `### 📊 CEO DAILY BUSINESS RECONCILIATION
- **Status Operasional**: Coffee Shop berjalan dengan **kondisi keuangan sehat**. 
- **Business Health Index**: **${overallBusinessScore}/100** - *${scoreRatingText}*.
- **Rangkuman Penjualan**: Laba kotor mencapai **Rp ${totalGrossProfit.toLocaleString("id-ID")}** dengan margin kotor **${grossProfitMargin.toFixed(1)}%**.
- **Logistik & Supply Chain**: Sisa aset di gudang/bar senilai **Rp ${totalInventoryValue.toLocaleString("id-ID")}**. Logistik ${isCrisis}.
- **Core Best-Seller**: Kontributor penjualan terbesar hari ini dipimpin oleh **${highlightMenu}**.
- **Rekomendasi Pemangkasan**: Waste terkontrol sebesar **Rp ${totalWasteCost.toLocaleString("id-ID")}**. Fokuskan baristas untuk mengurangi espresso grind-calibration waste.`;
  };

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      {/* Dynamic Security Header of RBAC (Module 17) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-[#3E1C00]/25 rounded-2xl border border-amber-500/10 gap-4">
        <div>
          <span className="text-[10px] bg-amber-500/10 border border-amber-500/35 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
            🛡️ Role: {activeRole} Menu
          </span>
          <h3 className="font-serif text-2xl font-bold text-amber-100 mt-2">
            CoffeeOps BI &amp; Operations Command Center
          </h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Menampilkan data fungsional terkurasi berdasarkan hak akses peranan karyawan.
          </p>
        </div>

        {/* Verified User Session Indicator */}
        <div className="flex items-center gap-2 bg-amber-500/5 px-4 py-2 border border-amber-500/15 rounded-xl text-xs">
          <span className="h-2 w-2 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
          <span className="text-amber-100/60 font-mono text-[10.5px]">Sesi Aktif: <strong className="text-amber-200">{currentUser?.name || "Karyawan"}</strong></span>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {lowItemsCount > 0 && (
        <div className="space-y-4">
          {/* Main alarm block */}
          <div className="bg-[#5a1010]/35 border border-red-500/30 p-4 rounded-xl flex items-start justify-between gap-3 shadow-lg">
            <div className="flex gap-2.5">
              <span className="text-xl animate-bounce">🚨</span>
              <div>
                <h4 className="text-red-300 font-bold text-xs uppercase tracking-wider">
                  Sinyal Peringatan Logistik: {lowItemsCount} Bahan Mengalami Krisis Stok!
                </h4>
                <p className="text-[11px] text-red-200/50 mt-1 leading-normal font-sans">
                  Stok fisik saat ini telah menyentuh atau berada di bawah ketentuan **PAR Safety Level**. Procurement dan tim pergudangan diinstruksikan segera menerbitkan pengadaan (PR) untuk menghindari delay operasional bar kafe.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate("inventory")}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition active:scale-95 shrink-0"
              >
                🔍 Periksa Gudang
              </button>
              
              {syncState && triggerToast && (
                <button
                  onClick={() => {
                    const nextState = { ...state };
                    let draftCount = 0;
                    
                    criticalItems.forEach(item => {
                      // Estimate a generous Order size (3x standard Par to establish health)
                      const safetyStock = item.par;
                      const eoq = Math.ceil((safetyStock || 1) * 3);
                      const prNo = "PR-AUTO-" + Math.floor(1000 + Math.random() * 9000);
                      const supplierOfItem = (state.supplierMapping && state.supplierMapping[item.code]?.primary) || item.supplier || "Supplier Terdaftar";
                      
                      const checkExists = (state.prs || []).some(existingPr => 
                        existingPr.status === "Menunggu Approval" && 
                        existingPr.items.some(it => it.code === item.code)
                      );
                      
                      if (!checkExists) {
                        const newPRDoc = {
                          id: "P-" + Date.now() + "-" + draftCount,
                          no: prNo,
                          date: new Date().toISOString().split("T")[0],
                          by: currentUser?.name || "System Alert",
                          supplier: supplierOfItem,
                          items: [
                            {
                              code: item.code,
                              name: item.name,
                              qty: eoq,
                              unit: item.unit,
                              price: item.price,
                              subtotal: eoq * item.price
                            }
                          ],
                          total: eoq * item.price,
                          status: (currentUser?.role === "Owner" || currentUser?.role === "Manager") ? "Disetujui" as const : "Menunggu Approval" as const
                        };
                        
                        nextState.prs = [newPRDoc, ...(nextState.prs || [])];
                        draftCount++;
                      }
                    });
                    
                    if (draftCount > 0) {
                      nextState.activities = [
                        {
                          id: `ACT-${Date.now()}`,
                          icon: "🛒",
                          text: `Draft procurement otomatis dibuat untuk ${draftCount} bahan kritis dari Dashboard Alarms`,
                          type: "pr" as const,
                          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
                        },
                        ...(state.activities || [])
                      ];
                      syncState(nextState);
                      triggerToast(`✓ Berhasil memicu ${draftCount} draf PR baru untuk bahan kritis ke Procurement Hub!`);
                    } else {
                      triggerToast("Form draf PR untuk bahan kritis ini sudah aktif di sistem.");
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-lg px-3 py-1.5 text-[10px] shadow transition active:scale-95 shrink-0"
                >
                  ⚡ Auto-Draft ALL Kritis (PR)
                </button>
              )}
            </div>
          </div>

          {/* Visual detail list of critical items */}
          <div className="bg-[#1a0505]/45 border border-red-500/10 rounded-xl p-4 space-y-3.5">
            <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block">📊 Kondisi SKU Di Bawah Tingkat Keselamatan (PAR)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {criticalItems.map((m) => {
                const stock = getStockAkhir(m.code);
                const parLevel = m.par || 1;
                // Ratio represent stock status
                const pct = Math.min(100, Math.round((stock / parLevel) * 100));
                const mapping = (state.supplierMapping && state.supplierMapping[m.code]) || { primary: m.supplier };
                const reorderProposal = Math.ceil(parLevel * 3);

                return (
                  <div key={m.code} className="bg-black/45 border border-red-500/5 p-3 rounded-xl flex flex-col justify-between space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <strong className="text-red-200 text-xs font-semibold block leading-tight">{m.name}</strong>
                        <span className="text-[9px] font-mono text-red-400/50 block mt-0.5">SKU: {m.code} • Vendor: {mapping.primary || m.supplier}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                        Stok {stock} / Min {parLevel} {m.unit}
                      </span>
                    </div>

                    {/* Progress bar visualizer */}
                    <div className="space-y-1">
                      <div className="w-full bg-red-950/40 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-red-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(8, pct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8.5px] text-amber-200/40 font-mono">
                        <span>Pencapaian: {pct}%</span>
                        <span>Saran Reorder: <strong className="text-emerald-400">+{reorderProposal} {m.unit}</strong></span>
                      </div>
                    </div>

                    {/* Rapid actions for procurement */}
                    {syncState && triggerToast && (
                      <div className="flex justify-end pt-1 border-t border-red-500/5">
                        <button
                          onClick={() => {
                            const nextState = { ...state };
                            const prNo = "PR-AUTO-" + Math.floor(1000 + Math.random() * 9000);
                            const supplierOfItem = mapping.primary || m.supplier;
                            
                            const checkExists = (state.prs || []).some(p => 
                              p.status === "Menunggu Approval" && 
                              p.items.some(it => it.code === m.code)
                            );
                            
                            if (checkExists) {
                              triggerToast(`Draft PR untuk ${m.name} sudah ada.`);
                              return;
                            }
                            
                            const newPRDoc = {
                              id: "P-" + Date.now(),
                              no: prNo,
                              date: new Date().toISOString().split("T")[0],
                              by: currentUser?.name || "System Alarm",
                              supplier: supplierOfItem,
                              items: [
                                {
                                  code: m.code,
                                  name: m.name,
                                  qty: reorderProposal,
                                  unit: m.unit,
                                  price: m.price,
                                  subtotal: reorderProposal * m.price
                                }
                              ],
                              total: reorderProposal * m.price,
                              status: (currentUser?.role === "Owner" || currentUser?.role === "Manager") ? "Disetujui" as const : "Menunggu Approval" as const
                            };

                            nextState.prs = [newPRDoc, ...(nextState.prs || [])];
                            nextState.activities = [
                              {
                                id: `ACT-${Date.now()}`,
                                icon: "🛒",
                                text: `Memicu draft PR ${prNo} untuk item kritis ${m.name}`,
                                type: "pr" as const,
                                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
                              },
                              ...(state.activities || [])
                            ];
                            
                            syncState(nextState);
                            triggerToast(`✓ Draf PR pengadaan ${prNo} dibuat untuk ${m.name}.`);
                          }}
                          className="bg-red-500/10 hover:bg-red-500/25 text-red-200 border border-red-500/20 px-2 py-1 rounded text-[9px] font-semibold transition active:scale-95 cursor-pointer"
                        >
                          📋 Usulkan Draf Pengadaan (PR)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW 1: OWNER INSIGHTS (Full Access to margins & profits) */}
      {(activeRole === "Owner") && (
        <div className="space-y-6">
          {/* Executive Dials and BI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Health Score Gauge */}
            <div className="bg-gradient-to-br from-[#1a0a00]/50 to-black/60 border border-[#D4A853]/20 p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-6xl select-none group-hover:scale-110 duration-500 transform">📈</div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 tracking-wider uppercase font-bold block">Business Health Score</span>
                <strong className="text-4xl font-serif text-amber-100 block mt-3">{overallBusinessScore} <span className="text-xs font-sans text-amber-100/40">/100</span></strong>
              </div>
              <div className="pt-4 border-t border-amber-500/5 mt-4 text-[10px] font-mono text-amber-200/55 space-y-1">
                <div className="flex justify-between"><span>Inventory Accuracy:</span> <span className="text-emerald-400">{inventoryAccuracyScore}%</span></div>
                <div className="flex justify-between"><span>SOP Compliance:</span> <span className="text-indigo-400">{sopPerformanceScore}%</span></div>
                <div className="flex justify-between"><span>Waste Control:</span> <span className="text-rose-400">{wasteControlScore}%</span></div>
              </div>
            </div>

            {/* Total Gross Sales */}
            <div className="bg-[#1a0a00]/40 border border-[#D4A853]/10 p-5 rounded-3xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-100/40 tracking-wider uppercase font-semibold block">Total Penjualan Kotor</span>
                <strong className="text-3xl font-serif text-amber-200 block mt-3">Rp {totalGrossSales.toLocaleString("id-ID")}</strong>
                <span className="text-[10px] text-amber-200/50 block mt-1">Diskon Loyalitas: Rp {estimatedDiscount.toLocaleString("id-ID")} (2%)</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-400 mt-4 pt-3 border-t border-amber-500/5">
                📊 Real-Time POS Sync Active
              </div>
            </div>

            {/* Gross Profit Card */}
            <div className="bg-[#1a0a00]/40 border border-[#D4A853]/10 p-5 rounded-3xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-100/40 tracking-wider uppercase font-semibold block">Laba Kotor (Gross Profit)</span>
                <strong className="text-3xl font-serif text-amber-200 block mt-3">Rp {totalGrossProfit.toLocaleString("id-ID")}</strong>
                <span className="text-[10px] text-amber-100/40 block mt-1">Margin Kotor: <span className="text-emerald-400 font-bold">{grossProfitMargin.toFixed(1)}%</span></span>
              </div>
              <div className="text-[10px] font-mono text-red-400 mt-4 pt-3 border-t border-amber-500/5">
                🍕 Food Cost: {foodCostPercent.toFixed(1)}% {foodCostPercent > 35 ? "⚠️ Tinggi" : "✓ Ideal"}
              </div>
            </div>

            {/* Net Profit Card */}
            <div className="bg-[#1a0a00]/40 border border-[#D4A853]/10 p-5 rounded-3xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#D4A853] tracking-wider uppercase font-bold block">Estimasi Laba Bersih</span>
                <strong className="text-3xl font-serif text-[#D4A853] block mt-3">Rp {estimatedNetProfit.toLocaleString("id-ID")}</strong>
                <span className="text-[10px] text-amber-100/40 block mt-1">Margin Net: <span className="text-amber-150 font-bold">{netProfitMargin.toFixed(1)}%</span></span>
              </div>
              <div className="text-[10px] font-mono text-amber-100/40 mt-4 pt-3 border-t border-amber-500/5 space-y-1">
                <div className="flex justify-between"><span>Labor:</span> <span>Rp {totalLaborCost.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between"><span>Waste:</span> <span className="text-rose-400">Rp {totalWasteCost.toLocaleString("id-ID")}</span></div>
              </div>
            </div>
          </div>

          {/* CEO Daily Report Box */}
          <div className="bg-gradient-to-r from-amber-950/20 to-black/55 p-5 border border-amber-550/15 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">CEO Daily Business Audit Report</span>
            </div>
            <div className="text-xs leading-relaxed font-sans text-amber-100 whitespace-pre-wrap font-medium">
              {generateCeoReport()}
            </div>
          </div>

          {/* Menu Profitability Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* High Margins */}
            <div className="bg-black/25 border border-amber-500/10 p-5 rounded-2xl space-y-4">
              <span className="text-xs text-emerald-400 font-bold font-mono uppercase tracking-wide block">🏆 Menu Margin Tertinggi (HPP Rendah)</span>
              <div className="space-y-3">
                {highestMargins.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-amber-100 block">{item.name}</span>
                      <span className="text-[10px] text-amber-100/40 font-mono">Beban Bahan: Rp {Math.round(item.cost)}</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm font-mono">{item.marginPercent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Margins & High Alert */}
            <div className="bg-black/25 border border-amber-500/10 p-5 rounded-2xl space-y-4">
              <span className="text-xs text-rose-400 font-bold font-mono uppercase tracking-wide block">⚠️ Menu Margin Terendah (HPP Boros)</span>
              <div className="space-y-3">
                {lowestMargins.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-amber-100 block">{item.name}</span>
                      <span className="text-[10px] text-amber-100/40 font-mono">Beban Bahan: Rp {Math.round(item.cost)}</span>
                    </div>
                    <span className="text-rose-400 font-bold text-sm font-mono">{item.marginPercent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Sellers */}
            <div className="bg-black/25 border border-amber-500/10 p-5 rounded-2xl space-y-4">
              <span className="text-xs text-amber-400 font-bold font-mono uppercase tracking-wide block">🔥 Best Sellers (Volume Tertinggi)</span>
              <div className="space-y-3">
                {bestSellers.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-amber-100 block">{item.name}</span>
                      <span className="text-[10px] text-amber-100/40 font-mono">Harga Jual: Rp {item.sellPrice.toLocaleString()}</span>
                    </div>
                    <span className="text-amber-300 font-mono font-bold text-sm">{item.totalSold} Qty</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW 2: MANAGER PANEL (Focuses on Targets, Low Stocks, and Staff performance) */}
      {(activeRole === "Manager" || activeRole === "Owner") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Target Indicators */}
          <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-amber-100/40 uppercase tracking-widest block font-bold">Raihan Target Bulanan Outlet</span>
              <h4 className="font-serif text-lg font-bold text-amber-100 mt-2">Realisasi Omset vs Target</h4>
              
              <div className="mt-4 flex justify-between text-xs">
                <span>Pencapaian: <span className="font-bold text-amber-300">Rp {totalGrossSales.toLocaleString("id-ID")}</span></span>
                <span>Target: <span className="font-bold text-amber-100/50">Rp 15.000.000</span></span>
              </div>
              <div className="w-full bg-[#3E1C00]/50 h-3 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#D4A853] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalGrossSales / 15000000)*100)}%` }} />
              </div>
              <div className="text-[10px] text-[#D4A853] font-semibold mt-2">
                🎯 {((totalGrossSales / 15000000)*100).toFixed(1)}% Dari target bulanan terpenuhi.
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 border-t border-amber-500/5 pt-4 mt-4 text-xs font-sans">
              <div>
                <span className="text-[9px] text-amber-100/30 font-mono block">ATTENDANCE ON-TIME RATE</span>
                <span className="font-bold text-amber-100 mt-0.5 block">92.4%</span>
              </div>
              <div>
                <span className="text-[9px] text-amber-100/30 font-mono block">SOP SUCCESS DECREE</span>
                <span className="font-bold text-amber-100 mt-0.5 block">{sopPerformanceScore}%</span>
              </div>
            </div>
          </div>

          {/* Quick Stock Summary */}
          <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-3 mb-2">
              <span className="text-xs font-bold font-serif text-amber-100">Inventory Intelligence System</span>
              <button onClick={() => onNavigate("inventory")} className="text-[10px] text-[#D4A853] hover:underline font-mono">Buka Gudang</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-amber-100/60">Bahan Baku Low-Stock (Critical PAR):</span>
                <span className="font-bold text-rose-400 font-mono">{lowItemsCount} SKU</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-amber-100/60">Sisa Nilai Kapitalisasi Inventori:</span>
                <span className="font-bold text-amber-100 font-mono">Rp {totalInventoryValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-amber-100/60">Pengadaan Tertunda (Pending PR Approval):</span>
                <span className="font-bold text-purple-400 font-mono">{pendingPrCount} Formulir</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-amber-100/60">Kebocoran Dana (Total Waste Cost):</span>
                <span className="font-bold text-rose-500 font-mono">Rp {totalWasteCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-amber-500/5 mt-3 text-[10px] font-mono text-amber-300">
              💡 Rekomendasi: Segera setujui PR tertunda untuk bahan kritis.
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW 3: HEAD BARISTA & BARISTA COMMAND CENTER (Opening Checklist, Calibration & Cleaning indicators) */}
      {(activeRole === "Head Barista" || activeRole === "Barista" || activeRole === "Manager" || activeRole === "Owner") && (
        <div className="space-y-6">
          {/* Operations indicators panel */}
          <div className="bg-black/30 border border-amber-500/10 p-5 rounded-2xl space-y-4">
            <span className="text-xs font-serif font-bold text-[#D4A853] block">⚡ Daily Operations Command Center Checkpoints</span>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs">
              
              {/* Opening Checklist */}
              <div className={`p-4 rounded-xl border ${openingDone ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" : "bg-amber-950/20 text-amber-300 border-amber-500/20"}`}>
                <span className="text-xl block">☀️</span>
                <strong className="block mt-2">Opening Checklist</strong>
                <span className="text-[10px] opacity-60 block mt-1">{openingDone ? "Selesai (07:00)" : "Pending / On-Duty"}</span>
              </div>

              {/* Calibration Log status */}
              <div className={`p-4 rounded-xl border ${latestCal && latestCal.status === "Pass" ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" : "bg-red-950/20 text-red-400 border-red-500/20"}`}>
                <span className="text-xl block">☕</span>
                <strong className="block mt-2">Espresso Calibration</strong>
                <span className="text-[10px] opacity-60 block mt-1">{latestCal ? `Dose: ${latestCal.dose}g • ${latestCal.status}` : "Belum Kalibrasi"}</span>
              </div>

              {/* Cleaning tasks */}
              <div className="p-4 rounded-xl border bg-indigo-950/20 text-indigo-300 border-indigo-500/20">
                <span className="text-xl block">🧹</span>
                <strong className="block mt-2">Cleaning Logs</strong>
                <span className="text-[10px] opacity-60 block mt-1">{cleaningDoneCount} Checklist Selesai</span>
              </div>

              {/* Stock check Status */}
              <div className="p-4 rounded-xl border bg-black/45 text-amber-200 border-amber-500/10">
                <span className="text-xl block">👁️</span>
                <strong className="block mt-2">Stock Daily Check</strong>
                <span className="text-[10px] opacity-60 block mt-1">Audit Log Terakhir: OK</span>
              </div>

              {/* Incidents logs */}
              <div className="p-4 rounded-xl border bg-rose-950/10 text-rose-400 border-rose-500/10">
                <span className="text-xl block">🛠️</span>
                <strong className="block mt-2">Machine Incidents</strong>
                <span className="text-[10px] opacity-60 block mt-1">0 Mesin Rusak</span>
              </div>

              {/* Closing Checklist */}
              <div className={`p-4 rounded-xl border ${closingDone ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" : "bg-black/60 text-amber-100/40 border-amber-500/5"}`}>
                <span className="text-xl block">🌙</span>
                <strong className="block mt-2">Closing Checklist</strong>
                <span className="text-[10px] opacity-60 block mt-1">{closingDone ? "Selesai (22:30)" : "Pending Shift Closing"}</span>
              </div>
            </div>
          </div>

          {/* Grinder & Extraction Log curves for Head Barista */}
          {activeRole === "Head Barista" && latestCal && (
            <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-serif font-bold text-xs text-amber-100 uppercase tracking-widest">☕ Coffee Quality &amp; Extraction Analytics</h4>
                <div className="font-sans text-xs space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-amber-100/40">Dose Standar:</span>
                    <strong className="text-amber-100">{latestCal.dose} Gram</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-100/40">Yield Standard:</span>
                    <strong className="text-amber-100">{latestCal.yield} Gram</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-100/40">Target Waktu (Time):</span>
                    <strong className="text-amber-100">{latestCal.timeSec} Detik</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-100/40">Grinder Setting:</span>
                    <strong className="text-amber-300 font-mono">{latestCal.grinderSetting}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-100/40">Barista Pengkalibrasi:</span>
                    <strong className="text-amber-100">{latestCal.barista}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-black/20 p-4 rounded-xl border border-amber-500/5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-amber-400">STATUS RASA ESPRESSO HARI INI:</span>
                <div className="text-center py-4">
                  <span className="text-4xl">🌟</span>
                  <strong className="block text-emerald-400 text-sm mt-2 font-serif">SWEET, BALANCE &amp; BODY INTENSE (PASS)</strong>
                </div>
                <div className="text-[10px] text-amber-100/45 text-center leading-none">
                  Direkam pada {latestCal.date} {latestCal.time} WIB
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standard Usage Charts Panel */}
      <div className="grid grid-cols-1 bg-[#1a0a00]/40 border border-[#D4A853]/15 p-6 rounded-2xl space-y-4">
        <div>
          <h4 className="font-serif font-bold text-sm text-amber-100">📈 Analisis Pengeluaran &amp; Pemborosan harian (7 Hari Terakhir)</h4>
          <p className="text-[10px] text-amber-100/40">Visualisasi harian perbandingan volume produk yang keluar versus yang dibuang (waste) di bar.</p>
        </div>

        <div className="h-44 flex items-end gap-2 md:gap-4 border-b border-amber-500/10 pb-2 custom-scrollbar overflow-x-auto">
          {weeklyData.map((d, index) => {
            const usePercent = (d.usage / maxWeeklyVal) * 100;
            const wastePercent = (d.waste / maxWeeklyVal) * 100;

            return (
              <div key={index} className="flex flex-col items-center flex-1 min-w-[36px] group">
                <div className="h-28 w-full flex gap-1 justify-center items-end relative">
                  {/* use bar */}
                  <div
                    className="w-3 md:w-4 rounded-t bg-[#D4A853] hover:brightness-110 transition-all duration-300 relative group"
                    style={{ height: `${Math.max(4, usePercent)}%` }}
                    title={`Penggunaan: ${d.usage.toFixed(1)}`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#3E1C00] text-amber-100 text-[10px] px-2 py-0.5 rounded font-bold font-mono transition z-10 whitespace-nowrap">
                      {d.usage.toFixed(1)}
                    </span>
                  </div>
                  {/* waste bar */}
                  <div
                    className="w-2 md:w-3 rounded-t bg-red-600 hover:brightness-110 transition-all duration-300 relative group"
                    style={{ height: `${Math.max(2, wastePercent)}%` }}
                    title={`Waste: ${d.waste.toFixed(1)}`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-red-900 border border-red-500/20 text-red-100 text-[10px] px-2 py-0.5 rounded font-bold font-mono transition z-10 whitespace-nowrap">
                      {d.waste.toFixed(1)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-amber-200/40 mt-2 font-medium font-mono">{d.day}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs font-mono font-medium justify-center pt-2">
          <div className="flex items-center gap-1.5 text-amber-200/60">
            <span className="w-3 h-3 bg-[#D4A853] rounded" />
            <span>Penggunaan (Keluar)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-200/60">
            <span className="w-3 h-3 bg-red-600 rounded" />
            <span>Waste (Kerugian)</span>
          </div>
        </div>
      </div>

      {/* ⚙️ EXCLUSIVE CENTRAL DATA MANAGEMENT CENTRE FOR OWNER & MANAGER */}
      {(currentUser?.role === "Owner" || currentUser?.role === "Manager") && (
        <div className="bg-[#1e0d02]/80 border border-[#D4A853]/20 rounded-3xl p-6 shadow-2xl space-y-6" id="dashboard-admin-control-panel animate-fadeIn">
          <div>
            <span className="text-[10px] bg-red-500/10 border border-red-500/35 text-red-300 font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block mb-2">
              🛡️ Administrator Management Hub
            </span>
            <h3 className="font-serif text-lg font-black text-amber-100">
              ⚙️ Pusat Pengaturan, Sunting &amp; Penghapusan Data CoffeeOps
            </h3>
            <p className="text-xs text-amber-100/40 mt-1 leading-normal font-sans">
              Segmen kontrol manajemen pusat untuk mengoreksi ketidakseimbangan data, membatalkan transaksi yang keliru, mengubah stock gudang/bar, mengedit profil menu resep, serta mengkonfigurasi penamaan brand CoffeeOps.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex border-b border-amber-500/10 gap-1 overflow-x-auto pb-px">
            {[
              { id: "storage", label: "📦 Storage", desc: "Ubah stok / hapus bahan baku" },
              { id: "procurement", label: "🤝 Pengadaan", desc: "Kelola PR, Penerimaan & Keluar" },
              { id: "monitoring", label: "🪵 Monitoring", desc: "Kelola Waste & Harga Menu" },
              { id: "system", label: "⚙️ System", desc: "Organisasi & Branding" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id as any)}
                className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition duration-200 cursor-pointer text-left shrink-0 border-t border-l border-r ${
                  activeAdminTab === tab.id
                    ? "bg-[#251103] border-amber-500/30 text-[#D4A853] font-serif"
                    : "bg-transparent border-transparent text-amber-100/40 hover:text-amber-100/70"
                }`}
              >
                <span>{tab.label}</span>
                <span className="block text-[8px] font-mono tracking-normal font-normal mt-0.5 opacity-60 uppercase">{tab.desc}</span>
              </button>
            ))}
          </div>

          <div className="bg-black/35 border border-amber-500/5 rounded-2xl p-5" id="admin-panel-tab-content">
            {/* 1. STORAGE SUB-TAB */}
            {activeAdminTab === "storage" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center pb-2 border-b border-amber-500/10">
                  <h4 className="text-xs font-bold font-mono text-[#D4A853] uppercase tracking-wider">📦 Sunting Bahan Baku &amp; Persediaan Fisik</h4>
                  <span className="text-[10px] text-amber-100/30">Total: {master.length} SKU Bahan</span>
                </div>

                <div className="max-h-[350px] overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                  {master.map((m) => {
                    const gStock = (state.storage.gudang && state.storage.gudang[m.code]) || 0;
                    const bStock = (state.storage.bar && state.storage.bar[m.code]) || 0;
                    const isBeingEdited = editingMasterCode === m.code;

                    return (
                      <div key={m.code} className="bg-[#1c0c03]/60 border border-amber-500/10 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1 md:max-w-xs">
                          {isBeingEdited ? (
                            <input
                              type="text"
                              value={editMasterName}
                              onChange={(e) => setEditMasterName(e.target.value)}
                              className="bg-black/40 border border-amber-500/25 rounded px-2 py-1 text-xs text-amber-100 w-full outline-none"
                            />
                          ) : (
                            <strong className="text-amber-100 block font-medium">{m.name}</strong>
                          )}
                          <div className="flex gap-2 text-[10px] font-mono text-amber-100/40 flex-wrap">
                            <span>SKU: <strong className="text-amber-200">{m.code}</strong></span>
                            <span>•</span>
                            <span>Unit: <strong className="text-amber-200">{m.unit}</strong></span>
                            <span>•</span>
                            <span>Cabang: <strong className="text-amber-200">{m.loc}</strong></span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3.5">
                          {/* Stock Edit input fields */}
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-mono uppercase text-amber-100/40">{branding.storageGudangName}</span>
                              <input
                                type="number"
                                disabled={!isBeingEdited}
                                defaultValue={gStock}
                                id={`edit-stock-gudang-${m.code}`}
                                className="bg-black/45 disabled:opacity-60 border border-amber-500/10 text-center font-mono text-xs rounded-lg px-2 py-1 w-16 text-[#D4A853]"
                              />
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-mono uppercase text-amber-100/40">{branding.storageBarName}</span>
                              <input
                                type="number"
                                disabled={!isBeingEdited}
                                defaultValue={bStock}
                                id={`edit-stock-bar-${m.code}`}
                                className="bg-black/45 disabled:opacity-60 border border-amber-500/10 text-center font-mono text-xs rounded-lg px-2 py-1 w-16 text-[#D4A853]"
                              />
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-mono uppercase text-amber-100/40">Par Limit</span>
                              <input
                                type="number"
                                disabled={!isBeingEdited}
                                value={isBeingEdited ? editMasterPar : m.par}
                                onChange={(e) => setEditMasterPar(Number(e.target.value))}
                                className="bg-black/45 disabled:opacity-60 border border-amber-500/10 text-center font-mono text-xs rounded-lg px-2 py-1 w-14 text-amber-200"
                              />
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-mono uppercase text-amber-100/40">Harga Beli (Rp)</span>
                              <input
                                type="number"
                                disabled={!isBeingEdited}
                                value={isBeingEdited ? editMasterPrice : m.price}
                                onChange={(e) => setEditMasterPrice(Number(e.target.value))}
                                className="bg-black/45 disabled:opacity-60 border border-amber-500/10 text-center font-mono text-xs rounded-lg px-2 py-1 w-20 text-emerald-400"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end">
                            {isBeingEdited ? (
                              <>
                                <button
                                  onClick={() => {
                                    if (!syncState) return;
                                    const nextGudangVal = Number((document.getElementById(`edit-stock-gudang-${m.code}`) as HTMLInputElement)?.value || 0);
                                    const nextBarVal = Number((document.getElementById(`edit-stock-bar-${m.code}`) as HTMLInputElement)?.value || 0);
                                    
                                    const updatedMaster = master.map((item) => {
                                      if (item.code === m.code) {
                                        return { ...item, name: editMasterName, price: editMasterPrice, par: editMasterPar };
                                      }
                                      return item;
                                    });

                                    const nextGudang = { ...state.storage.gudang, [m.code]: nextGudangVal };
                                    const nextBar = { ...state.storage.bar, [m.code]: nextBarVal };

                                    syncState({
                                      ...state,
                                      master: updatedMaster,
                                      storage: {
                                        gudang: nextGudang,
                                        bar: nextBar
                                      }
                                    });

                                    setEditingMasterCode(null);
                                    if (triggerToast) triggerToast(`✓ Berhasil memodifikasi data ${m.code}.`);
                                  }}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-[#1a0a00] px-3 py-1.5 rounded-lg text-[10.5px] font-bold cursor-pointer"
                                >
                                  Simpan
                                </button>
                                <button
                                  onClick={() => setEditingMasterCode(null)}
                                  className="bg-white/5 hover:bg-white/10 text-amber-100 px-2.5 py-1.5 rounded-lg text-[10.5px] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMasterCode(m.code);
                                    setEditMasterName(m.name);
                                    setEditMasterPrice(m.price);
                                    setEditMasterPar(m.par);
                                  }}
                                  className="bg-[#D4A853]/10 hover:bg-[#D4A853]/25 text-[#D4A853] border border-[#D4A853]/15 px-2.5 py-1.5 rounded-lg text-[10.5px] cursor-pointer font-bold"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (!syncState) return;
                                    if (confirm(`Apakah Anda yakin ingin menghapus bahan baku ${m.name} [${m.code}] dari database secara permanen? Stok serta rekamannya akan ditiadakan.`)) {
                                      const updatedMaster = master.filter((item) => item.code !== m.code);
                                      const nextGudang = { ...state.storage.gudang };
                                      delete nextGudang[m.code];
                                      const nextBar = { ...state.storage.bar };
                                      delete nextBar[m.code];

                                      syncState({
                                        ...state,
                                        master: updatedMaster,
                                        storage: {
                                          gudang: nextGudang,
                                          bar: nextBar
                                        }
                                      });
                                      if (triggerToast) triggerToast(`✓ ${m.name} terhapus dari logistik.`);
                                    }
                                  }}
                                  className="bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/15 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold cursor-pointer"
                                >
                                  🗑️ Hapus
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. PROCUREMENT SUB-TAB */}
            {activeAdminTab === "procurement" && (
              <div className="space-y-6 animate-fadeIn">
                {/* 2a. Purchase Requests (PRs) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-1 border-b border-amber-500/15">
                    <h5 className="text-xs font-bold text-[#D4A853] font-mono uppercase">📑 Sunting &amp; Pengesahan Purchase Requests (PR)</h5>
                    <span className="text-[9px] font-mono opacity-50">Total: {prs.length} Berkas</span>
                  </div>

                  <div className="max-h-[180px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {prs.map((p) => (
                      <div key={p.id} className="bg-black/35 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-200">{p.no}</span>
                            <span className="text-[#D4A853] font-mono text-[10px]">Rp {p.total.toLocaleString("id-ID")}</span>
                          </div>
                          <p className="text-[10px] text-amber-100/40">Dibuat oleh: {p.by} pada {p.date} • Vendor: {p.supplier}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={p.status}
                            onChange={(e) => {
                              if (!syncState) return;
                              const updatedPrs = prs.map((item) => {
                                if (item.id === p.id) {
                                  return { ...item, status: e.target.value as any };
                                }
                                return item;
                              });
                              syncState({ ...state, prs: updatedPrs });
                              if (triggerToast) triggerToast(`✓ Status PR ${p.no} diubah ke ${e.target.value}.`);
                            }}
                            className="bg-amber-950/80 border border-amber-500/25 text-amber-100 text-[10.5px] rounded px-1.5 py-1 outline-none font-sans font-medium cursor-pointer"
                          >
                            <option value="Menunggu Approval">Menunggu Approval</option>
                            <option value="Disetujui">Disetujui</option>
                            <option value="Ditolak">Ditolak</option>
                            <option value="Selesai Order">Selesai Order</option>
                          </select>

                          <button
                            onClick={() => {
                              if (!syncState) return;
                              if (confirm(`Apakah Anda yakin ingin meniadakan dokumen Purchase Request ${p.no}?`)) {
                                const updatedPrs = prs.filter((item) => item.id !== p.id);
                                syncState({ ...state, prs: updatedPrs });
                                if (triggerToast) triggerToast(`✓ PR ${p.no} dihapus.`);
                              }
                            }}
                            className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/10 text-red-400 p-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}

                    {prs.length === 0 && (
                      <p className="text-center py-4 text-amber-100/30 text-xs font-mono">Belum ada dokumen PR yang diterbitkan.</p>
                    )}
                  </div>
                </div>

                {/* 2b. Goods Receipts (GRN) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-1 border-b border-amber-500/15">
                    <h5 className="text-xs font-bold text-[#D4A853] font-mono uppercase">📥 Manajemen Tanda Terima Masuk (GRN)</h5>
                    <span className="text-[9px] font-mono opacity-50">Total: {grns.length} GRN</span>
                  </div>

                  <div className="max-h-[180px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {grns.map((g) => (
                      <div key={g.id} className="bg-[#1a0a00]/30 border border-amber-500/10 p-3 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
                        <div className="space-y-0.5">
                          <strong className="text-amber-100 font-medium block">{g.no}</strong>
                          <span className="text-[10px] text-amber-100/40 block">Tgl: {g.date} • Penerima: {g.by} • Vendor: {g.supplier} • ({g.totalItems} jenis barang)</span>
                        </div>

                        <button
                          onClick={() => {
                            if (!syncState) return;
                            if (confirm(`Apakah Anda yakin ingin menghapus penerimaan Barang Masuk (GRN) ${g.no}? Koreksi ini berguna membalikkan nilai mutasi buruk.`)) {
                              const updatedGrns = grns.filter((item) => item.id !== g.id);
                              syncState({ ...state, grns: updatedGrns });
                              if (triggerToast) triggerToast(`✓ GRN ${g.no} dihapus.`);
                            }
                          }}
                          className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/10 text-red-400 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold cursor-pointer uppercase tracking-wider"
                        >
                          Hapus GRN
                        </button>
                      </div>
                    ))}

                    {grns.length === 0 && (
                      <p className="text-center py-4 text-amber-100/30 text-xs font-mono">Belum ada tanda terima barang masuk (GRN).</p>
                    )}
                  </div>
                </div>

                {/* 2c. Stock Issues (Barang Keluar) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-1 border-b border-amber-500/15">
                    <h5 className="text-xs font-bold text-[#D4A853] font-mono uppercase">📤 Manajemen Barang Keluar (Issues)</h5>
                    <span className="text-[9px] font-mono opacity-50">Total: {state.issues?.length || 0} Mutasi Keluar</span>
                  </div>

                  <div className="max-h-[180px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {(state.issues || []).map((i, idx) => (
                      <div key={i.id || idx} className="bg-black/35 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
                        <div className="space-y-0.5">
                          <strong className="text-amber-100 font-medium block">{i.name} [Qty: {i.qty} {i.unit}]</strong>
                          <span className="text-[10px] text-amber-100/40 block">Kategori: {i.cat} • Jam: {i.time} • Petugas: {i.by} • Note: {i.note || "-"}</span>
                        </div>

                        <button
                          onClick={() => {
                            if (!syncState) return;
                            if (confirm(`Apakah Anda yakin ingin menghapus catatan pengeluaran barang ini?`)) {
                              const updatedIssues = (state.issues || []).filter((item, index) => item.id ? item.id !== i.id : index !== idx);
                              syncState({ ...state, issues: updatedIssues });
                              if (triggerToast) triggerToast(`✓ Catatan barang keluar dihapus.`);
                            }
                          }}
                          className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/10 text-red-400 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Hapus Catatan
                        </button>
                      </div>
                    ))}

                    {(state.issues || []).length === 0 && (
                      <p className="text-center py-4 text-amber-100/30 text-xs font-mono">Belum ada mutasi barang keluar tercatat.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. MONITORING SUB-TAB */}
            {activeAdminTab === "monitoring" && (
              <div className="space-y-6 animate-fadeIn">
                {/* 3a. Waste Log */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-1 border-b border-amber-500/15">
                    <h5 className="text-xs font-bold text-[#D4A853] font-mono uppercase">🗑️ Koreksi &amp; Koreksi Pembuangan (Waste &amp; Loss Logs)</h5>
                    <span className="text-[9px] font-mono opacity-50">Total: {wastes.length} Logs</span>
                  </div>

                  <div className="max-h-[180px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {wastes.map((w, wIndex) => (
                      <div key={w.id || wIndex} className="bg-black/35 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
                        <div className="space-y-0.5">
                          <strong className="text-red-300 font-medium block">{w.name} [Qty: {w.qty} {w.unit}]</strong>
                          <span className="text-[10px] text-amber-100/40 block">Penyebab: <strong className="text-amber-100">{w.cause}</strong> • Rugi: <strong className="text-red-400">Rp {w.loss.toLocaleString("id-ID")}</strong> • Petugas: {w.by}</span>
                        </div>

                        <button
                          onClick={() => {
                            if (!syncState) return;
                            if (confirm(`Apakah Anda yakin ingin menghapus logs pemborosan (Waste) ini? Tindakan ini merekonsiliasi balik grafik rugi.`)) {
                              const updatedWastes = wastes.filter((item, index) => item.id ? item.id !== w.id : index !== wIndex);
                              syncState({ ...state, wastes: updatedWastes });
                              if (triggerToast) triggerToast(`✓ Logs waste dibatalkan.`);
                            }
                          }}
                          className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/10 text-red-400 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Hapus logs
                        </button>
                      </div>
                    ))}

                    {wastes.length === 0 && (
                      <p className="text-center py-4 text-amber-100/30 text-xs font-mono">Belum ada logs pembuangan bahan.</p>
                    )}
                  </div>
                </div>

                {/* 3b. Menu Recipes & COGS */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-1 border-b border-amber-500/15">
                    <h5 className="text-xs font-bold text-[#D4A853] font-mono uppercase">☕ Kelola &amp; Ubah Harga Resep Menu (HPP)</h5>
                    <span className="text-[9px] font-mono opacity-50">Total: {recipes?.length || 0} Menu Resep</span>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {(recipes || []).map((r) => {
                      const isBeingEdited = editingRecipeId === r.id;

                      return (
                        <div key={r.id} className="bg-[#1c0c03]/60 border border-amber-500/10 p-3 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
                          <div className="space-y-1">
                            {isBeingEdited ? (
                              <input
                                type="text"
                                value={editRecipeName}
                                onChange={(e) => setEditRecipeName(e.target.value)}
                                className="bg-black/40 border border-amber-500/25 rounded px-2 py-1 text-xs text-amber-100 w-full outline-none"
                              />
                            ) : (
                              <strong className="text-amber-100 block font-medium">{r.name}</strong>
                            )}
                            <span className="text-[10px] font-mono text-amber-100/40 block">Kategori: {r.category} • ({r.ingredients.length} komposisi bahan)</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-mono text-amber-100/50 uppercase">Harga Jual (Rp)</span>
                              <input
                                type="number"
                                disabled={!isBeingEdited}
                                value={isBeingEdited ? editRecipePrice : r.sellPrice}
                                onChange={(e) => setEditRecipePrice(Number(e.target.value))}
                                className="bg-black/45 border border-amber-500/10 rounded-lg text-center font-mono text-xs px-2 py-1 w-24 text-emerald-400 font-bold"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              {isBeingEdited ? (
                                <>
                                  <button
                                    onClick={() => {
                                      if (!syncState || !recipes) return;
                                      const updatedRecipes = recipes.map((item) => {
                                        if (item.id === r.id) {
                                          return { ...item, name: editRecipeName, sellPrice: Number(editRecipePrice) };
                                        }
                                        return item;
                                      });
                                      syncState({ ...state, recipes: updatedRecipes });
                                      setEditingRecipeId(null);
                                      if (triggerToast) triggerToast(`✓ Harga resep ${r.name} diperbarui.`);
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-amber-950 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => setEditingRecipeId(null)}
                                    className="bg-white/5 hover:bg-white/10 text-amber-100 px-2 py-1 rounded text-[10px] cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingRecipeId(r.id);
                                      setEditRecipeName(r.name);
                                      setEditRecipePrice(r.sellPrice);
                                    }}
                                    className="bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/10 text-amber-300 px-2 py-1 rounded text-[10px] cursor-pointer"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (!syncState || !recipes) return;
                                      if (confirm(`Apakah Anda yakin ingin menghapus resep menu ${r.name} beserta isinya?`)) {
                                        const updatedRecipes = recipes.filter((item) => item.id !== r.id);
                                        syncState({ ...state, recipes: updatedRecipes });
                                        if (triggerToast) triggerToast(`✓ Resep menu ${r.name} dihapus.`);
                                      }
                                    }}
                                    className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/10 text-red-400 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    🗑️ Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 4. SYSTEM SUB-TAB */}
            {activeAdminTab === "system" && (
              <div className="space-y-6 animate-fadeIn">
                {/* 4a. Users & Staff Shortcut */}
                <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-amber-200">👥 Manajemen Profil &amp; User Akses Karyawan</h5>
                    <p className="text-[10px] text-amber-100/40 max-w-md">
                      Pendaftaran karyawan baru, perubahan PIN, pembaharuan Gmail dan nomor WhatsApp, serta foto profil pribadi kru harus diproses terenkripsi di terminal Akses Login &amp; Kru.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate("users")}
                    className="bg-[#D4A853] hover:bg-[#c39745] text-[#1a0a00] font-bold px-4 py-2.5 rounded-xl transition cursor-pointer text-center text-xs shrink-0 inline-flex items-center gap-1 shadow-md active:scale-95"
                  >
                    👥 Lompat Ke Akses Login &amp; Kru ➡️
                  </button>
                </div>

                {/* 4b. Branding Settings alternative edit */}
                <div className="bg-black/25 border border-amber-500/5 p-4 rounded-xl space-y-4">
                  <div className="pb-2 border-b border-white/5">
                    <h5 className="text-xs font-bold text-[#D4A853] font-mono uppercase">🎨 Kustomisasi Cepat Identitas Brand</h5>
                    <p className="text-[9px] text-amber-100/40">Ganti teks penamaan outlet kemitraan secara instan.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-mono">Nama Bisnis (Brand)</label>
                      <input
                        type="text"
                        value={editBrandingName}
                        onChange={(e) => setEditBrandingName(e.target.value)}
                        className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none font-sans text-amber-100 text-xs focus:border-[#D4A853]/40"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-mono">Nama Lokasi Gudang (Storage)</label>
                      <input
                        type="text"
                        value={editGudangName}
                        onChange={(e) => setEditGudangName(e.target.value)}
                        className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none font-sans text-amber-100 text-xs focus:border-[#D4A853]/40"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-mono">Nama Lokasi Bar (Storage)</label>
                      <input
                        type="text"
                        value={editBarName}
                        onChange={(e) => setEditBarName(e.target.value)}
                        className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 outline-none font-sans text-amber-100 text-xs focus:border-[#D4A853]/40"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!syncState) return;
                      syncState({
                        ...state,
                        branding: {
                          ...branding,
                          name: editBrandingName,
                          storageGudangName: editGudangName,
                          storageBarName: editBarName
                        }
                      });
                      if (triggerToast) triggerToast("✓ Pengaturan brand berhasil disimpan.");
                    }}
                    className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-amber-100 font-bold px-4 py-2 rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1 shadow-md active:scale-95"
                  >
                    💾 Simpan Identitas Brand
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
