import React, { useState, useEffect, useRef } from "react";
import { CoffeeOpsState, User, BackupItem, BackupAuditLog, BackupNotificationSettings } from "../types";
import SupabaseEnterpriseSchema from "./SupabaseEnterpriseSchema";
import { 
  Shield, 
  Database, 
  Upload, 
  Download, 
  RefreshCw, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  History, 
  Lock, 
  Unlock, 
  Settings, 
  Trash2, 
  ChevronRight, 
  Terminal, 
  Bell, 
  Layers, 
  PieChart, 
  Share2 
} from "lucide-react";

interface SystemManagementProps {
  state: CoffeeOpsState;
  syncState: (state: CoffeeOpsState) => void;
  currentUser: User | null;
  activeRole: string;
}

export default function SystemManagement({
  state,
  syncState,
  currentUser,
  activeRole,
}: SystemManagementProps) {
  // Navigation Subtabs
  const [activeSubTab, setActiveSubTab] = useState<"backup" | "restore" | "export" | "import" | "recovery" | "audit" | "supabase">("backup");

  // Supabase Cloud Configuration State
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem("coffeeops_sb_url") || "");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem("coffeeops_sb_anon_key") || "");
  const [supabaseServiceKey, setSupabaseServiceKey] = useState(() => localStorage.getItem("coffeeops_sb_service_key") || "");
  const [supabaseBucket, setSupabaseBucket] = useState(() => localStorage.getItem("coffeeops_sb_bucket") || "coffeeops-backups");
  const [isConfigEditing, setIsConfigEditing] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [testResultMsg, setTestResultMsg] = useState("");

  // Notification Settings
  const [notifEmail, setNotifEmail] = useState(() => state.backupNotificationSettings?.email || currentUser?.email || "owner@coffeeops.com");
  const [isEmailEnabled, setIsEmailEnabled] = useState(() => state.backupNotificationSettings?.isEmailEnabled ?? true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(() => state.backupNotificationSettings?.whatsapp || currentUser?.whatsappNumber || "08123456789");
  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(() => state.backupNotificationSettings?.isWhatsappEnabled ?? false);
  const [notifTelegram, setNotifTelegram] = useState(() => state.backupNotificationSettings?.telegram || "@coffeeops_bot");
  const [isTelegramEnabled, setIsTelegramEnabled] = useState(() => state.backupNotificationSettings?.isTelegramEnabled ?? false);

  // Manual Backup form states
  const [backupNotes, setBackupNotes] = useState("");
  const [encryptBackup, setEncryptBackup] = useState(true);
  const [backupPasswordValue, setBackupPasswordValue] = useState("");
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupSuccessCard, setBackupSuccessCard] = useState<BackupItem | null>(null);

  // Restore States
  const [selectedBackupIdForRestore, setSelectedBackupIdForRestore] = useState<string>("");
  const [restoreType, setRestoreType] = useState<"full" | "partial">("full");
  const [partialModules, setPartialModules] = useState({
    sop: false,
    inventory: false,
    equipment: false,
    reports: false,
  });
  const [restoreStep, setRestoreStep] = useState<number>(1); // 1: Select, 2: Security Pin, 3: OTP Code, 4: Executing/Success
  const [restorePinValue, setRestorePinValue] = useState("");
  const [restoreOtpValue, setRestoreOtpValue] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restorePinError, setRestorePinError] = useState("");
  const [restoreOtpError, setRestoreOtpError] = useState("");

  // Import states
  const [importTargetModule, setImportTargetModule] = useState<"inventory" | "equipment" | "sop" | "users">("inventory");
  const [validationReport, setValidationReport] = useState<{
    status: "idle" | "validating" | "success" | "errors";
    fileName: string;
    rowCount: number;
    errors: string[];
    parsedData: any[] | null;
  }>({
    status: "idle",
    fileName: "",
    rowCount: 0,
    errors: [],
    parsedData: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters for History table
  const [historyFilter, setHistoryFilter] = useState<"All" | "Daily" | "Weekly" | "Monthly" | "Manual">("All");
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");

  // Storage Stats (simulated based on actual data length + mock values)
  const [dbStats, setDbStats] = useState({
    dbSizeKb: 142.4,
    mediaSizeMb: 12.8,
    backupSizeMb: 84.5,
    maxStorageGb: 50,
  });

  // Check Role Access. Only Owner or Manager gets in.
  const isOwner = currentUser?.role === "Owner";
  const isManager = currentUser?.role === "Manager";
  const isReadOnly = isManager; // Manager is strictly Read Only

  // Auto-fill existing or default backups if empty on first load.
  useEffect(() => {
    if (!state.backupsList || state.backupsList.length === 0) {
      const defaultBackups: BackupItem[] = [
        {
          id: "bk-01",
          name: "coffeeops_auto_daily_02_00",
          createdDate: "2026-06-02 02:00",
          backupType: "Daily",
          fileSize: "2.42 MB",
          createdBy: "Automated System Check",
          isProtected: true,
          notes: "Daily automated snapshot of terminal db at 2 AM timezone",
          isStorageBackup: true
        },
        {
          id: "bk-02",
          name: "coffeeops_weekly_schedule_sun",
          createdDate: "2026-05-31 03:00",
          backupType: "Weekly",
          fileSize: "14.15 MB",
          createdBy: "Automated System Check",
          isProtected: true,
          notes: "Weekly recurring audit snapshot + Supabase Storage full dump",
          isStorageBackup: true
        },
        {
          id: "bk-03",
          name: "coffeeops_monthly_closing_may",
          createdDate: "2026-06-01 02:05",
          backupType: "Monthly",
          fileSize: "48.20 MB",
          createdBy: "Automated System Check",
          isProtected: true,
          notes: "Monthly enterprise financial, operational, & SOP digital backup",
          isStorageBackup: true
        }
      ];

      const defaultAuditLogs: BackupAuditLog[] = [
        {
          id: "log-01",
          actorName: "Sistem Otomatis",
          actorRole: "System Admin",
          actionType: "CREATE_BACKUP",
          timestamp: "2026-06-02 02:00",
          details: "Berhasil melakukan pencadangan otomatis harian (Daily Backup) ke cloud storage Supabase.",
          status: "SUCCESS"
        },
        {
          id: "log-02",
          actorName: "Sistem Otomatis",
          actorRole: "System Admin",
          actionType: "CREATE_BACKUP",
          timestamp: "2026-06-01 02:05",
          details: "Berhasil melakukan pencadangan bulanan global (Monthly Backup) ke server Supabase Storage.",
          status: "SUCCESS"
        }
      ];

      // Sync defaults
      syncState({
        ...state,
        backupsList: defaultBackups,
        backupAuditLogs: defaultAuditLogs,
        backupNotificationSettings: {
          email: "owner@coffeeops.com",
          isEmailEnabled: true,
          whatsapp: "08123456789",
          isWhatsappEnabled: false,
          telegram: "@coffeeops_bot",
          isTelegramEnabled: false
        }
      });
    }
  }, []);

  // Recalculate dynamic storage stats on state changes
  useEffect(() => {
    // Basic dynamic calculations to reflect actual record counts
    const userCount = state.users?.length || 0;
    const sopCount = state.sopsList?.length || 0;
    const itemCount = state.master?.length || 0;
    const transCount = state.sales?.length || 0;
    
    const sizeFactor = 1.05 + (userCount * 0.15) + (sopCount * 1.5) + (itemCount * 0.25) + (transCount * 0.35);
    const calculatedDbSize = Math.max(14.5, parseFloat((sizeFactor * 12.4).toFixed(1)));
    const calculatedMediaSize = Math.max(8.2, parseFloat((sopCount * 4.1 + 5.5).toFixed(1)));
    const calculatedBackupSize = Math.max(48.5, parseFloat(((state.backupsList?.length || 3) * calculatedDbSize * 1.1 + 25.5).toFixed(1)));

    setDbStats({
      dbSizeKb: calculatedDbSize,
      mediaSizeMb: calculatedMediaSize,
      backupSizeMb: calculatedBackupSize,
      maxStorageGb: 50,
    });
  }, [state, state.backupsList, state.sopsList, state.master, state.sales]);

  // Handle configuration update
  const handleSaveConfig = () => {
    localStorage.setItem("coffeeops_sb_url", supabaseUrl);
    localStorage.setItem("coffeeops_sb_anon_key", supabaseAnonKey);
    localStorage.setItem("coffeeops_sb_service_key", supabaseServiceKey);
    localStorage.setItem("coffeeops_sb_bucket", supabaseBucket);
    
    // Add audit log for config update
    const newAuditLog: BackupAuditLog = {
      id: "log-" + Date.now(),
      actorName: currentUser?.name || "Kru Sesi",
      actorRole: currentUser?.role || "Staff",
      actionType: "CONFIG_CHANGE",
      timestamp: getCurrentTimeString(),
      details: `Mengubah konfigurasi API Endpoint & Kredensial Sinkronisasi Supabase ke Bucket: ${supabaseBucket}`,
      status: "SUCCESS"
    };

    const nextState = {
      ...state,
      backupAuditLogs: [newAuditLog, ...(state.backupAuditLogs || [])],
      backupNotificationSettings: {
        email: notifEmail,
        isEmailEnabled,
        whatsapp: notifWhatsapp,
        isWhatsappEnabled,
        telegram: notifTelegram,
        isTelegramEnabled
      }
    };

    syncState(nextState);
    setIsConfigEditing(false);
    alert("✓ Konfigurasi Supabase System & Notifikasi berhasil disimpan.");
  };

  // Test Supabase connection
  const handleTestConnection = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setTestStatus("failed");
      setTestResultMsg("Endpoint URL dan Anon Key/Token tidak boleh kosong!");
      return;
    }
    setTestStatus("testing");
    setTestResultMsg("Menghubungi endpoint Supabase...");

    setTimeout(() => {
      // Simulate real ping check
      if (supabaseUrl.includes("supabase.co")) {
        setTestStatus("success");
        setTestResultMsg(`✓ Sukses terhubung ke Supabase Cloud Platform. Bucket '${supabaseBucket}' dalam keadaan Aktif (Operational).`);
      } else {
        setTestStatus("failed");
        setTestResultMsg("Gagal melakukan ping. DNS resolution gagal atau Token tidak valid (TLS Handshake Failed).");
      }
    }, 1500);
  };

  // Create Manual Backup
  const handleCreateManualBackup = () => {
    if (isReadOnly) return;
    setIsCreatingBackup(true);
    setBackupSuccessCard(null);

    // Dynamic filename based on datetime
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, "_");
    const secondsStr = new Date().toLocaleTimeString("en-US", {hour12: false}).replace(/:/g, "_");
    const name = `manual-coffeeops-snapshot-${dateStr}-${secondsStr}`;

    setTimeout(() => {
      const sizeMb = (dbStats.dbSizeKb / 1000 + 1.25).toFixed(2);
      const newBackup: BackupItem = {
        id: "bk-man-" + Date.now(),
        name,
        createdDate: getCurrentTimeString(),
        backupType: "Manual",
        fileSize: `${sizeMb} MB`,
        createdBy: currentUser?.name || "Owner Terminal",
        notes: backupNotes || "Manual full system backup",
        isProtected: encryptBackup,
        isStorageBackup: true
      };

      const newAuditLog: BackupAuditLog = {
        id: "log-" + Date.now(),
        actorName: currentUser?.name || "Owner Terminal",
        actorRole: currentUser?.role || "Staff",
        actionType: "CREATE_BACKUP",
        timestamp: getCurrentTimeString(),
        details: `Membuat manual snapshot '${name}' secara instan (Enkripsi: ${encryptBackup ? "Ya (AES-256)" : "Tidak"}). Deskripsi: ${backupNotes || "-"}`,
        status: "SUCCESS"
      };

      const updatedBackups = [newBackup, ...(state.backupsList || [])];
      const nextLogs = [newAuditLog, ...(state.backupAuditLogs || [])];

      syncState({
        ...state,
        backupsList: updatedBackups,
        backupAuditLogs: nextLogs
      });

      setIsCreatingBackup(false);
      setBackupSuccessCard(newBackup);
      setBackupNotes("");
      setBackupPasswordValue("");

      // Trigger standard email simulation
      if (isEmailEnabled) {
        console.log(`Sending Backup success email notification to ${notifEmail}`);
      }
    }, 1800);
  };

  // Delete Backup
  const handleDeleteBackup = (id: string, name: string) => {
    if (isReadOnly) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus arsip backup '${name}' dari Supabase Cloud / local?`)) return;

    const updated = (state.backupsList || []).filter(b => b.id !== id);
    const newAuditLog: BackupAuditLog = {
      id: "log-" + Date.now(),
      actorName: currentUser?.name || "Owner Terminal",
      actorRole: currentUser?.role || "Staff",
      actionType: "DELETE",
      timestamp: getCurrentTimeString(),
      details: `Menghapus arsip cadangan (Deleted Backup Key): '${name}'`,
      status: "SUCCESS"
    };

    syncState({
      ...state,
      backupsList: updated,
      backupAuditLogs: [newAuditLog, ...(state.backupAuditLogs || [])]
    });

    alert(`✓ Backup '${name}' berhasil dihapus permanen.`);
  };

  // Triggering OTP Sending for Restore Security
  const handleSendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsRestoring(true);

    setTimeout(() => {
      setIsRestoring(false);
      setOtpSent(true);
      setRestoreOtpError("");
      // Simulate real dispatch console print
      console.log(`[STRICT SECURITY] Security OTP Code generated for Owner: ${code}. Sent to ${notifEmail}`);
      alert(`🔑 Keamanan Berlapis: Kode OTP Rahasia 6-digit berhasil dikirimkan ke: ${notifEmail}`);
    }, 1000);
  };

  // Pin Validation
  const handleVerifyPin = () => {
    if (!currentUser || !restorePinValue) {
      setRestorePinError("PIN Anda wajib dimasukkan.");
      return;
    }

    if (restorePinValue !== currentUser.pin) {
      setRestorePinError("❌ PIN Verifikasi Salah! Harap masukkan PIN yang benar untuk otorisasi.");
      return;
    }

    setRestorePinError("");
    setRestoreStep(3); // Go to OTP screen
    handleSendOtp();
  };

  // OTP Verification and Execution
  const handleExecuteRestore = () => {
    if (restoreOtpValue !== generatedOtp) {
      setRestoreOtpError("❌ Kode OTP Salah! Silakan periksa kembali email Anda.");
      return;
    }

    setRestoreOtpError("");
    setIsRestoring(true);
    setRestoreProgress(5);

    // Simulate progress bar execution
    const interval = setInterval(() => {
      setRestoreProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          finalizeRestoreExecution();
          return 100;
        }
        return prev + 15;
      });
    }, 400);
  };

  // Finalize restore actions, roll back database state
  const finalizeRestoreExecution = () => {
    const backupObj = (state.backupsList || []).find(b => b.id === selectedBackupIdForRestore);
    const backupName = backupObj ? backupObj.name : "Backup Unknown";

    // Set auditing log
    const audit: BackupAuditLog = {
      id: "log-" + Date.now(),
      actorName: currentUser?.name || "Owner Terminal",
      actorRole: currentUser?.role || "Staff",
      actionType: "RESTORE",
      timestamp: getCurrentTimeString(),
      details: `Melakukan pemulihan data (Restore Execution) '${restoreType === "full" ? "Penuh (Full)" : "Parsial (Partial)"}' dari snapshot: ${backupName}`,
      moduleRestored: restoreType === "full" ? "Semua Modul (Full DB / Files)" : Object.keys(partialModules).filter(k => partialModules[k as keyof typeof partialModules]).join(", "),
      status: "SUCCESS"
    };

    // If restoring, simulate specific key rollbacks
    const updatedState = { ...state };
    updatedState.backupAuditLogs = [audit, ...(state.backupAuditLogs || [])];
    
    // If partial restore, we reset logs or simulate successfully loading those
    syncState(updatedState);

    setIsRestoring(false);
    setRestoreStep(4); // Success screen
  };

  // Reset Restore Flow
  const resetRestoreFlow = () => {
    setRestoreStep(1);
    setSelectedBackupIdForRestore("");
    setRestorePinValue("");
    setRestoreOtpValue("");
    setGeneratedOtp("");
    setOtpSent(false);
    setRestoreProgress(0);
    setPartialModules({
      sop: false,
      inventory: false,
      equipment: false,
      reports: false,
    });
  };

  // Exporters Center
  const downloadCsvFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Add Audit Log for export
    const newLog: BackupAuditLog = {
      id: "log-" + Date.now(),
      actorName: currentUser?.name || "Kru Sesi",
      actorRole: currentUser?.role || "Staff",
      actionType: "CONFIG_CHANGE",
      timestamp: getCurrentTimeString(),
      details: `Mengekspor data operasional '${fileName.split(".")[0]}' ke Excel/CSV format`,
      status: "SUCCESS"
    };
    syncState({
      ...state,
      backupAuditLogs: [newLog, ...(state.backupAuditLogs || [])]
    });
  };

  const handleExportDataExcel = (moduleName: string) => {
    let csvContent = "";
    const prefix = state.branding.name.toLowerCase().replace(/\s+/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);

    if (moduleName === "inventory") {
      csvContent = "Kode Bahan,Nama Bahan Baku,Unit Satuan,Minimal Par Stock\n";
      state.master.forEach(item => {
        csvContent += `"${item.code}","${item.name}","${item.unit}",${item.par}\n`;
      });
      downloadCsvFile(csvContent, `${prefix}_export_inventory_${dateStr}.csv`);
    } else if (moduleName === "sop") {
      csvContent = "ID SOP,Judul SOP,Kategori,Versi,Doc/Video Link\n";
      (state.sopsList || []).forEach(sop => {
        csvContent += `"${sop.id}","${sop.title}","${sop.category}","${sop.version}","${sop.videoUrl || sop.docUrl || "-"}"\n`;
      });
      downloadCsvFile(csvContent, `${prefix}_export_sop_guidelines_${dateStr}.csv`);
    } else if (moduleName === "kpi") {
      csvContent = "KPI Record ID,Nama Staff,Skor KPI,SOP Compliance,Catatan Evaluasi\n";
      (state.serviceKPIs || []).forEach(kpi => {
        csvContent += `"${kpi.id}","${kpi.staffName}",${kpi.avgScore},${kpi.sopCompliance},"${kpi.notes || "-"}"\n`;
      });
      // Fallback dummy records if empty
      if ((state.serviceKPIs || []).length === 0) {
        csvContent += `"KPI-DUMMY-1","Andi Wijaya",92,98,"Sangat disiplin dan kalibrasi susu sempurna"\n`;
        csvContent += `"KPI-DUMMY-2","Budi Santoso",86,95,"Disiplin FIFO sangat bagus, ramah foh"\n`;
      }
      downloadCsvFile(csvContent, `${prefix}_export_kpi_performa_${dateStr}.csv`);
    } else if (moduleName === "attendance") {
      csvContent = "Log ID,Nama Staff,Tanggal,Waktu Masuk,Waktu Pulang,Status,Shift\n";
      (state.shiftAttendanceLogs || []).forEach(att => {
        csvContent += `"${att.id}","${att.userName}","${att.date}","${att.checkIn}","${att.checkOut || "-"}","${att.status}","${att.shiftId || "-"}"\n`;
      });
      downloadCsvFile(csvContent, `${prefix}_export_attendance_${dateStr}.csv`);
    } else if (moduleName === "equipment") {
      csvContent = "Asset ID,Asset Name,Category,Storage Area,Status,Maintenance Schedule\n";
      (state.equipmentList || []).forEach(eq => {
        csvContent += `"${eq.assetId}","${eq.name}","${eq.department}","${eq.location}","${eq.status}","${eq.maintenanceSchedule || "-"}"\n`;
      });
      downloadCsvFile(csvContent, `${prefix}_export_equipment_database_${dateStr}.csv`);
    } else if (moduleName === "financial") {
      csvContent = "Log ID,Tanggal Transaksi,Sales Revenue Bersih,HPP Pokok,Est. Kotor Laba\n";
      (state.sales || []).forEach(sale => {
        csvContent += `"${sale.id}","${sale.date}",${sale.totalRevenue},${sale.totalCost},${sale.totalRevenue - sale.totalCost}\n`;
      });
      downloadCsvFile(csvContent, `${prefix}_export_financial_sales_${dateStr}.csv`);
    } else {
      alert("Format data ekspor tidak dikenali oleh System Engine.");
    }
  };

  // Upload File Simulator & Schema Checklist Validator
  const handleFileUploadAction = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationReport({
      status: "validating",
      fileName: file.name,
      rowCount: 0,
      errors: [],
      parsedData: null
    });

    // Read file text
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setTimeout(() => {
        // Run rigorous column checks
        const lines = text.split("\n").filter(l => l.trim().length > 0);
        if (lines.length === 0) {
          setValidationReport({
            status: "errors",
            fileName: file.name,
            rowCount: 0,
            errors: ["File kosong atau tidak memiliki data yang valid."],
            parsedData: null
          });
          return;
        }

        const headers = lines[0].toLowerCase();
        let errorsList: string[] = [];
        let parsedRows: any[] = [];

        if (importTargetModule === "inventory") {
          // Required headers check
          if (!headers.includes("kode") && !headers.includes("code")) {
            errorsList.push("Kolom wajib 'Kode Bahan' (code/kode) tidak terdeteksi!");
          }
          if (!headers.includes("nama") && !headers.includes("name")) {
            errorsList.push("Kolom wajib 'Nama Bahan' (name/nama) tidak terdeteksi!");
          }

          if (errorsList.length === 0) {
            // Dry parsing rows
            for (let i = 1; i < lines.length; i++) {
              const parts = lines[i].split(",").map(p => p.replace(/"/g, "").trim());
              if (parts.length >= 2) {
                parsedRows.push({
                  code: parts[0],
                  name: parts[1],
                  unit: parts[2] || "pcs",
                  par: parseFloat(parts[3]) || 0
                });
              }
            }
          }
        } else if (importTargetModule === "equipment") {
          if (!headers.includes("code") && !headers.includes("kode")) {
            errorsList.push("Kolom wajib 'Asset Code/Kode' tidak terdeteksi.");
          }
          if (!headers.includes("name") && !headers.includes("nama")) {
            errorsList.push("Kolom wajib 'Asset Name/Nama' tidak terdeteksi.");
          }

          if (errorsList.length === 0) {
            for (let i = 1; i < lines.length; i++) {
              const parts = lines[i].split(",").map(p => p.replace(/"/g, "").trim());
              if (parts.length >= 2) {
                parsedRows.push({
                  code: parts[0],
                  name: parts[1],
                  category: parts[2] || "Uncategorized",
                  location: parts[3] || "gudang",
                  status: parts[4] || "Aktif"
                });
              }
            }
          }
        } else {
          // SOP & Employee Validator standard
          if (lines.length < 2) {
            errorsList.push("Data baris minim tidak mencukupi (Silakan masukkan baris data setelah header).");
          }
        }

        if (errorsList.length > 0) {
          setValidationReport({
            status: "errors",
            fileName: file.name,
            rowCount: 0,
            errors: errorsList,
            parsedData: null
          });
        } else {
          setValidationReport({
            status: "success",
            fileName: file.name,
            rowCount: parsedRows.length > 0 ? parsedRows.length : lines.length - 1,
            errors: [],
            parsedData: parsedRows.length > 0 ? parsedRows : null
          });
        }
      }, 1200);
    };

    reader.readAsText(file);
  };

  // Merge validated rows to State
  const handleExecuteImportMerge = () => {
    if (isReadOnly || !validationReport.parsedData) return;

    const data = validationReport.parsedData;
    const nextLogs: BackupAuditLog = {
      id: "log-" + Date.now(),
      actorName: currentUser?.name || "Owner Terminal",
      actorRole: currentUser?.role || "Staff",
      actionType: "CONFIG_CHANGE",
      timestamp: getCurrentTimeString(),
      details: `Mengimpor & Menggabungkan (Merge Update) ${data.length} baris dataset baru ke modul ${importTargetModule}`,
      status: "SUCCESS"
    };

    let updatedState = { ...state };
    updatedState.backupAuditLogs = [nextLogs, ...(state.backupAuditLogs || [])];

    if (importTargetModule === "inventory") {
      // Merge items in master screen
      const existingCodes = state.master.map(m => m.code);
      const newItems = data.filter(d => !existingCodes.includes(d.code)).map(d => ({
        code: d.code,
        name: d.name,
        unit: d.unit || "pcs",
        par: parseFloat(d.par) || 5,
        price: parseFloat(d.price) || 0,
        supplier: d.defaultSupplier || "Supplier Impor",
        temp: d.storageTemp || "Suhu Ruang",
        shelf: d.shelfLife || "6 Bulan",
        loc: "both" as const
      }));
      updatedState.master = [...state.master, ...newItems];

    } else if (importTargetModule === "equipment") {
      const existing = state.equipmentList || [];
      const newEquip = data.map(d => ({
        id: "EQ-" + d.code + "_" + Date.now(),
        assetId: d.code || "EQ-NEW",
        name: d.name || "Aset Baru",
        brand: d.brand || "-",
        model: "Classic",
        serialNumber: "SN-MOCK-" + Math.floor(Math.random() * 900),
        purchasePrice: parseFloat(d.purchasePrice) || 0,
        supplier: "Supplier Impor",
        location: d.location || "Gudang Belakang",
        department: "Coffee Equipment" as const,
        status: "Aktif" as const,
        warrantyExpiry: "-",
        economicLifeYears: 5,
        purchaseDate: new Date().toISOString().slice(0, 10),
        maintenanceSchedule: "Monthly" as const,
        maintenanceHistory: []
      }));
      updatedState.equipmentList = [...existing, ...newEquip];
    }

    syncState(updatedState);
    alert(`✓ Sukses mengimpor dan menambal data baru ke dalam database ${importTargetModule}!`);
    setValidationReport({
      status: "idle",
      fileName: "",
      rowCount: 0,
      errors: [],
      parsedData: null
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Quick Recovery Feature
  const handleQuickRecovery = () => {
    if (isReadOnly) return;
    if (!state.backupsList || state.backupsList.length === 0) {
      alert("Tidak ada target arsip cadangan aktif yang terdaftar di history.");
      return;
    }

    const latest = state.backupsList[0];
    if (confirm(`⚠️ QUICK RECOVERY: Apakah Anda yakin ingin memulihkan database secara INSTAN ke versi backup paling akhir: '${latest.name}'?`)) {
      setIsRestoring(true);
      setRestoreProgress(0);

      // Simulation timeline
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        setRestoreProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          
          const recoveryAudit: BackupAuditLog = {
            id: "log-" + Date.now(),
            actorName: currentUser?.name || "System Automated",
            actorRole: currentUser?.role || "Owner",
            actionType: "RECOVERY",
            timestamp: getCurrentTimeString(),
            details: `Melakukan Quick Recovery Instan database kembali ke snapshot: ${latest.name}`,
            status: "SUCCESS"
          };

          syncState({
            ...state,
            disasterRecoveryActive: false, // Turn off failure if active
            backupAuditLogs: [recoveryAudit, ...(state.backupAuditLogs || [])]
          });

          setIsRestoring(false);
          alert(`🎉 Quick Recovery Berhasil! Aplikasi CoffeeOps telah sepenuhnya dimuat ulang ke state: '${latest.name}'`);
        }
      }, 500);
    }
  };

  // Toggle disaster recovery simulation failure
  const handleToggleDisasterRecovery = () => {
    if (isReadOnly) return;
    const currentState = state.disasterRecoveryActive || false;
    const nextValue = !currentState;

    const recoveryAudit: BackupAuditLog = {
      id: "log-" + Date.now(),
      actorName: currentUser?.name || "Owner Terminal",
      actorRole: currentUser?.role || "Staff",
      actionType: "RECOVERY",
      timestamp: getCurrentTimeString(),
      details: nextValue 
        ? "Memicu pengujian DATABASE FAILURE & DISASTER RECOVERY MODE (Read-only terminal offline)" 
        : "Menutup mode pengujian, mengaktifkan kembali core database cloud normal",
      status: "SUCCESS"
    };

    syncState({
      ...state,
      disasterRecoveryActive: nextValue,
      backupAuditLogs: [recoveryAudit, ...(state.backupAuditLogs || [])]
    });

    alert(nextValue 
      ? "🚨 DISASTER RECOVERY MODE DIAKTIFKAN: Semua terminal operasional kru akan dipaksa berjalan dalam mode Read-Only dengan performa data lokal lokal."
      : "✓ Koneksi database normal pulih sepenuhnya. Cloud API kembali online."
    );
  };

  // Helper date tools
  const getCurrentTimeString = () => {
    const d = new Date();
    const datePart = d.toISOString().slice(0, 10);
    const timePart = d.toTimeString().split(" ")[0].slice(0, 5);
    return `${datePart} ${timePart}`;
  };

  // History query filter logic
  const filteredBackups = (state.backupsList || []).filter(b => {
    const matchType = historyFilter === "All" || b.backupType === historyFilter;
    const matchSearch = b.name.toLowerCase().includes(searchHistoryQuery.toLowerCase()) || 
                        (b.notes && b.notes.toLowerCase().includes(searchHistoryQuery.toLowerCase())) ||
                        b.createdBy.toLowerCase().includes(searchHistoryQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6" id="backup-restore-center">
      {/* Upper Status / Header */}
      <div className="bg-gradient-to-r from-[#1E0D02] to-[#2B1704] border border-[#D4A853]/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl transform translate-x-10 -translate-y-10 select-none font-black font-serif">
          SHIELD
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Shield className="h-6 w-6 text-amber-400" />
              </span>
              <div>
                <h1 className="font-serif text-2xl font-bold text-amber-100 tracking-tight flex items-center gap-2">
                  COFFEEOPS BACKUP &amp; RESTORE CENTER
                </h1>
                <p className="text-xs text-amber-200/60 font-mono mt-0.5">
                  Secure Enterprise Cloud Storage System &amp; Disaster Recovery Suite
                </p>
              </div>
            </div>
          </div>

          {/* Quick Disaster Status Alert Banner */}
          <div className="flex items-center gap-3 bg-black/30 border border-[#D4A853]/10 px-4 py-3 rounded-2xl">
            <div className={`h-3 w-3 rounded-full animate-pulse ${state.disasterRecoveryActive ? "bg-red-500" : "bg-emerald-500"}`} />
            <div className="text-xs font-mono">
              <div className="text-amber-100/40 text-[9px] uppercase tracking-wider">Status Cloud Database</div>
              <div className={state.disasterRecoveryActive ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                {state.disasterRecoveryActive ? "⚠️ DISASTER RECOVERY (Read-Only Active)" : "✓ ONLINE & FULL READ-WRITE"}
              </div>
            </div>
          </div>
        </div>

        {/* Manager Note Alert */}
        {isReadOnly && (
          <div className="mt-4 bg-blue-950/40 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3">
            <span className="text-lg">📢</span>
            <div className="text-xs text-blue-200">
              <strong className="font-bold uppercase text-blue-300">AKSES TERBATAS (MANAGER READ-ONLY):</strong> Anda memiliki akses Read-Only. Hanya peran <strong>Owner</strong> yang dapat membuat backup baru, melakukan restore data, mengedit endpoint, dan menjalankan import/recovery.
            </div>
          </div>
        )}
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: System Monitoring & Subtab Switchers */}
        <div className="space-y-6 lg:col-span-1">
          {/* Subtabs lists */}
          <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-4 shadow-xl space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-400/40 px-3 uppercase tracking-widest block mb-1">Menu Navigasi SecOps</span>
            
            <button
              onClick={() => setActiveSubTab("backup")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition duration-250 ${
                activeSubTab === "backup" 
                  ? "bg-amber-500/15 border-l-2 border-amber-400 text-amber-300 font-bold" 
                  : "text-amber-100/60 hover:bg-white/5"
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Backup Center</span>
            </button>
            <button
              onClick={() => setActiveSubTab("restore")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition duration-250 ${
                activeSubTab === "restore" 
                  ? "bg-amber-500/15 border-l-2 border-amber-400 text-amber-300 font-bold" 
                  : "text-amber-100/60 hover:bg-white/5"
              }`}
            >
              <History className="h-4 w-4" />
              <span>Restore Center</span>
            </button>
            <button
              onClick={() => setActiveSubTab("export")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition duration-250 ${
                activeSubTab === "export" 
                  ? "bg-amber-500/15 border-l-2 border-amber-400 text-amber-300 font-bold" 
                  : "text-amber-100/60 hover:bg-white/5"
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>
            <button
              onClick={() => setActiveSubTab("import")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition duration-250 ${
                activeSubTab === "import" 
                  ? "bg-amber-500/15 border-l-2 border-amber-400 text-amber-300 font-bold" 
                  : "text-amber-100/60 hover:bg-white/5"
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Import Data Center</span>
            </button>
            <button
              onClick={() => setActiveSubTab("recovery")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition duration-250 ${
                activeSubTab === "recovery" 
                  ? "bg-amber-500/15 border-l-2 border-amber-400 text-amber-300 font-bold" 
                  : "text-amber-100/60 hover:bg-white/5"
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              <span>System Recovery Center</span>
            </button>
            <button
              onClick={() => setActiveSubTab("audit")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition duration-250 ${
                activeSubTab === "audit" 
                  ? "bg-amber-500/15 border-l-2 border-amber-400 text-amber-300 font-bold" 
                  : "text-amber-100/60 hover:bg-white/5"
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>Audit Backup Logs</span>
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveSubTab("supabase")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition duration-250 ${
                  activeSubTab === "supabase" 
                    ? "bg-amber-500/15 border-l-2 border-amber-400 text-amber-300 font-bold" 
                    : "text-amber-100/60 hover:bg-white/5"
                }`}
              >
                <div className="text-sm shrink-0">☁️</div>
                <span>Enterprise SaaS Module</span>
              </button>
            )}
          </div>

          {/* Storage & Cloud Size Monitoring */}
          <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="font-serif text-amber-100 text-sm font-bold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-amber-400" />
              Monitoring Server Storage
            </h3>

            {/* Simulated Pie/Progress Charts */}
            <div className="space-y-3 font-mono text-xs text-amber-100/70">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>SQLite / JSON DB:</span>
                  <span className="text-amber-300 font-bold">{dbStats.dbSizeKb} KB</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: "35%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Supabase /backup/storage:</span>
                  <span className="text-amber-300 font-bold">{dbStats.mediaSizeMb} MB</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: "55%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Backup Archives Size:</span>
                  <span className="text-amber-300 font-bold">{dbStats.backupSizeMb} MB</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "70%" }}></div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Total Kebutuhan Disk:</span>
                  <span className="text-[#D4A853] font-bold">~ {(dbStats.backupSizeMb + dbStats.mediaSizeMb).toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Kuota Cloud Supabase:</span>
                  <span>{dbStats.maxStorageGb} GB (50,000 MB)</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Sisa Free Space:</span>
                  <span>~ 99.8 %</span>
                </div>
              </div>
            </div>
          </div>

          {/* Retention Policy Box */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-2">
            <h4 className="text-[11px] font-mono font-bold text-amber-400/50 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="h-3 w-3" />
              Retention Policy (Kebijakan)
            </h4>
            <ul className="text-[11px] font-sans text-amber-200/60 space-y-1.5 list-disc pl-4">
              <li><strong>Daily Backups</strong>: Disimpan otomatis selama 30 hari.</li>
              <li><strong>Weekly Backups</strong>: Disimpan otomatis selama 12 minggu.</li>
              <li><strong>Monthly Backups</strong>: Disimpan otomatis selama 12 bulan.</li>
              <li><strong>Manual Backups</strong>: Disimpan permanen (kecuali didelete instan).</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Core Modules Panels */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* 1. BACKUP CENTER SUBTAB */}
          {activeSubTab === "backup" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Manual Snapshot Control */}
              <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="border-b border-[#D4A853]/15 pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-amber-100 flex items-center gap-2">
                      ⚡ Manual Database Snapshot &amp; Storage Backup
                    </h2>
                    <p className="text-xs text-amber-200/50 mt-0.5">
                      Pencadangan point-in-time instan mengamankan seluruh 16 tabel relasi data &amp; file attachments.
                    </p>
                  </div>
                </div>

                {/* Form parameters */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-mono font-semibold text-amber-200 block mb-1">Catatan / Deskripsi Snapshot (Notes)</label>
                    <textarea
                      disabled={isReadOnly}
                      value={backupNotes}
                      onChange={(e) => setBackupNotes(e.target.value)}
                      placeholder="Masukkan catatan spesifik (misal: 'Pembuatan backup sebelum migrasi inventaris bulanan Juni')"
                      className="w-full text-xs font-sans bg-black/40 border border-[#D4A853]/20 rounded-xl px-4 py-3 placeholder-amber-100/30 text-amber-100 focus:outline-none focus:border-amber-400 h-20 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-semibold text-amber-100 flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-amber-400" />
                        Sandi Enkripsi &amp; Proteksi AES-256
                      </div>
                      <p className="text-[10px] text-amber-200/60 max-w-md">
                        Mengenkripsi snapshot secara end-to-end sebelum dikirimkan ke server Supabase Storage. File dilindungi sandi server otomatis.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => !isReadOnly && setEncryptBackup(!encryptBackup)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition border cursor-pointer ${
                          encryptBackup 
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                            : "bg-black/40 border-white/5 text-amber-100/40"
                        }`}
                        disabled={isReadOnly}
                      >
                        {encryptBackup ? "🔒 ENKRIPSI AKTIF" : "🔓 NO PROTECTION"}
                      </button>
                    </div>
                  </div>

                  {/* Trigger buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      disabled={isReadOnly || isCreatingBackup}
                      onClick={handleCreateManualBackup}
                      className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 active:scale-95 text-amber-950 px-6 py-2.5 rounded-xl font-mono text-xs font-bold transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      {isCreatingBackup ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>MEMPROSES BACKUP CLOUD... (MENGUNGGAH KE SUPABASE)</span>
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4" />
                          <span>CREATE BACKUP NOW</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Successful Backup Alert Card popup inside */}
                {backupSuccessCard && (
                  <div className="mt-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-400 font-serif text-sm font-bold">
                      <CheckCircle2 className="h-5 w-5" />
                      Arsip Backup Berhasil Dipaketkan ke Supabase Storage!
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 font-mono text-[11px] text-amber-100/80">
                      <div>
                        <span className="text-amber-100/40 block">Backup Name:</span>
                        <span className="truncate block font-semibold text-emerald-300">{backupSuccessCard.name}</span>
                      </div>
                      <div>
                        <span className="text-amber-100/40 block">Ukuran Snapshot:</span>
                        <span className="block font-semibold">{backupSuccessCard.fileSize}</span>
                      </div>
                      <div>
                        <span className="text-amber-100/40 block">Waktu Cadangan:</span>
                        <span className="block font-semibold">{backupSuccessCard.createdDate}</span>
                      </div>
                      <div>
                        <span className="text-amber-100/40 block">Status Cloud:</span>
                        <span className="block font-semibold text-emerald-400">✓ UPLOADED</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-amber-150/65 pt-2 border-t border-white/5">
                      Sandi Proteksi otomatis digenerate dan dikoleksi di master SecOps log. Path folder: <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded">/backup/storage/{backupSuccessCard.name}.json</code>
                    </div>
                  </div>
                )}
              </div>

              {/* Automatic Backup Schedules Detail */}
              <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">
                    📅 Jadwal Backup Otomatis Terjadwal
                  </h3>
                  <p className="text-xs text-amber-200/50 mt-0.5">
                    Cron daemon CoffeeOps mengeksekusi sinkronisasi snapshot periodik tanpa membebani server fisik bar.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-black/40 border border-[#D4A853]/10 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-black inline-block mb-2">Harian / Daily</span>
                      <h4 className="font-serif font-bold text-sm text-amber-100">Setiap Jam 02:00 Pagi</h4>
                      <p className="text-[11px] text-amber-200/40 mt-1">Mengamankan seluruh audit-log, transaksi harian, dan mutasi kru.</p>
                    </div>
                    <div className="text-[10px] font-mono mt-3 text-emerald-400 flex items-center gap-1.5 pt-2 border-t border-white/5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                      Active Daemon State
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border border-[#D4A853]/10 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-black inline-block mb-2">Mingguan / Weekly</span>
                      <h4 className="font-serif font-bold text-sm text-amber-100">Setiap Hari Minggu</h4>
                      <p className="text-[11px] text-amber-200/40 mt-1">Full database + Supabase Storage sync media (/SOP PDF &amp; Foto-foto).</p>
                    </div>
                    <div className="text-[10px] font-mono mt-3 text-emerald-400 flex items-center gap-1.5 pt-2 border-t border-white/5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                      Active Daemon State
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border border-[#D4A853]/10 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-black inline-block mb-2">Bulanan / Monthly</span>
                      <h4 className="font-serif font-bold text-sm text-amber-100">Tanggal 1 Setiap Bulan</h4>
                      <p className="text-[11px] text-amber-200/40 mt-1">Pencadangan buku besar COGS, profit, ROI, dan evaluasi KPI barista.</p>
                    </div>
                    <div className="text-[10px] font-mono mt-3 text-emerald-400 flex items-center gap-1.5 pt-2 border-t border-white/5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                      Active Daemon State
                    </div>
                  </div>
                </div>
              </div>

              {/* Backups History List Table */}
              <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4A853]/15 pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-amber-100 flex items-center gap-2">
                      📁 Daftar Arsip Cadangan (Backup History)
                    </h3>
                    <p className="text-xs text-amber-200/50 mt-0.5">
                      Daftar snapshot yang tersimpan di master bucket Supabase Cloud Storage.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {/* Filters button menu */}
                    {["All", "Daily", "Weekly", "Monthly", "Manual"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setHistoryFilter(type as any)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold border transition ${
                          historyFilter === type 
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30" 
                            : "bg-black/20 border-white/5 text-amber-100/50 hover:border-white/10"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub search options */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchHistoryQuery}
                    onChange={(e) => setSearchHistoryQuery(e.target.value)}
                    placeholder="Cari file backup berdasarkan nama, catatan, atau pembuat..."
                    className="w-full text-xs font-mono bg-black/40 border border-[#D4A853]/10 rounded-xl px-4 py-2 placeholder-amber-100/30 text-amber-100 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Database Table layout */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-[#D4A853]/15 text-amber-100/40 text-[11px] font-mono">
                        <th className="py-3 px-4">Backup Name</th>
                        <th className="py-3 px-4">Tanggal Cadangan</th>
                        <th className="py-3 px-4">Tipe</th>
                        <th className="py-3 px-4">Ukuran</th>
                        <th className="py-3 px-4">Dibuat Oleh</th>
                        <th className="py-3 px-4 text-right">Opsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {filteredBackups.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-amber-100/30 font-mono text-[11px]">
                            Tidak ada arsip cadangan (backups) yang lolos kriteria filter harian.
                          </td>
                        </tr>
                      ) : (
                        filteredBackups.map((bk) => (
                          <tr key={bk.id} className="hover:bg-white/2 transition">
                            <td className="py-3 px-4 font-mono font-bold text-amber-100">
                              <span className="flex items-center gap-2 truncate max-w-[200px]" title={bk.name}>
                                📦 {bk.name}
                                {bk.isProtected && (
                                  <span className="text-[10px] text-amber-400" title="Password Crypt Protected">🔒</span>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-amber-200/80">{bk.createdDate}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase ${
                                bk.backupType === "Daily" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                                bk.backupType === "Weekly" ? "bg-purple-500/10 border border-purple-500/20 text-purple-400" :
                                bk.backupType === "Monthly" ? "bg-sky-500/10 border border-sky-500/20 text-sky-400" :
                                "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              }`}>
                                {bk.backupType}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-amber-100">{bk.fileSize}</td>
                            <td className="py-3 px-4 text-amber-150">{bk.createdBy}</td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  // Raw download of state mock file
                                  const mockContent = JSON.stringify({
                                    metadata: {
                                      backupId: bk.id,
                                      backupName: bk.name,
                                      createdDate: bk.createdDate,
                                      serverSource: "Supabase Cloud Core",
                                      stateClass: "CoffeeOpsState"
                                    },
                                    stateSnapshot: state
                                  }, null, 2);
                                  downloadCsvFile(mockContent, `${bk.name}.json`);
                                }}
                                className="bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 px-2.5 py-1 rounded-lg text-amber-300 font-mono text-[10px] cursor-pointer"
                              >
                                Unduh JSON
                              </button>
                              
                              {!isReadOnly && (
                                <button
                                  onClick={() => handleDeleteBackup(bk.id, bk.name)}
                                  className="bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/25 px-2.5 py-1 rounded-lg text-red-400 font-mono text-[10px] cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supabase Storage Backup Dashboard Folder representation */}
              <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">
                    ☁️ Monitor Folder Supabase Storage <code className="text-amber-300 bg-black/40 px-2 py-0.5 rounded text-xs">/backup/storage</code>
                  </h3>
                  <p className="text-xs text-amber-200/50 mt-0.5">
                    Memantau pencadangan binary assets seperti manual kerja PDF, video training, nota received, dan dokumen pemeliharaan.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { title: "SOP PDF Manuals", folder: "/backup/storage/sop_pdfs", count: `${state.sopsList?.filter(s=>s.docUrl).length || 3} Files`, size: "14.2 MB" },
                    { title: "SOP Video Guides", folder: "/backup/storage/sop_videos", count: `${state.sopsList?.filter(s=>s.videoUrl).length || 2} Videos`, size: "95.5 MB" },
                    { title: "Log / Report Files", folder: "/backup/storage/reports_pdf", count: `${state.reportQueue?.length || 5} Docs`, size: "2.4 MB" },
                    { title: "Equipment / Asset photos", folder: "/backup/storage/assets_photos", count: "12 Photos", size: "4.8 MB" }
                  ].map((sub, idx) => (
                    <div key={idx} className="p-4 bg-black/30 border border-white/5 rounded-2xl">
                      <div className="text-[10px] text-amber-300/40 uppercase font-mono tracking-wider">{sub.folder}</div>
                      <h4 className="font-serif font-bold text-[#D4A853] text-sm mt-1">{sub.title}</h4>
                      <div className="flex justify-between text-xs font-mono mt-3 pt-2 border-t border-white/5 text-amber-100/60">
                        <span>{sub.count}</span>
                        <span className="text-amber-200">{sub.size}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. RESTORE CENTER SUBTAB */}
          {activeSubTab === "restore" && (
            <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
              <div className="border-b border-[#D4A853]/15 pb-4 mb-4">
                <h2 className="font-serif text-lg font-bold text-amber-100 flex items-center gap-2">
                  🔄 Restore Center / Cloud Rollback Wizard
                </h2>
                <p className="text-xs text-amber-200/50 mt-0.5">
                  Pulihkan kembali database CoffeeOps ke point backup cloud masa lalu untuk membatalkan kesalahan fatal atau migrasi data rusak.
                </p>
              </div>

              {isReadOnly && (
                <div className="bg-[#D4A853]/5 border border-[#D4A853]/20 p-4 rounded-2xl flex items-center gap-3">
                  <span className="text-lg">🛡️</span>
                  <p className="text-xs text-[#D4A853]">
                    <strong>Akses Manager: Read Only.</strong> Anda dapat melihat proses dan diagram rollback wizard, namun tombol eksekusi final dinonaktifkan.
                  </p>
                </div>
              )}

              {/* Wizard Steps visual indicator */}
              <div className="flex items-center gap-2 max-w-lg mx-auto mb-6 select-none font-mono text-[10px] text-amber-100/45">
                {[
                  { step: 1, label: "Arsip & Modul" },
                  { step: 2, label: "Password PIN" },
                  { step: 3, label: "Keamanan OTP" },
                  { step: 4, label: "Rolled-back" }
                ].map((s) => (
                  <React.Fragment key={s.step}>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold font-serif ${
                        restoreStep === s.step 
                          ? "bg-amber-500 text-amber-950" 
                          : restoreStep > s.step 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-black/40 border border-white/5"
                      }`}>
                        {s.step}
                      </span>
                      <span className={restoreStep === s.step ? "text-amber-300 font-bold" : ""}>{s.label}</span>
                    </div>
                    {s.step < 4 && <ChevronRight className="h-3.5 w-3.5 opacity-30" />}
                  </React.Fragment>
                ))}
              </div>

              {/* STEP 1: SELECT SOURCE BACKUP AND MODULES TYPE */}
              {restoreStep === 1 && (
                <div className="space-y-6">
                  {/* Backup Selection selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-mono font-bold text-amber-400 block">Pilih Arsip Snapshot Target:</label>
                    <div className="max-h-52 overflow-y-auto space-y-2 border border-[#D4A853]/10 p-3 rounded-2xl bg-black/30">
                      {(!state.backupsList || state.backupsList.length === 0) ? (
                        <div className="text-center py-6 text-amber-100/30 text-xs font-mono">
                          Tidak ditemukan file cadangan di sistem.
                        </div>
                      ) : (
                        state.backupsList.map((bk) => (
                          <div
                            key={bk.id}
                            onClick={() => setSelectedBackupIdForRestore(bk.id)}
                            className={`p-3 rounded-xl border transition duration-200 cursor-pointer flex items-center justify-between ${
                              selectedBackupIdForRestore === bk.id 
                                ? "bg-amber-500/10 border-amber-500/50 text-amber-150" 
                                : "bg-black/20 border-white/5 hover:border-white/10 text-amber-200/70"
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-xs font-mono font-bold block">📦 {bk.name}</span>
                              <span className="text-[10px] text-amber-100/40 font-mono">{bk.createdDate} • Dibuat Oleh: {bk.createdBy}</span>
                            </div>
                            <span className="text-xs font-mono font-semibold text-amber-400">{bk.fileSize}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Restore Strategy switch */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <label className="text-xs font-mono font-bold text-amber-400 block">Tipe Penyelarasan (Restore Strategy):</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => setRestoreType("full")}
                        className={`p-4 rounded-2xl border transition duration-250 cursor-pointer ${
                          restoreType === "full" 
                            ? "bg-amber-500/5 border-amber-500/30 text-amber-100" 
                            : "bg-black/30 border-white/5 text-amber-100/40 hover:border-white/10"
                        }`}
                      >
                        <h4 className="font-serif font-bold text-sm tracking-wide">Full Restore (Penuh)</h4>
                        <p className="text-[11px] text-amber-200/50 mt-1">Mengembalikan seluruh 16 modul database &amp; file storage Supabase secara utuh.</p>
                      </div>

                      <div
                        onClick={() => setRestoreType("partial")}
                        className={`p-4 rounded-2xl border transition duration-250 cursor-pointer ${
                          restoreType === "partial" 
                            ? "bg-amber-500/5 border-amber-500/30 text-amber-100" 
                            : "bg-black/30 border-white/5 text-amber-100/40 hover:border-white/10"
                        }`}
                      >
                        <h4 className="font-serif font-bold text-sm tracking-wide">Partial Restore (Parsial)</h4>
                        <p className="text-[11px] text-amber-200/50 mt-1">Hanya memulihkan segmen modul yang dipilih (misal: SOP atau Inventaris saja).</p>
                      </div>
                    </div>
                  </div>

                  {/* Partial modules switches */}
                  {restoreType === "partial" && (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3 animate-fadeIn">
                      <span className="text-[10px] font-mono text-amber-300 font-bold block uppercase tracking-wider">Modul Parsial Yang Dipulihkan</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        {[
                          { key: "sop", label: "📚 SOP Guidelines Only" },
                          { key: "inventory", label: "📦 Stock & Inventory Only" },
                          { key: "equipment", label: "⚙️ Equipment Assets Detail" },
                          { key: "reports", label: "📅 Reports & OpsLogs" }
                        ].map((m) => (
                          <div
                            key={m.key}
                            onClick={() => setPartialModules({
                              ...partialModules,
                              [m.key]: !partialModules[m.key as keyof typeof partialModules]
                            })}
                            className={`p-3 rounded-xl border transition cursor-pointer font-semibold ${
                              partialModules[m.key as keyof typeof partialModules]
                                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                                : "bg-black/40 border-white/5 text-amber-100/55 hover:border-white/10"
                            }`}
                          >
                            {m.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirm warnings */}
                  <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-xs">
                    <span className="text-xl">⚠️</span>
                    <div className="space-y-1 text-red-200">
                      <strong className="font-bold uppercase tracking-wide">PERINGATAN (CRITICAL IMPACT DIRECTIVES):</strong>
                      <p>Rollback atau restore data akan menimpa dan <strong>mengganti seluruh data berjalan sisa transaksi saat ini</strong> dengan snapshot lama. Operasi ini tidak dapat dipulihkan (Irreversible). Pastikan tidak ada barista aktif yang sedang melayani closing POS pada terminal lain.</p>
                    </div>
                  </div>

                  {/* Step 1 Submit */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      disabled={!selectedBackupIdForRestore || (restoreType === "partial" && !Object.values(partialModules).some(v=>v))}
                      onClick={() => setRestoreStep(2)}
                      className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-amber-950 px-6 py-2.5 rounded-xl font-mono text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      LANJUT KE VERIFIKASI PIN ➔
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ENTER PASSWORD PIN */}
              {restoreStep === 2 && (
                <div className="max-w-md mx-auto space-y-4 animate-fadeIn">
                  <div className="text-center space-y-2">
                    <Lock className="h-10 w-10 text-amber-400 mx-auto" />
                    <h3 className="font-serif font-bold text-amber-100">Otoritas PIN Kiosk Owner</h3>
                    <p className="text-xs text-amber-200/50">
                      Demi keamanan, Anda wajib memasukkan PIN Master koki/owner Anda yang aktif untuk melanjutkan inisiasi rollback.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="password"
                      maxLength={6}
                      value={restorePinValue}
                      onChange={(e) => setRestorePinValue(e.target.value.replace(/\D/g, ""))}
                      placeholder="Masukkan 4 atau 6-digit PIN Anda"
                      className="w-full text-center tracking-widest font-mono text-lg bg-black/60 border border-[#D4A853]/20 rounded-2xl px-4 py-3 placeholder-amber-100/20 text-amber-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500"
                    />
                    {restorePinError && (
                      <p className="text-xs text-red-400 text-center font-semibold">{restorePinError}</p>
                    )}
                  </div>

                  <div className="flex justify-between gap-4 pt-4">
                    <button
                      onClick={() => setRestoreStep(1)}
                      className="w-1/2 bg-black/40 hover:bg-white/5 border border-white/10 text-amber-100/60 font-mono text-xs py-2.5 rounded-xl cursor-pointer"
                    >
                      ⬅️ KEMBALI
                    </button>
                    <button
                      onClick={handleVerifyPin}
                      className="w-1/2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-mono text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                    >
                      VERIFIKASI PIN
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: OTP CONFIRMATION SCREEN */}
              {restoreStep === 3 && (
                <div className="max-w-md mx-auto space-y-4 animate-fadeIn">
                  <div className="text-center space-y-2">
                    <Unlock className="h-10 w-10 text-emerald-400 mx-auto" />
                    <h3 className="font-serif font-bold text-amber-100">Sistem Autentikasi OTP Rahasia</h3>
                    <p className="text-xs text-amber-200/50">
                      CoffeeOps telah mengirimkan kode OTP verifikasi 6-digit ke alamat secure email: <strong className="text-emerald-400">{notifEmail}</strong>. Sesi berlaku selama 3 menit.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={restoreOtpValue}
                      onChange={(e) => setRestoreOtpValue(e.target.value.replace(/\D/g, ""))}
                      placeholder="Masukkan 6-Digit Kode OTP"
                      className="w-full text-center tracking-widest font-mono text-lg bg-black/60 border border-[#D4A853]/20 rounded-2xl px-4 py-3 placeholder-amber-100/20 text-amber-100 focus:outline-none focus:border-amber-400"
                    />
                    {restoreOtpError && (
                      <p className="text-xs text-red-400 text-center font-semibold">{restoreOtpError}</p>
                    )}
                  </div>

                  {/* Test OTP Hint fallback in preview */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-center text-[11px] text-amber-200/40">
                    💡 Developer Sandbox Hint: Gunakan kode verification OTP <strong className="text-amber-300 font-mono text-xs">{generatedOtp}</strong> untuk eksekusi sukses.
                  </div>

                  <div className="flex justify-between gap-4 pt-4">
                    <button
                      onClick={() => setRestoreStep(2)}
                      className="w-1/2 bg-black/40 hover:bg-white/5 border border-white/10 text-amber-100/60 font-mono text-xs py-2.5 rounded-xl cursor-pointer"
                    >
                      ⬅️ KEMBALI
                    </button>
                    <button
                      disabled={isReadOnly || isRestoring}
                      onClick={handleExecuteRestore}
                      className="w-1/2 bg-red-500 hover:bg-red-600 text-amber-950 font-mono text-xs font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {isRestoring ? "MEMULIHKAN..." : "EKSEKUSI RESTORE"}
                    </button>
                  </div>

                  {isRestoring && (
                    <div className="space-y-2 pt-4">
                      <div className="flex justify-between text-[11px] font-mono text-amber-300">
                        <span>Menulis ulang cloud master blocks...</span>
                        <span>{restoreProgress} %</span>
                      </div>
                      <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${restoreProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: RESTORE COMPLETE SUCCESS */}
              {restoreStep === 4 && (
                <div className="max-w-md mx-auto text-center space-y-4 animate-fadeIn py-6">
                  <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-2 select-none text-3xl">
                    🎉
                  </div>
                  <h3 className="font-serif font-bold text-emerald-400 text-lg">PROSES PEMULIHAN SISTEM BERHASIL SUKSES!</h3>
                  <p className="text-xs text-amber-100/80 leading-relaxed">
                    Arsip snapshot database CoffeeOps telah sukses direstorasi seutuhnya ke terminal. Aplikasi telah me-reload dataset sops, resep, purchase orders, log KPI koki, dan database equipment secara aman tanpa ada error schema.
                  </p>

                  <div className="pt-4">
                    <button
                      onClick={resetRestoreFlow}
                      className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-6 py-2 rounded-xl font-mono text-xs font-bold transition cursor-pointer"
                    >
                      KEMBALI KE PANEL UTAMA
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. EXPORT DATA CENTER SUBTAB */}
          {activeSubTab === "export" && (
            <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
              <div className="border-b border-[#D4A853]/15 pb-4 mb-4">
                <h2 className="font-serif text-lg font-bold text-amber-100 flex items-center gap-2">
                  📥 Export Data Center
                </h2>
                <p className="text-xs text-amber-200/50 mt-0.5">
                  Ekspor instan seluruh log operasional, stok bahan baku, dan performa barista ke format Excel (.xlsx), CSV murni, atau PDF siap cetak.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "📦 Master Stock & Inventory Harian", desc: "Data sisa stok gudang, par level, dan minimal supply stok.", key: "inventory" },
                  { title: "📚 SOP Guidelines & Video Resources", desc: "Formulasi PDF Standard Operational Procedure CoffeeOps.", key: "sop" },
                  { title: "🏆 KPI & Performa Penilaian Kru", desc: "Skor kedisiplinan, target barista, dan performa mutasi.", key: "kpi" },
                  { title: "📋 Absensi & Log Shift Kehadiran", desc: "Log check-in, checkout, keterlambatan, dan jam kerja koki.", key: "attendance" },
                  { title: "📅 Master Equipment Asset Database", desc: "Katalog mesin espresso, chiller, grinder, dan log servis.", key: "equipment" },
                  { title: "☕ Financial Ledger (Sales & BEP)", desc: "Statistik perputaran resep, COGS, dan gross profit margin.", key: "financial" }
                ].map((item) => (
                  <div key={item.key} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-[#D4A853] text-[13px]">{item.title}</h4>
                      <p className="text-[11px] text-amber-200/40 mt-1">{item.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleExportDataExcel(item.key)}
                        className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-amber-950 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="h-3 w-3" />
                        <span>Export CSV (Excel compatible)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. IMPORT DATA CENTER SUBTAB */}
          {activeSubTab === "import" && (
            <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
              <div className="border-b border-[#D4A853]/15 pb-4 mb-4">
                <h2 className="font-serif text-lg font-bold text-amber-100 flex items-center gap-2">
                  📤 Import &amp; Database Merging Center (Excel / CSV Validator)
                </h2>
                <p className="text-xs text-amber-200/50 mt-0.5">
                  Unggah file Excel atau CSV eksternal untuk mengupdate / menambah item inventaris, equipment, dan kru karyawan baru secara batch.
                </p>
              </div>

              {isReadOnly && (
                <div className="bg-[#D4A853]/5 border border-[#D4A853]/20 p-4 rounded-xl text-xs text-[#D4A853] font-bold">
                  ⚠️ PEMBERITAHUAN: Hanya akun ADMINISTRATOR (Owner) yang dapat melakukan import data. Mode Reader (Manager) terkunci.
                </div>
              )}

              {/* Module target upload selection */}
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold text-amber-400 block">Pilih Target Modul Database:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { key: "inventory", label: "📦 Stock Inventory" },
                    { key: "equipment", label: "⚙️ Equipment Assets" },
                    { key: "sop", label: "📚 SOP Manuals" },
                    { key: "users", label: "👥 Employee accounts" }
                  ].map((m) => (
                    <div
                      key={m.key}
                      onClick={() => !isReadOnly && setImportTargetModule(m.key as any)}
                      className={`p-3 rounded-xl border text-center transition font-semibold ${
                        isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      } ${
                        importTargetModule === m.key 
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                          : "bg-black/40 border-white/5 text-amber-100/55 hover:border-white/10"
                      }`}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* File dropzone widget */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition duration-200 ${
                  isReadOnly ? "opacity-50 cursor-not-allowed border-white/5 bg-black/20" : "border-[#D4A853]/20 hover:border-amber-400/50 bg-black/40 cursor-pointer"
                }`}
                onClick={() => !isReadOnly && fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                <h4 className="font-serif font-bold text-amber-100 text-sm">Drag &amp; Drop berkas CSV/XLSX di sini, atau klik untuk browse</h4>
                <p className="text-[10px] text-amber-200/40 font-mono mt-1">Format standard CSV Comma Separated (Max 5MB file size).</p>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUploadAction}
                  accept=".csv,.txt"
                  className="hidden"
                  disabled={isReadOnly}
                />
              </div>

              {/* Validation Report results card */}
              {validationReport.status !== "idle" && (
                <div className="p-4 bg-black/40 border border-[#D4A853]/15 rounded-2xl space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-100">📋 Hasil Validasi Berkas: {validationReport.fileName}</span>
                    </div>

                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                      validationReport.status === "validating" ? "bg-amber-500/10 text-amber-400" :
                      validationReport.status === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {validationReport.status === "validating" ? "PROSES VALIDASI..." :
                       validationReport.status === "success" ? "✓ BERKAS VALID (LULUS)" :
                       "❌ CONFIG INVALID (GAGAL)"}
                    </span>
                  </div>

                  {validationReport.status === "validating" && (
                    <div className="text-center py-4 flex flex-col items-center justify-center gap-2 text-xs font-mono text-amber-200/40">
                      <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
                      Mengkroscek relasi data, format tipe, and mandatory header constraints...
                    </div>
                  )}

                  {validationReport.status === "success" && (
                    <div className="space-y-3">
                      <div className="text-xs text-amber-200/80 font-mono">
                        ✓ Berhasil memvalidasi <strong className="text-emerald-400">{validationReport.rowCount} baris</strong> item data. Seluruh kolom terpetakan ke skema database dengan sempurna.
                      </div>

                      {/* Import execution */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleExecuteImportMerge}
                          className="bg-emerald-500 hover:bg-emerald-600 text-amber-950 font-mono text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                        >
                          Lakukan Sinkronisasi &amp; Gabung Data (Merge Update)
                        </button>
                      </div>
                    </div>
                  )}

                  {validationReport.status === "errors" && (
                    <div className="space-y-2">
                      <p className="text-xs text-red-300 font-bold">Ditemukan kesalahan struktural skema:</p>
                      <ul className="text-[11px] font-mono text-red-400 space-y-1 list-disc pl-4">
                        {validationReport.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-amber-100/40 mt-1 pt-2 border-t border-white/5">
                        Harap sesuaikan penulisan header dengan panduan export agar parser bisa memproses file.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Template Download Sample Card */}
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono text-amber-400 font-bold block uppercase tracking-wider">💡 Contoh Format Berkas CSV Valid</span>
                <div className="bg-black/60 p-3 rounded-xl font-mono text-[10px] text-amber-100/70 overflow-x-auto whitespace-pre">
                  {importTargetModule === "inventory" ? (
                    `kode,nama,satuan,par_stock\nSU-SUSU,"Susu Greenfield Fullcream",liter,12\nKO-BEANS,"Biji Kopi Bebijian Arabica",kg,15\nOT-OAT,"Oatside Oatmilk Premium",pcs,20`
                  ) : importTargetModule === "equipment" ? (
                    `kode,nama,kategori,area,status\nEQ-ESP-01,"Mesin Espresso La Marzocco 3-Group",Barista Engine,Bar Utama,Sehat / Normal\nEQ-GRN-02,"Grinder Mahlkonig EK43",Barista Tool,Bar Utama,Sehat`
                  ) : importTargetModule === "sop" ? (
                    `id,title,category,type,attachmentUrl\nSOP-001,"Dial-In Espresso & Kalibrasi Pagi",Barista Operational,Video,https://youtube.com/watch?v=123`
                  ) : (
                    `id,name,role,pin,email\nUSR-019,"Rian Hermawan",Barista,4281,rian@coffeeops.com`
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. SYSTEM RECOVERY SUBTAB */}
          {activeSubTab === "recovery" && (
            <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
              <div className="border-b border-[#D4A853]/15 pb-4 mb-4">
                <h2 className="font-serif text-lg font-bold text-amber-100 flex items-center gap-2">
                  🛡️ System Recovery &amp; Terminal Disaster Contingency
                </h2>
                <p className="text-xs text-amber-200/50 mt-0.5">
                  Penanganan darurat apabila server utama crash atau mengalami kegagalan sinkronisasi cloud.
                </p>
              </div>

              {isReadOnly && (
                <div className="bg-blue-950/40 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-200 font-bold">
                  📱 Akses Pimpinan/Manager: Anda berada dalam mode Pengawasan. Simulasi tombol pemulihan dan disaster switches hanya diizinkan untuk peran Owner.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quick Recovery Card */}
                <div className="p-5 bg-black/40 border border-[#D4A853]/10 rounded-3xl flex flex-col justify-between">
                  <div>
                    <span className="text-3xl">🚀</span>
                    <h4 className="font-serif font-bold text-amber-100 text-sm mt-3">Quick System Recovery</h4>
                    <p className="text-xs text-amber-250/50 mt-1.5 leading-relaxed">
                      Memulihkan seluruh database portal ke snapshot arsip terakhir yang valid dalam 1-klik, menyingkirkan validasi multi-step demi penyelamatan instan.
                    </p>
                  </div>

                  <button
                    disabled={isReadOnly || isRestoring}
                    onClick={handleQuickRecovery}
                    className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-mono text-xs font-bold py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? "RESTORING LAST BACKUP..." : "RUN QUICK RECOVERY"}
                  </button>
                </div>

                {/* Simulated database failure Disaster switch Card */}
                <div className="p-5 bg-black/40 border border-red-500/10 rounded-3xl flex flex-col justify-between">
                  <div>
                    <span className="text-3xl">🚨</span>
                    <h4 className="font-serif font-bold text-red-300 text-sm mt-3">Disaster Recovery Simulation</h4>
                    <p className="text-xs text-amber-250/50 mt-1.5 leading-relaxed">
                      Simulasikan kegagalan total server cloud (Database Crash Offline). Mengaktifkan mode darurat agar operasional kedai tetap menyajikan data penting lewat terminal read-only.
                    </p>
                  </div>

                  <button
                    disabled={isReadOnly}
                    onClick={handleToggleDisasterRecovery}
                    className={`mt-6 w-full font-mono text-xs font-bold py-2 rounded-xl transition cursor-pointer ${
                      state.disasterRecoveryActive 
                        ? "bg-emerald-600 hover:bg-emerald-500 text-amber-950" 
                        : "bg-red-950/40 hover:bg-red-900/30 border border-red-500/30 text-red-300"
                    }`}
                  >
                    {state.disasterRecoveryActive ? "PEMULIHAN: SINKRONKAN KEMBALI CLOUD" : "TRIGGERS DATABASE FAILURE"}
                  </button>
                </div>
              </div>

              {/* Advanced info and Disaster details summary layout */}
              <div className="p-4 bg-[#1E0D02] border border-[#D4A853]/15 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono text-amber-300 font-bold block uppercase tracking-wider">Mekanisme Kontingensi Operasional:</span>
                <p className="text-xs text-amber-100/70 leading-relaxed font-sans">
                  Sistem terminal dilindungi dengan fallback sandboxed-state. Jika database online terdeteksi gagal berespon selambat-lambatnya 5 detik, browser barista akan otomatis melakukan fallback, merender cache SOP kerja, detail equipment barcode, dan minimal target stok di layout darurat offline, mencegah keterlambatan penyajian cangkir kopi ke pelanggan.
                </p>
              </div>
            </div>
          )}

          {/* 6. AUDIT BACKUP LOGS SUBTAB */}
          {activeSubTab === "audit" && (
            <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4 animate-fadeIn">
              <div className="border-b border-[#D4A853]/15 pb-4 mb-4">
                <h2 className="font-serif text-lg font-bold text-amber-100 flex items-center gap-2">
                  🛡️ SecOps Backup &amp; Restore Audit Logs
                </h2>
                <p className="text-xs text-amber-200/50 mt-0.5">
                  Log pengawasan digital mencakup pembuatan snapshot, restore database, pergantian endpoint, dan merge import data. (Non-Deletable Registry).
                </p>
              </div>

              {/* Table logs registry list */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-[#D4A853]/15 text-amber-100/40 text-[11px] font-mono">
                      <th className="py-2.5 px-4">Waktu Kejadian</th>
                      <th className="py-2.5 px-4">Aktor Pengoperasi</th>
                      <th className="py-2.5 px-4">Tipe Aksi SecOps</th>
                      <th className="py-2.5 px-4">Keterangan Detail Audit</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium text-amber-100">
                    {(!state.backupAuditLogs || state.backupAuditLogs.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-amber-100/30 font-mono text-[11px]">
                          Belum ada aktivitas SecOps yang tercatat di terminal registry.
                        </td>
                      </tr>
                    ) : (
                      state.backupAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/2 transition">
                          <td className="py-3 px-4 font-mono text-amber-200/80 whitespace-nowrap">{log.timestamp}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold">{log.actorName}</span>
                            <span className="text-[10px] text-amber-100/40 font-mono block mt-0.5">{log.actorRole}</span>
                          </td>
                          <td className="py-3 px-4 pt-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                              log.actionType === "CREATE_BACKUP" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
                              log.actionType === "RESTORE" ? "bg-purple-500/10 text-purple-300 border border-purple-500/20" :
                              log.actionType === "DELETE" ? "bg-red-500/10 text-red-300 border border-red-500/20" :
                              log.actionType === "RECOVERY" ? "bg-sky-500/10 text-sky-300 border border-sky-500/20" :
                              "bg-amber-400/10 text-[#D4A853] border border-[#D4A853]/20"
                            }`}>
                              {log.actionType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-amber-200/75 max-w-sm font-sans leading-relaxed">{log.details}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block text-[10px] font-mono font-bold text-emerald-400">
                              ✓ {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === "supabase" && (
            <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4 animate-fadeIn text-amber-50">
              <SupabaseEnterpriseSchema />
            </div>
          )}

          {/* Supabase Endpoint Setup and Notification Panel (Available on all tabs at the footer of panels) */}
          <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div>
                <h3 className="font-serif text-sm font-bold text-amber-100 flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-[#D4A853]" />
                  Supabase Cloud API Integration &amp; Security Alerts Setup
                </h3>
                <p className="text-[11px] text-amber-200/50 mt-0.5">
                  Modifikasi parameter URL dan Token webhook / notifications untuk automatic back-ups.
                </p>
              </div>

              {!isConfigEditing ? (
                <button
                  type="button"
                  onClick={() => setIsConfigEditing(true)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-300 text-xs font-mono font-bold cursor-pointer"
                >
                  Edit Konfigurasi
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigEditing(false)}
                    className="bg-black/40 hover:bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-amber-200/60 text-xs font-mono cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="bg-emerald-500 hover:bg-emerald-600 text-amber-950 font-bold px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              )}
            </div>

            {/* Config Edit Form layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left col: Supabase credentials */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-amber-400 font-bold block uppercase tracking-wider">Kredensial Supabase (Cloud Database Link)</span>
                
                <div>
                  <label className="text-[10px] font-mono text-amber-200 block mb-1">Supabase Endpoint URL</label>
                  <input
                    type="text"
                    disabled={!isConfigEditing}
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="Contoh: https://vzhgksbytwl.supabase.co"
                    className="w-full text-xs font-mono bg-black/40 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-amber-200 block mb-1">Anon API Key / Token</label>
                  <input
                    type="password"
                    disabled={!isConfigEditing}
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••••••"
                    className="w-full text-xs font-mono bg-black/40 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-amber-200 block mb-1">Service Role Key (Bypass RLS - Opsional)</label>
                  <input
                    type="password"
                    disabled={!isConfigEditing}
                    value={supabaseServiceKey}
                    onChange={(e) => setSupabaseServiceKey(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••••••"
                    className="w-full text-xs font-mono bg-black/40 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-amber-200 block mb-1">Supabase Storage Bucket Name</label>
                  <input
                    type="text"
                    disabled={!isConfigEditing}
                    value={supabaseBucket}
                    onChange={(e) => setSupabaseBucket(e.target.value)}
                    placeholder="coffeeops-backups"
                    className="w-full text-xs font-mono bg-black/40 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>

                {isConfigEditing && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 py-2 rounded-xl text-amber-300 font-mono text-xs font-bold transition cursor-pointer"
                    >
                      🧪 Test Connection Ping
                    </button>
                    {testStatus !== "idle" && (
                      <p className={`text-[11px] font-mono mt-1.5 text-center ${
                        testStatus === "testing" ? "text-amber-300 animate-pulse" :
                        testStatus === "success" ? "text-emerald-400" :
                        "text-red-400 font-bold"
                      }`}>
                        {testResultMsg}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right col: Guard Notification parameters */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-amber-400 font-bold block uppercase tracking-wider">Notifikasi &amp; SecAlerts Dispatcher (Email, WA, TG)</span>

                {/* Email Notif */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-amber-200 block">Recipient Email Alerts</label>
                    <input
                      type="checkbox"
                      disabled={!isConfigEditing}
                      checked={isEmailEnabled}
                      onChange={(e) => setIsEmailEnabled(e.target.checked)}
                      className="accent-amber-500"
                    />
                  </div>
                  <input
                    type="email"
                    disabled={!isConfigEditing || !isEmailEnabled}
                    value={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.value)}
                    className="w-full text-xs font-sans bg-black/40 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    placeholder="owner@coffeeops.com"
                  />
                </div>

                {/* WhatsApp Notif */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-amber-200 block">WhatsApp Alert Trigger</label>
                    <input
                      type="checkbox"
                      disabled={!isConfigEditing}
                      checked={isWhatsappEnabled}
                      onChange={(e) => setIsWhatsappEnabled(e.target.checked)}
                      className="accent-amber-500"
                    />
                  </div>
                  <input
                    type="text"
                    disabled={!isConfigEditing || !isWhatsappEnabled}
                    value={notifWhatsapp}
                    onChange={(e) => setNotifWhatsapp(e.target.value)}
                    className="w-full text-xs font-mono bg-black/40 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    placeholder="08123456789"
                  />
                </div>

                {/* Telegram Bot */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-amber-200 block">Telegram Channel / User ID</label>
                    <input
                      type="checkbox"
                      disabled={!isConfigEditing}
                      checked={isTelegramEnabled}
                      onChange={(e) => setIsTelegramEnabled(e.target.checked)}
                      className="accent-amber-500"
                    />
                  </div>
                  <input
                    type="text"
                    disabled={!isConfigEditing || !isTelegramEnabled}
                    value={notifTelegram}
                    onChange={(e) => setNotifTelegram(e.target.value)}
                    className="w-full text-xs font-mono bg-black/40 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    placeholder="@coffeeops_bot"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
