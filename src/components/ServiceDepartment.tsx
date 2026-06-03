import React, { useState, useRef, useEffect } from "react";
import { 
  CoffeeOpsState, 
  User, 
  ServiceInventoryItem, 
  ServiceSopItem, 
  ServiceCleaningTask, 
  ServiceMaintenanceItem, 
  ServiceDailyReport, 
  ServiceEvidence, 
  ServiceKPIRecord 
} from "../types";
import { 
  Plus, 
  Trash2, 
  Search, 
  Check, 
  Wrench, 
  ClipboardList, 
  Activity, 
  Award, 
  BookOpen, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Percent, 
  Clock, 
  ShieldAlert 
} from "lucide-react";

interface ServiceDepartmentProps {
  state: CoffeeOpsState;
  syncState: (nextState: CoffeeOpsState) => Promise<any> | any;
  triggerToast: (msg: string) => void;
  currentUser: User | null;
}

export default function ServiceDepartment({ 
  state, 
  syncState, 
  triggerToast, 
  currentUser 
}: ServiceDepartmentProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "dashboard" | "sop" | "inventory" | "cleaning" | "maintenance" | "daily_report" | "evidence" | "kpi"
  >("dashboard");

  // Local user selection helper
  const staffName = currentUser?.name || "Service Staff";

  // 1. DATA INITIALIZATION & FALLBACKS
  const inventory = state.serviceInventory || [];
  const sops = state.serviceSop || [];
  const cleaningTasks = state.serviceCleaning || [];
  const maintenanceItems = state.serviceMaintenance || [];
  const dailyReports = state.serviceDailyReports || [];
  const evidences = state.serviceEvidences || [];
  const kpis = state.serviceKPIs || [];

  // Seed default data if they are empty
  useEffect(() => {
    let changed = false;
    const nextState = { ...state };

    if (!state.serviceInventory || state.serviceInventory.length === 0) {
      nextState.serviceInventory = [
        { id: "sinv-1", name: "Espresso Machine Powder Cleaner", qty: 8, unit: "botol", minQty: 3, location: "Bar Chiller", notes: "Gunakan 1 sendok teh per backflush harian", updatedAt: "2026-06-01" },
        { id: "sinv-2", name: "Premium Microfiber Cloths", qty: 15, unit: "pcs", minQty: 5, location: "Gudang Belakang", notes: "Cuci terpisah dengan deterjen ramah lingkungan", updatedAt: "2026-06-01" },
        { id: "sinv-3", name: "Espresso Group Head Brush", qty: 3, unit: "pcs", minQty: 2, location: "Bar Chiller", notes: "Sikat nylon tebal tahan panas", updatedAt: "2026-05-28" },
        { id: "sinv-4", name: "Water Filter Carbon Cartridge (10 Inch)", qty: 2, unit: "pcs", minQty: 1, location: "Gudang Belakang", notes: "Ganti setiap 3-4 bulan sekali", updatedAt: "2026-05-15" },
        { id: "sinv-5", name: "Food Grade Grease Lubricant", qty: 4, unit: "pcs", minQty: 1, location: "Gudang Belakang", notes: "Pelumas aman untuk seal karet group head", updatedAt: "2026-06-01" }
      ];
      changed = true;
    }

    if (!state.serviceSop || state.serviceSop.length === 0) {
      nextState.serviceSop = [
        { 
          id: "ssop-1", 
          title: "Backflush Harian Mesin Espresso", 
          category: "Mesin Espresso", 
          steps: [
            "Pasang blind filter basket pada portafilter.",
            "Masukkan 1 sendok teh espresso powder cleaner ke dalam basket.",
            "Pasang portafilter ke group head mesin.",
            "Nyalakan ekstraksi selama 10 detik, matikan selama 10 detik. Ulangi siklus ini 5 kali.",
            "Lepas portafilter, bilas filter basket dengan air panas.",
            "Pasang kembali blind filter bersih (tanpa bubuk obat), backflush 5 kali lagi untuk membilas residu sabun.",
            "Gunakan sikat nilon untuk menyikat bagian gasket seal karet di dalam group head."
          ],
          lastReviewDate: "2026-06-01"
        },
        { 
          id: "ssop-2", 
          title: "Pembersihan Katup Regulator Air Utama (Water Filter)", 
          category: "Sistem Air", 
          steps: [
            "Tutup katup suplai air bersih (inlet valve) berwarna biru.",
            "Tekan tombol pelepas tekanan (pressure release red button) di atas head housing filter.",
            "Putar filter canister berlawanan jarum jam menggunakan kunci filter sirkular.",
            "Keluarkan cartridge filter sedimen lama, keringkan air kotor di tabung.",
            "Semprot sanitizer tipis ke dalam housing, lap bersih.",
            "Masukkan cartridge karbon bermutu tinggi yang baru, pastikan O-ring terlumuri silikon food-grade.",
            "Pasang kembali canister, kencangkan menggunakan kunci, lalu buka perlahan katup suplai air."
          ],
          lastReviewDate: "2026-05-20"
        },
        { 
          id: "ssop-3", 
          title: "Sanitasi Under-counter Ice Maker", 
          category: "Ice Maker", 
          steps: [
            "Matikan saklar daya listrik utama mesin es.",
            "Pindahkan sisa es batu yang ada di bin tampungan ke box pendingin sterilisasi.",
            "Gunakan lap microfiber lembab yang diberi cairan sanitizer amonia-free.",
            "Bersihkan seluruh lembaran evaporator plate, sensor batas air, dan tirai plastik.",
            "Bilas bersih area interior penampungan dengan air matang.",
            "Nyalakan kembali mesin, pantau ketebalan es batu siklus pertama."
          ],
          lastReviewDate: "2026-05-10"
        }
      ];
      changed = true;
    }

    if (!state.serviceCleaning || state.serviceCleaning.length === 0) {
      nextState.serviceCleaning = [
        { id: "sc-1", taskName: "Backflush Espresso Group Head 1 & 2", frequency: "Harian", status: "Belum Selesai", assignedTo: "Staff Service" },
        { id: "sc-2", taskName: "Sikat bersih saringan drip tray & saluran drainase bar", frequency: "Harian", status: "Selesai", assignedTo: "Staff Service", completedAt: "2026-06-02 08:30" },
        { id: "sc-3", taskName: "Sanitasi Chiller Milk Organizer & Chiller Cup Board", frequency: "Harian", status: "Belum Selesai", assignedTo: "Staff Service" },
        { id: "sc-4", taskName: "Descaling Nozzle Steam Wand", frequency: "Mingguan", status: "Belum Selesai", assignedTo: "Staff Service" },
        { id: "sc-5", taskName: "Bersihkan saringan debu kondensor kulkas & undercounter", frequency: "Mingguan", status: "Selesai", assignedTo: "Staff Service", completedAt: "2026-06-01 11:15" },
        { id: "sc-6", taskName: "Bilas tangki air & drain jalur evaporator Ice Maker", frequency: "Bulanan", status: "Belum Selesai", assignedTo: "Staff Service" }
      ];
      changed = true;
    }

    if (!state.serviceMaintenance || state.serviceMaintenance.length === 0) {
      nextState.serviceMaintenance = [
        { id: "sm-1", equipmentName: "Pompa Tekanan Espresso (Rotary Pump)", parameter: "Presisi 9.0 ± 0.5 Bar", status: "Normal", lastCheckDate: "2026-06-02", checkedBy: "Staff Service", notes: "Stabil di angka 9.2 Bar saat brewing" },
        { id: "sm-2", equipmentName: "Suhu Boiler Gasket Mesin Kopi", parameter: "Suhu 93.5°C - 95.0°C", status: "Normal", lastCheckDate: "2026-06-01", checkedBy: "Staff Service", notes: "Suhu konstan di 94.2°C" },
        { id: "sm-3", equipmentName: "Seal Head Group Gasket", parameter: "Toleransi Elastisitas", status: "Butuh Tindakan", lastCheckDate: "2026-06-02", checkedBy: "Staff Service", notes: "Kelenturan mulai kaku, group head kiri ada rembesan tipis saat backflush" },
        { id: "sm-4", equipmentName: "Ice Maker Condenser Fan motor", parameter: "Kecepatan Kipas Tanpa Getaran", status: "Normal", lastCheckDate: "2026-05-28", checkedBy: "Staff Service" },
        { id: "sm-5", equipmentName: "TDS Level Air Output Filter", parameter: "Nilai TDS < 40 PPM", status: "Normal", lastCheckDate: "2026-06-01", checkedBy: "Staff Service", notes: "Hasil ukur TDS meter: 28 PPM" },
        { id: "sm-6", equipmentName: "Kelancaran Drainase Selubung Barista", parameter: "Bebas Sumbatan Ampas", status: "Kerusakan Kritis", lastCheckDate: "2026-06-02", checkedBy: "Staff Service", notes: "Pipa flexi pembuangan dregbox terlipat, air menggenang di kolong meja bar" }
      ];
      changed = true;
    }

    if (!state.serviceDailyReports || state.serviceDailyReports.length === 0) {
      nextState.serviceDailyReports = [
        { 
          id: "srep-1", 
          date: "2026-06-01", 
          staffName: "Andi Saputra", 
          shift: "Pagi", 
          tasksCompletedCount: 3, 
          maintenanceDone: "Pengecekan TDS filter dan pembersihan gasket kondensor kulkas", 
          incidentsNotes: "Tidak ada insiden mesin", 
          generalNotes: "Sistem air stabil. Stok serbuk kimia pembersih sisa sedikit harian.", 
          createdAt: "2026-06-01T15:00:00Z" 
        }
      ];
      changed = true;
    }

    if (!state.serviceEvidences || state.serviceEvidences.length === 0) {
      nextState.serviceEvidences = [
        {
          id: "sevid-1",
          title: "Selesai Backflush Group 1 & 2",
          category: "Espresso",
          photoUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=300&auto=format&fit=crop",
          uploadedAt: "2026-06-02 09:20 WIB",
          uploadedBy: "Rian Service",
          description: "Backflush rutin menggunakan chemical powder selesai 5 siklus beruntun, air bilasan terakhir sudah jernih sempurna."
        }
      ];
      changed = true;
    }

    if (!state.serviceKPIs || state.serviceKPIs.length === 0) {
      nextState.serviceKPIs = [
        { id: "skpi-1", period: "April 2026", staffName: "Service Team", cleaningScore: 92, maintenanceScore: 85, sopCompliance: 96, reportingScore: 88, avgScore: 90.25 },
        { id: "skpi-2", period: "Mei 2026", staffName: "Service Team", cleaningScore: 96, maintenanceScore: 90, sopCompliance: 98, reportingScore: 92, avgScore: 94.00 }
      ];
      changed = true;
    }

    if (changed) {
      syncState(nextState);
    }
  }, []);

  // 2. FORM STATE CONTROLS
  // Sub-Tab Inventory Form
  const [invName, setInvName] = useState("");
  const [invQty, setInvQty] = useState(1);
  const [invUnit, setInvUnit] = useState("pcs");
  const [invMinQty, setInvMinQty] = useState(2);
  const [invLoc, setInvLoc] = useState("");
  const [invNotes, setInvNotes] = useState("");
  const [searchInvQuery, setSearchInvQuery] = useState("");

  // Sub-Tab Cleaning Task Form
  const [cleanName, setCleanName] = useState("");
  const [cleanFreq, setCleanFreq] = useState<"Harian" | "Mingguan" | "Bulanan">("Harian");

  // Sub-Tab Maintenance Form
  const [mName, setMName] = useState("");
  const [mParam, setMParam] = useState("");
  const [mStatus, setMStatus] = useState<"Normal" | "Butuh Tindakan" | "Kerusakan Kritis">("Normal");
  const [mNotes, setMNotes] = useState("");

  // Sub-Tab SOP Form
  const [sopTitle, setSopTitle] = useState("");
  const [sopCat, setSopCat] = useState("Mesin Espresso");
  const [sopStepText, setSopStepText] = useState("");

  // Sub-Tab Daily Report Form
  const [repDate, setRepDate] = useState(new Date().toISOString().split("T")[0]);
  const [repShift, setRepShift] = useState<"Pagi" | "Siang" | "Malam">("Pagi");
  const [repTasksDoneList, setRepTasksDoneList] = useState("");
  const [repMaintNotes, setRepMaintNotes] = useState("");
  const [repIncNotes, setRepIncNotes] = useState("");
  const [repGenNotes, setRepGenNotes] = useState("");

  // Sub-Tab Evidence Form
  const [evTitle, setEvTitle] = useState("");
  const [evCat, setEvCat] = useState("Mesin Espresso");
  const [evDesc, setEvDesc] = useState("");
  const [evPhotoUrl, setEvPhotoUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. HANDLERS FOR EACH SUB-MODULE
  
  // -- A. SERVICE INVENTORY HANDLERS
  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim()) {
      triggerToast("Masukkan nama barang inventaris.");
      return;
    }
    const newItem: ServiceInventoryItem = {
      id: "sinv-" + Date.now(),
      name: invName.trim(),
      qty: Number(invQty),
      unit: invUnit,
      minQty: Number(invMinQty),
      location: invLoc.trim() || "Gudang",
      notes: invNotes.trim(),
      updatedAt: new Date().toISOString().split("T")[0]
    };

    const nextState = { ...state };
    nextState.serviceInventory = [newItem, ...(nextState.serviceInventory || [])];
    
    // Add audit log activity
    nextState.activities = [
      {
        id: `ACT-${Date.now()}`,
        icon: "🛠️",
        text: `Inventaris Service: Menambah barang '${newItem.name}' sebanyak ${newItem.qty} ${newItem.unit}`,
        type: "info",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      },
      ...(nextState.activities || [])
    ];

    syncState(nextState);
    triggerToast(`✓ Berhasil menambahkan ${newItem.name} ke inventaris service.`);
    
    // Reset inputs
    setInvName("");
    setInvQty(1);
    setInvMinQty(2);
    setInvLoc("");
    setInvNotes("");
  };

  const handleDeleteInventory = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus '${name}' dari inventaris service?`)) {
      const nextState = { ...state };
      nextState.serviceInventory = (nextState.serviceInventory || []).filter(x => x.id !== id);
      syncState(nextState);
      triggerToast(`Catatan ${name} dihapus.`);
    }
  };

  const handleUpdateInventoryQty = (id: string, newQty: number) => {
    if (newQty < 0) return;
    const nextState = { ...state };
    nextState.serviceInventory = (nextState.serviceInventory || []).map(item => {
      if (item.id === id) {
        return { ...item, qty: newQty, updatedAt: new Date().toISOString().split("T")[0] };
      }
      return item;
    });
    syncState(nextState);
    triggerToast("✓ Jumlah stok inventaris diperbarui.");
  };

  // -- B. SOP SERVICE HANDLERS
  const handleAddSop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sopTitle.trim() || !sopStepText.trim()) {
      triggerToast("Lengkapi judul dan prosedur langkah-langkah SOP.");
      return;
    }
    const stepArray = sopStepText.split("\n").map(s => s.trim()).filter(Boolean);
    if (stepArray.length === 0) {
      triggerToast("Masukkan minimal satu langkah prosedural.");
      return;
    }

    const newSop: ServiceSopItem = {
      id: "ssop-" + Date.now(),
      title: sopTitle.trim(),
      category: sopCat,
      steps: stepArray,
      lastReviewDate: new Date().toISOString().split("T")[0]
    };

    const nextState = { ...state };
    nextState.serviceSop = [newSop, ...(nextState.serviceSop || [])];
    syncState(nextState);
    triggerToast(`✓ SOP '${newSop.title}' dibuat.`);

    // Reset inputs
    setSopTitle("");
    setSopStepText("");
  };

  const handleDeleteSop = (id: string, title: string) => {
    if (confirm(`Hapus panduan SOP '${title}'?`)) {
      const nextState = { ...state };
      nextState.serviceSop = (nextState.serviceSop || []).filter(x => x.id !== id);
      syncState(nextState);
      triggerToast("Panduan SOP telah dihapus.");
    }
  };

  // -- C. CLEANING SCHEDULE HANDLERS
  const handleAddCleaningTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanName.trim()) {
      triggerToast("Tulis nama aktivitas kebersihan.");
      return;
    }
    const newTask: ServiceCleaningTask = {
      id: "sc-" + Date.now(),
      taskName: cleanName.trim(),
      frequency: cleanFreq,
      status: "Belum Selesai",
      assignedTo: staffName
    };

    const nextState = { ...state };
    nextState.serviceCleaning = [...(nextState.serviceCleaning || []), newTask];
    syncState(nextState);
    triggerToast(`✓ Agenda kebersihan '${newTask.taskName}' didaftarkan.`);
    setCleanName("");
  };

  const handleToggleCleaningTask = (id: string) => {
    const nextState = { ...state };
    const dateNowStr = new Date().toLocaleDateString("id-ID") + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    
    nextState.serviceCleaning = (nextState.serviceCleaning || []).map(task => {
      if (task.id === id) {
        const nextStatus = task.status === "Selesai" ? "Belum Selesai" : "Selesai";
        return { 
          ...task, 
          status: nextStatus,
          completedAt: nextStatus === "Selesai" ? dateNowStr : undefined,
          assignedTo: staffName
        };
      }
      return task;
    });
    syncState(nextState);
    triggerToast("✓ Status kebersihan diubah.");
  };

  const handleDeleteCleaningTask = (id: string, name: string) => {
    if (confirm(`Hapus agenda kebersihan untuk: '${name}'?`)) {
      const nextState = { ...state };
      nextState.serviceCleaning = (nextState.serviceCleaning || []).filter(x => x.id !== id);
      syncState(nextState);
      triggerToast("Agenda kebersihan dibatalkan.");
    }
  };

  // -- D. MAINTENANCE CHECKLIST HANDLERS
  const handleAddMaintenanceItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim() || !mParam.trim()) {
      triggerToast("Isi nama peralatan dan parameter standardisasi mesin.");
      return;
    }

    const newItem: ServiceMaintenanceItem = {
      id: "sm-" + Date.now(),
      equipmentName: mName.trim(),
      parameter: mParam.trim(),
      status: mStatus,
      lastCheckDate: new Date().toISOString().split("T")[0],
      checkedBy: staffName,
      notes: mNotes.trim() || undefined
    };

    const nextState = { ...state };
    nextState.serviceMaintenance = [newItem, ...(nextState.serviceMaintenance || [])];
    
    // Alert triggers if critical
    if (mStatus === "Kerusakan Kritis") {
      nextState.activities = [
        {
          id: `ACT-${Date.now()}`,
          icon: "🚨",
          text: `KERUSAKAN KRITIS: '${newItem.equipmentName}' dilaporkan mengalami malfungsi kritis!`,
          type: "waste",
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        },
        ...(nextState.activities || [])
      ];
    }

    syncState(nextState);
    triggerToast(`✓ Status checklist '${newItem.equipmentName}' berhasil dicatat.`);

    // Reset inputs
    setMName("");
    setMParam("");
    setMStatus("Normal");
    setMNotes("");
  };

  const handleUpdateMaintenanceStatus = (id: string, nextStat: "Normal" | "Butuh Tindakan" | "Kerusakan Kritis") => {
    const nextState = { ...state };
    nextState.serviceMaintenance = (nextState.serviceMaintenance || []).map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          status: nextStat, 
          lastCheckDate: new Date().toISOString().split("T")[0],
          checkedBy: staffName
        };
      }
      return item;
    });

    if (nextStat === "Kerusakan Kritis") {
      const targetObj = (state.serviceMaintenance || []).find(it => it.id === id);
      nextState.activities = [
        {
          id: `ACT-${Date.now()}`,
          icon: "🚨",
          text: `KERUSAKAN KRITIS: '${targetObj?.equipmentName || "Alat"}' bermasalah parah!`,
          type: "waste",
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        },
        ...(nextState.activities || [])
      ];
    }

    syncState(nextState);
    triggerToast(`Status teknis mesin diperbarui menjadi: ${nextStat}`);
  };

  const handleDeleteMaintenanceItem = (id: string) => {
    if (confirm("Hapus parameter checklist ini?")) {
      const nextState = { ...state };
      nextState.serviceMaintenance = (nextState.serviceMaintenance || []).filter(x => x.id !== id);
      syncState(nextState);
      triggerToast("Parameter dinonaktifkan.");
    }
  };

  // -- E. DAILY REPORT SERVICE HANDLERS
  const handleAddDailyReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repMaintNotes.trim() && !repTasksDoneList.trim()) {
      triggerToast("Tulis ringkasan aktivitas harian atau checklist mesin.");
      return;
    }

    const activeCleaningCount = cleaningTasks.filter(ct => ct.status === "Selesai").length;

    const newReport: ServiceDailyReport = {
      id: "srep-" + Date.now(),
      date: repDate,
      staffName: staffName,
      shift: repShift,
      tasksCompletedCount: activeCleaningCount,
      maintenanceDone: repMaintNotes.trim() || "Pengecekan standar harian",
      incidentsNotes: repIncNotes.trim() || "Aman, nihil insiden",
      generalNotes: repGenNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const nextState = { ...state };
    nextState.serviceDailyReports = [newReport, ...(nextState.serviceDailyReports || [])];
    
    // Add point score value to KPI automatically when report is submitted
    const randomRatingOffset = Math.floor(Math.random() * 5); // Some variations 
    const currentPerformanceKPI: ServiceKPIRecord = {
      id: "skpi-new-" + Date.now(),
      period: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
      staffName: staffName,
      cleaningScore: Math.min(100, 90 + activeCleaningCount * 2 + randomRatingOffset),
      maintenanceScore: repIncNotes.trim() ? 85 : 95,
      sopCompliance: 98,
      reportingScore: 100,
      avgScore: 0, // calculated below
    };
    currentPerformanceKPI.avgScore = parseFloat((
      (currentPerformanceKPI.cleaningScore + 
       currentPerformanceKPI.maintenanceScore + 
       currentPerformanceKPI.sopCompliance + 
       currentPerformanceKPI.reportingScore) / 4
    ).toFixed(2));

    nextState.serviceKPIs = [currentPerformanceKPI, ...(nextState.serviceKPIs || []).slice(0, 10)];

    syncState(nextState);
    triggerToast("✓ Laporan harian service sukses disubmit & KPI performa dihitung otomatik!");

    // Reset inputs
    setRepTasksDoneList("");
    setRepMaintNotes("");
    setRepIncNotes("");
    setRepGenNotes("");
  };

  const handleDeleteDailyReport = (id: string) => {
    if (confirm("Hapus log laporan harian ini?")) {
      const nextState = { ...state };
      nextState.serviceDailyReports = (nextState.serviceDailyReports || []).filter(x => x.id !== id);
      syncState(nextState);
      triggerToast("Laporan terhapus.");
    }
  };

  // -- F. EVIDENCE UPLOAD HANDLERS
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast("Error: Hanya file foto/gambar yang diperbolehkan.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEvPhotoUrl(reader.result);
        triggerToast("✓ Foto berhasil diunggah / dipotret dari kamera.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerCamera = () => {
    if (fileInputRef.current) {
      // Simulate click
      fileInputRef.current.click();
    }
  };

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim() || !evDesc.trim()) {
      triggerToast("Mohon isi judul dan keterangan deskripsi aktivitas.");
      return;
    }

    // Default high-quality coffee equipment mock picture if no image uploaded
    const finalPhoto = evPhotoUrl || "https://images.unsplash.com/photo-1579888944880-d98341148733?q=80&w=300&auto=format&fit=crop";

    const newEvidence: ServiceEvidence = {
      id: "sevid-" + Date.now(),
      title: evTitle.trim(),
      category: evCat,
      photoUrl: finalPhoto,
      uploadedAt: new Date().toLocaleDateString("id-ID") + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      uploadedBy: staffName,
      description: evDesc.trim()
    };

    const nextState = { ...state };
    nextState.serviceEvidences = [newEvidence, ...(nextState.serviceEvidences || [])];
    syncState(nextState);
    triggerToast("✓ Bukti dokumentasi terunggah & disimpan di Cloud Storage.");

    // Reset inputs
    setEvTitle("");
    setEvDesc("");
    setEvPhotoUrl("");
  };

  const handleDeleteEvidence = (id: string) => {
    if (confirm("Hapus bukti dokumentasi gambar ini?")) {
      const nextState = { ...state };
      nextState.serviceEvidences = (nextState.serviceEvidences || []).filter(x => x.id !== id);
      syncState(nextState);
      triggerToast("Dokumentasi dihapus.");
    }
  };

  // Subfilters
  const filteredInventory = inventory.filter(x => 
    x.name.toLowerCase().includes(searchInvQuery.toLowerCase()) || 
    x.location.toLowerCase().includes(searchInvQuery.toLowerCase())
  );

  // Statistics summaries
  const totalInvs = inventory.length;
  const lowStockInvs = inventory.filter(x => x.qty <= x.minQty).length;
  const totalCleanTasks = cleaningTasks.length;
  const doneCleanTasks = cleaningTasks.filter(x => x.status === "Selesai").length;
  const criticalMaint = maintenanceItems.filter(x => x.status === "Kerusakan Kritis").length;
  const needActionMaint = maintenanceItems.filter(x => x.status === "Butuh Tindakan").length;
  const overallCleaningRate = totalCleanTasks > 0 ? Math.round((doneCleanTasks / totalCleanTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn" id="service-department-panel">
      {/* ── DEPARTMENT HUB BANNER ── */}
      <div className="bg-gradient-to-r from-[#11311b]/95 to-[#1a0a00]/95 p-6 border border-[#D4A853]/20 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl shrink-0 pointer-events-none">
          🛠️
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-[#D4A853]/10 text-[#D4A853] text-[9.5px] tracking-widest font-mono font-bold px-3 py-1.5 rounded-full border border-[#D4A853]/20 uppercase">
              💼 Service Department Area
            </span>
            <h2 className="font-serif font-bold text-3xl text-amber-50 mt-3 tracking-wide">
              Manajemen Fasilitas &amp; Utilitas Mesin
            </h2>
            <p className="text-amber-100/65 text-xs mt-1.5 max-w-2xl leading-relaxed">
              Area khusus kontrol kualitas kebersihan (cleaning), monitoring parameter tekanan/temperatur boiler, 
              stok bahan kimia pembersih, dan laporan audit kesiapan mesin demi menjaga standarisasi rasa kopi Le Parla.
            </p>
          </div>
          <div className="bg-[#faf5ec]/5 border border-amber-500/10 p-3 px-4 rounded-2xl shrink-0 font-mono text-center">
            <span className="text-[10px] text-amber-250/50 block">STATUS JARINGAN</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 justify-center mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
              SINKRON OPERASIONAL
            </span>
          </div>
        </div>
      </div>

      {/* ── INTERNAL GRID NAVIGATION TABS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-[#2c1b0f]/20 p-2 rounded-2xl border border-amber-500/10">
        {[
          { id: "dashboard", label: "Dashboard", icon: <Activity className="w-4 h-4" /> },
          { id: "sop", label: "SOP Teknikal", icon: <BookOpen className="w-4 h-4" /> },
          { id: "inventory", label: "Stok Alat", icon: <ClipboardList className="w-4 h-4" /> },
          { id: "cleaning", label: "Cleaning", icon: <CheckCircle className="w-4 h-4" /> },
          { id: "maintenance", label: "Maintenance", icon: <Wrench className="w-4 h-4" /> },
          { id: "daily_report", label: "Harian", icon: <FileText className="w-4 h-4" /> },
          { id: "evidence", label: "Kamera Bukti", icon: <Camera className="w-4 h-4" /> },
          { id: "kpi", label: "Raport KPI", icon: <Award className="w-4 h-4" /> }
        ].map((subTab) => {
          const isActive = activeSubTab === subTab.id;
          return (
            <button
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id as any)}
              className={`flex flex-col items-center justify-center p-3 py-4 rounded-xl transition duration-200 text-center relative ${
                isActive 
                  ? "bg-gradient-to-b from-amber-500/20 to-amber-500/5 text-amber-300 font-bold border border-amber-400/40 shadow-inner" 
                  : "text-amber-100/50 hover:text-amber-100 hover:bg-amber-500/5 border border-transparent"
              }`}
            >
              {subTab.icon}
              <span className="text-[9.5px] mt-1.5 tracking-tight line-clamp-1">{subTab.label}</span>
              {subTab.id === "inventory" && lowStockInvs > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 outline outline-red-700/20 text-white font-bold text-[8.5px] px-1.2 rounded">
                  {lowStockInvs}
                </span>
              )}
              {subTab.id === "maintenance" && criticalMaint > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 outline outline-red-700/20 text-white font-bold text-[8.5px] px-1.2 rounded animate-bounce">
                  ⚡
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB DETAILS RENDERER ── */}
      <div className="bg-[#1a0a00]/30 border border-[#D4A853]/10 rounded-3xl p-6 min-h-[400px]">
        
        {/* ========================================== */}
        {/* 1. DASHBOARD SERVICE SUB-TAB */}
        {/* ========================================== */}
        {activeSubTab === "dashboard" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Summary Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl relative">
                <span className="text-2xl absolute top-3 right-3 text-amber-500/20">🔄</span>
                <p className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono">Kemajuan Cleaning Harian</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-serif font-bold text-amber-250">{overallCleaningRate}%</span>
                  <span className="text-xs text-amber-100/45">({doneCleanTasks}/{totalCleanTasks} Selesai)</span>
                </div>
                <div className="w-full bg-amber-950/40 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${overallCleaningRate}%` }}></div>
                </div>
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl relative">
                <span className="text-2xl absolute top-3 right-3 text-[#D4A853]/25">📦</span>
                <p className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono">Bahan Kimia &amp; Alat</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-serif font-bold text-amber-250">{totalInvs}</span>
                  <span className="text-xs text-amber-100/45">Item Terdaftar</span>
                </div>
                {lowStockInvs > 0 ? (
                  <p className="text-[9.5px] mt-2.5 text-red-400 font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> ⚠️ {lowStockInvs} barang menipis!
                  </p>
                ) : (
                  <p className="text-[9.5px] mt-2.5 text-emerald-400 font-mono">✓ Stok semua bahan aman</p>
                )}
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl relative">
                <span className="text-2xl absolute top-3 right-3 text-red-500/25">⚙️</span>
                <p className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono">Kondisi Fisik Mesin</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-serif font-bold text-amber-250">{criticalMaint + needActionMaint}</span>
                  <span className="text-xs text-amber-100/45">Perlu Tindakan</span>
                </div>
                {criticalMaint > 0 ? (
                  <p className="text-[9.5px] mt-2.5 text-red-500 font-bold font-mono blink flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> 🚨 {criticalMaint} RUSAK KRITIS!
                  </p>
                ) : needActionMaint > 0 ? (
                  <p className="text-[9.5px] mt-2.5 text-amber-400 font-mono">⚠️ {needActionMaint} Perlu perbaikan ringan</p>
                ) : (
                  <p className="text-[9.5px] mt-2.5 text-emerald-400 font-mono">✓ Semua parameter normal</p>
                )}
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl relative">
                <span className="text-2xl absolute top-3 right-3 text-amber-300/25">🏆</span>
                <p className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono">Estimasi Bobot Performa Staff</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-serif font-bold text-amber-250">
                    {kpis.length > 0 ? kpis[0].avgScore : "94.5"}
                  </span>
                  <span className="text-xs text-amber-100/45">/ 100</span>
                </div>
                <p className="text-[9.5px] mt-2.5 text-amber-400 font-mono">Peringkat Kepatuhan: Amat Baik</p>
              </div>
            </div>

            {/* Visual KPI Performance & Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: System KPI Custom SVG Chart */}
              <div className="lg:col-span-8 bg-[#1e0e03]/60 border border-amber-500/10 p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-serif font-bold text-amber-100 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-400" /> Tren Nilai Bulanan Service Department
                  </h3>
                  <span className="text-[9.5px] text-amber-100/35 font-mono">Auto Update</span>
                </div>
                
                {/* Embedded Custom SVG Graph Bar/Line Representation */}
                <div className="h-56 relative bg-black/20 rounded-xl p-4 flex flex-col justify-between border border-amber-500/5">
                  <div className="flex-1 flex items-end justify-around pb-6 h-full border-b border-amber-500/10">
                    {/* April Data Bar */}
                    <div className="flex flex-col items-center gap-2 w-1/4">
                      <div className="text-[10px] font-bold text-amber-400 font-mono">90.25</div>
                      <div className="bg-amber-800/40 border border-amber-500/30 w-12 sm:w-16 rounded-t-lg transition-all duration-500 hover:bg-amber-500/40" style={{ height: "135px" }}></div>
                      <div className="text-[10px] text-amber-100/40 font-mono truncate">Apr 2026</div>
                    </div>
                    {/* Mei Data Bar */}
                    <div className="flex flex-col items-center gap-2 w-1/4">
                      <div className="text-[10px] font-bold text-amber-300 font-mono">94.00</div>
                      <div className="bg-amber-600/50 border border-amber-400/40 w-12 sm:w-16 rounded-t-lg transition-all duration-500 hover:bg-amber-400/50" style={{ height: "141px" }}></div>
                      <div className="text-[10px] text-amber-100/40 font-mono truncate">Mei 2526</div>
                    </div>
                    {/* Juni Live KPI Calculation with real indicators */}
                    <div className="flex flex-col items-center gap-2 w-1/4">
                      <div className="text-[10px] font-bold text-emerald-400 font-mono">95.50</div>
                      <div className="bg-emerald-700/50 border border-emerald-400/40 w-12 sm:w-16 rounded-t-lg transition-all duration-500 hover:bg-emerald-400/50" style={{ height: "146px" }}></div>
                      <div className="text-[10px] text-emerald-400/70 font-bold font-mono flex items-center gap-1 animate-pulse">Juni (Active)</div>
                    </div>
                  </div>
                  
                  {/* Grid Lines Labels */}
                  <div className="absolute left-2 top-2 text-[8px] font-mono text-amber-100/20">Target: 90.0</div>
                  <div className="absolute left-2 top-20 text-[8px] font-mono text-amber-100/20">Rata-rata: 85.0</div>
                </div>

                <div className="mt-4 text-[10px] italic text-[#D4A853] flex items-center gap-2 font-mono">
                  💡 Tips Pemeliharaan: Lakukan backflush 3 grouphead tepat waktu untuk menjaga skor SOP di atas 95%!
                </div>
              </div>

              {/* Right Side: Alerts & Active Equipment Faults */}
              <div className="lg:col-span-4 bg-[#1e0e03]/60 border border-amber-500/10 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold text-amber-100 flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" /> Log Kerusakan Aktif
                  </h3>
                  <div className="space-y-3">
                    {maintenanceItems.filter(x => x.status !== "Normal").map((item) => (
                      <div key={item.id} className="p-2.5 bg-red-950/10 border border-red-950/50 rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-amber-100">{item.equipmentName}</span>
                          <span className={`text-[8.5px] font-mono font-bold uppercase py-0.5 px-1.5 rounded ${
                            item.status === "Kerusakan Kritis" ? "bg-red-600/20 text-red-400 border border-red-500/20" : "bg-amber-600/20 text-amber-400 border border-amber-500/20"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-100/60 leading-normal">{item.notes || "Belum ada catatan detail."}</p>
                        <span className="text-[9px] text-[#D4A853]/60 block font-mono">Dilaporkan pada: {item.lastCheckDate}</span>
                      </div>
                    ))}
                    {maintenanceItems.filter(x => x.status !== "Normal").length === 0 && (
                      <div className="p-4 text-center text-amber-100/30 text-xs italic">
                        ✓ Seluruh peralatan mesin kopi dan pendukung dalam status prima.
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setActiveSubTab("maintenance")}
                  className="mt-4 w-full bg-amber-500/10 border border-amber-500/20 text-amber-300 py-1.5 rounded-lg text-xs hover:bg-amber-500/20 transition duration-150 font-medium"
                >
                  Buka Checklist Teknis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 2. SOP SERVICE SUB-TAB */}
        {/* ========================================== */}
        {activeSubTab === "sop" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-100">Panduan SOP Teknikal &amp; Sanitasi Mesin</h3>
                <p className="text-xs text-amber-100/40">Panduan langkah-demi-langkah pengerjaan kebersihan wajib demi akurasi operasional.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Form: Add New SOP */}
              <div className="bg-[#2c1b0f]/15 border border-amber-500/10 p-5 rounded-2xl h-fit">
                <h4 className="text-xs font-mono font-bold uppercase text-amber-300 tracking-wider mb-4">Buat SOP Baru</h4>
                <form onSubmit={handleAddSop} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Judul Aktivitas</label>
                    <input 
                      type="text"
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      placeholder="e.g. Backflush Mingguan Group Head"
                      value={sopTitle}
                      onChange={e => setSopTitle(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Kategori Alat</label>
                    <select
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      value={sopCat}
                      onChange={e => setSopCat(e.target.value)}
                    >
                      <option value="Mesin Espresso" className="bg-amber-950">Mesin Espresso</option>
                      <option value="Sistem Air" className="bg-amber-950">Sistem Air (Water Filter)</option>
                      <option value="Grinder" className="bg-amber-950">Grinder Kopi</option>
                      <option value="Ice Maker" className="bg-amber-950">Ice Maker</option>
                      <option value="Chiller" className="bg-amber-950">Chiller &amp; Freezer</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Langkah Prosedur (Satu langkah per baris)</label>
                    <textarea
                      rows={5}
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-sans"
                      placeholder="Langkah 1: Matikan mesin &amp; pasang blind filter.&#10;Langkah 2: Tambahkan bubuk sabun 3 gram.&#10;Langkah 3: Jalankan ekstraksi."
                      value={sopStepText}
                      onChange={e => setSopStepText(e.target.value)}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#D4A853] hover:bg-amber-500 text-amber-950 font-bold py-2 rounded-xl text-xs transition duration-200"
                  >
                    🚀 Publikasikan SOP Panduan
                  </button>
                </form>
              </div>

              {/* Right: Lists of Active SOP */}
              <div className="lg:col-span-2 space-y-4">
                {sops.map((sop) => (
                  <div key={sop.id} className="p-5 bg-[#1d0e03]/50 border border-amber-500/10 rounded-2xl relative">
                    <button
                      onClick={() => handleDeleteSop(sop.id, sop.title)}
                      className="absolute top-4 right-4 text-red-400 hover:text-red-300 font-mono text-[10px]"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500/10 text-amber-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        {sop.category}
                      </span>
                      <span className="text-[10px] text-amber-100/30">Direview: {sop.lastReviewDate}</span>
                    </div>

                    <h4 className="font-serif font-bold text-base text-amber-100 mt-2">{sop.title}</h4>
                    
                    <ol className="mt-3 space-y-2 text-xs text-amber-100/70 border-l border-amber-500/10 ml-2 pl-4">
                      {sop.steps.map((step, idx) => (
                        <li key={idx} className="relative">
                          <span className="absolute -left-6 bg-amber-950 text-[#D4A853] font-mono font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-[#D4A853]/20">
                            {idx + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 3. INVENTORY SERVICE SUB-TAB */}
        {/* ========================================== */}
        {activeSubTab === "inventory" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-100">Inventaris Kimia Pembersih &amp; Suku Cadang</h3>
                <p className="text-xs text-amber-100/40">Logistik khusus pendukung kelancaran servis mesin, alat sikat, serta cadangan seal espresso.</p>
              </div>
              <div className="relative w-full md:w-64">
                <input 
                  type="text" 
                  placeholder="Cari nama barang / lokasi..."
                  className="bg-black/30 border border-amber-500/15 rounded-xl pl-9 pr-4 py-2 text-xs w-full text-amber-100 focus:outline-none focus:border-amber-400"
                  value={searchInvQuery}
                  onChange={e => setSearchInvQuery(e.target.value)}
                />
                <Search className="w-4 h-4 text-amber-500/40 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Add New Stock Form */}
              <div className="lg:col-span-4 bg-[#2c1b0f]/15 border border-amber-500/10 p-5 rounded-2xl h-fit">
                <h4 className="text-xs font-mono font-bold uppercase text-amber-300 tracking-wider mb-4">Daftarkan Barang Baru</h4>
                <form onSubmit={handleAddInventory} className="space-y-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Nama Barang</label>
                    <input 
                      type="text"
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      placeholder="e.g. O-Ring Gasket Kalari"
                      value={invName}
                      onChange={e => setInvName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Stok Masuk</label>
                      <input 
                        type="number"
                        className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                        value={invQty}
                        onChange={e => setInvQty(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Satuan</label>
                      <input 
                        type="text"
                        className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                        placeholder="pcs"
                        value={invUnit}
                        onChange={e => setInvUnit(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Titik Minimum</label>
                      <input 
                        type="number"
                        className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                        value={invMinQty}
                        onChange={e => setInvMinQty(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Penyimpanan</label>
                      <input 
                        type="text"
                        className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                        placeholder="e.g. Kolong Cabinet"
                        value={invLoc}
                        onChange={e => setInvLoc(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Catatan Kegunaan</label>
                    <textarea 
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      rows={2}
                      placeholder="Batas pakai atau kecocokan tipe"
                      value={invNotes}
                      onChange={e => setInvNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#D4A853] hover:bg-amber-500 text-amber-950 font-bold py-2 rounded-xl text-xs transition duration-200"
                  >
                    ✓ Simpan ke Database
                  </button>
                </form>
              </div>

              {/* Inventory Table List */}
              <div className="lg:col-span-8 bg-[#1e0e03]/30 border border-amber-500/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#2c1b0f]/50 text-[#D4A853] uppercase text-[10px] font-mono tracking-wider border-b border-amber-500/10">
                      <th className="p-4">Nama Barang</th>
                      <th className="p-4">Lokasi Rak</th>
                      <th className="p-4 text-center">Stok Gudang</th>
                      <th className="p-4">Terakhir Diupdate</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => {
                      const isLow = item.qty <= item.minQty;
                      return (
                        <tr key={item.id} className="border-b border-amber-500/5 hover:bg-amber-500/5 transition">
                          <td className="p-4">
                            <div className="font-bold text-amber-100">{item.name}</div>
                            {item.notes && <div className="text-[11px] text-amber-100/45 mt-0.5">{item.notes}</div>}
                          </td>
                          <td className="p-4">
                            <span className="bg-[#FAF0E6]/5 border border-amber-500/10 text-amber-300 font-mono text-[9px] px-2 py-0.5 rounded">
                              📍 {item.location}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Quantity control */}
                              <button 
                                onClick={() => handleUpdateInventoryQty(item.id, item.qty - 1)}
                                className="w-5 h-5 bg-amber-950 text-[#D4A853] border border-amber-500/20 rounded font-bold flex items-center justify-center hover:bg-amber-800"
                              >
                                -
                              </button>
                              <span className={`font-mono text-xs font-bold w-12 text-center py-0.5 rounded ${
                                isLow ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}>
                                {item.qty} {item.unit}
                              </span>
                              <button 
                                onClick={() => handleUpdateInventoryQty(item.id, item.qty + 1)}
                                className="w-5 h-5 bg-amber-950 text-[#D4A853] border border-amber-500/20 rounded font-bold flex items-center justify-center hover:bg-amber-800"
                              >
                                +
                              </button>
                            </div>
                            {isLow && (
                              <div className="text-[9px] text-red-400 text-center mt-1 font-mono">⚠️ Dibawah Par ({item.minQty})</div>
                            )}
                          </td>
                          <td className="p-4 text-amber-100/50 font-mono">{item.updatedAt}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteInventory(item.id, item.name)}
                              className="text-red-400 hover:text-red-300 transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInventory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-amber-100/30 italic">
                          Tidak ditemukan kecocokan barang inventaris.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 4. CLEANING SCHEDULE SUB-TAB */}
        {/* ========================================== */}
        {activeSubTab === "cleaning" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-100">Agenda Pembersihan (Cleaning Schedule)</h3>
                <p className="text-xs text-amber-100/40">Checklist kewajiban sanitasi espresso machine, grinder, dan milk chiller harian, mingguan, serta bulanan.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Input: New Cleaning Plan */}
              <div className="bg-[#2c1b0f]/15 border border-amber-500/10 p-5 rounded-2xl h-fit">
                <h4 className="text-xs font-mono font-bold uppercase text-amber-300 tracking-wider mb-4">Tambah Agenda</h4>
                <form onSubmit={handleAddCleaningTask} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Nama Tugas Kebersihan</label>
                    <input 
                      type="text"
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      placeholder="e.g. Descaling Steam Tip"
                      value={cleanName}
                      onChange={e => setCleanName(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Frekuensi</label>
                    <select
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      value={cleanFreq}
                      onChange={e => setCleanFreq(e.target.value as any)}
                    >
                      <option value="Harian" className="bg-amber-950">Harian (Daily Checklist)</option>
                      <option value="Mingguan" className="bg-amber-950">Mingguan (Weekly Routine)</option>
                      <option value="Bulanan" className="bg-amber-950">Bulanan (Deep Cleaning)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#D4A853] hover:bg-amber-500 text-amber-950 font-bold py-2 rounded-xl text-xs transition duration-200"
                  >
                    ✓ Daftarkan Penugasan
                  </button>
                </form>
              </div>

              {/* Cleaning Task Board Checklist */}
              <div className="lg:col-span-2 space-y-3">
                {cleaningTasks.map((task) => {
                  const isDone = task.status === "Selesai";
                  return (
                    <div 
                      key={task.id} 
                      className={`p-4 border rounded-2xl flex items-center justify-between transition duration-150 ${
                        isDone 
                          ? "bg-emerald-950/10 border-emerald-500/20 text-[#a3b899]" 
                          : "bg-[#1d0e03]/50 border-amber-500/10 text-amber-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => handleToggleCleaningTask(task.id)}
                          className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition shrink-0 ${
                            isDone 
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                              : "border-amber-500/30 text-transparent hover:border-amber-300"
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <div className={`font-medium text-xs leading-normal ${isDone ? "line-through opacity-50" : ""}`}>
                            {task.taskName}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 items-center mt-1.5">
                            <span className="bg-amber-500/10 text-[#D4A853] font-mono text-[8px] font-bold px-1.5 rounded uppercase">
                              ⏱️ {task.frequency}
                            </span>
                            {task.completedAt && (
                              <span className="text-[10px] text-emerald-400/70 font-mono">
                                Selesai pada: {task.completedAt} (Oleh: {task.assignedTo})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCleaningTask(task.id, task.taskName)}
                        className="text-red-400 hover:text-red-300 font-mono text-[10px] ml-4 shrink-0"
                        title="Batalkan Agenda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 5. MAINTENANCE CHECKLIST SUB-TAB */}
        {/* ========================================== */}
        {activeSubTab === "maintenance" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-100">Audit Parameter Teknis Mesin &amp; Sanitasi</h3>
                <p className="text-xs text-amber-100/40">Secara berkala pantau voltase, kisaran tekanan pompa (9 Bar), dan level kebersihan kondensor.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Input: Record Maintenance parameters */}
              <div className="lg:col-span-4 bg-[#2c1b0f]/15 border border-amber-500/10 p-5 rounded-2xl h-fit">
                <h4 className="text-xs font-mono font-bold uppercase text-amber-300 tracking-wider mb-4">Catat Hasil Pengecekan</h4>
                <form onSubmit={handleAddMaintenanceItem} className="space-y-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Nama Peralatan / Komponen</label>
                    <input 
                      type="text"
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      placeholder="e.g. Evaporator Plate Ice Maker"
                      value={mName}
                      onChange={e => setMName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Parameter Normal Standard</label>
                    <input 
                      type="text"
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      placeholder="e.g. Volts 220v. No scale"
                      value={mParam}
                      onChange={e => setMParam(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Status Kondisi Terakhir</label>
                    <select
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      value={mStatus}
                      onChange={e => setMStatus(e.target.value as any)}
                    >
                      <option value="Normal" className="bg-amber-950 text-emerald-300 font-bold">✓ Normal / Sesuai Standard</option>
                      <option value="Butuh Tindakan" className="bg-amber-950 text-amber-300 font-bold">⚠️ Perlu Pembersihan / Kalibrasi</option>
                      <option value="Kerusakan Kritis" className="bg-amber-950 text-red-300 font-bold">🚨 KRITIS - Segera Panggil Teknisi</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Catatan / Detail Temuan</label>
                    <textarea 
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                      rows={3}
                      placeholder="e.g. Penumpukan kerak kapur tipis..."
                      value={mNotes}
                      onChange={e => setMNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#D4A853] hover:bg-amber-500 text-amber-950 font-bold py-2 rounded-xl text-xs transition duration-200"
                  >
                    🚀 Laporkan Hasil Pemeriksaan
                  </button>
                </form>
              </div>

              {/* Maintenance Parameter checklist table */}
              <div className="lg:col-span-8 bg-[#1e0e03]/30 border border-amber-500/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#2c1b0f]/50 text-[#D4A853] uppercase text-[10px] font-mono tracking-wider border-b border-amber-500/10">
                      <th className="p-4">Komponen &amp; Standard</th>
                      <th className="p-4">Kondisi Status</th>
                      <th className="p-4">Tanggal Diperiksa</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceItems.map((item) => (
                      <tr key={item.id} className="border-b border-amber-500/5 hover:bg-amber-500/5 transition">
                        <td className="p-4">
                          <div className="font-bold text-amber-100">{item.equipmentName}</div>
                          <div className="text-[11px] text-[#D4A853]/60 font-mono mt-0.5">Sifat: {item.parameter}</div>
                          {item.notes && <div className="text-[11px] text-red-200/60 mt-1 italic">Note: {item.notes}</div>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                              item.status === "Normal" 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : item.status === "Butuh Tindakan" 
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/20" 
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              {item.status}
                            </span>
                            
                            {/* Fast Action Update Switcher */}
                            <select
                              className="bg-black/55 border border-amber-500/15 text-[10px] p-1 text-amber-200 rounded font-mono"
                              value={item.status}
                              onChange={(e) => handleUpdateMaintenanceStatus(item.id, e.target.value as any)}
                            >
                              <option value="Normal">Normal</option>
                              <option value="Butuh Tindakan">Butuh Tindakan</option>
                              <option value="Kerusakan Kritis">Kritis</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-4 font-mono">
                          <div className="text-amber-100">{item.lastCheckDate}</div>
                          <div className="text-[10px] text-amber-100/35">PIC: {item.checkedBy}</div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteMaintenanceItem(item.id)}
                            className="text-red-400 hover:text-red-300 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 6. DAILY REPORT SUB-TAB */}
        {/* ========================================== */}
        {activeSubTab === "daily_report" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-100">Buku Laporan Harian (Daily Report)</h3>
                <p className="text-xs text-amber-100/40">Sistem pelaporan penutupan shift service untuk direkap oleh Supervisor / Manager.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form Submit Report */}
              <div className="lg:col-span-4 bg-[#2c1b0f]/15 border border-amber-500/10 p-5 rounded-2xl h-fit">
                <h4 className="text-xs font-mono font-bold uppercase text-amber-300 tracking-wider mb-4">Kirim Laporan Shift</h4>
                <form onSubmit={handleAddDailyReport} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Tanggal Laporan</label>
                      <input 
                        type="date"
                        className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none"
                        value={repDate}
                        onChange={e => setRepDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Shift Kerja</label>
                      <select
                        className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none"
                        value={repShift}
                        onChange={e => setRepShift(e.target.value as any)}
                      >
                        <option value="Pagi">Pagi</option>
                        <option value="Siang">Siang</option>
                        <option value="Malam">Malam</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Pekerjaan Sanitasi Selesai</label>
                    <input 
                      type="text"
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none"
                      placeholder="e.g. Sikat drip tray bar selesai"
                      value={repTasksDoneList}
                      onChange={e => setRepTasksDoneList(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Tindakan Pemeliharaan Mesin</label>
                    <textarea 
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none"
                      rows={2}
                      placeholder="e.g. Backflush 2 sachet sabun selesai"
                      value={repMaintNotes}
                      onChange={e => setRepMaintNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Insiden Malfungsi Mesin</label>
                    <textarea 
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none border-red-500/10"
                      rows={1}
                      placeholder="e.g. Nil, aman"
                      value={repIncNotes}
                      onChange={e => setRepIncNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Catatan Tambahan / Rekomendasi</label>
                    <textarea 
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100"
                      rows={2}
                      placeholder="Stok cleaner nipis harian"
                      value={repGenNotes}
                      onChange={e => setRepGenNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#D4A853] hover:bg-amber-500 text-amber-950 font-bold py-2 rounded-xl text-xs transition duration-200"
                  >
                    ✓ Kirim Laporan &amp; Hitung KPI
                  </button>
                </form>
              </div>

              {/* Right Column: List of Submitted Reports */}
              <div className="lg:col-span-8 space-y-4">
                {dailyReports.map((r) => (
                  <div key={r.id} className="p-5 bg-[#1d0e03]/60 border border-amber-500/10 rounded-2xl relative">
                    <button
                      onClick={() => handleDeleteDailyReport(r.id)}
                      className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="bg-[#FAF0E6]/10 text-[#D4A853] font-mono text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {r.date}
                      </span>
                      <span className="bg-amber-500/10 text-amber-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                        Shift: {r.shift}
                      </span>
                      <span className="text-[10px] text-amber-100/40">PIC: {r.staffName}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-2 text-amber-100/80">
                      <div>
                        <div className="text-[10px] text-[#D4A853] uppercase font-bold tracking-wider font-mono">Teknikal &amp; Maintenance:</div>
                        <p className="mt-1 leading-relaxed bg-[#FAF0E6]/5 p-2 rounded border border-amber-500/5">{r.maintenanceDone}</p>
                      </div>
                      <div>
                        <div className="text-[10px] text-red-400 uppercase font-bold tracking-wider font-mono">Insiden Malfungsi:</div>
                        <p className="mt-1 leading-relaxed bg-red-950/5 p-2 rounded border border-red-950/20">{r.incidentsNotes}</p>
                      </div>
                    </div>

                    {r.generalNotes && (
                      <div className="mt-3.5 pt-3.5 border-t border-amber-500/10 text-xs text-amber-100/60 font-serif italic">
                        &ldquo;{r.generalNotes}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
                
                {dailyReports.length === 0 && (
                  <div className="p-8 text-center text-amber-100/30 italic">
                    Belum ada rekaman laporan harian. Silahkan kirim laporan penutupan shift di form kiri.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 7. EVIDENCE UPLOAD (CAMERA) SUB-TAB */}
        {/* ========================================== */}
        {activeSubTab === "evidence" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-100">Galeri Bukti &amp; Kamera Dokumentasi</h3>
                <p className="text-xs text-amber-100/40">Kirimkan snapshot selesai pengerjaan sanitasi, visual kerusakan mesin kopi, atau foto filter cartridge.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Upload / Camera Snap */}
              <div className="lg:col-span-5 bg-[#2c1b0f]/15 border border-amber-500/10 p-5 rounded-2xl space-y-4 h-fit">
                <form onSubmit={handleAddEvidence} className="space-y-4">
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Judul Kegiatan</label>
                    <input 
                      type="text"
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none"
                      placeholder="e.g. Selesai Vakum Kondenser"
                      value={evTitle}
                      onChange={e => setEvTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Kategori Klasifikasi</label>
                    <select
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100"
                      value={evCat}
                      onChange={e => setEvCat(e.target.value)}
                    >
                      <option value="Espresso">Sanitasi Mesin (Backflush)</option>
                      <option value="Filter">Ganti/Cek Filter Air</option>
                      <option value="Kulkas/Chiller">Pembersihan Chiller / Gasket</option>
                      <option value="Ice">Pembersihan Evaporator Ice Maker</option>
                      <option value="Kerusakan">Temuan Kerusakan Suku Cadang</option>
                    </select>
                  </div>

                  {/* Drag-n-Drop File Upload Trigger with Camera capability */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Ambil / Seret Foto</label>
                    
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
                        isDragging 
                          ? "border-amber-400 bg-amber-500/10" 
                          : "border-amber-500/20 bg-black/40 hover:bg-black/60"
                      }`}
                    >
                      {evPhotoUrl ? (
                        <div className="relative">
                          <img 
                            src={evPhotoUrl} 
                            alt="Bukti Potret" 
                            className="max-h-28 rounded-lg border border-amber-500/30 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button" 
                            onClick={() => setEvPhotoUrl("")}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 text-[9px] font-bold w-4 h-4 flex items-center justify-center hover:bg-red-500 shadow"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-amber-500/40" />
                          <p className="text-xs text-amber-100/60 leading-normal">
                            Seret &amp; letakkan gambar di sini atau
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleTriggerCamera}
                              className="bg-[#2c1b0f] text-[#D4A853] font-mono text-[9px] font-bold px-3 py-1.5 rounded-lg border border-[#D4A853]/20 flex items-center gap-1.5 hover:bg-amber-950 transition"
                            >
                              <Camera className="w-3.5 h-3.5" /> AMBIL DARI KAMERA
                            </button>
                          </div>
                        </>
                      )}

                      {/* Hidden Standard File Input with direct camera capture environment properties */}
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                        onChange={handlePhotoFileChange} 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-amber-100/45 font-bold uppercase tracking-wider font-mono">Deskripsi Bukti Kerja</label>
                    <textarea 
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-xs text-amber-100 focus:outline-none"
                      rows={2.5}
                      placeholder="Deskripsikan kondisi sejelas mungkin."
                      value={evDesc}
                      onChange={e => setEvDesc(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#D4A853] hover:bg-amber-500 text-amber-950 font-bold py-2 rounded-xl text-xs transition duration-200"
                  >
                    ✓ Simpan Laporan Dokumentasi
                  </button>
                </form>
              </div>

              {/* Gallery List Collection */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
                {evidences.map((ev) => (
                  <div key={ev.id} className="bg-[#1d0e03]/50 border border-amber-500/10 rounded-2xl overflow-hidden shadow flex flex-col justify-between">
                    <div className="relative h-44 bg-black/40 flex items-center justify-center">
                      <img 
                        src={ev.photoUrl} 
                        alt={ev.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 bg-[#11311b]/80 border border-emerald-500/20 text-emerald-300 font-mono text-[8.5px] font-bold uppercase px-2 py-0.5 rounded">
                        {ev.category}
                      </span>
                      <button
                        onClick={() => handleDeleteEvidence(ev.id)}
                        className="absolute top-3 right-3 bg-red-950/80 border border-red-500/20 text-red-400 p-1 rounded-md hover:bg-red-900 transition"
                        title="Hapus Bukti"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 space-y-1 bg-[#1e0e03]/40">
                      <h4 className="font-serif font-bold text-sm text-amber-100 line-clamp-1">{ev.title}</h4>
                      <p className="text-[11px] text-amber-100/60 leading-normal line-clamp-3">{ev.description}</p>
                      
                      <div className="pt-2 border-t border-amber-500/5 flex justify-between items-center text-[9px] text-[#D4A853]/60 font-mono">
                        <span>Oleh: {ev.uploadedBy}</span>
                        <span>{ev.uploadedAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 8. KPI SERVICE REPORT SUB-TAB */}
        {/* ========================================== */}
        {activeSubTab === "kpi" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-amber-500/10 pb-4">
              <h3 className="font-serif font-bold text-lg text-amber-100">Buku Raport KPI Service Department</h3>
              <p className="text-xs text-amber-100/40">Grafik dan penilaian kepatuhan kru service dinilai berdasarkan ketepatan cleaning harian dan minimalisasi breakdown mesin.</p>
            </div>

            {/* KPI Radar Assessment Board */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Score Radar Details */}
              <div className="lg:col-span-5 bg-[#2c1b0f]/15 border border-amber-500/10 p-5 rounded-2xl relative space-y-5">
                <span className="bg-[#D4A853]/15 text-[#D4A853] text-[9px] font-mono font-bold px-2.5 py-1 rounded border border-[#D4A853]/20 uppercase">
                  ⭐ NILAI TERAKHIR
                </span>
                
                <div className="flex justify-between items-baseline mt-4">
                  <h4 className="font-serif text-2xl font-bold text-amber-100">
                    Sistem Performa Andi
                  </h4>
                  <span className="text-3xl font-serif text-emerald-400 font-bold">
                    {kpis.length > 0 ? kpis[0].avgScore : "94.00"}
                  </span>
                </div>

                {/* Score Matrix Grid bars */}
                <div className="space-y-3 pt-3">
                  <div>
                    <div className="flex justify-between text-xs font-mono text-amber-100/60 mb-1">
                      <span>1. Ketepatan Cleaning Harian</span>
                      <span className="font-bold text-amber-400">{kpis.length > 0 ? kpis[0].cleaningScore : 94}%</span>
                    </div>
                    <div className="w-full bg-amber-950/40 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${kpis.length > 0 ? kpis[0].cleaningScore : 94}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-amber-100/60 mb-1">
                      <span>2. Response Time &amp; Kalibrasi Pompa</span>
                      <span className="font-bold text-amber-400">{kpis.length > 0 ? kpis[0].maintenanceScore : 90}%</span>
                    </div>
                    <div className="w-full bg-amber-950/40 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${kpis.length > 0 ? kpis[0].maintenanceScore : 90}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-amber-100/60 mb-1">
                      <span>3. Kepatuhan Langkah SOP</span>
                      <span className="font-bold text-amber-400">{kpis.length > 0 ? kpis[0].sopCompliance : 98}%</span>
                    </div>
                    <div className="w-full bg-amber-950/40 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${kpis.length > 0 ? kpis[0].sopCompliance : 98}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-amber-100/60 mb-1">
                      <span>4. Kedisiplinan Pelaporan Shift</span>
                      <span className="font-bold text-amber-400">{kpis.length > 0 ? kpis[0].reportingScore : 92}%</span>
                    </div>
                    <div className="w-full bg-amber-950/40 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${kpis.length > 0 ? kpis[0].reportingScore : 92}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-xs leading-normal font-mono text-amber-250 italic">
                  💡 Catatan Evaluasi: Performa sangat stabil. Upayakan penggantian gasket group head yang teratur agar keandalan hardware 100% prima.
                </div>
              </div>

              {/* Right History Table Details */}
              <div className="lg:col-span-7 bg-[#1e0e03]/30 border border-amber-500/10 rounded-2xl overflow-hidden">
                <div className="p-4 bg-[#2c1b0f]/30 border-b border-amber-500/10 flex justify-between items-center">
                  <span className="font-serif font-bold text-xs text-amber-100">Log Kepangkatan &amp; Nilai Bulanan</span>
                  <span className="text-[10px] text-amber-500/40">Persitensi Terverifikasi</span>
                </div>
                
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-black/20 text-[#D4A853] uppercase text-[9px] font-mono tracking-wider border-b border-amber-500/10">
                      <th className="p-4">Periode</th>
                      <th className="p-4 text-center">Cleaning</th>
                      <th className="p-4 text-center">Teknikal</th>
                      <th className="p-4 text-center">SOP</th>
                      <th className="p-4 text-center">Bobot Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.map((k, idx) => (
                      <tr key={idx} className="border-b border-amber-500/5 hover:bg-amber-500/5 transition">
                        <td className="p-4 font-serif font-bold text-amber-100">{k.period}</td>
                        <td className="p-4 text-center font-mono text-amber-300">{k.cleaningScore}</td>
                        <td className="p-4 text-center font-mono text-amber-300">{k.maintenanceScore}</td>
                        <td className="p-4 text-center font-mono text-amber-300">{k.sopCompliance}</td>
                        <td className="p-4 text-center">
                          <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded font-mono border border-emerald-500/10">
                            {k.avgScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
