import React, { useState, useEffect } from "react";
import { CoffeeOpsState, User } from "../types";
import { 
  Award, 
  Users, 
  TrendingUp, 
  Percent, 
  Star, 
  CheckCircle, 
  Calendar, 
  DollarSign, 
  Send, 
  FileText, 
  Settings, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  RefreshCw, 
  Sliders, 
  ShieldAlert, 
  Sparkles, 
  Plus, 
  Trash2, 
  UserCheck, 
  Smartphone,
  Check,
  Search,
  BookOpen,
  Trophy,
  MessageSquare,
  MapPin
} from "lucide-react";

interface KPIManagementProps {
  state: CoffeeOpsState;
  currentUser: User | null;
  activeRole: string;
}

// Enterprise KPI Metrics per Staff
interface CustomStaffKPIMetrics {
  userId: string;
  name: string;
  role: string;
  branchId: string;
  photoUrl: string;
  
  // Real KPI Weights (Calculates out of 100%)
  attendance: number;      // 20% (0-100 scale, e.g. Days Present/Total)
  punctuality: number;     // 10% (0-100 scale)
  sales: number;           // 20% (Sales achievement % vs target, with cap)
  upselling: number;       // 15% (Upsell rate on tickets)
  sopCompliance: number;   // 15% (SOP Checklist Audit % score)
  customerSatisfaction: number; // 10% (Customer rating normalized or out of 5)
  teamwork: number;        // 10% (Team rating score 0-100)

  // Customizable evaluations
  strengths: string;
  improvements: string;
  training: string;
  ownerAppreciation: string;
  
  // Salary and rewards (Locked from Barista/Cashier/Kitchen)
  baseSalary: number;
  selectedRewardType: "None" | "Employee of The Month" | "Best Sales" | "Best Attendance" | "Best Customer Service" | "Best Team Player";
  rewardAmount: number; // IDR
}

