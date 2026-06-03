import React, { useState } from "react";
import { CoffeeOpsState, User } from "../types";
import { 
  TrendingUp, 
  Coins, 
  BarChart3, 
  PieChart, 
  DollarSign, 
  Percent, 
  Award, 
  ShieldAlert, 
  Sparkles, 
  Plus, 
  Clock, 
  Info,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

interface BusinessAnalyticsProps {
  state: CoffeeOpsState;
  syncState: (updatedState: CoffeeOpsState) => Promise<void>;
  currentUser: User | null;
  activeRole: string;
}

export default function BusinessAnalytics({
  state,
  syncState,
  currentUser,
  activeRole
}: BusinessAnalyticsProps) {
  // Grab state data
  const sales = state.sales || [];
  const bep = state.bepData || {
    fixedCost: 45000000,
    variableCostPerCupPercent: 35,
    estimatedAverageTransaction: 35000,
    sampleMonthlyRevenue: 135000000,
    historicalFixedCosts: [
      { label: "Gaji Kru & Staff", value: 25000000 },
      { label: "Sewa Ruko", value: 12000000 },
      { label: "Listrik, Air & Wi-fi", value: 5000000 },
      { label: "Pemasaran", value: 3000050 }
    ]
  };

  const roi = state.roiData || {
    initialInvestment: 350000000,
    machineryCost: 150000000,
    renovationCost: 120000000,
    furnitureCost: 50000000,
    marketingCost: 30000000
  };

  // Form input states
  const [isEditBepOpen, setIsEditBepOpen] = useState(false);
  const [fixedOverhead, setFixedOverhead] = useState(bep.fixedCost);
  const [varCostPct, setVarCostPct] = useState(bep.variableCostPerCupPercent);
  const [avgTicket, setAvgTicket] = useState(bep.estimatedAverageTransaction);

  const [isEditRoiOpen, setIsEditRoiOpen] = useState(false);
  const [initialInv, setInitialInv] = useState(roi.initialInvestment);
  const [machineCost, setMachineCost] = useState(roi.machineryCost);
  const [renovCost, setRenovCost] = useState(roi.renovationCost);
  const [furnishCost, setFurnishCost] = useState(roi.furnitureCost);
  const [marketingCost, setMarketingCost] = useState(roi.marketingCost);

  const isAuthorized = activeRole === "Owner" || activeRole === "Manager";

  // 1. CALCULATE REAL METRICS FROM SALES DATABASE
  // Sum of state.sales
  const totalActualRevenue = sales.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const totalActualCostOfGoods = sales.reduce((acc, curr) => acc + (curr.totalCost || (curr.totalRevenue * 0.35)), 0);
  const actualGrossProfit = totalActualRevenue - totalActualCostOfGoods;
  
  // Annualized or simulated monthly runs
  // Let's assume actual revenue covers about 7 transaction days in the sample,
  // we scale it up to monthly (coeff 30/7) for real simulation run-rate
  const runRateCoeff = 30 / 8; // sample covers around 8 days
  const estimatedMonthlyRevenue = totalActualRevenue * runRateCoeff;
  const estimatedMonthlyCOGS = totalActualCostOfGoods * runRateCoeff;
  const estimatedMonthlyGrossProfit = estimatedMonthlyRevenue - estimatedMonthlyCOGS;
  const estimatedMonthlyNetProfit = estimatedMonthlyGrossProfit - bep.fixedCost;

  // 2. MATHEMATICAL BEP CALCULATIONS
  // Average ticket (Selling Price)
  const averageSellingPrice = avgTicket; 
  // Variable Cost per unit/cup
  const variableCostPerUnit = averageSellingPrice * (varCostPct / 100);
  // Contribution Margin per unit
  const contributionMarginPerUnit = averageSellingPrice - variableCostPerUnit;
  
  // BEP in Units (Transactions) per Month = Fixed Cost / Margin per Unit
  const bepTransactionsMonth = Math.ceil(bep.fixedCost / contributionMarginPerUnit);
  // BEP in Revenue per Month = Units * Selling Price
  const bepRevenueMonth = bepTransactionsMonth * averageSellingPrice;
  
  // Daily BEP
  const bepTransactionsDay = Math.ceil(bepTransactionsMonth / 30);
  const bepRevenueDay = Math.ceil(bepRevenueMonth / 30);

  // 3. MATHEMATICAL ROI CALCULATIONS
  const totalInvestmentCapEx = initialInv + machineCost + renovCost + furnishCost + marketingCost;
  
  // Multiplied by 12 for annualized returns
  // Target annualized profit
  const annualNetProfit = Math.max(0, estimatedMonthlyNetProfit) * 12;
  const roiPercentage = totalInvestmentCapEx > 0 ? (annualNetProfit / totalInvestmentCapEx) * 100 : 0;
  
  // Payback period (months)
  const paybackPeriodMonths = estimatedMonthlyNetProfit > 0 ? (totalInvestmentCapEx / estimatedMonthlyNetProfit) : 0;

  // Calculat ROI Estimated Return Date
  const getEstimatedReturnDate = (months: number) => {
    if (months <= 0 || isNaN(months) || !isFinite(months)) return "N/A (Net Profit Harus Positif)";
    const today = new Date("2026-06-02");
    today.setMonth(today.getMonth() + Math.ceil(months));
    return today.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
  };

  const handleUpdateBep = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedBep = {
      ...bep,
      fixedCost: fixedOverhead,
      variableCostPerCupPercent: varCostPct,
      estimatedAverageTransaction: avgTicket
    };

    await syncState({
      ...state,
      bepData: updatedBep
    });
    setIsEditBepOpen(false);
  };

  const handleUpdateRoi = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRoi = {
      initialInvestment: initialInv,
      machineryCost: machineCost,
      renovationCost: renovCost,
      furnitureCost: furnishCost,
      marketingCost: marketingCost
    };

    await syncState({
      ...state,
      roiData: updatedRoi
    });
    setIsEditRoiOpen(false);
  };

  // Preset quick-setters for simulation
  const applyPresetPremiumCafe = () => {
    setFixedOverhead(65000000);
    setVarCostPct(33);
    setAvgTicket(42000);
  };

  const applyPresetStandardKiosk = () => {
    setFixedOverhead(22000000);
    setVarCostPct(38);
    setAvgTicket(22000);
  };

  return (
    <div className="space-y-6 text-amber-50 animate-fadeIn" id="business-intelligence-container">
      
      {/* Header Info */}
      <div className="bg-[#1a0a00]/30 p-5 border border-amber-500/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            📈 Business Intelligence &amp; Analytics Center
          </h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Dasbor eksekutif pemantau metrik Break-Even Point (BEP), Return on Investment (ROI), pemetaan pengeluaran CapEx, dan kesehatan finansial kafe.
          </p>
        </div>
        
        {isAuthorized && (
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsEditBepOpen(true)}
              className="flex-1 md:flex-initial bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition min-h-[44px]"
            >
              🛠️ ATUR PARAMETER BEP
            </button>
            <button
              onClick={() => setIsEditRoiOpen(true)}
              className="flex-1 md:flex-initial bg-[#D4A853] hover:bg-[#bd933d] text-amber-950 px-4 py-2.5 rounded-xl text-xs font-serif font-black transition cursor-pointer min-h-[44px]"
            >
              📊 CAPEX &amp; INVESTASI
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1: BUSINESS HEALTH EXECUTIVE SUITE STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="business-health-suite">
        
        {/* KPI 1: ESTIMATED MONTHLY REVENUE */}
        <div className="bg-[#1c0f05]/50 border border-amber-500/10 rounded-2xl p-4.5 space-y-2">
          <div className="flex justify-between items-center text-amber-100/45 text-[10.5px] uppercase font-mono font-bold tracking-wider">
            <span>Estimasi Omset / Bulan</span>
            <span>💰</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-xl sm:text-2xl font-mono font-black text-amber-150">
              Rp {Math.round(estimatedMonthlyRevenue).toLocaleString("id-ID")}
            </h4>
            <p className="text-[10px] text-emerald-400 font-mono">
              Berdasarkan run-rate penjualan harian saat ini
            </p>
          </div>
        </div>

        {/* KPI 2: VARIABLE COST PERCENT (COGS) */}
        <div className="bg-[#1c0f05]/50 border border-amber-500/10 rounded-2xl p-4.5 space-y-2">
          <div className="flex justify-between items-center text-amber-100/45 text-[10.5px] uppercase font-mono font-bold tracking-wider">
            <span>Food / Sip COGS (Var. Cost)</span>
            <span>☕</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-xl sm:text-2xl font-mono font-black text-amber-150">
              {varCostPct}%
            </h4>
            <div className="text-[10px] text-amber-200/40 font-mono">
              Omset bahan baku: Rp {Math.round(estimatedMonthlyCOGS).toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* KPI 3: FIXED OVERHEAD COSTS */}
        <div className="bg-[#1c0f05]/50 border border-amber-500/10 rounded-2xl p-4.5 space-y-2">
          <div className="flex justify-between items-center text-amber-100/45 text-[10.5px] uppercase font-mono font-bold tracking-wider">
            <span>Biaya Tetap (Fixed Cost)</span>
            <span>🏢</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-xl sm:text-2xl font-mono font-black text-red-400">
              Rp {bep.fixedCost.toLocaleString("id-ID")}
            </h4>
            <p className="text-[10px] text-amber-100/30 font-mono">
              Kewajiban sewa, gaji, dan rutin utilitas harian
            </p>
          </div>
        </div>

        {/* KPI 4: ESTIMATED NET PROFIT */}
        <div className="bg-[#1c0f05]/50 border border-[#D4A853]/20 rounded-2xl p-4.5 space-y-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 bg-amber-400/10 px-2.5 py-0.5 rounded-bl-xl border-l border-b border-amber-500/10 font-mono text-[8px] text-amber-400">BEST RUN</div>
          <div className="flex justify-between items-center text-amber-150/50 text-[10.5px] uppercase font-mono font-bold tracking-wider">
            <span>Prakiraan Profit Bersih</span>
            <span>📈</span>
          </div>
          <div className="space-y-1">
            <h4 className={`text-xl sm:text-2xl font-mono font-black ${estimatedMonthlyNetProfit >= 0 ? "text-emerald-300" : "text-red-400"}`}>
              Rp {Math.round(estimatedMonthlyNetProfit).toLocaleString("id-ID")}
            </h4>
            <p className="text-[10.5px] font-mono leading-none">
              Margin Bersih: {estimatedMonthlyRevenue > 0 ? Math.round((estimatedMonthlyNetProfit / estimatedMonthlyRevenue) * 100) : 0}%
            </p>
          </div>
        </div>

      </div>

      {/* SECTION 2: BREAK-EVEN POINT (BEP) INTEGRATING PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEft: Mathematical BEP targets columns */}
        <div className="lg:col-span-7 bg-[#1c0f05]/40 border border-[#D4A853]/15 rounded-2xl p-5 space-y-5">
          <h4 className="font-serif text-sm font-bold text-amber-100 border-b border-amber-500/10 pb-2 flex items-center gap-2">
            🏆 Target Penjualan titik Impas (Break-Even Point)
          </h4>

          {/* BEP target specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Monthly target */}
            <div className="bg-black/25 border border-amber-500/5 p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-amber-100/40 uppercase font-mono block">Titik Impas Bulanan (Monthly BEP)</span>
              <div className="space-y-1">
                <div className="font-mono text-lg font-black text-amber-200">
                  Rp {Math.round(bepRevenueMonth).toLocaleString("id-ID")}
                </div>
                <div className="text-[10.5px] font-mono text-amber-150/60">
                   {bepTransactionsMonth.toLocaleString("id-ID")} Transaksi (Cup / Tiket)
                </div>
              </div>
            </div>

            {/* Daily target */}
            <div className="bg-black/25 border border-amber-500/5 p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-amber-100/40 uppercase font-mono block">Target harian minim (Daily BEP)</span>
              <div className="space-y-1">
                <div className="font-mono text-lg font-black text-amber-200">
                  Rp {Math.round(bepRevenueDay).toLocaleString("id-ID")}
                </div>
                <div className="text-[10.5px] font-mono text-amber-150/60">
                  {bepTransactionsDay} Transaksi / Hari @ standard 35k
                </div>
              </div>
            </div>

          </div>

          {/* Mathematical formulation log explanations */}
          <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl space-y-2 text-[11px] text-amber-200/90 leading-relaxed font-mono">
            <div>
              <strong>Latar Formula:</strong> <br />
              • Harga Jual Rata-rata: <strong>Rp {averageSellingPrice.toLocaleString("id-ID")} / Tiket</strong> <br />
              • Food Cost (Bahan Baku) per Unit: {varCostPct}% = <strong>Rp {Math.round(variableCostPerUnit).toLocaleString("id-ID")}</strong> <br />
              • Kontribusi Margin Keuntungan per Unit: <strong>Rp {Math.round(contributionMarginPerUnit).toLocaleString("id-ID")}</strong>
            </div>
            <div className="text-[10px] text-amber-100/40 border-t border-amber-500/5 pt-2 italic">
               *BEP dihitung dengan: Biaya Tetap ({bep.fixedCost.toLocaleString("id-ID")}) dibagi Kontribusi Margin per unit ({Math.round(contributionMarginPerUnit).toLocaleString("id-ID")})
            </div>
          </div>

          {/* Progress gauge compare ACTUAL VS BEP LIMITS */}
          <div className="space-y-3.5 pt-1">
            <h5 className="font-serif text-[11px] text-amber-200/80 font-bold uppercase tracking-wider">Perbandingan Omset Terkini vs Titik Impas (BEP Progress):</h5>
            
            <div className="space-y-2 bg-black/20 p-4 border border-amber-500/5 rounded-2xl">
              <div className="flex justify-between font-mono text-[10.5px]">
                <span className="text-amber-100/40">Kebutuhan BEP Bulanan: Rp {bepRevenueMonth.toLocaleString("id-ID")}</span>
                <span className="text-amber-300 font-bold">Hasil Sekarang: Rp {Math.round(estimatedMonthlyRevenue).toLocaleString("id-ID")}</span>
              </div>

              {/* Progress gauge bar */}
              <div className="h-4 w-full bg-black/45 rounded-full overflow-hidden p-0.5 border border-amber-500/15 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${estimatedMonthlyRevenue >= bepRevenueMonth ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(100, (estimatedMonthlyRevenue / bepRevenueMonth) * 100)}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-black text-amber-50 text-shadow pr-2">
                  {Math.round((estimatedMonthlyRevenue / bepRevenueMonth) * 100)}% Target Tercapai
                </span>
              </div>

              {estimatedMonthlyRevenue >= bepRevenueMonth ? (
                <div className="text-[10.5px] font-mono text-emerald-400 flex items-center gap-1">
                  ✓ <strong>USAHA TIAP IMbAS (BEP PASSED)</strong>: Operasional kafe Anda saat ini membuahkan profit bersih yang sehat di atas titik impas! Pertahankan run-rate ini!
                </div>
              ) : (
                <div className="text-[10.5px] font-mono text-red-300 flex items-center gap-1 animate-pulse">
                  ⚠️ <strong>DIBAWAH TARGET IMbAS</strong>: Omset berjalan belum mencukupi untuk menutup total fixed cost bulanan. Target cup tambahan: {(bepTransactionsMonth - (totalActualRevenue * runRateCoeff / averageSellingPrice)).toFixed(0)} cups/bulan.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right: ROI Estimations & Payback calculation */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* ROI summary card */}
          <div className="bg-[#1c0f05]/40 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4">
            <h4 className="font-serif text-sm font-bold text-amber-100 border-b border-amber-500/10 pb-2 flex items-center gap-1.5">
              🏆 Analisis Pengembalian Investasi (ROI &amp; Payback Period)
            </h4>

            <div className="bg-black/30 p-3.5 rounded-xl border border-amber-500/5 space-y-3 font-mono text-[11px]">
              <div className="flex justify-between"><span className="text-amber-100/40">Total Modal CapEx Keperluan:</span> <span className="font-extrabold text-amber-100">Rp {totalInvestmentCapEx.toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between"><span className="text-amber-100/40">Prakiraan Net Profit / Tahun:</span> <span className="font-extrabold text-emerald-300">Rp {annualNetProfit.toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between border-t border-amber-500/5 pt-2"><span className="text-amber-300 font-bold">ROI % (Annual Rate):</span> <span className="font-black text-amber-250 text-xs text-right">{roiPercentage.toFixed(1)}% / Tahun</span></div>
            </div>

            {/* Payback result highlights */}
            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl text-center space-y-2">
              <span className="text-[10px] text-amber-200/55 uppercase font-mono block">Prakiraan Balik Modal (Payback Period):</span>
              <h3 className="font-serif font-black text-lg text-amber-200">
                {paybackPeriodMonths > 0 ? `${paybackPeriodMonths.toFixed(1)} Bulan` : "Tak terhingga (Profit Negatif)"}
              </h3>
              <p className="text-[9.5px] font-mono text-amber-100/30">
                Est. Tanggal Balik Modal: <strong className="text-amber-200">{getEstimatedReturnDate(paybackPeriodMonths)}</strong>
              </p>
            </div>

            {/* CapEx allocation breakdown visualizer */}
            <div className="space-y-2 bg-black/20 p-3 border border-amber-500/5 rounded-xl text-[10px] font-mono">
              <span className="text-amber-100/40 uppercase text-[9px] block mb-1">Rincian modal CapEx terdaftar (Capital Expenditures):</span>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center bg-black/10 p-1.5 rounded">
                  <span>🏗️ Konstruksi Renovasi Ruko:</span>
                  <span className="font-bold">Rp {renovCost.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center bg-black/10 p-1.5 rounded">
                  <span>☕ Mesin Kani &amp; Peralatan Bar:</span>
                  <span className="font-bold">Rp {machineCost.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center bg-black/10 p-1.5 rounded">
                  <span>🛋️ Mebel, Kursi &amp; Dekorasi:</span>
                  <span className="font-bold">Rp {furnishCost.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center bg-black/10 p-1.5 rounded">
                  <span>📢 Pemasaran Pertama &amp; Umum:</span>
                  <span className="font-bold">Rp {marketingCost.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center bg-[#211101] p-1.5 rounded border border-amber-500/10 text-amber-300">
                  <span>💵 Ekuitas Tunai Operational:</span>
                  <span className="font-black">Rp {initialInv.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Notice */}
          <div className="bg-black/25 border border-amber-500/10 p-3.5 rounded-xl font-mono text-[10px] text-amber-100/40 text-left space-y-1">
            <div className="flex gap-1 text-amber-400 font-bold"><Info size={11} /> INFORMASI KATEGORISASI</div>
            <p className="leading-relaxed">Omset dan Harga Pokok Penjualan (COGS) dihitung secara instan mengindeks dari database input resep minuman standar dan laporan penjualan kasir.</p>
          </div>

        </div>

      </div>

      {/* 5. EDIT PARAMETERS DIALOG FORM METRICS BEP */}
      {isEditBepOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#140b04] border border-[#D4A853]/20 rounded-3xl p-5 space-y-4 shadow-2xl text-amber-50">
            
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-2">
              <h4 className="font-serif text-sm font-bold text-amber-200">🛠️ Parameter Analisis BEP Kafe</h4>
              <button onClick={() => setIsEditBepOpen(false)} className="text-amber-100/40 hover:text-amber-100 font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateBep} className="space-y-4 text-xs sm:text-sm">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Total Fixed Costs Bulanan (Rp)</label>
                <input
                  type="number"
                  required
                  value={fixedOverhead}
                  onChange={(e) => setFixedOverhead(parseInt(e.target.value) || 0)}
                  className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Bahan Baku (Variable %) </label>
                  <input
                    type="number"
                    max={100}
                    min={1}
                    required
                    value={varCostPct}
                    onChange={(e) => setVarCostPct(parseInt(e.target.value) || 35)}
                    className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full text-center"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Rata-rata Harga Tiket Saaji (Rp)</label>
                  <input
                    type="number"
                    required
                    value={avgTicket}
                    onChange={(e) => setAvgTicket(parseInt(e.target.value) || 35000)}
                    className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full text-center"
                  />
                </div>
              </div>

              {/* Presets helpers */}
              <div className="bg-black/30 p-2.5 rounded-xl">
                <span className="text-[9.5px] text-[#D4A853] font-mono block uppercase mb-1">Simulasi Skenario Cepat (Scenario Presets):</span>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                  <button type="button" onClick={applyPresetPremiumCafe} className="bg-[#29170a] hover:bg-amber-500/10 p-2 rounded text-left border border-amber-500/5 truncate">
                    🥇 Cafe Premium
                  </button>
                  <button type="button" onClick={applyPresetStandardKiosk} className="bg-[#29170a] hover:bg-amber-500/10 p-2 rounded text-left border border-amber-500/5 truncate">
                    🛵 Standard Kiosk / Booth
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button type="button" onClick={() => setIsEditBepOpen(false)} className="bg-black/30 hover:bg-black/55 border border-amber-500/10 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer">Batal</button>
                <button type="submit" className="bg-[#D4A853] hover:bg-[#bd933d] px-6 py-2.5 rounded-lg text-xs font-serif font-black text-amber-950 transition cursor-pointer">Simpan Parameter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT CAPEX AND INITIAL INVESTMENTS ROI */}
      {isEditRoiOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#140b04] border border-[#D4A853]/20 rounded-3xl p-5 space-y-4 shadow-2xl text-amber-50">
            
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-2">
              <h4 className="font-serif text-sm font-bold text-amber-200">🏗️ Pengeluaran CapEx &amp; Modal Inisial</h4>
              <button onClick={() => setIsEditRoiOpen(false)} className="text-amber-100/40 hover:text-amber-100 font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateRoi} className="space-y-3.5 text-xs sm:text-sm max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">modal Kas Tunai Operasional (Rp)</label>
                <input
                  type="number"
                  value={initialInv}
                  onChange={(e) => setInitialInv(parseInt(e.target.value) || 0)}
                  className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Pengadaan Mesin Giling / Bar Cup (Rp)</label>
                <input
                  type="number"
                  value={machineCost}
                  onChange={(e) => setMachineCost(parseInt(e.target.value) || 0)}
                  className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Renovasi Ruko &amp; Kontruksi Sipil (Rp)</label>
                <input
                  type="number"
                  value={renovCost}
                  onChange={(e) => setRenovCost(parseInt(e.target.value) || 0)}
                  className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Mebel, Interior &amp; Dekorasi Ruangan (Rp)</label>
                <input
                  type="number"
                  value={furnishCost}
                  onChange={(e) => setFurnishCost(parseInt(e.target.value) || 0)}
                  className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Pemasaran Pembukaan &amp; Publikasi (Rp)</label>
                <input
                  type="number"
                  value={marketingCost}
                  onChange={(e) => setMarketingCost(parseInt(e.target.value) || 0)}
                  className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button type="button" onClick={() => setIsEditRoiOpen(false)} className="bg-black/30 hover:bg-black/55 border border-amber-500/10 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer">Batal</button>
                <button type="submit" className="bg-[#D4A853] hover:bg-[#c29643] px-6 py-2.5 rounded-lg text-xs font-serif font-black text-amber-950 transition cursor-pointer">Simpan Investasi</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