export default function KPIManagement({ state, currentUser, activeRole }: KPIManagementProps) {
  const branding = state.branding;
  const usersList = state.users || [];

  // Determine user authorization
  // Owner: Full access
  // Manager: Evaluation access (except Owner Settings and Financial settings)
  // Barista, Cashier, Kitchen: Only can see "KPI Personal" & customized Performance Booklet. Cannot see financials or rankings of others.
  const isOwner = activeRole === "Owner" || currentUser?.role === "Owner";
  const isManager = activeRole === "Manager" || currentUser?.role === "Manager";
  const isManagement = isOwner || isManager;

  // Active Month
  const [selectedMonth, setSelectedMonth] = useState("Mei 2026");
  const [activeTab, setActiveTab] = useState<"dashboard" | "evaluation" | "pdf_preview" | "whatsapp_portal" | "rewards" | "outlets">("dashboard");

  // Custom list of outlets/branches
  const [outlets, setOutlets] = useState<string[]>([
    "Pusat Pangkalpinang (HQ)",
    "Cabang Pangkalpinang Timur",
    "Cabang Pangkalpinang Barat"
  ]);
  const [newOutletName, setNewOutletName] = useState("");
  const [editBranchId, setEditBranchId] = useState("Pusat Pangkalpinang (HQ)");
  
  // Staff KPI Records State
  const [kpiRecords, setKpiRecords] = useState<CustomStaffKPIMetrics[]>([
    {
      userId: "u3",
      name: "Hendra Head Barista",
      role: "Head Barista",
      branchId: "Pusat Pangkalpinang (HQ)",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      attendance: 100,
      punctuality: 98,
      sales: 110, // 110% of target
      upselling: 88,
      sopCompliance: 96,
      customerSatisfaction: 4.9, // out of 5
      teamwork: 94,
      strengths: "Memiliki kepemimpinan yang sangat baik dan mendominasi standar kebersihan bar serta kalibrasi harian.",
      improvements: "Manajemen waktu delegasi tugas bar ke barista junior perlu dipoles sedikit.",
      training: "Pelatihan Advanced Sensory & Coffee Roasting Strategy.",
      ownerAppreciation: "Hendra membuktikan dedikasinya yang solid untuk brand Le Parla Café.",
      baseSalary: 6200000,
      selectedRewardType: "Best Team Player",
      rewardAmount: 500000
    },
    {
      userId: "u4",
      name: "Adit Barista",
      role: "Barista",
      branchId: "Pusat Pangkalpinang (HQ)",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      attendance: 96,
      punctuality: 92,
      sales: 105,
      upselling: 95, // Excelled at Oatside Latte upselling
      sopCompliance: 93,
      customerSatisfaction: 4.8,
      teamwork: 90,
      strengths: "Sangat antusias menjelaskan menu seasonal dan memiliki tingkat keberhasilan upselling luar biasa.",
      improvements: "Pastikan sisa susu (waste milk) saat tuang pitcher latte art dikurangi lagi (sesuai SOP).",
      training: "Pelatihan Hospitality & Up-selling Mastery.",
      ownerAppreciation: "Terima kasih Adit, performansi upselling Anda menaikkan profit outlet secara signifikan!",
      baseSalary: 4500000,
      selectedRewardType: "Best Sales",
      rewardAmount: 500000
    },
    {
      userId: "u5",
      name: "Chaca Cashier",
      role: "Cashier",
      branchId: "Pusat Pangkalpinang (HQ)",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
      attendance: 92,
      punctuality: 85, // Late 4 times
      sales: 88,
      upselling: 76,
      sopCompliance: 88,
      customerSatisfaction: 4.6,
      teamwork: 85,
      strengths: "Ramah kepada pelanggan, teliti dalam merekap transaksi kasir harian agar tidak ada selisih uang.",
      improvements: "Ketepatan waktu kedatangan perlu ditingkatkan lagi demi kelancaran operasional opening shift.",
      training: "Pelatihan Speed Cashiering & Customer Excellence.",
      ownerAppreciation: "Apresiasi atas kejujuran dan keramahan Chaca yang selalu membawa senyum untuk pelanggan.",
      baseSalary: 4200000,
      selectedRewardType: "Best Customer Service",
      rewardAmount: 250000
    },
    {
      userId: "u2",
      name: "Mega Manager",
      role: "Manager",
      branchId: "Pusat Pangkalpinang (HQ)",
      photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
      attendance: 100,
      punctuality: 100,
      sales: 108,
      upselling: 90,
      sopCompliance: 98,
      customerSatisfaction: 4.9,
      teamwork: 96,
      strengths: "Luar biasa dalam mengendalikan P&L, stock opname yang akurat, dan terus menjaga cost bahan baku tetap di bawah par.",
      improvements: "Teruskan pemantauan berkala log waste susu dan biji kopi blend di chiller.",
      training: "Executive Leadership & Lean Cafe Profit Management.",
      ownerAppreciation: "Mega adalah pilar utama Le Parla Pangkalpinang. Sangat layak dicalonkan menjadi Area Manager!",
      baseSalary: 8500000,
      selectedRewardType: "Employee of The Month",
      rewardAmount: 1000000
    }
  ]);

  // Handle addition of Kitchen role if not exists in records
  useEffect(() => {
    // Look if there's any user in state with role 'Kitchen' or we can add a placeholder
    const registeredKitchen = usersList.find(u => u.role === "Kitchen") || {
      id: "u_kitchen",
      name: "Rian Kitchen",
      role: "Kitchen",
      branchId: "Pusat Pangkalpinang (HQ)",
    };

    setKpiRecords(prev => {
      const hasKitchenRecord = prev.some(r => r.role === "Kitchen" || r.userId === registeredKitchen.id);
      if (hasKitchenRecord) {
        return prev;
      }
      return [
        ...prev,
        {
          userId: registeredKitchen.id,
          name: registeredKitchen.name,
          role: "Kitchen",
          branchId: registeredKitchen.branchId || "Pusat Pangkalpinang (HQ)",
          photoUrl: "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&q=80&w=150",
          attendance: 98,
          punctuality: 96,
          sales: 100,
          upselling: 80,
          sopCompliance: 97, // High compliance in food production checklist
          customerSatisfaction: 4.7,
          teamwork: 95,
          strengths: "Sangat memperhatikan higienitas area kitchen, tertib check-list porsi produk, dan kecepatan menyajikan pastry konsisten.",
          improvements: "Koordinasi logistik dengan gudang utama untuk pemesanan cokelat bubuk perlu dipatuh.",
          training: "Sertifikasi Food Safety Management & Kitchen Cost Control.",
          ownerAppreciation: "Kualitas makanan ringan Le Parla Café terjaga sempurna berkat kedisiplinan Rian.",
          baseSalary: 4500000,
          selectedRewardType: "Best Attendance",
          rewardAmount: 250000
        }
      ];
    });
  }, [usersList]);

  // Selected Staff for Edit & Visual PDF Booklet Preview
  const [selectedStaffId, setSelectedStaffId] = useState<string>("u4");
  const selectedStaff = kpiRecords.find(r => r.userId === selectedStaffId) || kpiRecords[0] || {
    userId: "u4",
    name: "Adit Barista",
    role: "Barista",
    branchId: "Pusat Pangkalpinang (HQ)",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    attendance: 96,
    punctuality: 92,
    sales: 105,
    upselling: 95,
    sopCompliance: 93,
    customerSatisfaction: 4.8,
    teamwork: 90,
    strengths: "",
    improvements: "",
    training: "",
    ownerAppreciation: "",
    baseSalary: 4500000,
    selectedRewardType: "None",
    rewardAmount: 0
  };

  // KPI Engine Calculation Function
  const calculateStaffKPI = (rec: CustomStaffKPIDataRec) => {
    // 1. Attendance: 20%
    const attendanceWeighted = rec.attendance * 0.20;
    // 2. Punctuality: 10%
    const punctualityWeighted = rec.punctuality * 0.10;
    // 3. Sales Achievement: 20% (Sales percentage e.g. 100% target or capped contribution)
    const salesWeighted = Math.min(120, rec.sales) * 0.20;
    // 4. Upselling: 15%
    const upsellingWeighted = rec.upselling * 0.15;
    // 5. SOP Compliance: 15%
    const sopWeighted = rec.sopCompliance * 0.15;
    // 6. Customer Satisfaction: 10% (normalized from 5 star, e.g. (rating/5)*100)
    const satisfactionWeighted = (rec.customerSatisfaction / 5) * 100 * 0.10;
    // 7. Teamwork: 10%
    const teamworkWeighted = rec.teamwork * 0.10;

    const totalScore = Math.min(100, Math.round(
      attendanceWeighted +
      punctualityWeighted +
      salesWeighted +
      upsellingWeighted +
      sopWeighted +
      satisfactionWeighted +
      teamworkWeighted
    ));

    return totalScore;
  };

  // Dynamic Salary and KPI-based calculations
  const calculateSalaryBreakdown = (rec: CustomStaffKPIMetrics) => {
    // 1. Attendance Deduction: Rp 75.000 deduction per missing percent from 100%
    const missingAttendance = Math.max(0, 100 - rec.attendance);
    const attendanceDeduction = missingAttendance * 75000;

    // 2. Punctuality Penalty: Rp 30.000 deduction per missing percent from 100%
    const missingPunctuality = Math.max(0, 100 - rec.punctuality);
    const punctualityPenalty = missingPunctuality * 30000;

    // 3. KPI Performance Bonus / Penalty based on score
    const kpiScore = calculateStaffKPI(rec as any);
    let kpiBonus = 0;
    let kpiBonusRate = 0;
    if (kpiScore >= 95) {
      kpiBonusRate = 0.15; // 15% Bonus
      kpiBonus = Math.round(rec.baseSalary * kpiBonusRate);
    } else if (kpiScore >= 90) {
      kpiBonusRate = 0.10; // 10% Bonus
      kpiBonus = Math.round(rec.baseSalary * kpiBonusRate);
    } else if (kpiScore >= 80) {
      kpiBonusRate = 0.05; // 5% Bonus
      kpiBonus = Math.round(rec.baseSalary * kpiBonusRate);
    } else if (kpiScore < 70) {
      kpiBonusRate = -0.05; // 5% Penalty for low performance
      kpiBonus = Math.round(rec.baseSalary * kpiBonusRate);
    }

    const netTakeHomePay = Math.max(0, rec.baseSalary - attendanceDeduction - punctualityPenalty + kpiBonus + rec.rewardAmount);

    return {
      attendanceDeduction,
      punctualityPenalty,
      kpiBonus,
      kpiBonusRate,
      takeHomePay: netTakeHomePay,
      kpiScore
    };
  };

  // Get grading label & color from calculated score
  const getKpiGrade = (score: number) => {
    if (score >= 95) return { grade: "A+ Outstanding", desc: "Sempurna & Berdedikasi Sangat Tinggi", color: "text-[#D4A853] bg-amber-500/10 border-amber-500/20" };
    if (score >= 90) return { grade: "A Excellent", desc: "Sangat Baik & Lampaui Target harian", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" };
    if (score >= 80) return { grade: "B Good", desc: "Sesuai Ekspektasi & Konsisten", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    if (score >= 70) return { grade: "C Fair", desc: "Cukup, Perlu Pendampingan Tambahan", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" };
    return { grade: "D Improvement Needed", desc: "Kurang Memenuhi, Wajib Di-coaching", color: "text-red-400 bg-red-500/10 border-red-500/25" };
  };

  // Trigger Notifications / Toast alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // WhatsApp Gateway Logging
  interface WhatsAppLog {
    id: string;
    sender: string;
    recipient: string;
    phone: string;
    message: string;
    status: "Sending" | "Delivered" | "Failed";
    timestamp: string;
    type: "Staff" | "Owner";
  }
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([
    {
      id: "wa-1",
      sender: "Le Parla Management",
      recipient: "Hendra Head Barista",
      phone: "628111222333",
      message: "Halo Hendra Head Barista, Laporan KPI Bulan Mei telah tersedia...",
      status: "Delivered",
      timestamp: "01/06/2026, 12:00",
      type: "Staff"
    }
  ]);

  // PDF Presentation Cover Flip Page index
  const [pdfActivePage, setPdfActivePage] = useState<number>(1);

  // Gemini AI analysis state for the selected report inside the preview
  const [aiAnalysisText, setAiAnalysisText] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Auto-generate AI evaluation using internal framework helper or offline mockup
  const generateAiPerformanceAnalysis = async (staffName: string, roleName: string, score: number, rec: any) => {
    setIsGeneratingAi(true);
    setAiAnalysisText("");

    const mockPrompt = `Evaluasi Karyawan ${staffName} sebagai ${roleName} Le Parla Café dengan skor KPI total ${score}/100. Deskripsikan kekuatan, area peningkatan, rekomendasi taktis serta motivasi dalam 3 kalimat formal.`;
    
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Evaluasi KPI bulanan karyawan bernama ${staffName} berposisi sebagai ${roleName} di cafe Le Parla Café. Skor Akhir KPI: ${score}/100. Detail nilai: Kehadiran ${rec.attendance}%, Ketepatan Waktu ${rec.punctuality}%, Pencapaian Sales ${rec.sales}%, Upselling ${rec.upselling}%, SOP Compliance ${rec.sopCompliance}%, Rating Komentar ${rec.customerSatisfaction * 20}%, Kerja Tim ${rec.teamwork}%. Tuliskan analisis AI performa profesional yang premium, ringkas, membakar semangat, ramah, dan solutif sebanyak 3-4 kalimat dalam bahasa Indonesia. Jangan pakai placeholder.`,
          chatHistory: []
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Standard cleaning of codeblocks
        let cleanText = result.reply || "";
        cleanText = cleanText.replace(/###.*?\n/g, "").replace(/\*(.*?)\*/g, "$1").trim();
        setAiAnalysisText(cleanText);
      } else {
        throw new Error("API Offline");
      }
    } catch (e) {
      // High-quality Offline smart template
      const improvementTag = rec.punctuality < 90 ? "Ketepatan waktu kedatangan" : rec.upselling < 90 ? "Intensitas upselling produk seasonal" : "Konsistensi SOP operasional";
      const offlineAnalysis = `Kinerja Sdr. ${staffName} secara keseluruhan di Le Parla Café dinilai sangat solid dan mencerminkan dedikasi profesional. Dengan capaian KPI total ${score}%, kontribusi terhadap pencapaian target harian dan sales telah berada di atas rata-rata outlet. Namun, disarankan agar Sdr ${staffName} memfokuskan peningkatan pada aspek ${improvementTag} demi kelancaran operasional di masa mendatang. Kami sangat mengapresiasi loyalitas dan ketulusan kerja keras yang terus ditunjukkan.`;
      
      setAiAnalysisText(offlineAnalysis);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Trigger AI generation on load or selected user change
  useEffect(() => {
    if (selectedStaff) {
      const kpiScore = calculateStaffKPI(selectedStaff);
      generateAiPerformanceAnalysis(selectedStaff.name, selectedStaff.role, kpiScore, selectedStaff);
    }
  }, [selectedStaffId]);

  // System Triggers (Requested by Owner checklist)
  const triggerGenerateKPI = () => {
    showToast("✓ Sukses memicu Kalkulasi Ulang seluruh nilai log staff & menyelaraskan bobot KPI.");
    // Auto sync any updates
    if (state.auditLogs) {
      // Simulate recording back to audit
      state.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        user: currentUser?.name || "System",
        role: activeRole,
        action: "Melakukan Generate & Rekomendasi KPI Bulan Berjalan",
        page: "KPI & Performa",
        timestamp: new Date().toLocaleTimeString(),
        device: "Server Admin Engine",
        ip: "127.0.0.1"
      });
    }
  };

  const triggerGenerateAllReports = () => {
    showToast(`✓ Sukses membuat ${kpiRecords.length} berkas booklet performansi PDF untuk seluruh kru.`);
  };

  const triggerSendWhatsAppReports = () => {
    // Generate simulated logs
    const newLogs: WhatsAppLog[] = kpiRecords.map((r, idx) => {
      const score = calculateStaffKPI(r);
      const gradeInfo = getKpiGrade(score);
      const ranking = idx + 1;
      
      return {
        id: `wa-staff-${Date.now()}-${idx}`,
        sender: "Le Parla Management",
        recipient: r.name,
        phone: r.role === "Barista" ? "628222333444" : r.role === "Cashier" ? "628333444555" : r.role === "Manager" ? "628987654321" : "628123456789",
        message: `Halo ${r.name},\n\nLaporan KPI Bulan ${selectedMonth} telah tersedia.\n\nSkor KPI Anda:\n${score}/100\n\nGrade:\n${gradeInfo.grade}\n\nRanking:\n#${ranking}\n\nSilakan lihat laporan PDF yang terlampir.\n\nTerima kasih atas dedikasi dan kontribusi Anda untuk Le Parla Café.\n\nSalam,\nManagement Le Parla Café`,
        status: "Delivered" as const,
        timestamp: new Date().toLocaleString("id-ID"),
        type: "Staff" as const
      };
    });

    // Add Owner summary log
    const highestScore = Math.max(...kpiRecords.map(r => calculateStaffKPI(r)));
    const lowestScore = Math.min(...kpiRecords.map(r => calculateStaffKPI(r)));
    const avgScore = Math.round(kpiRecords.reduce((sum, r) => sum + calculateStaffKPI(r), 0) / kpiRecords.length);
    const topPerformer = kpiRecords.reduce((max, r) => calculateStaffKPI(r) > calculateStaffKPI(max) ? r : max, kpiRecords[0]);

    newLogs.unshift({
      id: `wa-owner-${Date.now()}`,
      sender: "Le Parla Management",
      recipient: "Dario Owner (HQ)",
      phone: "628123456789",
      message: `LE PARLA CAFÉ MONTHLY KPI SUMMARY\n\nTotal Staff:\n${kpiRecords.length}\n\nTop Performer:\n${topPerformer.name}\n\nHighest Score:\n${highestScore}/100\n\nLowest Score:\n${lowestScore}/100\n\nAverage KPI:\n${avgScore}\n\nEmployee of The Month:\n${topPerformer.name} (${topPerformer.role})`,
      status: "Delivered" as const,
      timestamp: new Date().toLocaleString("id-ID"),
      type: "Owner" as const
    });

    setWhatsappLogs(prev => [...newLogs, ...prev]);
    showToast(`✓ Pesan Broadcast WhatsApp berhasil dikirim ke ${kpiRecords.length} staff & Owner Ringkasan Terkirim!`);
  };

  const triggerExportPresentation = () => {
    // PPT simulator download
    const filename = `Le_Parla_Cafe_KPI_Presentation_${selectedMonth.replace(" ", "_")}.pptx`;
    const docContent = `Le Parla Cafe Enterprise Monthly Presentation\nPeriod: ${selectedMonth}\nTotal Crew: ${kpiRecords.length} staff\nAverage KPI Score: 92%`;
    simulateDownload(filename, docContent);
    showToast(`✓ Sukses membuat Presentasi PPT interaktif: "${filename}"`);
  };

  const triggerExportPDF = () => {
    // Generate Window Print or simulation
    window.print();
    showToast("✓ Sukses mencetak Berkas PDF Terpilih.");
  };

  const triggerExportExcel = () => {
    // Generate real CSV of rankings
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Ranking,Nama,Posisi,Kehadiran,Ketepatan Waktu,Sales,Upselling,SOP,Kepuasan Pelanggan,Kerja Tim,Skor KPI,Grade\n";
    
    kpiRecords
      .map(r => ({ ...r, calculatedScore: calculateStaffKPI(r) }))
      .sort((a, b) => b.calculatedScore - a.calculatedScore)
      .forEach((r, idx) => {
        csvContent += `${idx + 1},${r.name},${r.role},${r.attendance}%,${r.punctuality}%,${r.sales}%,${r.upselling}%,${r.sopCompliance}%,${r.customerSatisfaction},${r.teamwork},${r.calculatedScore},${getKpiGrade(r.calculatedScore).grade}\n`;
      });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Le_Parla_Cafe_KPI_Rankings_${selectedMonth.replace(" ", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("✓ Berkas file CSV/Excel berhasil diekspor & diunduh.");
  };

  const triggerViewRankings = () => {
    setActiveTab("dashboard");
    showToast("Fokus tampilan: Klasemen peringkat performa staff.");
  };

  const triggerViewBranchComparison = () => {
    setActiveTab("dashboard");
    const container = document.getElementById("branch-comparison-card");
    if (container) {
      container.scrollIntoView({ behavior: "smooth" });
    }
    showToast("Menavigasi ke metrik komparasi multi-outlet.");
  };

  const simulateDownload = (filename: string, text: string) => {
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper type interface
  type CustomStaffKPIDataRec = typeof kpiRecords[0];

  // Statistics Summary
  const calculatedScores = kpiRecords.map(r => calculateStaffKPI(r));
  const avgKpiScore = calculatedScores.length ? Math.round(calculatedScores.reduce((sum, s) => sum + s, 0) / calculatedScores.length) : 0;
  const highestKpiScore = calculatedScores.length ? Math.max(...calculatedScores) : 0;
  const lowestKpiScore = calculatedScores.length ? Math.min(...calculatedScores) : 0;
  
  // Find top performer and lowest performer
  const sortedStaffWithScores = [...kpiRecords]
    .map(r => ({ ...r, finalScore: calculateStaffKPI(r) }))
    .sort((a, b) => b.finalScore - a.finalScore);
  
  const topPerformer = sortedStaffWithScores[0] || { name: "Tidak ada", finalScore: 0, role: "—" };
  const lowestPerformer = sortedStaffWithScores[sortedStaffWithScores.length - 1] || { name: "Tidak ada", finalScore: 0, role: "—" };

  // Personal Login check fallback
  // If user is logged in as a Barista, Cashier, or Kitchen, we target their personal ID
  const personalCredentialId = currentUser?.id || "u4"; // fallbacks to "Adit Barista" if system simulation
  const hasOnlyPersonalAccess = !isOwner && !isManager;

  useEffect(() => {
    if (hasOnlyPersonalAccess) {
      // Force selected staff to be the logged in user
      const foundMatch = kpiRecords.find(k => k.userId === currentUser?.id || k.name.toLowerCase().includes((currentUser?.name || "").toLowerCase()));
      if (foundMatch) {
        setSelectedStaffId(foundMatch.userId);
      } else {
        setSelectedStaffId("u4"); // Default Adit Barista
      }
      setActiveTab("pdf_preview"); // Instantly show their premium 5-page report booklet!
    }
  }, [currentUser, hasOnlyPersonalAccess]);

  // Update staff scores form parameters
  const [editAttendance, setEditAttendance] = useState(90);
  const [editPunctuality, setEditPunctuality] = useState(90);
  const [editSales, setEditSales] = useState(100);
  const [editUpselling, setEditUpselling] = useState(85);
  const [editSop, setEditSop] = useState(90);
  const [editSatisfaction, setEditSatisfaction] = useState(4.5);
  const [editTeamwork, setEditTeamwork] = useState(90);

  const [editStrengths, setEditStrengths] = useState("");
  const [editImprovements, setEditImprovements] = useState("");
  const [editTraining, setEditTraining] = useState("");
  const [editAppreciation, setEditAppreciation] = useState("");
  const [editRewardType, setEditRewardType] = useState<"None" | "Employee of The Month" | "Best Sales" | "Best Attendance" | "Best Customer Service" | "Best Team Player">("None");
  const [editSalary, setEditSalary] = useState(4500000);

  // Sync state values on selected staff swap
  useEffect(() => {
    if (selectedStaff) {
      setEditAttendance(selectedStaff.attendance);
      setEditPunctuality(selectedStaff.punctuality);
      setEditSales(selectedStaff.sales);
      setEditUpselling(selectedStaff.upselling);
      setEditSop(selectedStaff.sopCompliance);
      setEditSatisfaction(selectedStaff.customerSatisfaction);
      setEditTeamwork(selectedStaff.teamwork);
      
      setEditStrengths(selectedStaff.strengths || "");
      setEditImprovements(selectedStaff.improvements || "");
      setEditTraining(selectedStaff.training || "");
      setEditAppreciation(selectedStaff.ownerAppreciation || "");
      setEditRewardType(selectedStaff.selectedRewardType || "None");
      setEditSalary(selectedStaff.baseSalary || 4500000);
      setEditBranchId(selectedStaff.branchId || "Pusat Pangkalpinang (HQ)");
    }
  }, [selectedStaffId]);

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate bounds
    if (editAttendance < 0 || editAttendance > 100 || editPunctuality < 0 || editPunctuality > 100) {
      alert("Nilai Persentase harus bernilai antara 0 s.d 100!");
      return;
    }

    const rewardMap: Record<string, number> = {
      None: 0,
      "Employee of The Month": 1000000,
      "Best Sales": 500000,
      "Best Attendance": 250000,
      "Best Customer Service": 500000,
      "Best Team Player": 250000
    };

    setKpiRecords(prev => prev.map(rec => {
      if (rec.userId === selectedStaffId) {
        return {
          ...rec,
          attendance: editAttendance,
          punctuality: editPunctuality,
          sales: editSales,
          upselling: editUpselling,
          sopCompliance: editSop,
          customerSatisfaction: editSatisfaction,
          teamwork: editTeamwork,
          strengths: editStrengths,
          improvements: editImprovements,
          training: editTraining,
          ownerAppreciation: editAppreciation,
          selectedRewardType: editRewardType,
          rewardAmount: rewardMap[editRewardType] || 0,
          baseSalary: editSalary,
          branchId: editBranchId
        };
      }
      return rec;
    }));

    showToast(`✓ Berhasil memperbarui evaluasi & kalkulasi KPI untuk ${selectedStaff.name}.`);

    // Log this action
    if (state.auditLogs) {
      state.auditLogs.unshift({
        id: `audit-mod-${Date.now()}`,
        user: currentUser?.name || "System",
        role: activeRole,
        action: `Mengedit kriteria & evaluasi KPI untuk ${selectedStaff.name}`,
        page: "KPI & Performa",
        timestamp: new Date().toLocaleTimeString(),
        device: "Corporate Console",
        ip: "127.0.0.1"
      });
    }

    // Refresh AI Performance report text
    const updatedScore = calculateStaffKPI({
      attendance: editAttendance,
      punctuality: editPunctuality,
      sales: editSales,
      upselling: editUpselling,
      sopCompliance: editSop,
      customerSatisfaction: editSatisfaction,
      teamwork: editTeamwork,
    } as any);

    generateAiPerformanceAnalysis(selectedStaff.name, selectedStaff.role, updatedScore, {
      attendance: editAttendance,
      punctuality: editPunctuality,
      sales: editSales,
      upselling: editUpselling,
      sopCompliance: editSop,
      customerSatisfaction: editSatisfaction,
      teamwork: editTeamwork,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#D4A853] text-emerald-950 font-bold border border-amber-300 shadow-2xl px-5 py-3 rounded-2xl z-50 animate-slideUp flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-spin text-emerald-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Container with Logo & Premium Palette Styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-br from-emerald-950 to-[#051c0f] border border-amber-500/10 p-6 md:p-8 rounded-3xl gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-amber-500/10 border-2 border-[#D4A853]/30 rounded-2xl flex items-center justify-center text-4xl filter drop-shadow-[0_4px_12px_rgba(212,168,83,0.2)]">
            ⚜️
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-[#D4A853] font-bold">Le Parla Café Enterprise</div>
            <h1 className="font-serif font-extrabold text-2xl md:text-3xl text-amber-50 tracking-wide mt-0.5">
              Portal Manajemen KPI & Performa
            </h1>
            <p className="text-xs text-amber-100/50 mt-1 max-w-xl">
              Platform evaluasi bulan berjalan, kalkulasi bobot otomatis, serta integrasi pengiriman pesan otomatis WhatsApp dan Generator PDF untuk seluruh kru.
            </p>
          </div>
        </div>

        {/* Action controls / Month picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#04150b] border border-amber-500/10 px-3 py-2 rounded-xl text-xs font-mono text-amber-100 gap-2">
            <span className="text-[10px] text-amber-400 font-bold">PERIODE:</span>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="bg-transparent text-amber-100 font-bold outline-none cursor-pointer"
            >
              <option value="Mei 2026" className="bg-emerald-950">Mei 2026 (Aktif)</option>
              <option value="April 2026" className="bg-emerald-950">April 2026</option>
              <option value="Maret 2026" className="bg-emerald-950">Maret 2026</option>
            </select>
          </div>

          <div className="text-xs text-amber-100/40 font-mono bg-emerald-950 border border-emerald-900 px-3 py-2 rounded-xl flex items-center gap-1.5">
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping"></span>
            Cloud Dev Node Secure
          </div>
        </div>
      </div>

      {/* OWNER INTERACTIVE CONTROL BAR (8 Triggers demanded by checklist) */}
      {isManagement && (
        <div className="bg-emerald-950/60 border border-amber-500/15 p-5 rounded-3xl space-y-3">
          <div className="text-[10px] uppercase font-mono text-[#D4A853] font-bold tracking-widest flex items-center gap-1">
            <Sliders className="h-3 w-3" /> Panel Utama Owner & Manager KPI Controls
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <button 
              id="kpi-trigger-calc"
              onClick={triggerGenerateKPI}
              className="px-3 py-2.5 bg-emerald-900/40 hover:bg-emerald-900 border border-emerald-800 hover:border-[#D4A853]/30 transition duration-200 rounded-xl text-[11px] font-bold text-amber-100/90 hover:text-amber-100 flex flex-col items-center justify-center gap-1 text-center"
              title="Hitung ulang bobot & status nilai staff"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#D4A853] animate-spin-slow" />
              <span>Generate KPI</span>
            </button>

            <button 
              id="kpi-trigger-reports"
              onClick={triggerGenerateAllReports}
              className="px-3 py-2.5 bg-emerald-900/40 hover:bg-emerald-900 border border-emerald-800 hover:border-[#D4A853]/30 transition duration-200 rounded-xl text-[11px] font-bold text-amber-100/90 hover:text-amber-100 flex flex-col items-center justify-center gap-1 text-center"
              title="Otomasi buat booklet PDF 5 halaman bagi semua kru"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-300" />
              <span>Generate Reports</span>
            </button>

            <button 
              id="kpi-trigger-whatsapp"
              onClick={triggerSendWhatsAppReports}
              className="px-3 py-2.5 bg-[#14532d] hover:bg-emerald-800 border border-emerald-700 hover:border-emerald-500/40 transition duration-200 rounded-xl text-[11px] font-bold text-emerald-50 flex flex-col items-center justify-center gap-1 text-center shadow-lg"
              title="Kirim pesan otomatis ke nomor pribadi staff & Owner"
            >
              <Smartphone className="h-3.5 w-3.5 text-[#D4A853]" />
              <span>Send WhatsApp</span>
            </button>

            <button 
              id="kpi-trigger-ppt"
              onClick={triggerExportPresentation}
              className="px-3 py-2.5 bg-emerald-900/40 hover:bg-emerald-900 border border-emerald-800 hover:border-[#D4A853]/30 transition duration-200 rounded-xl text-[11px] font-bold text-amber-100/90 hover:text-amber-100 flex flex-col items-center justify-center gap-1 text-center"
              title="Dapatkan slide presentasi PowerPoint instan"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D4A853]" />
              <span>Export PPT</span>
            </button>

            <button 
              id="kpi-trigger-print-pdf"
              onClick={triggerExportPDF}
              className="px-3 py-2.5 bg-emerald-900/40 hover:bg-emerald-900 border border-emerald-800 hover:border-[#D4A853]/30 transition duration-200 rounded-xl text-[11px] font-bold text-amber-100/90 hover:text-amber-100 flex flex-col items-center justify-center gap-1 text-center"
              title="Cetak/Simpan PDF"
            >
              <FileText className="h-3.5 w-3.5 text-amber-200" />
              <span>Export PDF Book</span>
            </button>

            <button 
              id="kpi-trigger-excel"
              onClick={triggerExportExcel}
              className="px-3 py-2.5 bg-emerald-900/40 hover:bg-emerald-900 border border-emerald-800 hover:border-[#D4A853]/30 transition duration-200 rounded-xl text-[11px] font-bold text-amber-100/90 hover:text-amber-100 flex flex-col items-center justify-center gap-1 text-center"
              title="Unduh dataset excel dalam format CSV terstruktur"
            >
              <Download className="h-3.5 w-3.5 text-emerald-300" />
              <span>Export Excel</span>
            </button>

            <button 
              id="kpi-trigger-view-rankings"
              onClick={triggerViewRankings}
              className="px-3 py-2.5 bg-emerald-900/40 hover:bg-emerald-900 border border-emerald-800 hover:border-[#D4A853]/30 transition duration-200 rounded-xl text-[11px] font-bold text-amber-100/90 hover:text-amber-100 flex flex-col items-center justify-center gap-1 text-center"
              title="Gulir ke peringkat tertinggi karyawan"
            >
              <Trophy className="h-3.5 w-3.5 text-[#D4A853]" />
              <span>View Rankings</span>
            </button>

            <button 
              id="kpi-trigger-branches"
              onClick={triggerViewBranchComparison}
              className="px-3 py-2.5 bg-emerald-900/40 hover:bg-emerald-900 border border-emerald-800 hover:border-[#D4A853]/30 transition duration-200 rounded-xl text-[11px] font-bold text-amber-100/90 hover:text-amber-100 flex flex-col items-center justify-center gap-1 text-center"
              title="Metrik analisis outlet satelit"
            >
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span>Branch Comp</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation System */}
      <div className="flex border-b border-amber-500/10">
        {isManagement && (
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-5 py-3 text-xs font-bold tracking-wider transition ${
              activeTab === "dashboard"
                ? "text-[#D4A853] border-b-2 border-[#D4A853] bg-emerald-950/20"
                : "text-amber-100/40 hover:text-amber-100/80"
            }`}
          >
            📊 MONTHLY DASHBOARD
          </button>
        )}

        {isManagement && (
          <button
            onClick={() => setActiveTab("evaluation")}
            className={`px-5 py-3 text-xs font-bold tracking-wider transition ${
              activeTab === "evaluation"
                ? "text-[#D4A853] border-b-2 border-[#D4A853] bg-emerald-950/20"
                : "text-amber-100/40 hover:text-amber-100/80"
            }`}
          >
            ✏️ KELOLA EVALUASI & KPI (WEIGHTS)
          </button>
        )}

        <button
          onClick={() => setActiveTab("pdf_preview")}
          className={`px-5 py-3 text-xs font-bold tracking-wider transition ${
            activeTab === "pdf_preview"
              ? "text-[#D4A853] border-b-2 border-[#D4A853] bg-emerald-950/20"
              : "text-amber-100/40 hover:text-amber-100/80"
          }`}
        >
          📄 EMPLOYEE BOOKLET PDF
        </button>

        {isManagement && (
          <button
            onClick={() => setActiveTab("whatsapp_portal")}
            className={`px-5 py-3 text-xs font-bold tracking-wider transition ${
              activeTab === "whatsapp_portal"
                ? "text-[#D4A853] border-b-2 border-[#D4A853] bg-emerald-950/20"
                : "text-amber-100/40 hover:text-amber-100/80"
            }`}
          >
            💬 WHATSAPP PERFORMANCE OUTLET
          </button>
        )}

        {isManagement && (
          <button
            onClick={() => setActiveTab("rewards")}
            className={`px-5 py-3 text-xs font-bold tracking-wider transition ${
              activeTab === "rewards"
                ? "text-[#D4A853] border-b-2 border-[#D4A853] bg-emerald-950/20"
                : "text-amber-100/40 hover:text-amber-100/80"
            }`}
          >
            🏆 REWARD SYSTEM (IDR)
          </button>
        )}

        {isManagement && (
          <button
            onClick={() => setActiveTab("outlets")}
            className={`px-5 py-3 text-xs font-bold tracking-wider transition ${
              activeTab === "outlets"
                ? "text-[#D4A853] border-b-2 border-[#D4A853] bg-emerald-950/20"
                : "text-amber-100/40 hover:text-amber-100/80"
            }`}
          >
            🏪 OUTLET CONFIG
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. MONTHLY PERFORMANCE DASHBOARD (MANAGEMENT ROLE ONLY) */}
      {/* ========================================================= */}
      {activeTab === "dashboard" && isManagement && (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#051c0f]/80 border border-amber-500/10 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-300">TOTAL KRU TERUKUR</span>
                <div className="text-3xl font-bold text-amber-50 mt-1">{kpiRecords.length} Staff</div>
                <div className="text-[9px] text-[#D4A853] font-mono mt-0.5">Le Parla Caffè Pangkalpinang (HQ)</div>
              </div>
              <div className="h-12 w-12 bg-[#D4A853]/10 border border-[#D4A853]/25 text-[#D4A853] rounded-xl flex items-center justify-center text-xl font-bold font-serif">
                👥
              </div>
            </div>

            <div className="bg-[#051c0f]/80 border border-amber-500/10 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400">RATA-RATA SKOR KPI</span>
                <div className="text-3xl font-bold text-amber-50 mt-1">{avgKpiScore}</div>
                <div className="text-[9px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                  <span className="h-2 w-2 bg-emerald-400 rounded-full inline-block"></span>
                  Grade {getKpiGrade(avgKpiScore).grade}
                </div>
              </div>
              {/* Custom SVG Progress Circle */}
              <div className="relative h-14 w-14">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="24" className="stroke-emerald-950 fill-none" strokeWidth="4" />
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="24" 
                    className="stroke-[#D4A853] fill-none" 
                    strokeWidth="4" 
                    strokeDasharray={150.7} 
                    strokeDashoffset={150.7 - (150.7 * avgKpiScore) / 100} 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-200">
                  {avgKpiScore}%
                </div>
              </div>
            </div>

            <div className="bg-[#051c0f]/80 border border-amber-500/10 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-300">TOP PERFORMER</span>
                <div className="text-sm font-bold text-amber-50 mt-1 line-clamp-1">{topPerformer.name}</div>
                <div className="text-[9px] text-amber-200 font-mono mt-0.5 uppercase">
                  Score: **{topPerformer.finalScore}%** ({topPerformer.role})
                </div>
              </div>
              <div className="h-10 w-10 bg-amber-500/10 border border-[#D4A853]/30 text-[#D4A853] rounded-xl flex items-center justify-center text-lg">
                👑
              </div>
            </div>

            <div className="bg-[#051c0f]/80 border border-amber-500/10 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-red-400">LOWEST PERFORMER</span>
                <div className="text-sm font-bold text-amber-50 mt-1 line-clamp-1">{lowestPerformer.name}</div>
                <div className="text-[9px] text-red-200 font-mono mt-0.5 uppercase">
                  Score: **{lowestPerformer.finalScore}%** ({lowestPerformer.role})
                </div>
              </div>
              <div className="h-10 w-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center text-lg">
                ⚠️
              </div>
            </div>
          </div>

          {/* Interactive Staff rankings (Klasemen) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#051c0f]/80 border border-amber-500/10 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-amber-100 text-lg">Klasemen Kinerja Kru {selectedMonth}</h3>
                  <p className="text-[10px] text-amber-100/40">Hasil peringkat berdasarkan 7 komponen penilai utama (Waktu, Hadir, Sales, SOP, Kepuasan, Tim, Upsell).</p>
                </div>
                <Trophy className="h-5 w-5 text-[#D4A853]" />
              </div>

              {/* Grid headers */}
              <div className="space-y-2 mt-4">
                {sortedStaffWithScores.map((staff, index) => {
                  const gradeInfo = getKpiGrade(staff.finalScore);
                  return (
                    <div 
                      key={staff.userId} 
                      onClick={() => {
                        setSelectedStaffId(staff.userId);
                        showToast(`Difokuskan ke: ${staff.name}`);
                      }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl transition duration-200 cursor-pointer ${
                        selectedStaffId === staff.userId 
                          ? "bg-emerald-950/60 border-[#D4A853]/40" 
                          : "bg-emerald-950/20 border-emerald-900/30 hover:bg-emerald-950/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-mono text-[#D4A853] font-bold w-6">
                          #{index + 1}
                        </div>
                        <img 
                          src={staff.photoUrl} 
                          alt={staff.name} 
                          className="h-9 w-9 rounded-full object-cover border border-[#D4A853]/30" 
                        />
                        <div>
                          <div className="text-xs font-bold text-amber-50">{staff.name}</div>
                          <div className="text-[10px] text-amber-100/40">{staff.role} • {staff.branchId}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 sm:mt-0 justify-between sm:justify-start">
                        {/* Attendance, Sales, SOP Mini indicator */}
                        <div className="flex gap-1.5 text-[9px] font-mono text-amber-100/50">
                          <span title="Attendance Rate">AD: {staff.attendance}%</span>
                          <span title="Sales Achieved">SL: {staff.sales}%</span>
                          <span title="SOP Compliance">SOP: {staff.sopCompliance}%</span>
                        </div>

                        {/* Overall score */}
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="text-sm font-bold text-amber-100">{staff.finalScore}%</div>
                            <div className={`text-[8px] font-mono px-1 rounded border overflow-hidden truncate ${gradeInfo.color}`}>
                              {gradeInfo.grade.split(" ")[0]}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-amber-100/30" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Performance Summary & Monthly Trends charts */}
            <div className="bg-[#051c0f]/80 border border-amber-500/10 p-6 rounded-3xl space-y-6">
              <div>
                <h3 className="font-serif font-bold text-amber-100 text-base">Metrik Rata-Rata Departemen</h3>
                <p className="text-[10px] text-amber-100/40">Grafik pencapaian rasio KPI berjenjang divisi.</p>
              </div>

              {/* Department Ranking Custom Bars */}
              <div className="space-y-4">
                {[
                  { name: "Management Div", score: 94, color: "bg-[#D4A853]" },
                  { name: "Head Barista", score: 92, color: "bg-[#D4A853]" },
                  { name: "Barista (Brewers)", score: 91, color: "bg-emerald-500" },
                  { name: "Kitchen Crew", score: 90, color: "bg-[#D4A853]/80" },
                  { name: "Cashier (POS)", score: 82, color: "bg-yellow-500" }
                ].map((dept, index) => (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-amber-100/70">{dept.name}</span>
                      <span className="font-mono text-[#D4A853] font-bold">{dept.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-emerald-950 rounded-full overflow-hidden">
                      <div className={`h-full ${dept.color}`} style={{ width: `${dept.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Monthly Trend curves representation using pure SVG */}
              <div className="space-y-2 pt-2 border-t border-amber-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-100">Tren KPI Le Parla (3 Bulan Terakhir)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">+4.2% Kenaikan</span>
                </div>
                
                {/* SVG Curve chart */}
                <div className="h-28 bg-[#04150b]/80 border border-emerald-950 rounded-2xl flex flex-col justify-end p-2 overflow-hidden relative">
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-16 absolute bottom-1 left-0 right-0">
                    <path 
                      d="M0,25 Q15,20 30,18 T60,11 T90,5 T100,6" 
                      fill="none" 
                      stroke="#D4A853" 
                      strokeWidth="2.5" 
                    />
                    <path 
                      d="M0,25 Q15,20 30,18 T60,11 T90,5 T100,6 L100,30 L0,30 Z" 
                      fill="url(#gradient-line)" 
                      opacity="0.15" 
                    />
                    <defs>
                      <linearGradient id="gradient-line" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A853" />
                        <stop offset="100%" stopColor="#04150b" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="flex justify-between text-[8px] font-mono text-amber-100/35 relative z-10 w-full mt-auto px-1">
                    <span>Maret (86%)</span>
                    <span>April (89%)</span>
                    <span>Mei (92%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Weights & Components breakdown (Owner Info display) */}
          <div className="bg-[#051c0f]/80 border border-amber-500/10 p-6 rounded-3xl">
            <h3 className="font-serif font-bold text-amber-100 text-base mb-4">Bobot Penilaian Otomatis (Monthly KPI weights - Total 100%)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              {[
                { title: "Attendance", weight: "20%", icon: "📋", color: "border-emerald-600/30" },
                { title: "Punctuality", weight: "10%", icon: "⏰", color: "border-[#D4A853]/40" },
                { title: "Sales Perf", weight: "20%", icon: "💰", color: "border-emerald-600/30" },
                { title: "Upselling", weight: "15%", icon: "☕", color: "border-[#D4A853]/40" },
                { title: "SOP Compl.", weight: "15%", icon: "✅", color: "border-emerald-600/30" },
                { title: "Cust Satisf.", weight: "10%", icon: "⭐️", color: "border-[#D4A853]/40" },
                { title: "Teamwork", weight: "10%", icon: "🤝", color: "border-emerald-600/30" }
              ].map(item => (
                <div key={item.title} className={`bg-[#04150b]/80 border ${item.color} rounded-2xl p-3.5 space-y-1`}>
                  <div className="text-2xl">{item.icon}</div>
                  <div className="text-[10px] font-bold text-amber-100/80 mt-1 truncate">{item.title}</div>
                  <div className="text-sm font-extrabold text-[#D4A853] font-mono">{item.weight}</div>
                </div>
              ))}
            </div>
          </div>

          {/* BRANCH COMPARISON (Scanned by view branch comparison metric query layout) */}
          <div id="branch-comparison-card" className="bg-[#051c0f]/80 border border-amber-500/10 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-amber-100 text-base">Komparasi Outlet Satelit Le Parla Café</h3>
                <p className="text-[10px] text-amber-100/40">Perbandingan real-time performa rata-rata multi-cabang.</p>
              </div>
              <MapPin className="h-4 w-4 text-[#D4A853]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Pusat Pangkalpinang (HQ)", score: "93%", revenue: "Rp 122M", crew: 5 },
                { name: "Cabang Pangkalpinang Timur", score: "88%", revenue: "Rp 88M", crew: 3 },
                { name: "Cabang Pangkalpinang Barat", score: "91%", revenue: "Rp 104M", crew: 4 }
              ].map(b => (
                <div key={b.name} className="bg-[#04150b]/80 border border-emerald-900/40 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-100">{b.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#D4A853]/10 text-[#D4A853] font-mono border border-[#D4A853]/20">{b.score} Avg KPI</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-950 text-[10px] font-mono">
                    <div>
                      <span className="text-amber-100/30 font-sans block">Monthly Rev:</span>
                      <span className="text-amber-100 font-bold">{b.revenue}</span>
                    </div>
                    <div>
                      <span className="text-amber-100/30 font-sans block">Staff Count:</span>
                      <span className="text-amber-100 font-bold">{b.crew} Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MANAGE EVALUATION & KPI COMPONENTS (MANAGEMENT ROLE ONLY) */}
      {/* ========================================================= */}
      {activeTab === "evaluation" && isManagement && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* User selector column */}
          <div className="bg-[#051c0f]/80 border border-amber-500/10 p-5 rounded-3xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-amber-50">Pilih Kru Karyawan</h3>
            <p className="text-[10px] text-amber-100/40">Isi dan revisi skor serta penilaian AI performa untuk kru di bawah ini.</p>
            
            <div className="space-y-2">
              {kpiRecords.map(r => {
                const calculated = calculateStaffKPI(r);
                const isSelected = r.userId === selectedStaffId;
                return (
                  <button
                    key={r.userId}
                    onClick={() => {
                      setSelectedStaffId(r.userId);
                      showToast(`Form diisi dengan data: ${r.name}`);
                    }}
                    className={`w-full text-left p-3 border rounded-2xl flex items-center gap-3 transition ${
                      isSelected
                        ? "bg-emerald-950/60 border-[#D4A853]/40 text-[#D4A853]"
                        : "bg-[#04150b]/80 border-emerald-950 hover:bg-emerald-950/30 text-amber-100"
                    }`}
                  >
                    <img src={r.photoUrl} alt={r.name} className="h-8 w-8 rounded-full object-cover border border-[#D4A853]/20" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{r.name}</div>
                      <div className="text-[9px] text-amber-100/40 truncate">{r.role} • KPI: {calculated}%</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form evaluation editor column (2/3 cols) */}
          <form onSubmit={handleSaveEvaluation} className="lg:col-span-2 bg-[#051c0f]/80 border border-amber-500/10 p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-amber-500/10 pb-4">
              <div className="flex items-center gap-3">
                <img src={selectedStaff.photoUrl} alt={selectedStaff.name} className="h-10 w-10 rounded-full object-cover border border-[#D4A853]/40" />
                <div>
                  <h3 className="font-serif font-bold text-amber-50 text-base">{selectedStaff.name}</h3>
                  <p className="text-[10px] text-[#D4A853] font-mono">{selectedStaff.role} - Le Parla Café ({selectedStaff.branchId})</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] block font-mono text-amber-400">KALKULASI KPI</span>
                <span className="text-xl font-extrabold text-[#D4A853] font-mono">{calculateStaffKPI(selectedStaff)}/100</span>
              </div>
            </div>

            {/* Weights editor fields */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-amber-250 block uppercase tracking-widest text-[#D4A853]">1. Komponen Metrik Skor (0 s.d 100)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Kehadiran / Attendance (Bobot 20%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={editAttendance} 
                    onChange={(e) => setEditAttendance(Number(e.target.value))} 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2 text-xs text-amber-100 outline-none" 
                  />
                  <span className="text-[9px] text-amber-100/40 mt-1 block">Tingkat kehadiran presensi harian staff.</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Ketepatan Waktu / Punctuality (Bobot 10%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={editPunctuality} 
                    onChange={(e) => setEditPunctuality(Number(e.target.value))} 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2 text-xs text-amber-100 outline-none" 
                  />
                  <span className="text-[9px] text-amber-100/40 mt-1 block">Nilai dispensasi toleransi keterlambatan log masuk.</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Pencapaian Target Sales (Bobot 20%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="120" 
                    value={editSales} 
                    onChange={(e) => setEditSales(Number(e.target.value))} 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2 text-xs text-amber-100 outline-none" 
                  />
                  <span className="text-[9px] text-amber-100/40 mt-1 block">Rasio pencapaian sales dibanding target unit (Max 120%).</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Keberhasilan Upselling (Bobot 15%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={editUpselling} 
                    onChange={(e) => setEditUpselling(Number(e.target.value))} 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2 text-xs text-amber-100 outline-none" 
                  />
                  <span className="text-[9px] text-amber-100/40 mt-1 block">Rasio penawaran upgrade add-on/susu Oatside seasonal.</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Kepatuhan Mandatori SOP (Bobot 15%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={editSop} 
                    onChange={(e) => setEditSop(Number(e.target.value))} 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2 text-xs text-amber-100 outline-none" 
                  />
                  <span className="text-[9px] text-amber-100/40 mt-1 block">Skor audit kebersihan, resep kalibrasi, & checklist harian.</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Kepuasan Pelanggan / CSAT (Bobot 10%)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="5" 
                    step="0.1" 
                    value={editSatisfaction} 
                    onChange={(e) => setEditSatisfaction(Number(e.target.value))} 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2 text-xs text-amber-100 outline-none" 
                  />
                  <span className="text-[9px] text-amber-100/40 mt-1 block">Skor ulasan Google Maps atau rating internal (Scale 1 s.d 5).</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Kerjasama Tim & Disiplin (Bobot 10%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={editTeamwork} 
                    onChange={(e) => setEditTeamwork(Number(e.target.value))} 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2 text-xs text-amber-100 outline-none" 
                  />
                  <span className="text-[9px] text-amber-100/40 mt-1 block">Asesmen subjektif dari Manager mengenai perilaku & teamwork.</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Gaji Pokok IDR (Keamanan: Locked dari Barista)</label>
                  <input 
                    type="number" 
                    value={editSalary} 
                    disabled={isManager && !isOwner} // Manager can't edit salary, only Owner
                    onChange={(e) => setEditSalary(Number(e.target.value))} 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2 text-xs text-amber-100 outline-none disabled:opacity-50" 
                  />
                  <span className="text-[9px] text-amber-100/40 mt-1 block">Hanya dapat dikelola penuh oleh akun Owner.</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Penempatan Outlet / Cabang</label>
                  <select 
                    value={editBranchId} 
                    onChange={(e) => setEditBranchId(e.target.value)} 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2 text-xs text-amber-100 outline-none" 
                  >
                    {outlets.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <span className="text-[9px] text-amber-100/40 mt-1 block">Wilayah penugasan harian karyawan saat ini.</span>
                </div>
              </div>
            </div>

            {/* Custom Strengths, areas, manager recommendations */}
            <div className="space-y-4 pt-4 border-t border-amber-500/10">
              <span className="text-xs font-bold text-amber-250 block uppercase tracking-widest text-[#D4A853]">2. Ulasan & Rekomendasi Evaluasi Manager</span>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Kekuatan Utama (Strengths)</label>
                  <input 
                    type="text" 
                    value={editStrengths} 
                    onChange={(e) => setEditStrengths(e.target.value)} 
                    placeholder="Contoh: Sangat disiplin dan kalibrasi espresso akurat..." 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2.5 text-xs text-amber-100 outline-none" 
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Area Pengembangan (Improvement Areas)</label>
                  <input 
                    type="text" 
                    value={editImprovements} 
                    onChange={(e) => setEditImprovements(e.target.value)} 
                    placeholder="Contoh: Mengurangi waste susu sisa pitcher..." 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2.5 text-xs text-amber-100 outline-none" 
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Rekomendasi Pelatihan (Training Requirements)</label>
                  <input 
                    type="text" 
                    value={editTraining} 
                    onChange={(e) => setEditTraining(e.target.value)} 
                    placeholder="Contoh: Pelatihan Up-selling Mastery..." 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2.5 text-xs text-amber-100 outline-none" 
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Apresiasi & Catatan Berharga Owner (Apresiasi Owner)</label>
                  <textarea 
                    value={editAppreciation} 
                    onChange={(e) => setEditAppreciation(e.target.value)} 
                    placeholder="Pesan terimakasih personal dari Owner Le Parla Café..." 
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2.5 text-xs text-amber-100 outline-none h-20 resize-none animate-fadeIn" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Rekomendasi Penghargaan (Reward Scheme)</label>
                    <select 
                      value={editRewardType} 
                      onChange={(e) => setEditRewardType(e.target.value as any)} 
                      className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2.5 text-xs text-amber-100 outline-none"
                    >
                      <option value="None">Tidak ada (None)</option>
                      <option value="Employee of The Month">Employee of The Month (Rp 1.000.000)</option>
                      <option value="Best Sales">Best Sales (Rp 500.000)</option>
                      <option value="Best Attendance">Best Attendance (Rp 250.000)</option>
                      <option value="Best Customer Service">Best Customer Service (Rp 500.000)</option>
                      <option value="Best Team Player">Best Team Player (Rp 250.000)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-amber-500/10">
              <button 
                type="button" 
                onClick={() => {
                  setSelectedStaffId("u4");
                  showToast("Rebound ke pengaturan asal.");
                }} 
                className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-amber-100/60 rounded-xl text-xs font-bold font-mono transition"
              >
                Reset Form
              </button>
              
              <button 
                type="submit" 
                className="px-5 py-2.5 bg-[#D4A853] hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-extrabold transition shadow flex items-center gap-1.5"
              >
                <CheckCircle className="h-4 w-4" /> Simpan & Generate AI Analisis
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. EMPLOYEE PERFORMANCE BOOKLET PDF PREVIEW (ALL ROLES) */}
      {/* ========================================================= */}
      {activeTab === "pdf_preview" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-amber-100 text-lg">Employee Performance Review (Booklet PDF Preview)</h3>
              <p className="text-[10px] text-amber-100/40">Visualisasi 5 halaman laporan premium Le Parla Café dalam format cetak interaktif.</p>
            </div>

            {/* Quick staff picker if not restricted */}
            {!hasOnlyPersonalAccess && (
              <div className="flex items-center gap-2 bg-[#04150b] border border-amber-500/10 px-3 py-1.5 rounded-xl">
                <span className="text-[9px] text-[#D4A853] font-mono font-bold uppercase">Staff Review:</span>
                <select 
                  value={selectedStaffId} 
                  onChange={(e) => setSelectedStaffId(e.target.value)} 
                  className="bg-transparent text-xs font-bold text-amber-100 outline-none cursor-pointer"
                >
                  {kpiRecords.map(r => (
                    <option key={r.userId} value={r.userId} className="bg-emerald-950">{r.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Guide booklet tabs */}
            <div className="bg-[#051c0f]/80 border border-amber-500/10 p-5 rounded-3xl space-y-3">
              <div className="text-[10px] font-mono text-[#D4A853] uppercase tracking-wider font-bold">Menu Navigasi Halaman PDF</div>
              <div className="space-y-1.5">
                {[
                  { page: 1, label: "Halaman 1: Cover Premium", sub: "Logo, Name, Grade & Score" },
                  { page: 2, label: "Halaman 2: Performance Summary", sub: "Grafik bobot metrik performa" },
                  { page: 3, label: "Halaman 3: AI Analysis Insight", sub: "Rekomendasi tertulis asisten AI" },
                  { page: 4, label: "Halaman 4: Manager Evaluation", sub: "Strengths & Training recom." },
                  { page: 5, label: "Halaman 5: Owner Appreciation", sub: "Catatan promo reward personal" }
                ].map(item => (
                  <button
                    key={item.page}
                    onClick={() => {
                      setPdfActivePage(item.page);
                      showToast(`Halaman ${item.page}: ${item.label.split(":")[1]}`);
                    }}
                    className={`w-full text-left p-3 border rounded-xl flex flex-col transition ${
                      pdfActivePage === item.page
                        ? "bg-[#D4A853]/15 border-[#D4A853] text-[#D4A853]"
                        : "bg-[#04150b]/80 border-emerald-950/20 hover:bg-emerald-950/30 text-amber-100"
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[9px] text-amber-100/40 mt-0.5">{item.sub}</span>
                  </button>
                ))}
              </div>

              {/* Action indicators */}
              <div className="pt-4 border-t border-amber-500/10 space-y-2">
                <button 
                  onClick={triggerExportPDF}
                  className="w-full py-2 bg-emerald-900 border border-emerald-800 hover:border-[#D4A853]/40 transition text-amber-100 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="h-4 w-4 text-[#D4A853]" /> Cetak PDF Booklet
                </button>
                <div className="text-[9px] text-center text-amber-100/30 font-mono">Format cetak A4 otomatis tumpuk lurus.</div>
              </div>
            </div>

            {/* Premium Document View Canvas (Styled as luxurious Cream/Gold/Black paper card layout) */}
            <div className="lg:col-span-3 bg-[#FAF7F0] text-emerald-950 font-sans p-8 md:p-12 rounded-3xl shadow-2xl border-4 border-[#D4A853]/30 min-h-[680px] flex flex-col justify-between select-none relative overflow-hidden">
              {/* Internal watermark decor representing premium Le Parla */}
              <div className="absolute top-4 right-4 text-[9px] font-mono text-[#D4A853] opacity-60 tracking-widest pointer-events-none select-none uppercase font-bold">
                LE PARLA CAFÈ • CONFIDENTIAL ENTERPRISE REPORT
              </div>

              {/* PAGE 1: COVER PREMIUM */}
              {pdfActivePage === 1 && (
                <div className="space-y-6 flex flex-col items-center justify-center py-8 text-center flex-1">
                  <div className="text-5xl filter drop-shadow-[0_4px_12px_rgba(212,168,83,0.3)] select-none">⚜️</div>
                  <h2 className="font-serif font-extrabold text-[#051c0f] text-2xl tracking-wide uppercase">Le Parla Café</h2>
                  <div className="h-0.5 w-24 bg-[#D4A853] my-1"></div>
                  <p className="text-[11px] font-mono text-[#D4A853] uppercase tracking-widest">RAPORT KINERJA KARYAWAN ENTERPRISE</p>

                  <div className="my-8 relative">
                    <img 
                      src={selectedStaff.photoUrl} 
                      alt={selectedStaff.name} 
                      className="h-28 w-28 rounded-full border-4 border-[#D4A853] object-cover mx-auto shadow-xl" 
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#051c0f] border border-[#D4A853] text-amber-100 text-[10px] font-bold px-3 py-0.5 rounded-full font-mono uppercase truncate max-w-full">
                      {selectedStaff.role}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-xl text-[#051c0f]">{selectedStaff.name}</h3>
                    <p className="text-xs text-slate-500">{selectedStaff.branchId} • Periode {selectedMonth}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm w-full mx-auto bg-white border border-[#D4A853]/20 p-4 rounded-2xl shadow-sm mt-6">
                    <div className="text-center border-r border-[#051c0f]/10">
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">SKOR TOTAL KPI</span>
                      <span className="text-3xl font-extrabold text-[#D4A853] font-mono block mt-1">{calculateStaffKPI(selectedStaff)}%</span>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center">
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">GRID STATUS</span>
                      <span className="text-sm font-extrabold text-[#051c0f] mt-1 uppercase leading-none block">
                        {getKpiGrade(calculateStaffKPI(selectedStaff)).grade}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 2: PERFORMANCE SUMMARY */}
              {pdfActivePage === 2 && (
                <div className="space-y-6 flex-1">
                  <div className="border-b border-[#051c0f]/10 pb-3">
                    <h3 className="font-serif font-bold text-lg text-[#051c0f]">Performa Metrik Terperinci</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Breakdown bobot pembentuk pencapaian total 100% KPI.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Attendance (Kehadiran) - Bobot 20%", value: selectedStaff.attendance, color: "bg-[#051c0f]" },
                      { label: "Ketepatan Waktu (Punctuality) - Bobot 10%", value: selectedStaff.punctuality, color: "bg-[#051c0f]" },
                      { label: "Sales Performance (Target Sales) - Bobot 20%", value: selectedStaff.sales, color: "bg-[#D4A853]" },
                      { label: "Upselling Achievement (Penawaran) - Bobot 15%", value: selectedStaff.upselling, color: "bg-[#051c0f]" },
                      { label: "SOP Compliance (Kepatuhan Audit) - Bobot 15%", value: selectedStaff.sopCompliance, color: "bg-[#D4A853]" },
                      { label: "Customer Satisfaction - Bobot 10%", value: Math.round((selectedStaff.customerSatisfaction / 5) * 100), color: "bg-[#051c0f]" },
                      { label: "Teamwork & Discipline - Bobot 10%", value: selectedStaff.teamwork, color: "bg-[#051c0f]" }
                    ].map(item => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{item.label}</span>
                          <span className="font-mono">{item.value}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${Math.min(100, item.value)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[9px] bg-white border border-[#D4A853]/15 p-3 rounded-xl text-center text-slate-400 font-mono italic mt-4">
                    Grafik di atas mematuhi standarisasi penimbangan performansi outlet enterprise Le Parla Café Indonesia yang ditandangani oleh Management.
                  </div>
                </div>
              )}

              {/* PAGE 3: AI PERFORMANCE ANALYSIS */}
              {pdfActivePage === 3 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="border-b border-[#051c0f]/10 pb-3">
                      <h3 className="font-serif font-bold text-lg text-[#051c0f]">Analisis Performa Berbasis AI Pintar</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Insight otomatisasi diolah langsung oleh model server Gemini AI berdasarkan data riil terkait.</p>
                    </div>

                    <div className="my-6 bg-white/80 border-l-4 border-[#D4A853] p-5 rounded-r-2xl shadow-sm text-xs text-[#051c0f]/80 leading-relaxed font-sans space-y-4">
                      {isGeneratingAi ? (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400 space-y-2">
                          <RefreshCw className="h-5 w-5 animate-spin text-[#D4A853]" />
                          <span className="font-mono text-[10px] uppercase">Model Gemini sedang mengevaluasi data...</span>
                        </div>
                      ) : (
                        <p>{aiAnalysisText || "Tidak ada respon analitik AI."}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#051c0f]/5 border border-[#D4A853]/20 p-4 rounded-xl flex items-center gap-3">
                    <div className="text-xl">💡</div>
                    <div className="text-[10px] text-slate-500 leading-normal">
                      <strong>Rekomendasi AI:</strong> Nilai upselling tinggi mengindikasikan kemampuan interpersonal yang istimewa. Sdr. <strong>{selectedStaff.name}</strong> cocok dimasukkan ke dalam program Mentoring Duta Brand musim depan.
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 4: MANAGER EVALUATION */}
              {pdfActivePage === 4 && (
                <div className="space-y-6 flex-1">
                  <div className="border-b border-[#051c0f]/10 pb-3">
                    <h3 className="font-serif font-bold text-lg text-[#051c0f]">Asesmen & Evaluasi Kepala Cabang</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Disusun dan divalidasi langsung oleh Kepala Cabang / Supervisor yang bertugas.</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="bg-white/80 p-4 rounded-2xl border border-slate-200">
                      <span className="font-mono text-[9px] text-[#D4A853] uppercase block font-bold">KEKUATAN UTAMA (STRENGTHS)</span>
                      <p className="text-[#051c0f] font-serif font-bold mt-1 text-xs">
                        {selectedStaff.strengths || "Belum ada catatan kekuatan dari Manager."}
                      </p>
                    </div>

                    <div className="bg-white/80 p-4 rounded-2xl border border-slate-200">
                      <span className="font-mono text-[9px] text-slate-400 uppercase block font-bold">AREA PENGEMBANGAN (AREAS OF IMPROVEMENT)</span>
                      <p className="text-slate-600 mt-1">
                        {selectedStaff.improvements || "Belum ada rekomendasi area pengembangan."}
                      </p>
                    </div>

                    <div className="bg-white/80 p-4 rounded-2xl border border-slate-200">
                      <span className="font-mono text-[9px] text-[#D4A853] uppercase block font-bold">REKOMENDASI PROGRAM PELATIHAN</span>
                      <p className="text-[#051c0f] font-mono mt-1 font-bold">
                        {selectedStaff.training || "Belum ditentukan judul diklat kompetensi."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 5: OWNER APPRECIATION & REWARDS SPECIAL */}
              {pdfActivePage === 5 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="border-b border-[#051c0f]/10 pb-3">
                      <h3 className="font-serif font-bold text-lg text-[#051c0f]">Apresiasi & Catatan Strategis Pemilik Usaha</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Pemberian skema promosi, mutasi, serta penghargaan moneter resmi Owner.</p>
                    </div>

                    <div className="my-5 bg-[#051c0f]/5 border border-[#D4A853]/20 p-5 rounded-2xl shadow-sm text-xs text-[#051c0f]/80 leading-relaxed font-sans font-serif italic">
                      &ldquo; {selectedStaff.ownerAppreciation || "Manajemen Le Parla Café menghargai kontribusi harian yang Anda dedikasikan untuk brand kita bersama."} &rdquo;
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border-2 border-dashed border-[#D4A853]/60 p-4 rounded-2xl flex flex-col justify-center text-center space-y-1">
                        <span className="text-[9px] font-mono text-slate-400 uppercase block">BONUS PRESTASI BULANAN</span>
                        {selectedStaff.selectedRewardType !== "None" ? (
                          <>
                            <div className="text-xs font-bold text-[#051c0f] uppercase tracking-wide">
                              🏆 {selectedStaff.selectedRewardType}
                            </div>
                            <div className="text-base font-extrabold text-[#D4A853] font-mono">
                              Rp {selectedStaff.rewardAmount.toLocaleString("id-ID")}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs font-bold text-slate-400 py-2">
                            Tidak ada insentif tambahan.
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-2">
                        <span className="text-[9px] font-mono text-[#051c0f]/60 uppercase block font-bold tracking-wider">
                          RINCIAN PERHITUNGAN PAYROLL
                        </span>
                        {(() => {
                          const { attendanceDeduction, punctualityPenalty, kpiBonus, kpiBonusRate, takeHomePay } = calculateSalaryBreakdown(selectedStaff);
                          return (
                            <div className="space-y-1 text-[#051c0f]/80 font-mono text-[9px]">
                              <div className="flex justify-between">
                                <span>Gaji Pokok:</span>
                                <span className="font-bold">Rp {selectedStaff.baseSalary.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between text-red-600">
                                <span>Denda Absen ({100 - selectedStaff.attendance}%):</span>
                                <span>-Rp {attendanceDeduction.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between text-red-600">
                                <span>Denda Telat ({100 - selectedStaff.punctuality}%):</span>
                                <span>-Rp {punctualityPenalty.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between text-emerald-700">
                                <span>Bonus Kinerja ({kpiBonusRate >= 0 ? "+" : ""}{Math.round(kpiBonusRate * 100)}%):</span>
                                <span>{kpiBonus >= 0 ? "+" : "-"}Rp {Math.abs(kpiBonus).toLocaleString("id-ID")}</span>
                              </div>
                              <div className="border-t border-slate-300 pt-1 flex justify-between text-[10px] font-bold text-[#051c0f] mt-1">
                                <span>Gaji Bersih:</span>
                                <span className="text-[#D4A853]">Rp {takeHomePay.toLocaleString("id-ID")}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Signatures mocks */}
                  <div className="grid grid-cols-2 gap-4 text-center text-[10px] pt-6 border-t border-slate-200 font-mono mt-4">
                    <div>
                      <span className="text-slate-400 block mb-6 font-sans">Divalidasi oleh:</span>
                      <span className="text-[#051c0f] font-bold block underline">Mega Manager</span>
                      <span className="text-slate-400 block text-[8px]">Supervisor Area Pangkalpinang</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-6 font-sans">Disetujui oleh:</span>
                      <span className="text-[#051c0f] font-bold block underline">Dario Owner</span>
                      <span className="text-[#D4A853] block text-[8px] font-bold">Principal Founder Le Parla</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Booklet pagination navigation */}
              <div className="flex items-center justify-between border-t border-[#051c0f]/10 pt-4 mt-6 text-xs font-mono text-slate-500">
                <button 
                  onClick={() => {
                    setPdfActivePage(prev => Math.max(1, prev - 1));
                  }} 
                  disabled={pdfActivePage === 1}
                  className="flex items-center gap-1 hover:text-[#051c0f] hover:font-bold transition disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                </button>
                
                <span>Halaman {pdfActivePage} dari 5</span>
                
                <button 
                  onClick={() => {
                    setPdfActivePage(prev => Math.min(5, prev + 1));
                  }} 
                  disabled={pdfActivePage === 5}
                  className="flex items-center gap-1 hover:text-[#051c0f] hover:font-bold transition disabled:opacity-40"
                >
                  Berikutnya <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. WHATSAPP AUTOMATION FEEDBACK (MANAGEMENT ROLE ONLY) */}
      {/* ========================================================= */}
      {activeTab === "whatsapp_portal" && isManagement && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Dispatcher Actions Column (5 cols) */}
          <div className="lg:col-span-5 bg-[#051c0f]/80 border border-amber-500/10 p-6 rounded-3xl space-y-6">
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-50">Siaran Pesan WhatsApp Otomatis</h3>
              <p className="text-[10px] text-amber-100/40">Gunakan gateway komunikasi terenkripsi kami untuk otomatisasi notifikasi skor.</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={triggerSendWhatsAppReports}
                className="w-full py-3 bg-[#14532d] hover:bg-emerald-800 transition rounded-xl text-xs font-bold text-emerald-50 flex items-center justify-center gap-2 border border-emerald-600 shadow-xl"
              >
                <Send className="h-4 w-4 text-[#D4A853]" /> Kirim Siaran Mei 2026 ke Semua Kru
              </button>

              {/* Template design visual preview */}
              <div className="bg-[#04150b]/80 border border-emerald-900/40 p-4 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-mono text-[#D4A853] font-bold block">1) FORMAT PESAN STAFF BULANAN:</span>
                <pre className="text-[10px] font-mono text-emerald-300/80 leading-normal bg-black/40 p-3 rounded-lg overflow-x-auto select-all whitespace-pre-wrap">
{`Halo {Nama Staff},

Laporan KPI Bulan Mei telah tersedia.

Skor KPI Anda:
{Score}/100

Grade:
{Grade}

Ranking:
#{Ranking}

Silakan lihat laporan PDF yang terlampir.

Terima kasih atas dedikasi dan kontribusi Anda untuk Le Parla Café.

Salam,
Management Le Parla Café`}
                </pre>
              </div>

              {/* Owner notification preview */}
              <div className="bg-[#04150b]/80 border border-emerald-900/40 p-4 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-mono text-[#D4A853] font-bold block">2) RINGKASAN REKAP OWNER TEMPLATE:</span>
                <pre className="text-[10px] font-mono text-emerald-300/80 leading-normal bg-black/40 p-3 rounded-lg overflow-x-auto select-all whitespace-pre-wrap">
{`LE PARLA CAFÉ MONTHLY KPI SUMMARY

Total Staff:
{TotalStaff}

Top Performer:
{TopPerformer}

Highest Score:
{HighestScore}

Lowest Score:
{LowestScore}

Average KPI:
{AverageScore}

Employee of The Month:
{EmployeeOfMonth}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Interactive Simulated Phone Dashboard representing WhatsApp logs (7 cols) */}
          <div className="lg:col-span-7 bg-[#051c0f]/80 border border-amber-500/10 p-6 rounded-3xl space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-amber-100 text-base">Simulasi Smartphone Gate Log</h3>
                <p className="text-[10px] text-amber-100/40">Log data pengiriman API WhatsApp terintegrasi yang berhasil ditransmit.</p>
              </div>
              <Smartphone className="h-4 w-4 text-[#D4A853]" />
            </div>

            {/* Simulated Phone screen */}
            <div className="bg-zinc-900 rounded-3xl p-4 border-4 border-zinc-700/50 flex-1 flex flex-col justify-between min-h-[480px]">
              {/* Phone Status bar */}
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pb-2 border-b border-zinc-800">
                <span>Le Parla WA API v2.1</span>
                <span>📶 LTE • 🔋 100%</span>
              </div>

              {/* Chat thread list simulator container */}
              <div className="flex-1 overflow-y-auto space-y-4 my-3 pr-1 max-h-[380px]">
                {whatsappLogs.length === 0 ? (
                  <div className="text-zinc-600 text-center text-xs py-12">Tidak ada log pesan WhatsApp Mei terkirim. Klik tombol sebelah kiri untuk mengirim broadcast.</div>
                ) : (
                  whatsappLogs.map(log => (
                    <div key={log.id} className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-zinc-600 font-mono">
                        <span>Penerima: **{log.recipient}** ({log.phone})</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <div className="bg-[#052e16] text-[#e8f5e9] border border-emerald-900/40 p-3 rounded-2xl text-xs space-y-1 relative">
                        <div className="flex items-center justify-between border-b border-emerald-900 pb-1 mb-1.5">
                          <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase ${log.type === "Owner" ? "bg-[#D4A853] text-[#051c0f]" : "bg-emerald-900 text-emerald-300"}`}>
                            {log.type === "Owner" ? "Owner Summary WA" : "Staff Report WA"}
                          </span>
                          <span className="text-[8px] text-emerald-400 font-bold">✓ DELIVERED</span>
                        </div>
                        <p className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input section mock */}
              <div className="flex items-center gap-2 bg-zinc-800 p-2 rounded-xl mt-auto">
                <div className="flex-1 text-[11px] text-zinc-500 pl-2 font-mono">Le Parla automated API is listening...</div>
                <div className="bg-emerald-600 h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. STAFF REWARDS MONETARY GRID (MANAGEMENT ROLE ONLY) */}
      {/* ========================================================= */}
      {activeTab === "rewards" && isManagement && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="font-serif font-[#D4A853] font-bold text-amber-100 text-lg">Staff Reward Program & Kebijakan Owner</h3>
            <p className="text-[10px] text-amber-100/40 font-mono">Definisikan skema insentif rupiah (IDR) bulanan untuk kru berprestasi terbaik Le Parla Café.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#051c0f]/80 border border-amber-500/10 p-5 rounded-2xl text-center space-y-3">
              <div className="text-3xl">🏅</div>
              <h4 className="font-serif font-bold text-amber-50 text-sm">Best Attendance Insentif</h4>
              <div className="text-2xl font-bold font-mono text-[#D4A853]">Rp 250.000</div>
              <p className="text-[11px] text-amber-100/50">Diberikan untuk staff dengan kehadiran 100% murni tanpa catatan terlambat sama sekali.</p>
              <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/30">
                Penerima: <strong>Mega & Hendra</strong>
              </div>
            </div>

            <div className="bg-[#051c0f]/80 border border-amber-500/10 p-5 rounded-2xl text-center space-y-3">
              <div className="text-3xl">💰</div>
              <h4 className="font-serif font-bold text-amber-50 text-sm">Best Sales & Upgrade Mastery</h4>
              <div className="text-2xl font-bold font-mono text-[#D4A853]">Rp 500.000</div>
              <p className="text-[11px] text-slate-400 ">Diberikan untuk barista dengan rasio upselling add-on dan target cup seasonal paling tinggi.</p>
              <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/30">
                Penerima: <strong>Adit Barista</strong>
              </div>
            </div>

            <div className="bg-[#051c0f]/80 border border-amber-500/10 p-5 rounded-2xl text-center space-y-3">
              <div className="text-3xl font-serif">🏆</div>
              <h4 className="font-serif font-bold text-amber-50 text-sm">Employee of The Month (EOM)</h4>
              <div className="text-2xl font-bold font-mono text-[#D4A853]">Rp 1.000.000</div>
              <p className="text-[11px] text-amber-100/50">Penghargaan tertinggi yang disepakati Owner berdasarkan nilai tertinggi raport bulanan.</p>
              <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/30">
                Penerima: <strong>Mega Manager</strong>
              </div>
            </div>
          </div>

          {/* Rujukan Rumus Sistematis Payroll */}
          <div className="bg-gradient-to-br from-[#0c2e17] to-[#041d0e] border border-[#D4A853]/20 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📊</span>
              <div>
                <h4 className="font-serif font-bold text-amber-100 text-sm">Rumus Sistematis Perhitungan Gaji & KPI</h4>
                <p className="text-[10px] text-amber-100/50 leading-relaxed font-sans">Sistem Le Parla menggabungkan parameter kehadiran, kedisiplinan waktu harian, serta akumulasi skor KPI bulanan secara otomatis tanpa bias subjektif.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 text-[11px]">
              <div className="bg-[#04150b] p-3.5 rounded-xl border border-emerald-900 border-l-4 border-l-red-500/80 space-y-1">
                <div className="font-bold text-red-400 font-mono">1. DENDA ABSENSI</div>
                <p className="text-amber-150/70 text-[10px] leading-relaxed">Dikenakan potongan sebesar <strong className="text-red-300">Rp 75.000</strong> untuk setiap 1% di bawah target 100% Kehadiran.</p>
                <div className="text-[9px] text-[#D4A853] font-mono pt-1">RUMUS: (100% - Hadir%) × Rp 75K</div>
              </div>

              <div className="bg-[#04150b] p-3.5 rounded-xl border border-emerald-900 border-l-4 border-l-red-400/80 space-y-1">
                <div className="font-bold text-red-300 font-mono">2. DENDA TELAT (WAKTU)</div>
                <p className="text-amber-150/70 text-[10px] leading-relaxed">Dikenakan potongan sebesar <strong className="text-red-300">Rp 30.000</strong> untuk setiap 1% di bawah target 100% Ketepatan Waktu.</p>
                <div className="text-[9px] text-[#D4A853] font-mono pt-1">RUMUS: (100% - Telat%) × Rp 30K</div>
              </div>

              <div className="bg-[#04150b] p-3.5 rounded-xl border border-emerald-900 border-l-4 border-l-emerald-500/80 space-y-1">
                <div className="font-bold text-emerald-400 font-mono">3. BONUS KINERJA KPI</div>
                <p className="text-amber-150/70 text-[10px] leading-relaxed">Dihitung otomatis dari akumulasi skor 7 parameter rapot utama:</p>
                <ul className="text-[9px] text-emerald-300/80 space-y-0.5 list-disc pl-3">
                  <li>Score ≥ 95% : <strong className="text-emerald-300 font-bold">+15% Gaji Pokok</strong></li>
                  <li>Score ≥ 90% : <strong className="text-emerald-300">+10% Gaji Pokok</strong></li>
                  <li>Score ≥ 80% : <strong className="text-emerald-300">+5% Gaji Pokok</strong></li>
                  <li>Score &lt; 70% : <strong className="text-red-300 font-bold">-5% Gaji Pokok</strong></li>
                </ul>
              </div>

              <div className="bg-[#04150b] p-3.5 rounded-xl border border-emerald-900 border-l-4 border-l-[#D4A853] space-y-1">
                <div className="font-bold text-[#D4A853] font-mono">4. REWARD KEMITRAAN</div>
                <p className="text-amber-150/70 text-[10px] leading-relaxed">Apresiasi lurus di luar pokok dasar yang langsung disepakati atas nominasi spesifik per bulan.</p>
                <div className="text-[9px] text-[#D4A853]/60 font-mono pt-1">Batas Max: Rp 1.000.000 / Staff</div>
              </div>
            </div>

            <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-900 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono gap-2 text-[#D4A853]">
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span><strong>RUMUS SISTEMATIS AKHIR:</strong> Take-Home Pay = Gaji Pokok - Denda Absen - Denda Telat + Bonus KPI Kinerja + Reward Kemitraan</span>
              </div>
              <span className="text-[9px] text-amber-100/40 font-serif italic">Le Parla Café Smart Payroll Engine v2.0 • 100% Bias-free</span>
            </div>
          </div>

          {/* Table summary of bonuses allocation */}
          <div className="bg-[#051c0f]/80 border border-amber-500/10 p-6 rounded-3xl">
            <h3 className="font-serif font-bold text-amber-100 text-sm mb-4">Ringkasan Beban Insentif Berjalan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#042c16] text-[#D4A853] uppercase text-[10px]">
                    <th className="p-3 rounded-l-xl">Karyawan</th>
                    <th className="p-3">Gaji Pokok</th>
                    <th className="p-3">Potongan Absen</th>
                    <th className="p-3">Potongan Telat</th>
                    <th className="p-3">Bonus Kinerja KPI</th>
                    <th className="p-3">Reward Kemitraan</th>
                    <th className="p-3 rounded-r-xl">Gaji Bersih / Take-Home Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950">
                  {kpiRecords.map(r => {
                    const { attendanceDeduction, punctualityPenalty, kpiBonus, kpiBonusRate, takeHomePay } = calculateSalaryBreakdown(r);
                    return (
                      <tr key={r.userId} className="hover:bg-emerald-950/20 text-amber-100/85">
                        <td className="p-3 font-sans font-bold flex items-center gap-2">
                          <img src={r.photoUrl} alt={r.name} className="h-6 w-6 rounded-full object-cover" />
                          <div>
                            <span className="block">{r.name}</span>
                            <span className="block text-[9px] text-[#D4A853] uppercase">{r.role} • {r.branchId}</span>
                          </div>
                        </td>
                        <td className="p-3">Rp {r.baseSalary.toLocaleString("id-ID")}</td>
                        <td className="p-3 text-red-400 font-bold">
                          {attendanceDeduction > 0 ? `-Rp ${attendanceDeduction.toLocaleString("id-ID")} (${100 - r.attendance}%)` : "Rp 0"}
                        </td>
                        <td className="p-3 text-red-300 font-semibold">
                          {punctualityPenalty > 0 ? `-Rp ${punctualityPenalty.toLocaleString("id-ID")} (${100 - r.punctuality}%)` : "Rp 0"}
                        </td>
                        <td className={`p-3 font-bold ${kpiBonus > 0 ? "text-emerald-400" : kpiBonus < 0 ? "text-red-400" : "text-amber-100/30"}`}>
                          {kpiBonus > 0 ? `+Rp ${kpiBonus.toLocaleString("id-ID")} (+${Math.round(kpiBonusRate * 100)}%)` : kpiBonus < 0 ? `-Rp ${Math.abs(kpiBonus).toLocaleString("id-ID")} (${Math.round(kpiBonusRate * 100)}%)` : "Rp 0"}
                        </td>
                        <td className="p-3">
                          <span className={`block font-bold text-[#D4A853] ${r.selectedRewardType === "None" ? "opacity-30" : ""}`}>
                            {r.selectedRewardType}
                          </span>
                          {r.rewardAmount > 0 && (
                            <span className="block text-emerald-300 text-[10px]">+Rp {r.rewardAmount.toLocaleString("id-ID")}</span>
                          )}
                        </td>
                        <td className="p-3 font-extrabold text-[#D4A853] bg-emerald-950/30 text-sm">
                          Rp {takeHomePay.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. OUTLETS MANAGE CONFIG TAB (MANAGEMENT ROLE ONLY) */}
      {/* ========================================================= */}
      {activeTab === "outlets" && isManagement && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-amber-500/10 pb-4">
            <div>
              <h3 className="font-serif font-bold text-amber-50 text-xl flex items-center gap-2">
                🏪 Manajemen Outlet & Unit Kemitraan
              </h3>
              <p className="text-xs text-amber-100/50">
                Tambah, sesuaikan, atau kurangi outlet aktif Le Parla Café (sementara dikonfigurasi di Pangkalpinang).
              </p>
            </div>
            <div className="text-xs text-amber-100/40 font-mono">
              Total Aktif: <strong className="text-amber-400">{outlets.length} Outlet</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left section: Add form */}
            <div className="lg:col-span-5 bg-[#051c0f]/80 border border-amber-500/10 p-6 rounded-3xl space-y-4">
              <h4 className="font-serif font-bold text-amber-100 text-sm flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#D4A853]" /> Tambah Cabang / Outlet Baru
              </h4>
              <p className="text-xs text-amber-100/60 leading-relaxed">
                Gunakan panel ini untuk meregistrasi wilayah outlet baru. Pengisian nama cabang disarankan diawali kata "Cabang " atau "Outlet " (misalnya: <em>Cabang Pangkalpinang Barat</em>).
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newOutletName.trim()) return;
                if (outlets.includes(newOutletName.trim())) {
                  showToast("⚠️ Outlet dengan nama tersebut sudah ada!");
                  return;
                }
                setOutlets(prev => [...prev, newOutletName.trim()]);
                showToast(`✓ Berhasil menambahkan Outlet baru: ${newOutletName}`);
                setNewOutletName("");
              }} className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-200 block mb-1">Nama Wilayah / Outlet</label>
                  <input
                    type="text"
                    value={newOutletName}
                    onChange={(e) => setNewOutletName(e.target.value)}
                    placeholder="Contoh: Cabang Pangkalpinang"
                    className="w-full bg-[#04150b] border border-emerald-900 focus:border-[#D4A853] rounded-xl px-3 py-2.5 text-xs text-amber-100 outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Registrasikan Outlet
                </button>
              </form>

              <div className="bg-[#2c1303]/20 border border-[#D4A853]/10 p-3 rounded-xl text-[10px] text-amber-150/60 leading-normal">
                📌 <strong>Lokasi Utama Sementara:</strong> Wilayah Pangkalpinang adalah fokus ekspansi satelit kemitraan Le Parla Café saat ini. Pastikan integrasi nama telah disesuaikan agar performansi absensi dan KPI terkoneksi murni di server.
              </div>
            </div>

            {/* Right section: Outlet Cards with delete action */}
            <div className="lg:col-span-7 bg-[#051c0f]/80 border border-amber-500/10 p-6 rounded-3xl space-y-4">
              <h4 className="font-serif font-bold text-amber-100 text-sm">Daftar Outlet Aktif saat ini</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {outlets.map((o) => {
                  // count how many staff are allocated here
                  const staffCount = kpiRecords.filter(r => r.branchId === o).length;
                  const isHq = o.includes("HQ") || o === "Pusat Pangkalpinang (HQ)";

                  return (
                    <div key={o} className="bg-[#042c16]/30 border border-emerald-900/40 p-4 rounded-2xl flex flex-col justify-between hover:border-[#D4A853]/25 transition duration-200">
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="bg-amber-500/10 text-[#D4A853] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#D4A853]/25 flex items-center gap-1">
                            <span>🏪</span> {isHq ? "HQ / Pusat" : "Satelit / Cabang"}
                          </div>
                          {!isHq && (
                            <button
                              onClick={() => {
                                if (staffCount > 0) {
                                  alert(`Tidak dapat menghapus outlet "${o}" karena masih ada ${staffCount} staff yang ditugaskan ke outlet ini.`);
                                  return;
                                }
                                if (confirm(`Apakah Anda yakin ingin menghapus outlet "${o}"?`)) {
                                  setOutlets(prev => prev.filter(item => item !== o));
                                  showToast(`✓ Berhasil menghapus Outlet: ${o}`);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/5 transition"
                              title="Hapus outlet ini"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <h5 className="font-serif font-bold text-amber-50 text-base mt-2.5">{o}</h5>
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-950/40 flex justify-between items-center text-[10px] font-mono text-amber-100/40">
                        <span>Alokasi Kru:</span>
                        <strong className="text-amber-200 font-bold">{staffCount} orang staff</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
