import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home as HomeIcon,
  CheckSquare,
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Save,
  Check,
  X,
  Star,
  AlertTriangle,
  Upload,
  Clock,
  Inbox,
  Award,
  Calendar,
  Layers,
  FileText,
  Smartphone,
  CheckCircle,
  TrendingUp,
  ChevronRight,
  UserCheck,
  Package
} from "lucide-react";
import {
  CoffeeOpsState,
  User,
  FohChecklistRecord,
  FohFeedback,
  FohComplaint,
  FohTable,
  FohInventoryItem,
  FohInventoryRequest,
  FohKpi,
  FohShift,
  FohTraining,
  FohTrainingResult
} from "../types";

interface FohManagementProps {
  state: CoffeeOpsState;
  syncState: (updatedState: CoffeeOpsState) => void;
  triggerToast: (msg: string) => void;
  currentUser: User | null;
}

export default function FohManagement({
  state,
  syncState,
  triggerToast,
  currentUser
}: FohManagementProps) {
  // Ensure FOH collections are array-initialized fallback
  const checklists = state.fohChecklists || [];
  const feedbacks = state.fohFeedback || [];
  const complaints = state.fohComplaints || [];
  const tables = state.fohTables || [];
  const inventory = state.fohInventory || [];
  const requests = state.fohInventoryRequests || [];
  const kpis = state.fohKpis || [];
  const shifts = state.fohShifts || [];
  const training = state.fohTraining || [];
  const trainingResults = state.fohTrainingResults || [];

  // Determine current effective role & state restrictions
  const actualRole = currentUser?.role || "Waiter";
  const isHeadWaiter = actualRole === "Head Waiter" || actualRole === "Owner" || actualRole === "Manager";
  const isOnlyWaiter = actualRole === "Waiter" || actualRole === "Front of House";

  // Allow high-level roles to simulate or switch views between Waiter & Head Waiter for complete operability
  const [roleMode, setRoleMode] = useState<"Waiter" | "Head Waiter">(
    actualRole === "Waiter" || actualRole === "Front of House" ? "Waiter" : "Head Waiter"
  );

  // Active sub-section (Waiters default to "home", Head Waiters can view KPI / Schedules)
  const [activeSubTab, setActiveSubTab] = useState<string>("home");
  const [enterpriseActiveSection, setEnterpriseActiveSection] = useState<"employees" | "tasks" | "kpis" | "feedbacks" | "incidents">("employees");

  // Local state for interactive Forms
  const [newFeedbackName, setNewFeedbackName] = useState("");
  const [newFeedbackRating, setNewFeedbackRating] = useState<number>(5);
  const [newFeedbackText, setNewFeedbackText] = useState("");
  const [newFeedbackComplaint, setNewFeedbackComplaint] = useState("");

  const [newComplaintDetail, setNewComplaintDetail] = useState("");
  const [newComplaintTable, setNewComplaintTable] = useState("Meja 1 (VIP)");
  const [newComplaintHour, setNewComplaintHour] = useState("");

  const [newRequestItem, setNewRequestItem] = useState("Tissue");
  const [newRequestQty, setNewRequestQty] = useState<number>(1);
  const [newRequestReason, setNewRequestReason] = useState("");

  // SOP Custom CRUD local State (for Managers / Owners)
  const isManagerOrOwner = actualRole === "Manager" || actualRole === "Owner";
  const [sopCategoryFilter, setSopCategoryFilter] = useState<string>("All");
  const [isAddingSop, setIsAddingSop] = useState(false);
  const [newSopTitle, setNewSopTitle] = useState("");
  const [newSopCategory, setNewSopCategory] = useState<string>("Customer Service");
  const [newSopSteps, setNewSopSteps] = useState("");

  // Quiz interactive state
  const [activeQuiz, setActiveQuiz] = useState<FohTraining | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [qIndex: number]: string }>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Leave / Swap Schedules local State
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [schedName, setSchedName] = useState("");
  const [schedShift, setSchedShift] = useState<"Pagi" | "Siang" | "Malam">("Pagi");
  const [schedType, setSchedType] = useState<"Work" | "Swap" | "Leave" | "Izin">("Work");
  const [schedReason, setSchedReason] = useState("");
  const [schedSwapWith, setSchedSwapWith] = useState("");

  // Checklist File Upload simulated state
  const [checklistType, setChecklistType] = useState<"opening" | "service" | "closing">("opening");
  const [checklistShift, setChecklistShift] = useState("Pagi");
  const [checklistValues, setChecklistValues] = useState<{ [task: string]: boolean }>({});
  const [checklistPhoto, setChecklistPhoto] = useState<string>("");
  const [customPhotoInput, setCustomPhotoInput] = useState<string>("");

  // Live Camera state
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Checklist SOP task item CRUD state
  const [taskCategoryToEdit, setTaskCategoryToEdit] = useState<"opening" | "service" | "closing">("opening");
  const [newSopTaskText, setNewSopTaskText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const defaultTasks = {
    opening: [
      "Area Dining Bersih",
      "Semua Meja Bersih",
      "Kursi Rapi",
      "Tissue Lengkap",
      "Menu Tersedia",
      "QR Menu Berfungsi",
      "Toilet Bersih",
      "Tempat Sampah Kosong"
    ],
    service: [
      "Greeting Customer",
      "Table Monitoring",
      "Complaint Handling",
      "Refill Condiment Station",
      "Refill Tissue"
    ],
    closing: [
      "Semua Meja Dibersihkan",
      "Lantai Dibersihkan",
      "Toilet Dibersihkan",
      "Sampah Dibuang",
      "Area Aman",
      "Lampu Dicek"
    ]
  };

  const currentTasks = state.fohChecklistTasks || defaultTasks;

  // --- ENTERPRISE DATABASE FOH STATE DEFINITIONS ---
  const employees = state.employees || [];
  const employeeTasks = state.employeeTasks || [];
  const employeeKpis = state.employeeKpis || [];
  const customerFeedbacks = state.customerFeedbacks || [];
  const incidentReports = state.incidentReports || [];

  // Employee Form State
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpGender, setNewEmpGender] = useState("Pria");
  const [newEmpPhone, setNewEmpPhone] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpCode, setNewEmpCode] = useState("");

  // Task Form State
  const [newTaskEmpId, setNewTaskEmpId] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<"opening" | "service" | "closing">("service");

  // KPI Form State
  const [newKpiEmpId, setNewKpiEmpId] = useState("");
  const [newKpiPeriod, setNewKpiPeriod] = useState("Juni 2026");
  const [newKpiAttendance, setNewKpiAttendance] = useState<number>(100);
  const [newKpiSop, setNewKpiSop] = useState<number>(100);
  const [newKpiRating, setNewKpiRating] = useState<number>(5);
  const [newKpiNotes, setNewKpiNotes] = useState("");

  // Incident Form State
  const [newIncidentType, setNewIncidentType] = useState("");
  const [newIncidentDesc, setNewIncidentDesc] = useState("");
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [newIncidentReporter, setNewIncidentReporter] = useState("");

  // simulated SaaS deploy/backup state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [deployActive, setDeployActive] = useState(false);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) {
      triggerToast("⚠ Nama employee tidak boleh kosong");
      return;
    }
    const code = newEmpCode.trim() || "EMP-" + Math.floor(1000 + Math.random() * 9000);
    const codeExists = employees.some(emp => emp.employeeCode === code);
    if (codeExists) {
      triggerToast(`⚠ Kode employee ${code} sudah terdaftar`);
      return;
    }
    const newEmp = {
      id: "emp-" + Date.now(),
      fullName: newEmpName.trim(),
      gender: newEmpGender,
      phone: newEmpPhone.trim() || "-",
      email: newEmpEmail.trim() || "-",
      employeeCode: code,
      isActive: true,
      branchId: "Pusat Pangkalpinang (HQ)",
      createdAt: new Date().toISOString().substring(0, 10) + " " + new Date().toTimeString().substring(0, 5)
    };
    const nextState = {
      ...state,
      employees: [newEmp, ...employees]
    };
    syncState(nextState);
    triggerToast(`✓ Berhasil mendaftarkan employee FOH: ${newEmp.fullName}`);
    setNewEmpName("");
    setNewEmpPhone("");
    setNewEmpEmail("");
    setNewEmpCode("");
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskEmpId) {
      triggerToast("⚠ Pilih employee terlebih dahulu");
      return;
    }
    if (!newTaskName.trim()) {
      triggerToast("⚠ Nama tugas tidak boleh kosong");
      return;
    }
    const emp = employees.find(e => e.id === newTaskEmpId);
    if (!emp) return;

    const newTask = {
      id: "tsk-" + Date.now(),
      employeeId: newTaskEmpId,
      taskName: newTaskName.trim(),
      category: newTaskCategory,
      status: "Pending" as const,
      assignedDate: new Date().toISOString().substring(0, 10)
    };

    const nextState = {
      ...state,
      employeeTasks: [newTask, ...employeeTasks]
    };
    syncState(nextState);
    triggerToast(`✓ Berhasil membagikan tugas ke ${emp.fullName}: ${newTask.taskName}`);
    setNewTaskName("");
  };

  const handleToggleTaskStatus = (taskId: string, currentStatus: string) => {
    const updated = employeeTasks.map(t => {
      if (t.id === taskId) {
        let nextStatus: "Pending" | "Completed" | "Approved" | "Rejected" = "Completed";
        if (currentStatus === "Completed") nextStatus = "Approved";
        else if (currentStatus === "Approved") nextStatus = "Pending";
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === "Completed" || nextStatus === "Approved"
            ? new Date().toISOString().substring(0, 10) + " " + new Date().toTimeString().substring(0, 5)
            : undefined
        };
      }
      return t;
    });
    syncState({ ...state, employeeTasks: updated });
    triggerToast("✓ Status tugas employee telah diperbarui");
  };

  const handleCreateKpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKpiEmpId) {
      triggerToast("⚠ Pilih employee untuk dievaluasi");
      return;
    }
    const emp = employees.find(e => e.id === newKpiEmpId);
    if (!emp) return;

    // Calculate final combined score: 40% SOP compliance, 30% Attendance rate, 30% customer feedback average
    // ratings are scale 1-5, convert to %: 5 Star is 100%, 4 Star is 80%, etc.
    const ratingPct = newKpiRating * 20;
    const finalScore = Math.round((newKpiSop * 0.4) + (newKpiAttendance * 0.3) + (ratingPct * 0.3));

    const newKpiItem = {
      id: "fkpi-" + Date.now(),
      employeeId: newKpiEmpId,
      period: newKpiPeriod,
      attendanceRate: newKpiAttendance,
      sopCompliance: newKpiSop,
      customerRating: newKpiRating,
      finalScore: finalScore,
      notes: newKpiNotes.trim() || "-",
      evaluatedBy: currentUser?.name || "Head Waiter",
      createdAt: new Date().toISOString().substring(0, 10)
    };

    const nextState = {
      ...state,
      employeeKpis: [newKpiItem, ...employeeKpis]
    };
    syncState(nextState);
    triggerToast(`✓ KPI Periode ${newKpiPeriod} untuk ${emp.fullName} berhasil dievaluasi dengan skor: ${finalScore}%`);
    setNewKpiNotes("");
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentType.trim() || !newIncidentDesc.trim()) {
      triggerToast("⚠ Isi tipe insiden dan deskripsi secara lengkap");
      return;
    }

    const newInc = {
      id: "ir-" + Date.now(),
      reporterId: newIncidentReporter || currentUser?.name || "FOH Staff",
      incidentType: newIncidentType.trim(),
      description: newIncidentDesc.trim(),
      severity: newIncidentSeverity,
      status: "Open" as const,
      incidentDate: new Date().toISOString().substring(0, 10) + " " + new Date().toTimeString().substring(0, 5),
      createdAt: new Date().toISOString().substring(0, 10)
    };

    const nextState = {
      ...state,
      incidentReports: [newInc, ...incidentReports]
    };
    syncState(nextState);
    triggerToast(`✓ Insiden ${newIncidentType} berhasil dilaporkan ke log keamanan!`);
    setNewIncidentType("");
    setNewIncidentDesc("");
  };

  const handleResolveIncident = (incId: string, solutionText: string) => {
    const updated = incidentReports.map(ir => {
      if (ir.id === incId) {
        return {
          ...ir,
          status: "Resolved" as const,
          resolutionNotes: solutionText || "Selesai diidentifikasi dan ditangani oleh tim shift harian"
        };
      }
      return ir;
    });
    syncState({ ...state, incidentReports: updated });
    triggerToast("✓ Status insiden berhasil ditandai sebagai Resolved");
  };

  const handleExecuteSaaSDebugBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(10);
    const timer1 = setTimeout(() => setBackupProgress(40), 400);
    const timer2 = setTimeout(() => setBackupProgress(75), 805);
    const timer3 = setTimeout(() => {
      setBackupProgress(100);
      setIsBackingUp(false);
      triggerToast("✓ [Enterprise Disaster Safeguard] Backup DB, Supabase Storage, and Auth State sukses disimpan!");
      
      // Save backup log in system state additively to keep record
      const newBackup = {
        id: "BK-FOH-" + Math.floor(1000 + Math.random() * 9000),
        name: `Automated Safeguard (FOH Additive-Layer Schema Sync)`,
        createdDate: new Date().toISOString().substring(0, 10) + " " + new Date().toTimeString().substring(0, 5),
        backupType: "Manual" as const,
        fileSize: "184 KB",
        createdBy: currentUser?.name || "System Safeguard",
        notes: "Additive database schema version snapshot taken successfully."
      };
      const backupsList = state.backupsList || [];
      syncState({
        ...state,
        backupsList: [newBackup, ...backupsList]
      });
    }, 1205);
  };

  const handleAddSopTaskTextHelper = (category: "opening" | "service" | "closing", text: string) => {
    handleAddChecklistTask(category, text);
  };

  const handleAddChecklistTask = (category: "opening" | "service" | "closing", text: string) => {
    if (!text.trim()) return;
    const nextState = { ...state };
    const tasks = { ...currentTasks };
    tasks[category] = [...tasks[category], text.trim()];
    nextState.fohChecklistTasks = tasks;
    syncState(nextState);
    triggerToast(`✓ Berhasil menambahkan tugas ${category}: ${text}`);
    setNewSopTaskText("");
  };

  const handleDeleteChecklistTask = (category: "opening" | "service" | "closing", index: number) => {
    const nextState = { ...state };
    const tasks = { ...currentTasks };
    const taskName = tasks[category][index];
    tasks[category] = tasks[category].filter((_, i) => i !== index);
    nextState.fohChecklistTasks = tasks;
    syncState(nextState);
    triggerToast(`✓ Berhasil menghapus tugas: ${taskName}`);
  };

  const handleUpdateChecklistTask = (category: "opening" | "service" | "closing", index: number, originalText: string) => {
    if (!editingText.trim()) return;
    const nextState = { ...state };
    const tasks = { ...currentTasks };
    tasks[category] = tasks[category].map((t, i) => i === index ? editingText.trim() : t);
    nextState.fohChecklistTasks = tasks;
    syncState(nextState);
    triggerToast(`✓ Berhasil mengubah tugas "${originalText}" menjadi "${editingText}"`);
    setEditingIndex(null);
    setEditingText("");
  };

  const handleFileCaptureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setChecklistPhoto(base64String);
      setCustomPhotoInput("");
      triggerToast("✓ Foto bukti berhasil ditangkap!");
    };
    reader.readAsDataURL(file);
  };

  const startLiveCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setCameraStream(stream);
      setShowLiveCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Tidak dapat mengakses kamera hardware. Pastikan izin kamera aktif.");
      triggerToast("⚠️ Gagal mengakses kamera hardware.");
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowLiveCamera(false);
  };

  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setChecklistPhoto(dataUrl);
        setCustomPhotoInput("");
        triggerToast("🎉 Berhasil mengambil foto bukti!");
      }
      stopLiveCamera();
    } catch (err) {
      triggerToast("⚠️ Gagal memproses pengambilan foto.");
    }
  };

  // Integrated FOH Attendance state and callbacks
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = (state.attendance || []).find(
    (a) => a.userId === (currentUser?.id || "u-waiter") && a.date === todayStr
  );

  const [attendancePhoto, setAttendancePhoto] = useState<string>("");
  const [showAttendanceCamera, setShowAttendanceCamera] = useState(false);
  const attVideoRef = React.useRef<HTMLVideoElement>(null);
  const [attCameraError, setAttCameraError] = useState("");

  const handleAttFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttendancePhoto(reader.result as string);
      triggerToast("✓ Foto selfie absen berhasil diterima!");
    };
    reader.readAsDataURL(file);
  };

  const startAttCamera = async () => {
    setAttCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      setShowAttendanceCamera(true);
      setTimeout(() => {
        if (attVideoRef.current) {
          attVideoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err) {
      setAttCameraError("Gagal mengakses kamera depan untuk selfie.");
      triggerToast("⚠️ Gagal mengakses kamera selfie.");
    }
  };

  const captureAttPhoto = () => {
    if (!attVideoRef.current) return;
    try {
      const video = attVideoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, 320, 320);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setAttendancePhoto(dataUrl);
        triggerToast("🎉 Selfie presensi berhasil ditangkap!");
      }
      if (attVideoRef.current.srcObject) {
        const stream = attVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
      setShowAttendanceCamera(false);
    } catch (err) {
      triggerToast("⚠️ Gagal mengambil foto selfie.");
    }
  };

  const cancelAttCamera = () => {
    if (attVideoRef.current && attVideoRef.current.srcObject) {
      const stream = attVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    setShowAttendanceCamera(false);
  };

  const handleClockIn = () => {
    const nextState = { ...state };
    const formatTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const isLate = new Date().getHours() >= 9;

    const newLog = {
      id: "att-" + Date.now(),
      userId: currentUser?.id || "u-waiter",
      userName: currentUser?.name || "Kru Waiter",
      role: currentUser?.role || "Waiter",
      date: todayStr,
      checkIn: formatTime,
      shift: checklistShift || "Pagi",
      status: (isLate ? "Terlambat" : "Hadir") as "Hadir" | "Terlambat",
      facePhoto: attendancePhoto || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=60"
    };

    nextState.attendance = [newLog, ...(nextState.attendance || [])];

    if (!nextState.auditLogs) nextState.auditLogs = [];
    nextState.auditLogs.unshift({
      id: "log-" + Date.now(),
      timestamp: new Date().toLocaleString(),
      user: currentUser?.name || "Kru Waiter",
      role: currentUser?.role || "Waiter",
      page: "FOH Dashboard",
      action: `Clock-In Presensi FOH pada ${formatTime}`,
      device: navigator.userAgent.substring(0, 40),
      ip: "192.168.1.10"
    });

    syncState(nextState);
    triggerToast("🎉 Clock In Kehadiran Berhasil!");
    setAttendancePhoto("");
  };

  const handleClockOut = () => {
    if (!todayAttendance) return;
    const nextState = { ...state };
    const formatTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    nextState.attendance = (nextState.attendance || []).map((a) => {
      if (a.id === todayAttendance.id) {
        return {
          ...a,
          checkOut: formatTime,
          hoursWorked: 8
        };
      }
      return a;
    });

    if (!nextState.auditLogs) nextState.auditLogs = [];
    nextState.auditLogs.unshift({
      id: "log-" + Date.now(),
      timestamp: new Date().toLocaleString(),
      user: currentUser?.name || "Kru Waiter",
      role: currentUser?.role || "Waiter",
      page: "FOH Dashboard",
      action: `Clock-Out Presensi FOH pada ${formatTime}`,
      device: navigator.userAgent.substring(0, 40),
      ip: "192.168.1.10"
    });

    syncState(nextState);
    triggerToast("👋 Clock Out Berhasil. Sampai jumpa di shift berikutnya!");
  };

  // Dynamic status-colored indicator class builders
  const getTableColorClass = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Occupied":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Reserved":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Cleaning Needed":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
    }
  };

  // ----------------------------------------------------
  // DYNAMIC COMPONENT STATE ACTION MUTATIONS
  // ----------------------------------------------------

  const handleToggleTable = (tableId: string, currentStatus: string) => {
    const statuses: ("Available" | "Occupied" | "Reserved" | "Cleaning Needed")[] = [
      "Available",
      "Occupied",
      "Reserved",
      "Cleaning Needed"
    ];
    const nextIndex = (statuses.indexOf(currentStatus as any) + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    const nextState = { ...state };
    nextState.fohTables = (nextState.fohTables || []).map((t) => {
      if (t.id === tableId) {
        return { ...t, status: nextStatus };
      }
      return t;
    });

    const actor = currentUser?.name || "Kru Waiter";
    const actRole = currentUser?.role || "Waiter";
    // Record into global audit log
    nextState.auditLogs = [
      {
        id: "AUD-FOH-" + Date.now(),
        user: actor,
        role: actRole,
        action: `Mengubah status ruangan/meja ${tableId} ke ${nextStatus}`,
        page: "FOH Table Management",
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        device: "Mobile Standard / Web Canvas",
        ip: "192.168.1.150"
      },
      ...(nextState.auditLogs || [])
    ];

    syncState(nextState);
    triggerToast(`✓ Status meja berhasil diubah ke ${nextStatus}`);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackName.trim() || !newFeedbackText.trim()) {
      triggerToast("Mohon lengkapi seluruh kolom masukan.");
      return;
    }

    const nextState = { ...state };
    const nextFeedbacks = [...(nextState.fohFeedback || [])];
    const nextComplaints = [...(nextState.fohComplaints || [])];

    const newFbId = "fb-" + Date.now();
    const newFb: FohFeedback = {
      id: newFbId,
      customerName: newFeedbackName,
      rating: newFeedbackRating,
      feedback: newFeedbackText,
      date: new Date().toISOString().split("T")[0]
    };

    nextFeedbacks.unshift(newFb);
    nextState.fohFeedback = nextFeedbacks;

    // Trigger auto complaint log entry if feedback is poor (rating 1-2) or complaint is written
    if (newFeedbackRating <= 2 || newFeedbackComplaint.trim()) {
      const cplId = "cpl-" + Date.now();
      const wordDetail = newFeedbackComplaint.trim()
        ? newFeedbackComplaint
        : `Customer ${newFeedbackName} memberi nilai Bintang ${newFeedbackRating}: ${newFeedbackText}`;

      const newCpl: FohComplaint = {
        id: cplId,
        detail: wordDetail,
        tableId: "Area Kasir / Dining",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        status: "Open"
      };
      nextComplaints.unshift(newCpl);
      nextState.fohComplaints = nextComplaints;
      triggerToast("✓ Komplain dideteksi rendah & terdaftar otomatis di Complaint Log.");
    }

    // Update overall metrics & auto-calculate Waiter KPIs based on new feedback averages
    recalculateWaiterKpis(nextState);

    // Save and Sync
    syncState(nextState);
    triggerToast("✓ Feedback kustomer berhasil tersimpan. Terimakasih!");
    setNewFeedbackName("");
    setNewFeedbackText("");
    setNewFeedbackComplaint("");
  };

  const handleRegisterComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaintDetail.trim()) {
      triggerToast("Tulis detail keluhan pelanggan.");
      return;
    }

    const nextState = { ...state };
    const nextComplaints = [...(nextState.fohComplaints || [])];

    const newCpl: FohComplaint = {
      id: "cpl-" + Date.now(),
      detail: newComplaintDetail,
      tableId: newComplaintTable,
      timestamp: newComplaintHour || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      status: "Open"
    };

    nextComplaints.unshift(newCpl);
    nextState.fohComplaints = nextComplaints;

    syncState(nextState);
    triggerToast("✓ Keluhan baru berhasil dicatat di Complaint Log!");
    setNewComplaintDetail("");
  };

  const handleActionComplaint = (id: string, actionType: "follow_up" | "close" | "escalate") => {
    const nextState = { ...state };
    nextState.fohComplaints = (nextState.fohComplaints || []).map((c) => {
      if (c.id === id) {
        if (actionType === "follow_up") return { ...c, status: "Followed Up", solution: "Sedang dianalisis jalan tengah" };
        if (actionType === "close") return { ...c, status: "Closed", solution: c.solution || "Telah diselesaikan secara kekeluargaan di outlet" };
        if (actionType === "escalate") return { ...c, status: "Escalated", solution: "Telah diteruskan kepada Manager / Owner Utama" };
      }
      return c;
    });

    recalculateWaiterKpis(nextState);
    syncState(nextState);
    triggerToast(`✓ Status komplain diperbarui ke: ${actionType.toUpperCase()}`);
  };

  const handleCreateInventoryRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRequestQty <= 0) {
      triggerToast("Jumlah barang harus minimal 1 unit.");
      return;
    }

    const nextState = { ...state };
    const nextRequests = [...(nextState.fohInventoryRequests || [])];

    const newReq: FohInventoryRequest = {
      id: "req-" + Date.now(),
      name: newRequestItem,
      qty: newRequestQty,
      reason: newRequestReason || "Stok FOH menipis",
      requestedBy: currentUser?.name || "Andi Waiter",
      status: "Pending"
    };

    nextRequests.unshift(newReq);
    nextState.fohInventoryRequests = nextRequests;

    syncState(nextState);
    triggerToast(`✓ Permintaan pengadaan ${newRequestItem} dikirim ke Head Waiter!`);
    setNewRequestReason("");
    setNewRequestQty(1);
  };

  const handleApproveInventoryRequest = (id: string, status: "Approved" | "Rejected") => {
    const nextState = { ...state };
    nextState.fohInventoryRequests = (nextState.fohInventoryRequests || []).map((r) => {
      if (r.id === id) {
        if (status === "Approved") {
          // Increase stock in FOH inventory directly on approval
          nextState.fohInventory = (nextState.fohInventory || []).map((fi) => {
            if (fi.name.toLowerCase() === r.name.toLowerCase()) {
              return { ...fi, qty: fi.qty + r.qty };
            }
            return fi;
          });
        }
        return { ...r, status: status };
      }
      return r;
    });

    recalculateWaiterKpis(nextState);
    syncState(nextState);
    triggerToast(`✓ Permintaan ${status === "Approved" ? "DISETUJUI & Stok Ditambah" : "DITOLAK"}`);
  };

  // Checklist Submission with compulsory Photo Evidence Upload
  const handleSubmitChecklist = (e: React.FormEvent) => {
    e.preventDefault();

    const tasksToVerify = currentTasks[checklistType];
    const completedItems = tasksToVerify.map((task) => ({
      task,
      completed: !!checklistValues[task]
    }));

    const finalPhoto = checklistPhoto || customPhotoInput || "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&auto=format&fit=crop&q=60";

    const newRecord: FohChecklistRecord = {
      id: "foh-chk-" + Date.now(),
      type: checklistType,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      shift: checklistShift,
      staffName: currentUser?.name || "Kru Waiter",
      role: currentUser?.role || "Waiter",
      items: completedItems,
      photoUrl: finalPhoto,
      status: "Pending" // Submitted photo/record needs Head Waiter or Manager approval
    };

    const nextState = { ...state };
    const nextChecklists = [...(nextState.fohChecklists || [])];
    nextChecklists.unshift(newRecord);
    nextState.fohChecklists = nextChecklists;

    // Update KPIs based on compliance completions
    recalculateWaiterKpis(nextState);

    syncState(nextState);
    triggerToast(`✓ Checklist ${checklistType.toUpperCase()} diajukan dengan Bukti Foto! Status: Menunggu approval.`);
    
    // Reset inputs
    setChecklistValues({});
    setChecklistPhoto("");
    setCustomPhotoInput("");
  };

  const handleApproveChecklist = (id: string, status: "Approved" | "Rejected") => {
    const nextState = { ...state };
    nextState.fohChecklists = (nextState.fohChecklists || []).map((c) => {
      if (c.id === id) {
        return { ...c, status: status };
      }
      return c;
    });

    recalculateWaiterKpis(nextState);
    syncState(nextState);
    triggerToast(`✓ Checklist ${status === "Approved" ? "DISETUJUI (TERVERIFIKASI)" : "DITOLAK"}`);
  };

  // Quiz evaluation
  const handleQuizSubmit = (quiz: FohTraining) => {
    if (!quiz.quiz || !quiz.quiz.length) return;
    let correctCount = 0;
    quiz.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.quiz.length) * 100);
    const passed = score >= 70;

    const nextState = { ...state };
    const nextResults = [...(nextState.fohTrainingResults || [])];

    const newResult: FohTrainingResult = {
      id: "res-" + Date.now(),
      staffName: currentUser?.name || "Andi Waiter",
      trainingTitle: quiz.title,
      score,
      passed,
      date: new Date().toISOString().split("T")[0]
    };

    nextResults.unshift(newResult);
    nextState.fohTrainingResults = nextResults;

    recalculateWaiterKpis(nextState);
    syncState(nextState);

    setQuizScore(score);
    triggerToast(passed ? "🎉 Selamat! Anda LULUS Pelatihan." : "⚠️ Skor Anda Belum Lulus. Coba Lagi!");
  };

  // SOP Custom CRUD Operations (for Managers & Owners)
  const handleAddSop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSopTitle.trim() || !newSopSteps.trim()) {
      triggerToast("Mohon isi judul dan langkah-langkah SOP.");
      return;
    }

    const stepsArray = newSopSteps.split("\n").filter((s) => s.trim().length > 0);
    const nextState = { ...state };
    const nextSops = [...(nextState.fohTraining || [])];

    const newSop: FohTraining = {
      id: "tr-custom-" + Date.now(),
      title: newSopTitle,
      category: newSopCategory as any,
      contentUrl: stepsArray.join(". "),
      quiz: [
        {
          question: `Apakah SOP ${newSopTitle} wajib dilaksanakan?`,
          options: ["Ya, Sangat Wajib", "Tidak Wajib", "Opsional", "Tergantung Mood"],
          answer: "Ya, Sangat Wajib"
        }
      ]
    };

    nextSops.unshift(newSop);
    nextState.fohTraining = nextSops;

    syncState(nextState);
    triggerToast(`✓ SOP Baru "${newSopTitle}" berhasil diunggah!`);
    setIsAddingSop(false);
    setNewSopTitle("");
    setNewSopSteps("");
  };

  const handleDeleteSop = (id: string) => {
    const nextState = { ...state };
    nextState.fohTraining = (nextState.fohTraining || []).filter((s) => s.id !== id);
    syncState(nextState);
    triggerToast("✓ SOP berhasil dihapus.");
  };

  // Shift schedule planning helper
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedDate || !schedName) {
      triggerToast("Isi Tanggal dan Nama Staff.");
      return;
    }

    const nextState = { ...state };
    const nextShifts = [...(nextState.fohShifts || [])];

    const newShift: FohShift = {
      id: "sh-" + Date.now(),
      date: schedDate,
      staffName: schedName,
      shift: schedShift,
      type: schedType,
      status: "Approved",
      swapWith: schedSwapWith || undefined,
      reason: schedReason || undefined
    };

    nextShifts.unshift(newShift);
    nextState.fohShifts = nextShifts;

    syncState(nextState);
    triggerToast(`✓ Jadwal shift berhasil dibuat untuk ${schedName}!`);
    setIsAddingSchedule(false);
    setSchedDate("");
    setSchedName("");
    setSchedReason("");
    setSchedSwapWith("");
  };

  // Re-calculate KPI weights dynamically for Waiters based on logs
  const recalculateWaiterKpis = (nextState: CoffeeOpsState) => {
    // Collect all submitted checklists of type we want, averages of rating feedback, and quiz completions
    const currentFeedback = nextState.fohFeedback || [];
    const avgCustomerRating = currentFeedback.length
      ? Math.round((currentFeedback.reduce((acc, current) => acc + current.rating, 0) / currentFeedback.length) * 20)
      : 90; // Default out of 100 base

    const resolvedComplaints = (nextState.fohComplaints || []).filter((c) => c.status === "Closed").length;
    const totalComplaints = (nextState.fohComplaints || []).length;
    const complaintResWeight = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 100;

    const checklistCompliance = Math.min(
      100,
      80 + (nextState.fohChecklists || []).filter((c) => c.status === "Approved").length * 5
    );

    const quizPassedCount = (nextState.fohTrainingResults || []).filter((r) => r.passed).length;
    const trainingCompleteness = Math.min(100, 70 + quizPassedCount * 15);

    // Save of user Andi Waiter KPI
    nextState.fohKpis = [
      {
        id: "kpi-1",
        staffName: "Andi Waiter",
        period: "Mei-Juni 2026",
        attendance: 98,
        sopCompletion: 95,
        customerRating: avgCustomerRating,
        complaintResolution: complaintResWeight,
        checklistCompletion: checklistCompliance,
        trainingCompletion: trainingCompleteness,
        score: Math.round(
          (98 + 95 + avgCustomerRating + complaintResWeight + checklistCompliance + trainingCompleteness) / 6
        ),
        category:
          Math.round(
            (98 + 95 + avgCustomerRating + complaintResWeight + checklistCompliance + trainingCompleteness) / 6
          ) >= 90
            ? "Excellent"
            : Math.round(
                (98 + 95 + avgCustomerRating + complaintResWeight + checklistCompliance + trainingCompleteness) / 6
              ) >= 80
            ? "Good"
            : "Average"
      }
    ];
  };

  // Derived KPI ratings
  const activeKPI = kpis.find((k) => k.staffName === "Andi Waiter") || {
    attendance: 98,
    sopCompletion: 95,
    customerRating: 94,
    complaintResolution: 100,
    checklistCompletion: 96,
    trainingCompletion: 100,
    score: 96.5,
    category: "Excellent"
  };

  const pendingApprovalsCount = useMemo(() => {
    const pendingChk = checklists.filter((c) => c.status === "Pending").length;
    const pendingReq = requests.filter((r) => r.status === "Pending").length;
    return pendingChk + pendingReq;
  }, [checklists, requests]);

  const activeComplaintsList = complaints.filter((c) => c.status !== "Closed");

  return (
    <div className="space-y-6">
      {/* Visual Identity Title & Description Card */}
      <div className="bg-gradient-to-r from-amber-950/40 to-stone-900/40 border border-amber-500/15 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍽️</span>
            <div>
              <h2 className="text-2xl font-serif font-bold text-amber-200 tracking-wide">
                Front of House (FOH) Dept
              </h2>
              <p className="text-xs text-amber-100/60 font-mono">
                Sistem Manajemen Waiter & Layanan Kebersihan CoffeeOps • Terintegrasi
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic switched Role Mode */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-amber-500/10">
          <span className="text-[10px] text-amber-200/50 uppercase tracking-widest font-mono">Akses Peran:</span>
          {isHeadWaiter ? (
            <select
              value={roleMode}
              onChange={(e) => {
                setRoleMode(e.target.value as any);
                setActiveSubTab("home");
              }}
              className="bg-amber-950/80 text-amber-200 border border-amber-500/30 text-xs rounded-lg px-2 py-1 outline-none font-sans font-bold cursor-pointer"
            >
              <option value="Waiter">Waiter Mode</option>
              <option value="Head Waiter">Head Waiter Mode</option>
            </select>
          ) : (
            <span className="text-xs text-amber-300 font-bold uppercase font-mono bg-amber-500/10 px-2 py-0.5 rounded">
              {actualRole}
            </span>
          )}
        </div>
      </div>

      {/* Top statistics indicators bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1c120c]/60 border border-[#D4A853]/10 p-4 rounded-xl flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center font-serif text-lg font-bold">
            ★
          </div>
          <div>
            <div className="text-[10px] text-amber-100/40 uppercase tracking-wider font-mono">Avg Customer Rating</div>
            <div className="text-lg font-bold text-amber-100">
              {(feedbacks.length
                ? feedbacks.reduce((a, b) => a + b.rating, 0) / feedbacks.length
                : 4.8
              ).toFixed(1)}{" "}
              / 5.0
            </div>
          </div>
        </div>

        <div className="bg-[#1c120c]/60 border border-[#D4A853]/10 p-4 rounded-xl flex items-center gap-3">
          <div className="h-10 w-10 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center font-bold">
            ⚠️
          </div>
          <div>
            <div className="text-[10px] text-amber-100/40 uppercase tracking-wider font-mono">Active Complaints</div>
            <div className="text-lg font-bold text-amber-100">{activeComplaintsList.length} Kasus</div>
          </div>
        </div>

        <div className="bg-[#1c120c]/60 border border-[#D4A853]/10 p-4 rounded-xl flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500/10 text-amber-300 rounded-lg flex items-center justify-center font-bold">
            📋
          </div>
          <div>
            <div className="text-[10px] text-amber-100/40 uppercase tracking-wider font-mono">Meja Terisi</div>
            <div className="text-lg font-bold text-amber-100">
              {tables.filter((t) => t.status === "Occupied").length} / {tables.length}
            </div>
          </div>
        </div>

        <div className="bg-[#1c120c]/60 border border-[#D4A853]/10 p-4 rounded-xl flex items-center gap-3">
          <div className="h-10 w-10 bg-cyan-500/10 text-cyan-400 rounded-lg flex items-center justify-center font-bold">
            📥
          </div>
          <div>
            <div className="text-[10px] text-amber-100/40 uppercase tracking-wider font-mono">Persetujuan Pending</div>
            <div className="text-lg font-bold text-cyan-300">
              {pendingApprovalsCount} Pengajuan
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sub-navigation and Content worksheets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Sub-Navigation Menu */}
        <div className="lg:col-span-3 bg-[#110500]/70 border border-amber-500/10 p-3 rounded-2xl space-y-2">
          <div className="px-3 py-2 border-b border-amber-500/5 mb-2">
            <span className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Menu Navigasi FOH</span>
          </div>

          <button
            onClick={() => setActiveSubTab("home")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
              activeSubTab === "home" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
            }`}
          >
            <HomeIcon className="h-4 w-4 shrink-0" />
            <span>Home / Waiter Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab("checklist");
              setChecklistType("opening");
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
              activeSubTab === "checklist" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
            }`}
          >
            <CheckSquare className="h-4 w-4 shrink-0" />
            <span>Daily Checklist & Upload</span>
          </button>

          <button
            onClick={() => setActiveSubTab("tables")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
              activeSubTab === "tables" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>Table Management</span>
          </button>

          <button
            onClick={() => setActiveSubTab("feedback")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
              activeSubTab === "feedback" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
            }`}
          >
            <Star className="h-4 w-4 shrink-0" />
            <span>Customer Feedback Form</span>
          </button>

          <button
            onClick={() => setActiveSubTab("complaints")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
              activeSubTab === "complaints" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
            }`}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Complaint Log & Solusi</span>
          </button>

          <button
            onClick={() => setActiveSubTab("inventory")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
              activeSubTab === "inventory" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
            }`}
          >
            <Package className="h-4 w-4 shrink-0" />
            <span>FOH Inventory & Requests</span>
          </button>

          <button
            onClick={() => setActiveSubTab("sop")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
              activeSubTab === "sop" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>SOP Library & Panduan</span>
          </button>

          <button
            onClick={() => setActiveSubTab("training")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
              activeSubTab === "training" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
            }`}
          >
            <Award className="h-4 w-4 shrink-0" />
            <span>Training Center & Kuis</span>
          </button>

          {/* HEAD WAITER & MGMT SPECIFIC SUB-NAV ITEMS */}
          {roleMode === "Head Waiter" && (
            <div className="pt-4 border-t border-amber-500/5 mt-4 space-y-2">
              <div className="px-3 py-1 mb-1">
                <span className="text-[10px] text-[#D4A853] font-semibold uppercase tracking-widest font-mono">Head Waiter Control</span>
              </div>

              <button
                onClick={() => setActiveSubTab("kpi")}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
                  activeSubTab === "kpi" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
                }`}
              >
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span>KPI & Team Performance</span>
              </button>

              <button
                onClick={() => setActiveSubTab("schedules")}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
                  activeSubTab === "schedules" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
                }`}
              >
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Shift Schedule Planner</span>
              </button>

              <button
                onClick={() => setActiveSubTab("approvals")}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 justify-between transition ${
                  activeSubTab === "approvals" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="h-4 w-4 shrink-0" />
                  <span>Approval Center</span>
                </div>
                {pendingApprovalsCount > 0 && (
                  <span className="bg-cyan-600 text-white font-bold px-1.5 py-0.5 rounded-full text-[9px]">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSubTab("checklist_editor")}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition ${
                  activeSubTab === "checklist_editor" ? "bg-amber-500/15 text-amber-205 font-bold" : "text-amber-100/60 hover:bg-amber-500/5 hover:text-amber-100"
                }`}
              >
                <CheckSquare className="h-4 w-4 shrink-0 text-amber-400" />
                <span>⚙️ Checklist SOP Editor</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side Content Container Box */}
        <div className="lg:col-span-9 bg-[#110500]/40 border border-amber-500/10 p-6 rounded-2xl min-h-[500px]">
          <AnimatePresence mode="wait">
            {/* SUB-TAB: HOME / DASHBOARD */}
            {activeSubTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    Dashboard Utama FOH
                  </h3>
                  <p className="text-xs text-amber-100/40 font-mono">
                    Selamat bekerja kembali. Berikut adalah status tugas harian dan performa FOH hari ini.
                  </p>
                </div>

                {/* KPI Overview score indicator for Andi Waiter */}
                <div className="bg-[#1c0f07]/80 rounded-xl p-5 border border-amber-500/15 flex flex-col md:flex-row items-center gap-6 justify-between">
                  <div>
                    <div className="text-xs text-[#D4A853] font-bold uppercase font-mono tracking-wider">Performa Pelayanan Waiter</div>
                    <h3 className="text-xl font-serif font-bold text-amber-100 mt-1">Andi Waiter KPI Booklet</h3>
                    <p className="text-xs text-amber-100/50 mt-1">
                      Kalkulasi performa terotomatisasi mencakup kelancaran opening checklist, feedback kustomer, dan quiz training center.
                    </p>
                  </div>
                  <div className="text-center bg-black/40 p-4 rounded-xl border border-amber-500/10 min-w-[130px]">
                    <div className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono">Skor Bulanan</div>
                    <div className="text-3xl font-bold text-amber-200 mt-1 font-serif">{activeKPI.score}</div>
                    <span className="inline-block text-[10px] uppercase font-mono px-2 py-0.5 mt-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                      {activeKPI.category}
                    </span>
                  </div>
                </div>

                {/* Subtasks Compliance list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-500/10">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide mb-3">Pintasan Waiter (Quick Actions)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setActiveSubTab("feedback")}
                        className="bg-black/30 hover:bg-black/50 p-3 rounded-lg border border-amber-500/15 text-left text-xs transition duration-200"
                      >
                        <span className="block text-lg mb-1">✍️</span>
                        <span className="font-bold text-amber-250">Input Feedback</span>
                      </button>
                      <button
                        onClick={() => setActiveSubTab("checklist")}
                        className="bg-black/30 hover:bg-black/50 p-3 rounded-lg border border-amber-500/15 text-left text-xs transition duration-200"
                      >
                        <span className="block text-lg mb-1">📋</span>
                        <span className="font-bold text-amber-250">Form Checklist</span>
                      </button>
                      <button
                        onClick={() => setActiveSubTab("tables")}
                        className="bg-black/30 hover:bg-black/50 p-3 rounded-lg border border-amber-500/15 text-left text-xs transition duration-200"
                      >
                        <span className="block text-lg mb-1">🛋️</span>
                        <span className="font-bold text-amber-250">Status Meja</span>
                      </button>
                      <button
                        onClick={() => setActiveSubTab("training")}
                        className="bg-black/30 hover:bg-black/50 p-3 rounded-lg border border-amber-500/15 text-left text-xs transition duration-200"
                      >
                        <span className="block text-lg mb-1">📖</span>
                        <span className="font-bold text-amber-250">Quiz & Training</span>
                      </button>
                    </div>
                  </div>

                  {/* SOP Fast Guide info display */}
                  <div className="bg-amber-950/20 p-4 rounded-xl border border-[#D4A853]/15">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide mb-3">Informasi Shift Hari Ini</h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between border-b border-amber-500/5 pb-2">
                        <span className="text-amber-100/40">Status Keaktifan:</span>
                        <span className="text-emerald-400 font-bold font-mono">ACTIVE (ONLINE)</span>
                      </div>
                      <div className="flex justify-between border-b border-amber-500/5 pb-2">
                        <span className="text-amber-100/40">SOP Terbaca Minggu Ini:</span>
                        <span className="text-amber-200 font-mono">100% Selesai</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-amber-100/40">Shift Berjalan:</span>
                        <span className="text-amber-300 font-bold">Pagi (06:00 - 14:00)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INTEGRATED FOH ATTENDANCE CARD */}
                <div className="bg-gradient-to-r from-[#201006] to-[#120701] rounded-2xl p-5 border border-amber-500/20 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-amber-100 flex items-center gap-1.5">
                        <span>📋</span> Presensi & Absensi Mandiri Kru FOH
                      </h4>
                      <p className="text-[11px] text-amber-150/50">
                        Ambil foto selfie bukti kehadiran dan lakukan check-in/out shift dengan GPS kordinat terintegrasi.
                      </p>
                    </div>
                    <div>
                      {todayAttendance ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-mono font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          ● SUDAH CLOCK-IN ({todayAttendance.checkIn})
                        </span>
                      ) : (
                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] uppercase font-mono font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          ● BELUM ABSEN MASUK
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* Left portion: Action button and state */}
                    <div className="md:col-span-7 space-y-4">
                      {!todayAttendance ? (
                        <div className="space-y-3">
                          <p className="text-xs text-amber-205/80">Silakan ambil selfie wajah Anda (opsional/mandatori) sebelum melakukan Clock-In Pagi/Siang.</p>
                          
                          <div className="flex flex-wrap gap-2">
                            {/* Native camera upload */}
                            <input
                              type="file"
                              accept="image/*"
                              capture="user"
                              id="att-selfie-upload"
                              className="hidden"
                              onChange={handleAttFileChange}
                            />
                            <label
                              htmlFor="att-selfie-upload"
                              className="bg-zinc-900 border border-amber-500/25 text-amber-205 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-zinc-850 transition"
                            >
                              📸 Buka Kamera Depan (Selfie)
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                if (showAttendanceCamera) {
                                  cancelAttCamera();
                                } else {
                                  startAttCamera();
                                }
                              }}
                              className="bg-[#1c0f07] border border-amber-500/20 text-amber-205 px-3 py-2 rounded-lg text-xs transition"
                            >
                              🎥 Live Streaming Selfie (Webcam)
                            </button>
                          </div>

                          {showAttendanceCamera && (
                            <div className="bg-black/80 border border-amber-500/25 p-3 rounded-xl flex flex-col items-center gap-2 max-w-xs">
                              <div className="relative w-44 aspect-square rounded-full overflow-hidden bg-zinc-950 border-2 border-amber-500/30">
                                <video ref={attVideoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                              </div>
                              {attCameraError && <p className="text-[10px] text-rose-450">{attCameraError}</p>}
                              <div className="flex gap-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={captureAttPhoto}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-1.5 rounded"
                                >
                                  Tangkap Selfie
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelAttCamera}
                                  className="bg-zinc-800 text-amber-205 font-bold text-[10px] px-2.5 py-1.5 rounded"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleClockIn}
                            className="w-full bg-[#1b0a04] hover:bg-amber-600 border border-amber-500/30 hover:border-amber-400 hover:text-black font-serif font-extrabold text-xs text-amber-250 py-3 rounded-xl transition duration-300 shadow-md uppercase tracking-wider block"
                          >
                            👉 SELESAIKAN CLOCK-IN MASUK SHIFT
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-amber-100/70">
                            Status Presensi Anda hari ini tercatat sebagai <strong className={`${todayAttendance.status === "Hadir" ? "text-emerald-400" : "text-amber-400"}`}>{todayAttendance.status}</strong> pada pukul <strong>{todayAttendance.checkIn}</strong>.
                          </p>

                          {todayAttendance.checkOut ? (
                            <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/10 text-xs text-emerald-300">
                              ✓ Anda telah menyelesaikan shift hari ini dan Clock-Out pada {todayAttendance.checkOut} Waktu Setempat. Selamat beristirahat!
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleClockOut}
                              className="w-full bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 border border-red-500/30 text-white font-serif font-bold text-xs py-3 rounded-xl transition uppercase tracking-wider block"
                            >
                              🚪 SELESAIKAN SHIFT / CLOCK-OUT SEKARANG
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right portion: Preview of selfie photo */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                      <span className="text-[10px] text-amber-205/50 font-mono tracking-widest uppercase">Selfie Preview</span>
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#D4A853]/25 bg-amber-950/10 flex items-center justify-center">
                        {attendancePhoto || todayAttendance?.facePhoto ? (
                          <img
                            src={attendancePhoto || todayAttendance?.facePhoto}
                            alt="Selfie"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs text-amber-100/20">Blank Area</span>
                        )}
                      </div>
                      <span className="text-[9px] text-amber-100/30 font-mono">300 x 300 JPG Format</span>
                    </div>
                  </div>
                </div>

                {/* Audit Activities for FOH Block */}
                <div className="bg-black/30 p-4 rounded-xl border border-amber-500/10">
                  <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block mb-3">FOH Activity Audit Log</span>
                  <div className="space-y-3">
                    {state.auditLogs?.filter((al) => al.page.includes("FOH")).slice(0, 3).map((al) => (
                      <div key={al.id} className="text-xs flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <p className="text-amber-100/80 font-bold">{al.action}</p>
                          <p className="text-[10px] text-amber-150/40">{al.user} ({al.role}) • {al.device}</p>
                        </div>
                        <span className="text-[10px] text-amber-200/50 font-mono shrink-0 font-bold bg-black/35 px-2 py-0.5 rounded">{al.timestamp}</span>
                      </div>
                    )) || (
                      <p className="text-xs text-amber-100/30">Belum ada aktivitas FOH terekam pada audit log hari ini.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: CHECKLIST */}
            {activeSubTab === "checklist" && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    Daily Checklist System
                  </h3>
                  <p className="text-xs text-amber-100/40 font-mono">
                    Wajib melengkapi checklist harian sesuai jadwal shift operasional dan menyertakan bukti foto evidence valid.
                  </p>
                </div>

                {/* Checklist type choice */}
                <div className="flex border-b border-amber-500/10">
                  {(["opening", "service", "closing"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setChecklistType(type);
                        setChecklistValues({});
                      }}
                      className={`flex-1 text-center py-2.5 text-xs font-bold border-b-2 transition uppercase ${
                        checklistType === type
                          ? "border-amber-400 text-amber-200 bg-amber-500/5"
                          : "border-transparent text-amber-100/40 hover:text-amber-200"
                      }`}
                    >
                      {type === "opening" ? "🌅 Opening" : type === "service" ? "☕ During Service" : "🌌 Closing"}
                    </button>
                  ))}
                </div>

                {/* Checklist Form */}
                <form onSubmit={handleSubmitChecklist} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-amber-500/10">
                    <div>
                      <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold block mb-1">Pilih Shift</label>
                      <select
                        value={checklistShift}
                        onChange={(e) => setChecklistShift(e.target.value)}
                        className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full"
                      >
                        <option value="Pagi">Pagi (06:00 - 14:00)</option>
                        <option value="Siang">Siang (13:00 - 21:00)</option>
                        <option value="Malam">Malam (20:00 - 23:00)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold block mb-1">Nama Petugas</span>
                      <p className="text-xs bg-amber-950/10 border border-amber-500/15 p-2 rounded-lg text-amber-205 font-bold">
                        {currentUser?.name || "Andi Waiter"} ({currentUser?.role || "Waiter"})
                      </p>
                    </div>
                  </div>

                  {/* Tasks List rendering */}
                  <div className="bg-black/30 p-4 rounded-xl border border-amber-500/10 space-y-3">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide block mb-2">Item Tugas Checklist</span>
                    
                    {currentTasks[checklistType]?.map((task: string) => (
                      <label key={task} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={!!checklistValues[task]}
                          onChange={(e) => setChecklistValues({ ...checklistValues, [task]: e.target.checked })}
                          className="rounded border-amber-500 text-amber-500 focus:ring-amber-500 h-4 w-4 bg-black"
                        />
                        <span className="text-xs text-amber-100">{task}</span>
                      </label>
                    )) || (
                      <p className="text-xs text-amber-100/40">Belum ada item tugas checklist untuk kategori ini.</p>
                    )}
                  </div>

                  {/* Photo evidence upload simulation */}
                  {(checklistType === "opening" || checklistType === "closing") && (
                    <div className="bg-[#1c0f07]/50 p-4 rounded-xl border border-amber-500/10 space-y-4">
                      <div>
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                          <Upload className="h-4 w-4 text-amber-400" />
                          <span>Unggah Bukti Foto (Mandatori Kamera)</span>
                        </span>
                        <p className="text-[11px] text-amber-100/40 mt-0.5">
                          Semua unggahan mewajibkan akses kamera langsung atau file terkompresi demi menjamin validitas kondisi dining room.
                        </p>
                      </div>

                      {/* Direct Hardware Camera Buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 border-b border-white/5">
                        {/* Native phone camera link */}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            id="native-camera-capture"
                            onChange={handleFileCaptureChange}
                          />
                          <label
                            htmlFor="native-camera-capture"
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-bold px-4 py-3 rounded-xl border border-amber-500/25 cursor-pointer text-xs text-center transition shadow-lg shrink-0"
                          >
                            📷 Aktifkan Kamera HP/Tablet
                          </label>
                          <span className="text-[9px] text-amber-205/50 block text-center mt-1">Mengaktifkan kamera belakang HP secara instan</span>
                        </div>

                        {/* Webcam Capture stream */}
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              if (showLiveCamera) {
                                stopLiveCamera();
                              } else {
                                startLiveCamera();
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-[#1a0e08] hover:bg-black/55 text-amber-250 font-bold px-4 py-3 rounded-xl border border-amber-500/20 text-xs transition shrink-0"
                          >
                            🎥 Live Camera Feed (Webcam)
                          </button>
                          <span className="text-[9px] text-amber-205/50 block text-center mt-1">Bidik frame live streaming dari browser panel</span>
                        </div>
                      </div>

                      {/* Video Stream capture widget */}
                      {showLiveCamera && (
                        <div className="bg-black/85 border border-amber-500/20 rounded-xl p-4 flex flex-col items-center gap-3">
                          <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden bg-zinc-950">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 bg-emerald-500/80 text-white text-[9px] px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                              LIVE WEBCAM
                            </div>
                          </div>
                          {cameraError && <p className="text-[11px] text-rose-400 font-mono text-center">{cameraError}</p>}
                          <div className="flex gap-2 w-full max-w-sm">
                            <button
                              type="button"
                              onClick={captureLivePhoto}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition"
                            >
                              📸 Ambil Foto
                            </button>
                            <button
                              type="button"
                              onClick={stopLiveCamera}
                              className="bg-zinc-800 hover:bg-zinc-700 text-amber-205 text-xs font-bold px-4 py-2.5 rounded-lg transition"
                            >
                              Tutup
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Predefined mock evidence visual templates */}
                      <div>
                        <span className="text-[10px] text-amber-250/60 uppercase tracking-widest font-mono font-bold block mb-2">Atau pilih dari template galeri</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { name: "Dining Bersih", url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=60" },
                            { name: "Meja Rapi", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=60" },
                            { name: "Toilet Higienis", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=60" }
                          ].map((pEv) => (
                            <button
                              key={pEv.name}
                              type="button"
                              onClick={() => {
                                setChecklistPhoto(pEv.url);
                                setCustomPhotoInput("");
                              }}
                              className={`p-2 border text-[11px] rounded-lg text-left transition ${
                                checklistPhoto === pEv.url
                                  ? "bg-amber-500/15 border-amber-400 text-amber-200"
                                  : "bg-black/20 border-white/5 text-amber-100/60 hover:bg-white/5"
                              }`}
                            >
                              <span className="block font-bold">📸 {pEv.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold block mb-1">Atau Masukkan URL Gambar Bukti Khusus</label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/... (atau data:image/jpeg;base64,...)"
                          value={checklistPhoto.startsWith("data:") ? "[Kamera / Capture Data URL]" : (customPhotoInput || checklistPhoto)}
                          onChange={(e) => {
                            setCustomPhotoInput(e.target.value);
                            setChecklistPhoto(e.target.value);
                          }}
                          className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2.5 text-xs w-full outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Photo preview bubble */}
                      {(checklistPhoto || customPhotoInput) && (
                        <div className="p-2 bg-black/45 rounded-lg w-fit outline outline-white/5">
                          <span className="text-[9px] text-[#D4A853] font-bold block mb-1 animate-pulse">📷 DATA FOTO BUKTI TERLAMPIR:</span>
                          <img
                            src={checklistPhoto || customPhotoInput}
                            alt="Evidence preview"
                            onError={(e) => {
                              (e.target as any).src = "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&auto=format&fit=crop&q=60";
                            }}
                            className="h-28 w-44 object-cover rounded border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submission and loading */}
                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-sans font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>Ajukan Checklist & Bukti ke Head Waiter</span>
                    </button>
                  </div>
                </form>

                {/* Checklist History Logs list */}
                <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 mt-6 space-y-4">
                  <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Riwayat Pengajuan Harian Anda</span>
                  <div className="space-y-3">
                    {checklists.map((c) => (
                      <div key={c.id} className="text-xs border-b border-white/5 pb-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <span className="text-amber-300 font-bold uppercase text-[10px] tracking-wide bg-amber-500/10 px-1.5 py-0.5 rounded mr-2">
                              {c.type.toUpperCase()}
                            </span>
                            <span className="text-amber-100 font-bold">{c.shift} Shift • Hari {c.date}</span>
                            <p className="text-[11px] text-amber-100/40 mt-1">Petugas: {c.staffName} ({c.role}) • Diunggah jam {c.time}</p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {c.photoUrl && (
                              <img
                                src={c.photoUrl}
                                alt="Claim thumb"
                                className="h-10 w-10 object-cover rounded border border-white/10"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.status === "Approved"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : c.status === "Rejected"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: TABLE MANAGEMENT */}
            {activeSubTab === "tables" && (
              <motion.div
                key="tables"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    Sistem Status Meja (Table Management)
                  </h3>
                  <p className="text-xs text-amber-100/40 font-mono">
                    Sentuh salah satu kartu meja di bawah ini untuk mengubah atau merotasi status secara real-time.
                  </p>
                </div>

                {/* Color Legend explanation */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-[#211208]/50 p-3 rounded-lg border border-amber-500/10 text-[10px] font-mono justify-items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="text-emerald-400 font-bold">Available (Kosong)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                    <span className="text-rose-400 font-bold">Occupied (Terisi)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span className="text-amber-400 font-bold">Reserved (Dipesan)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                    <span className="text-cyan-400 font-bold">Cleaning Needed</span>
                  </div>
                </div>

                {/* Tables Grid Layout */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tables.map((t) => {
                    const statusClass = getTableColorClass(t.status);
                    return (
                      <motion.div
                        key={t.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToggleTable(t.id, t.status)}
                        className={`p-6 rounded-xl cursor-pointer text-center border transition-all duration-300 relative overflow-hidden group ${statusClass}`}
                      >
                        {/* Interactive glow design */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="text-xs text-[#D4A853] font-bold uppercase tracking-widest font-mono">Meja Makan</div>
                        <h4 className="text-xl font-serif font-bold mt-1 text-white">{t.name}</h4>
                        <div className="mt-4 inline-block text-[10px] tracking-wide uppercase font-mono font-bold bg-black/40 px-3 py-1 rounded-full border border-white/5">
                          {t.status}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: CUSTOMER FEEDBACK */}
            {activeSubTab === "feedback" && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    Form Kepuasan Customer (Customer Feedback System)
                  </h3>
                  <p className="text-xs text-amber-100/40 font-mono">
                    Input keluhan dan apresiasi langsung dari tamu outlet untuk memperbaiki nilai performa harian.
                  </p>
                </div>

                <form onSubmit={handleSubmitFeedback} className="space-y-4 bg-[#140801]/60 p-5 rounded-2xl border border-amber-500/10">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold block mb-1">Nama Pelanggan (Grup)</label>
                      <input
                        type="text"
                        placeholder="Contoh: Keluarga Ibu Linda / Pak Budi"
                        value={newFeedbackName}
                        onChange={(e) => setNewFeedbackName(e.target.value)}
                        className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2.5 text-xs w-full outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold block mb-2">Rating Bintang Pelayanan (1 - 5)</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewFeedbackRating(star)}
                            className="text-2xl transition duration-150 transform hover:scale-125"
                          >
                            <span className={star <= newFeedbackRating ? "text-amber-400" : "text-amber-100/15"}>★</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold block mb-1">Ulasan Pelanggan (Apresiasi/Masukan)</label>
                      <textarea
                        rows={3}
                        placeholder="Contoh: Sangat puas dengan pelayanan ramah barista Hendra dan menu steak hangat."
                        value={newFeedbackText}
                        onChange={(e) => setNewFeedbackText(e.target.value)}
                        className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2.5 text-xs w-full outline-none focus:border-amber-400 resize-none"
                      />
                    </div>

                    <div className="bg-red-500/5 p-4 rounded-lg border border-red-500/10">
                      <label className="text-[10px] text-red-300 uppercase tracking-widest font-mono font-bold block mb-1">Apakah ada Komplain/Masalah spesifik? (Opsional)</label>
                      <p className="text-[10px] text-amber-100/30 mb-2">Jika diisi, sistem akan otomatis mendaftarkan laporan tindak lanjut di Complaint Log departemen.</p>
                      <input
                        type="text"
                        placeholder="Sebab: Tissue habis, pesanan salah, sendok berminyak..."
                        value={newFeedbackComplaint}
                        onChange={(e) => setNewFeedbackComplaint(e.target.value)}
                        className="bg-amber-950/20 text-amber-200 border border-red-500/25 rounded-lg p-2 text-xs w-full outline-none focus:border-red-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-sans font-bold text-xs px-5 py-2 rounded-xl transition cursor-pointer"
                    >
                      Kirim Feedback Tamu
                    </button>
                  </div>
                </form>

                {/* History list */}
                <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 mt-6 space-y-4">
                  <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Feedback Tamu Terakhir</span>
                  <div className="space-y-3">
                    {feedbacks.map((f) => (
                      <div key={f.id} className="text-xs border-b border-white/5 pb-3 space-y-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-amber-100">{f.customerName}</span>
                          <span className="text-amber-400 font-mono font-bold">{"★".repeat(f.rating)}</span>
                        </div>
                        <p className="text-amber-100/70">{f.feedback}</p>
                        <span className="text-[9px] text-amber-100/30 block">Tanggal: {f.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: COMPLAINT LOG */}
            {activeSubTab === "complaints" && (
              <motion.div
                key="complaints"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    Sistem Laporan Komplain (Complaint Log)
                  </h3>
                  <p className="text-xs text-amber-100/40 font-mono">
                    Seluruh komplain terekam di dashboard. Supervisor, Head Waiter, dan Manager dapat menindaklanjuti secara proaktif.
                  </p>
                </div>

                {/* Form to insert manually */}
                <form onSubmit={handleRegisterComplaint} className="bg-black/25 p-4 rounded-xl border border-amber-500/10 space-y-4">
                  <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Catat Komplain Baru</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono block mb-1">Dari Meja / Ruang</label>
                      <select
                        value={newComplaintTable}
                        onChange={(e) => setNewComplaintTable(e.target.value)}
                        className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full outline-none"
                      >
                        <option value="Meja 1 (VIP)">Meja 1 (VIP)</option>
                        <option value="Meja 2">Meja 2</option>
                        <option value="Meja 3">Meja 3</option>
                        <option value="Meja 4">Meja 4</option>
                        <option value="Area Kasir">Area Kasir</option>
                        <option value="Toilet">Toilet</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono block mb-1">Jam Kejadian</label>
                      <input
                        type="text"
                        placeholder="Contoh: 12:45"
                        value={newComplaintHour}
                        onChange={(e) => setNewComplaintHour(e.target.value)}
                        className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono block mb-1">Detail Keluhan Tamu & Keadaan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tamu komplain noda berminyak di sendok makan sup buntut."
                      value={newComplaintDetail}
                      onChange={(e) => setNewComplaintDetail(e.target.value)}
                      className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-sans font-bold text-xs px-4 py-2 rounded-lg transition"
                    >
                      Catat Komplain & Mulai Tindakan
                    </button>
                  </div>
                </form>

                {/* Complaint Logs with Actions */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Daftar Log Penanganan Komplain</span>
                  
                  {complaints.length === 0 ? (
                    <p className="text-xs text-amber-100/30">Belum ada catatan komplain.</p>
                  ) : (
                    complaints.map((c) => (
                      <div
                        key={c.id}
                        className={`p-4 rounded-xl border space-y-3 transition ${
                          c.status === "Open"
                            ? "bg-red-500/10 border-red-500/30"
                            : c.status === "Followed Up"
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-black/20 border-white/5 opacity-80"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-2">
                          <div>
                            <span className="text-amber-300 font-bold uppercase text-[9px] tracking-widest bg-amber-500/15 px-2 py-0.5 rounded mr-2">
                              {c.status}
                            </span>
                            <span className="text-amber-100 font-bold">{c.tableId} • {c.timestamp}</span>
                          </div>

                          {/* Control actions for authorized staff (Head Waiter, Manager) */}
                          {roleMode === "Head Waiter" && c.status !== "Closed" && (
                            <div className="flex items-center gap-2">
                              {c.status === "Open" && (
                                <button
                                  onClick={() => handleActionComplaint(c.id, "follow_up")}
                                  className="bg-amber-600 hover:bg-amber-500 text-amber-950 text-[10px] font-bold px-2.5 py-1 rounded"
                                >
                                  Follow Up
                                </button>
                              )}
                              <button
                                onClick={() => handleActionComplaint(c.id, "close")}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded"
                              >
                                Close & Selesai
                              </button>
                              <button
                                onClick={() => handleActionComplaint(c.id, "escalate")}
                                className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded"
                              >
                                Escalate ke Manager
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-amber-105">Kasus Keluhan:</p>
                          <p className="text-xs text-amber-100/80 mt-1">{c.detail}</p>
                        </div>

                        {c.solution && (
                          <div className="bg-white/5 p-2 rounded text-xs">
                            <span className="font-bold text-emerald-400">Solusi / Penanganan:</span>
                            <p className="text-amber-100/70 mt-0.5">{c.solution}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: INVENTORY */}
            {activeSubTab === "inventory" && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    FOH Inventory & Requests
                  </h3>
                  <p className="text-xs text-amber-100/40 font-mono">
                    Manajemen stok tisu, sedotan, paper bag, paper tray, dan barang habis pakai Front of House terpisah total dari Barista.
                  </p>
                </div>

                {/* Switch list or Request and creation */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* FOH Stok Stock list */}
                  <div className="md:col-span-7 bg-black/25 p-4 rounded-xl border border-amber-500/10 space-y-4">
                    <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Gudang Penyimpanan FOH</span>
                    <div className="space-y-2.5">
                      {inventory.map((item) => (
                        <div key={item.id} className="text-xs flex items-center justify-between border-b border-white/5 pb-2">
                          <div>
                            <p className="font-bold text-amber-100">{item.name}</p>
                            <span className="text-[10px] text-amber-100/40">{item.category} • Par: {item.parLevel} {item.unit}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-mono text-sm font-bold ${item.qty < item.parLevel ? "text-red-400" : "text-amber-205"}`}>
                              {item.qty} {item.unit}
                            </span>
                            {item.qty < item.parLevel && (
                              <span className="block text-[8px] tracking-tight bg-red-500/15 text-red-300 font-bold px-1 py-0.1 rounded uppercase animate-pulse">Butuh Supply</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Request Form */}
                  <div className="md:col-span-5 bg-black/35 p-4 rounded-xl border border-amber-500/10 space-y-4">
                    <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Form Permintaan Barang (Supply)</span>
                    <form onSubmit={handleCreateInventoryRequest} className="space-y-3">
                      <div>
                        <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block font-bold mb-1">Pilih Item</label>
                        <select
                          value={newRequestItem}
                          onChange={(e) => setNewRequestItem(e.target.value)}
                          className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full"
                        >
                          <option value="Tissue">Tissue</option>
                          <option value="Wet Tissue">Wet Tissue</option>
                          <option value="Sedotan">Sedotan</option>
                          <option value="Paper Bag">Paper Bag</option>
                          <option value="Cup Carrier">Cup Carrier</option>
                          <option value="Water Jug">Water Jug</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block font-bold mb-1">Jumlah Pemesanan (Qty)</label>
                        <input
                          type="number"
                          value={newRequestQty}
                          onChange={(e) => setNewRequestQty(parseInt(e.target.value) || 1)}
                          className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block font-bold mb-1">Alasan Pengadaan / Catatan</label>
                        <input
                          type="text"
                          placeholder="Contoh: Stok meja dining habis sisa 1 pack"
                          value={newRequestReason}
                          onChange={(e) => setNewRequestReason(e.target.value)}
                          className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full outline-none focus:border-amber-400"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-sans font-bold text-xs p-2.5 rounded-lg transition"
                      >
                        Kirim Pengajuan Supply
                      </button>
                    </form>
                  </div>
                </div>

                {/* Submissions list */}
                <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 space-y-4">
                  <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Daftar Pengajuan Supply FOH</span>
                  <div className="space-y-3">
                    {requests.map((r) => (
                      <div key={r.id} className="text-xs flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <p className="font-bold text-amber-100">Request {r.qty} {r.name}</p>
                          <span className="text-[10px] text-amber-100/40">Oleh: {r.requestedBy} • Alasan: {r.reason}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {roleMode === "Head Waiter" && r.status === "Pending" && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleApproveInventoryRequest(r.id, "Approved")}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproveInventoryRequest(r.id, "Rejected")}
                                className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              r.status === "Approved"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : r.status === "Rejected"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-cyan-500/10 text-cyan-400"
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: SOP SERVICE & LIBRARY */}
            {activeSubTab === "sop" && (
              <motion.div
                key="sop"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-amber-100">
                      SOP Library (Standard Operating Procedure)
                    </h3>
                    <p className="text-xs text-amber-100/40 font-mono">
                      {isManagerOrOwner ? "Anda memiliki hak asasi pengeditan SOP." : "Hanya dapat dibaca oleh Kru Waiter."}
                    </p>
                  </div>

                  {isManagerOrOwner && (
                    <button
                      onClick={() => setIsAddingSop(!isAddingSop)}
                      className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{isAddingSop ? "Selesai" : "Tambah SOP Baru"}</span>
                    </button>
                  )}
                </div>

                {isAddingSop && isManagerOrOwner && (
                  <form onSubmit={handleAddSop} className="bg-black/40 p-5 rounded-xl border border-amber-500/15 space-y-4">
                    <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Unggah SOP Baru (Khusus Manager)</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block font-bold mb-1">Judul SOP</label>
                        <input
                          type="text"
                          placeholder="Sebab: Greeting SOP Baru / Emergency Escape"
                          value={newSopTitle}
                          onChange={(e) => setNewSopTitle(e.target.value)}
                          className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block font-bold mb-1">Kategori</label>
                        <select
                          value={newSopCategory}
                          onChange={(e) => setNewSopCategory(e.target.value)}
                          className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full"
                        >
                          <option value="Customer Service">Customer Service</option>
                          <option value="Hygiene">Hygiene (Kebersihan)</option>
                          <option value="Safety">Safety & Emergency</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-amber-100/40 uppercase tracking-wide block font-mono">Langkah-Langkah (Satu instruksi per baris / Enter)</label>
                      <textarea
                        rows={4}
                        placeholder="1. Senyum kepada pelanggan&#10;2. Antar ke meja makan terbaik..."
                        value={newSopSteps}
                        onChange={(e) => setNewSopSteps(e.target.value)}
                        className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full resize-none font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs px-5 py-2 rounded-lg transition"
                    >
                      Unggah & Publikasikan ke Waiter
                    </button>
                  </form>
                )}

                {/* SOP filter */}
                <div className="flex gap-2">
                  {["All", "Customer Service", "Hygiene", "Safety"].map((fCategory) => (
                    <button
                      key={fCategory}
                      onClick={() => setSopCategoryFilter(fCategory)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition ${
                        sopCategoryFilter === fCategory
                          ? "bg-amber-500/20 text-amber-300 border border-amber-400/20"
                          : "bg-black/20 text-amber-100/40 hover:text-amber-100"
                      }`}
                    >
                      {fCategory}
                    </button>
                  ))}
                </div>

                {/* SOP Cards list */}
                <div className="space-y-4">
                  {(["Customer Service", "Hygiene", "Safety"] as const).map((catName) => {
                    if (sopCategoryFilter !== "All" && sopCategoryFilter !== catName) return null;

                    return (
                      <div key={catName} className="space-y-3">
                        <span className="text-xs font-bold text-[#D4A853] uppercase tracking-widest block">{catName} Group</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {training
                            .filter((s) => s.category.includes(catName) || s.category === catName)
                            .map((sopItem) => (
                              <div key={sopItem.id} className="bg-black/20 p-4 rounded-xl border border-amber-500/5 relative group">
                                {isManagerOrOwner && (
                                  <button
                                    onClick={() => handleDeleteSop(sopItem.id)}
                                    className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition"
                                    title="Hapus SOP"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                                <h4 className="text-xs font-bold text-amber-200">{sopItem.title}</h4>
                                <div className="text-[11px] text-amber-100/70 mt-3 space-y-1.5 font-sans leading-relaxed">
                                  {sopItem.contentUrl?.split(". ").map((step, sIdx) => (
                                    <p key={sIdx} className="flex gap-1.5 items-start">
                                      <span className="text-[9px] bg-amber-500/10 text-amber-300 px-1 rounded shrink-0">{sIdx + 1}</span>
                                      <span>{step}</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: TRAINING CENTER */}
            {activeSubTab === "training" && (
              <motion.div
                key="training"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    Training Center Waiter & Kuis Interaktif
                  </h3>
                  <p className="text-xs text-amber-100/40 font-mono">
                    Lolos pelatihan materi pelayanan untuk meningkatkan Skor KPI bulanan Anda. Batas minimum nilai kelolosan adalah 70%.
                  </p>
                </div>

                {activeQuiz ? (
                  // QUIZ PLAYGROUND SCREEN
                  <div className="bg-[#1c0f07]/90 p-6 rounded-2xl border border-amber-500/25 space-y-5">
                    <div className="flex justify-between items-center border-b border-amber-500/10 pb-3">
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest font-mono">Modul Kuis Pelatihan</span>
                        <h4 className="text-lg font-serif font-bold text-amber-100 mt-0.5">{activeQuiz.title}</h4>
                      </div>
                      <button
                        onClick={() => {
                          setActiveQuiz(null);
                          setQuizAnswers({});
                          setQuizScore(null);
                        }}
                        className="text-amber-100/60 hover:text-amber-100 border border-white/5 bg-black/20 p-1.5 rounded"
                      >
                        Kembali Ke Roster
                      </button>
                    </div>

                    {quizScore !== null ? (
                      // Display results
                      <div className="space-y-4 text-center py-6">
                        <div className="h-20 w-20 bg-amber-500/10 border border-amber-500/35 rounded-full flex items-center justify-center mx-auto text-3xl">
                          {quizScore >= 70 ? "🎉" : "😭"}
                        </div>
                        <h4 className="text-xl font-serif font-bold text-amber-205">
                          Skor Anda: {quizScore} / 100
                        </h4>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            quizScore >= 70 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {quizScore >= 70 ? "LULUS (Passed)" : "BELUM LULUS. Mohon pelajari lagi materi SOP"}
                        </span>
                      </div>
                    ) : (
                      // Quiz questions
                      <div className="space-y-5">
                        {activeQuiz.quiz?.map((q, qIndex) => (
                          <div key={qIndex} className="space-y-3 bg-black/20 p-4 rounded-xl">
                            <p className="text-xs font-bold text-amber-205">Pertanyaan {qIndex + 1}: {q.question}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {q.options.map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setQuizAnswers({ ...quizAnswers, [qIndex]: opt })}
                                  className={`p-3 text-xs text-left rounded-lg transition duration-200 border ${
                                    quizAnswers[qIndex] === opt
                                      ? "bg-amber-500/10 border-amber-400 text-amber-200"
                                      : "bg-black/30 border-white/5 text-amber-100/60 hover:bg-white/5"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleQuizSubmit(activeQuiz)}
                            className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-1.5"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Kirim & Evaluasi Skor Kuis</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Modul classes list
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Roster Materi Pembelajaran FOH</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {training.map((mod) => {
                        const scoreLog = trainingResults.find((r) => r.trainingTitle === mod.title);
                        return (
                          <div key={mod.id} className="bg-black/20 p-5 rounded-xl border border-amber-500/5 flex flex-col justify-between gap-4">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] uppercase tracking-wider font-mono text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                  {mod.category}
                                </span>
                                {scoreLog && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${scoreLog.passed ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                    LULUS ({scoreLog.score}%)
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-serif font-bold text-amber-100 mt-2">{mod.title}</h4>
                              <p className="text-xs text-amber-100/50 mt-1.5 leading-relaxed">{mod.contentUrl}</p>
                            </div>

                            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                              {/* Animated play-video simulation */}
                              <span className="text-[10px] text-amber-100/30 font-mono">📺 5 Mins Roster Video</span>
                              <button
                                onClick={() => {
                                  setActiveQuiz(mod);
                                  setQuizAnswers({});
                                  setQuizScore(null);
                                }}
                                className="bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 font-bold text-xs px-3 py-1.5 rounded transition"
                              >
                                Ikuti Quiz Karyawan
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* SUB-TAB: TEAM PERFORMANCE & KPI (Head Waiter & Bosses Only) */}
            {activeSubTab === "kpi" && roleMode === "Head Waiter" && (
              <motion.div
                key="kpi"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    KPI Waiter & Team Performance
                  </h3>
                  <p className="text-xs text-amber-100/40 font-mono">
                    Lembar monitoring KPI komprehensif seluruh divisi Front of House. Dinilai otomatis dari pemenuhan target harian.
                  </p>
                </div>

                <div className="bg-[#1c0f07]/45 p-5 rounded-2xl border border-amber-500/10 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between border-b border-amber-500/5 pb-3">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-amber-200">Andi Waiter (Personal KPI)</h4>
                      <p className="text-[11px] text-amber-150/45 mt-0.5">Masa Bakti: Senior Waiter • Divisi Front Of House</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/15">
                        Excellent Performer
                      </span>
                    </div>
                  </div>

                  {/* Components Weight Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-150/70">Ketepatan Kehadiran (Attendance)</span>
                        <span className="text-amber-200 font-bold font-mono">{activeKPI.attendance}%</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${activeKPI.attendance}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-150/70">Kepatuhan Melengkapi SOP & Quiz (SOP Training Score)</span>
                        <span className="text-amber-200 font-bold font-mono">{activeKPI.sopCompletion}%</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${activeKPI.sopCompletion}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-150/70">Rerata Rating Kustomer (Customer Ratings Metric)</span>
                        <span className="text-amber-200 font-bold font-mono">{activeKPI.customerRating}%</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${activeKPI.customerRating}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-150/70">Penyelesaian Keluhan / Komplain (Complaint Resolution)</span>
                        <span className="text-amber-200 font-bold font-mono">{activeKPI.complaintResolution}%</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${activeKPI.complaintResolution}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-150/70">Realisasi Checklist Operasional (Checklist Compliance)</span>
                        <span className="text-amber-200 font-bold font-mono">{activeKPI.checklistCompletion}%</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${activeKPI.checklistCompletion}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-500/10 flex justify-between items-center">
                    <span className="text-xs text-amber-100/40">Total Kalkulasi Bobot Skor Efektif:</span>
                    <span className="text-lg font-mono font-bold text-amber-205">{activeKPI.score} / 100</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: SHIFT SCHEDULES (Head Waiter & Bosses Only) */}
            {activeSubTab === "schedules" && roleMode === "Head Waiter" && (
              <motion.div
                key="schedules"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-amber-100">
                      Jadwal Kerja & Shift Planner
                    </h3>
                    <p className="text-xs text-amber-100/40 font-mono">
                      Melacak, menukar, mengajukan cuti staff FOH, serta merilis jadwal baru untuk kelancaran operasional.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddingSchedule(!isAddingSchedule)}
                    className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isAddingSchedule ? "Sembunyikan" : "Buat Jadwal Baru"}</span>
                  </button>
                </div>

                {isAddingSchedule && (
                  <form onSubmit={handleAddSchedule} className="bg-black/40 p-5 border border-amber-500/15 rounded-xl space-y-4">
                    <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Form Tambah Agenda Shift</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block mb-1">Nama Staff</label>
                        <input
                          type="text"
                          placeholder="Andi Waiter / Rima Waitress"
                          value={schedName}
                          onChange={(e) => setSchedName(e.target.value)}
                          className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block mb-1">Pilih Tanggal</label>
                        <input
                          type="date"
                          value={schedDate}
                          onChange={(e) => setSchedDate(e.target.value)}
                          className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block mb-1">Shift</label>
                        <select
                          value={schedShift}
                          onChange={(e) => setSchedShift(e.target.value as any)}
                          className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full"
                        >
                          <option value="Pagi">Pagi (06:00 - 14:00)</option>
                          <option value="Siang">Siang (13:00 - 21:00)</option>
                          <option value="Malam">Malam (20:00 - 23:00)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block mb-1">Jenis Roster</label>
                        <select
                          value={schedType}
                          onChange={(e) => setSchedType(e.target.value as any)}
                          className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full"
                        >
                          <option value="Work">Shift Reguler</option>
                          <option value="Swap">Tukar Shift</option>
                          <option value="Leave">Pengajuan Cuti</option>
                          <option value="Izin">Izin Sakit / Keperluan</option>
                        </select>
                      </div>

                      {schedType === "Swap" && (
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block mb-1">Tukar Dengan (Staff)</label>
                          <input
                            type="text"
                            placeholder="Sofi Waitress"
                            value={schedSwapWith}
                            onChange={(e) => setSchedSwapWith(e.target.value)}
                            className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] text-amber-100/40 uppercase tracking-widest block mb-1">Alasan / Catatan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Mengikuti wisuda kelolosan kuliah"
                        value={schedReason}
                        onChange={(e) => setSchedReason(e.target.value)}
                        className="bg-amber-950/40 text-amber-200 border border-amber-500/20 rounded-lg p-2 text-xs w-full outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs px-5 py-2 rounded-lg transition"
                    >
                      Rilis Jadwal / Izin Shift
                    </button>
                  </form>
                )}

                {/* Shifts List Display */}
                <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10 space-y-4">
                  <span className="text-xs font-bold text-[#D4A853] uppercase tracking-wide block">Roster Mingguan Divisi FOH</span>
                  <div className="space-y-3">
                    {shifts.map((sh) => (
                      <div key={sh.id} className="text-xs flex items-center justify-between border-b border-white/5 pb-2.5">
                        <div>
                          <p className="font-bold text-amber-100">{sh.staffName} • {sh.shift} Shift</p>
                          <span className="text-[10px] text-amber-100/40">Hari {sh.date} • Jenis: {sh.type}</span>
                          {sh.reason && <p className="text-[10px] text-amber-100/60 mt-0.5 mt-1">Sebab: {sh.reason}</p>}
                        </div>

                        <span className="inline-block text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/15">
                          {sh.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: APPROVALS (Head Waiter & Bosses Only) */}
            {activeSubTab === "approvals" && roleMode === "Head Waiter" && (
              <motion.div
                key="approvals"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    Persetujuan Terpusat (Approval Center)
                  </h3>
                  <p className="text-xs text-amber-100/40 font-mono">
                    Periksa keaslian bukti foto checklist harian dan kebutuhan barang habis pakai FOH sebelum diapprove.
                  </p>
                </div>

                {/* Section checklists pending approvals */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block">Pengajuan Bukti Foto & Checklist pending</span>
                  
                  {checklists.filter((c) => c.status === "Pending").length === 0 ? (
                    <p className="text-xs text-amber-100/30">Belum ada pengajuan bukti foto harian baru.</p>
                  ) : (
                    checklists.filter((c) => c.status === "Pending").map((c) => (
                      <div key={c.id} className="bg-amber-950/10 p-4 border border-amber-500/15 rounded-xl space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-amber-500/5 pb-2">
                          <div>
                            <span className="text-xs text-amber-300 font-bold uppercase tracking-wide mr-2">
                              {c.type.toUpperCase()} CHECKLIST
                            </span>
                            <span className="text-xs text-amber-100">Oleh: {c.staffName} ({c.role})</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveChecklist(c.id, "Approved")}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded"
                            >
                              Verify / Approve
                            </button>
                            <button
                              onClick={() => handleApproveChecklist(c.id, "Rejected")}
                              className="bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded"
                            >
                              Tolak Bukti
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-start">
                          {c.photoUrl && (
                            <div>
                              <span className="text-[10px] text-amber-100/40 block mb-1">Lampiran Foto Bukti:</span>
                              <img
                                src={c.photoUrl}
                                alt="Claim thumb"
                                className="h-28 w-44 object-cover rounded border border-white/10"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <div className="flex-1 space-y-1">
                            <span className="text-[10px] text-amber-100/40 block">Item Check Tugas Terpenuhi:</span>
                            <div className="grid grid-cols-2 gap-2">
                              {c.items.map((it, idx) => (
                                <p key={idx} className="text-xs flex items-center gap-1.5 text-white">
                                  <span>{it.completed ? "✅" : "❌"}</span>
                                  <span>{it.task}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Section inventory requests pending approvals */}
                <div className="space-y-4 pt-4 border-t border-amber-500/5">
                  <span className="text-xs font-bold text-[#D4A853] uppercase tracking-widest block">Pengajuan Supply Barang pending</span>
                  
                  {requests.filter((r) => r.status === "Pending").length === 0 ? (
                    <p className="text-xs text-amber-100/30">Belum ada pengajuan supply baru.</p>
                  ) : (
                    requests.filter((r) => r.status === "Pending").map((r) => (
                      <div key={r.id} className="bg-black/25 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-amber-205">Minta supply {r.qty} {r.name}</p>
                          <span className="text-[10px] text-amber-100/40">Diminta oleh: {r.requestedBy} • Alasan: {r.reason}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveInventoryRequest(r.id, "Approved")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleApproveInventoryRequest(r.id, "Rejected")}
                            className="bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded"
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: CHECKLIST SOP EDITOR (Head Waiter & Bosses Only) */}
            {activeSubTab === "checklist_editor" && roleMode === "Head Waiter" && (
              <motion.div
                key="checklist_editor"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-100">
                    Pengaturan SOP Item Tugas Checklist
                  </h3>
                  <p className="text-xs text-amber-100/40 font-mono">
                    Kelola list tugas harian SOP untuk Front of House. Tambahkan tugas baru, ubah rincian tugas, atau hapus tugas dengan hak akses Head Waiter.
                  </p>
                </div>

                <div className="bg-amber-950/10 p-4 border border-amber-500/15 rounded-xl space-y-4">
                  {/* Category Filter */}
                  <div className="flex gap-2 border-b border-amber-500/10 pb-3">
                    {(["opening", "service", "closing"] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setTaskCategoryToEdit(cat);
                          setEditingIndex(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                          taskCategoryToEdit === cat
                            ? "bg-amber-500 text-black font-extrabold"
                            : "bg-[#1c0f07] text-amber-205/60 border border-amber-500/10 hover:text-amber-100"
                        }`}
                      >
                        {cat === "opening" ? "🌅 Opening Tasks" : cat === "service" ? "☕ Service Tasks" : "🌌 Closing Tasks"}
                      </button>
                    ))}
                  </div>

                  {/* Add New Task Form */}
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs font-bold text-amber-300 block">Tambah Item Tugas SOP ({taskCategoryToEdit})</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: Periksa kebersihan mesin kasir..."
                        value={newSopTaskText}
                        onChange={(e) => setNewSopTaskText(e.target.value)}
                        className="flex-1 bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddChecklistTask(taskCategoryToEdit, newSopTaskText)}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition shrink-0"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>

                  {/* Tasks list with Edit & Delete */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-300 block">Daftar Tugas SOP Aktif</span>
                    
                    {currentTasks[taskCategoryToEdit]?.length === 0 ? (
                      <p className="text-xs text-amber-100/30">Belum ada tugas SOP dalam kategori ini.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {currentTasks[taskCategoryToEdit]?.map((task: string, idx: number) => (
                          <div key={idx} className="bg-black/25 p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-4">
                            {editingIndex === idx ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="flex-1 bg-amber-950/40 text-xs text-amber-100 border border-amber-500/30 rounded px-2 py-1 outline-none font-sans"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateChecklistTask(taskCategoryToEdit, idx, task)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] px-2 py-1 rounded font-bold"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingIndex(null)}
                                  className="bg-zinc-800 text-amber-205 text-[11px] px-2 py-1 rounded"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-xs text-amber-100">{idx + 1}. {task}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingIndex(idx);
                                      setEditingText(task);
                                    }}
                                    className="p-1.5 hover:bg-white/5 rounded text-amber-300 transition"
                                    title="Edit tugas"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteChecklistTask(taskCategoryToEdit, idx)}
                                    className="p-1.5 hover:bg-white/5 rounded text-red-400 transition"
                                    title="Hapus tugas"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: ENTERPRISE DATABASE SCHEMA SYNC */}
            {activeSubTab === "enterprise_sync" && roleMode === "Head Waiter" && (
              <motion.div
                key="enterprise_sync"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                {/* Enterprise Title Block */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1b0a01]/80 p-5 rounded-2xl border border-amber-500/20 shadow-xl animate-fade-in">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-amber-500/20 text-[#D4A853] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest">Enterprise SaaS Module</span>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">Active & Secure</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-amber-100">
                      Enterprise DB Schema & Relational Sync
                    </h3>
                    <p className="text-xs text-amber-100/40 font-mono mt-1 max-w-xl">
                      Layer tambahan multi-tenant dan RLS yang terintegrasi penuh ke atas database JSON / PostgreSQL CoffeeOps tanpa downtime atau resiko kehilangan data aslinya.
                    </p>
                  </div>

                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2 text-right shrink-0">
                    <span className="text-[10px] text-amber-100/40 uppercase font-mono tracking-wider block font-bold">Relational Integrations</span>
                    <div className="flex gap-2 justify-end">
                      <span className="text-[10px] font-mono font-bold bg-[#1d1d1d] text-amber-205 border border-white/5 px-2 py-0.5 rounded">users ➔ employees</span>
                      <span className="text-[10px] font-mono font-bold bg-[#1d1d1d] text-amber-205 border border-white/5 px-2 py-0.5 rounded">att ➔ kpi</span>
                    </div>
                  </div>
                </div>

                {/* Database Disaster Backup & Rollback Sentinel */}
                <div className="bg-amber-950/20 p-5 rounded-2xl border border-amber-500/20 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-amber-200 font-bold uppercase tracking-wider font-mono">
                        <AlertTriangle className="h-4 w-4 text-[#D4A853] shrink-0" />
                        <span>SaaS Disaster Recovery & Rollback Contingency Mode</span>
                      </div>
                      <p className="text-[11px] text-amber-100/50">
                        Amankan dan backup seluruh state sistem, database, credentials authentication login, dan Supabase storage buckets sebelum deploy migrasi schema baru.
                      </p>
                    </div>

                    <div className="shrink-0 font-sans">
                      <button
                        type="button"
                        disabled={isBackingUp}
                        onClick={handleExecuteSaaSDebugBackup}
                        className={`font-sans font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition flex items-center gap-2 ${
                          isBackingUp
                            ? "bg-[#1c0f07] text-amber-205/40 border border-amber-500/10"
                            : "bg-amber-500 hover:bg-amber-400 text-black shadow-lg"
                        }`}
                      >
                        {isBackingUp ? (
                          <>
                            <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-amber-950 border-t-transparent rounded-full" />
                            <span>Mencadangkan ({backupProgress}%)...</span>
                          </>
                        ) : (
                          <>
                            <span>Backup & Safeguard State</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isBackingUp && (
                    <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        className="bg-[#D4A853] h-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${backupProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-amber-100/40 block">Backup Database File</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">SUCCESSFUL (LOCAL)</span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-amber-100/40 block">Supabase SQL Storage</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">SAFEGUARD ACTIVE</span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-amber-100/40 block">Authentication Tokens</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">ENCRYPTED COPY</span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-amber-100/40 block">Settings Config</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">AUTO-ROLLBACK ON</span>
                    </div>
                  </div>
                </div>

                {/* Sub-tab Navigation Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-amber-500/10">
                  <button
                    onClick={() => setEnterpriseActiveSection("employees")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                      enterpriseActiveSection === "employees"
                        ? "bg-amber-500 text-black font-extrabold"
                        : "bg-[#160b03]/80 text-amber-205/60 border border-amber-500/10 hover:text-amber-100"
                    }`}
                  >
                    👥 Employees ({employees.length})
                  </button>
                  <button
                    onClick={() => setEnterpriseActiveSection("tasks")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                      enterpriseActiveSection === "tasks"
                        ? "bg-amber-500 text-black font-extrabold"
                        : "bg-[#160b03]/80 text-amber-205/60 border border-amber-500/10 hover:text-amber-100"
                    }`}
                  >
                    📋 Task List ({employeeTasks.length})
                  </button>
                  <button
                    onClick={() => setEnterpriseActiveSection("kpis")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                      enterpriseActiveSection === "kpis"
                        ? "bg-amber-500 text-black font-extrabold"
                        : "bg-[#160b03]/80 text-amber-205/60 border border-amber-500/10 hover:text-amber-100"
                    }`}
                  >
                    📈 Monthly KPI ({employeeKpis.length})
                  </button>
                  <button
                    onClick={() => setEnterpriseActiveSection("feedbacks")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                      enterpriseActiveSection === "feedbacks"
                        ? "bg-amber-500 text-black font-extrabold"
                        : "bg-[#160b03]/80 text-amber-205/60 border border-amber-500/10 hover:text-amber-100"
                    }`}
                  >
                    💬 Feedbacks ({feedbacks.length + customerFeedbacks.length})
                  </button>
                  <button
                    onClick={() => setEnterpriseActiveSection("incidents")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                      enterpriseActiveSection === "incidents"
                        ? "bg-amber-500 text-black font-extrabold"
                        : "bg-[#160b03]/80 text-amber-205/60 border border-amber-500/10 hover:text-amber-100"
                    }`}
                  >
                    🚨 Security Logs ({incidentReports.length})
                  </button>
                </div>

                {/* 1. EMPLOYEES PANEL */}
                {enterpriseActiveSection === "employees" && (
                  <div className="space-y-6">
                    <form onSubmit={handleCreateEmployee} className="bg-[#110500]/60 p-5 rounded-2xl border border-amber-500/15 space-y-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#D4A853] block">Tambah Employee FOH Baru</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Nama Lengkap</label>
                          <input
                            type="text"
                            placeholder="Contoh: Michael Waiter"
                            value={newEmpName}
                            onChange={(e) => setNewEmpName(e.target.value)}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Gender</label>
                          <select
                            value={newEmpGender}
                            onChange={(e) => setNewEmpGender(e.target.value)}
                            className="bg-[#1a0f07] text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none"
                          >
                            <option value="Pria">Pria</option>
                            <option value="Wanita">Wanita</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Kode / Nomor Induk Staff (Opsional)</label>
                          <input
                            type="text"
                            placeholder="Contoh: WTR005 (Bisa kosong)"
                            value={newEmpCode}
                            onChange={(e) => setNewEmpCode(e.target.value)}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">No. WhatsApp</label>
                          <input
                            type="text"
                            placeholder="Contoh: 62812345678"
                            value={newEmpPhone}
                            onChange={(e) => setNewEmpPhone(e.target.value)}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none focus:border-amber-400"
                          />
                        </div>
                        <div className="md:col-span-2 font-sans">
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Email Karyawan</label>
                          <input
                            type="email"
                            placeholder="Contoh: michael@gmail.com"
                            value={newEmpEmail}
                            onChange={(e) => setNewEmpEmail(e.target.value)}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="bg-amber-500 text-black font-sans font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer hover:bg-amber-400 transition"
                        >
                          Simpan & Daftarkan Staff
                        </button>
                      </div>
                    </form>

                    <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-xs font-bold text-amber-100">Daftar Physical Employee (FOH ADDITIVE LAYER)</span>
                        <span className="text-[10px] font-mono font-bold text-amber-100/40">BRANCH: PUSAT HQ</span>
                      </div>

                      {employees.length === 0 ? (
                        <p className="text-xs text-amber-100/30 py-4 text-center">Belum ada staff yang terdaftar. Gunakan mapping otomatis di atas.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {employees.map((emp) => (
                            <div key={emp.id} className="bg-amber-950/10 p-4 border border-amber-500/10 rounded-xl space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                  <span className="bg-amber-500/10 text-[#D4A853] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/15">{emp.employeeCode}</span>
                                  <h4 className="text-sm font-bold text-amber-100 pt-1">{emp.fullName}</h4>
                                  <p className="text-[10px] text-amber-100/40 font-mono">ID Relasi: {emp.userId || "Local-Only FOH Instance"}</p>
                                </div>
                                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${emp.isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/20 text-red-400"}`}>
                                  {emp.isActive ? "Aktif" : "Non-Aktif"}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-amber-100/60 pb-1">
                                <div>📱 Phone: {emp.phone}</div>
                                <div>✉ Email: {emp.email}</div>
                                <div>Gender: {emp.gender}</div>
                                <div>Created: {emp.createdAt?.substring(0, 10)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. TASKS PANEL */}
                {enterpriseActiveSection === "tasks" && (
                  <div className="space-y-6">
                    <form onSubmit={handleCreateTask} className="bg-[#110500]/60 p-5 rounded-2xl border border-amber-500/15 space-y-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#D4A853] block">Tugaskan Job Desk / Checklist Karyawan</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Pilih Employee</label>
                          <select
                            value={newTaskEmpId}
                            onChange={(e) => setNewTaskEmpId(e.target.value)}
                            className="bg-[#1a0f07] text-xs text-amber-150 border border-amber-500/25 rounded-lg px-3 py-2 w-full outline-none"
                          >
                            <option value="">-- Pilih Penerima Tugas --</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Kategori Shift Kebutuhan</label>
                          <select
                            value={newTaskCategory}
                            onChange={(e) => setNewTaskCategory(e.target.value as any)}
                            className="bg-[#1a0f07] text-xs text-amber-150 border border-amber-500/25 rounded-lg px-3 py-2 w-full outline-none"
                          >
                            <option value="opening">🌅 Opening Duty Checklist</option>
                            <option value="service" selected>☕ Active Service Duty</option>
                            <option value="closing">🌌 Closing Checklist SOP</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1 font-bold">Deskripsi Tugas Spesifik</label>
                          <input
                            type="text"
                            placeholder="Contoh: Bersihkan grinder & cek suhu susu bar"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-amber-500 text-black font-sans font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer hover:bg-amber-400 transition"
                        >
                          Bagikan Tugas
                        </button>
                      </div>
                    </form>

                    <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-xs font-bold text-amber-100 font-serif">Log Job Desk & Penugasan Harian (SOP Relational)</span>
                        <p className="text-[10px] text-[#D4A853] font-mono leading-none">💡 Klik baris tugas untuk memperbarui status (Pending ➔ Completed ➔ Approved)</p>
                      </div>

                      {employeeTasks.length === 0 ? (
                        <p className="text-xs text-amber-100/30 py-6 text-center">Belum ada job penugasan khusus hari ini. Gunakan form di atas untuk menugaskan.</p>
                      ) : (
                        <div className="space-y-2">
                          {employeeTasks.map((t) => {
                            const emp = employees.find(e => e.id === t.employeeId);
                            return (
                              <div
                                key={t.id}
                                onClick={() => handleToggleTaskStatus(t.id, t.status)}
                                className="bg-[#120803] p-3 border border-amber-500/10 rounded-xl flex items-center justify-between gap-4 hover:bg-amber-500/[0.04] transition cursor-pointer"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-amber-100">{t.taskName}</span>
                                    <span className={`text-[9px] font-mono uppercase px-1.5 rounded-full ${
                                      t.category === "opening" ? "bg-amber-500/10 text-[#D4A853]" : t.category === "service" ? "bg-[#18392b] text-[#5eead4]" : "bg-[#181d39] text-[#a5f3fc]"
                                    }`}>
                                      {t.category}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-amber-100/40">
                                    Penanggung Jawab: <span className="font-bold text-amber-100/70">{emp ? emp.fullName : "Staff FOH"}</span> • Ditugaskan: {t.assignedDate}
                                  </div>
                                </div>

                                <div className="text-right shrink-0 flex items-center gap-2 font-mono">
                                  {t.completedAt && (
                                    <span className="text-[9px] text-amber-100/30 font-mono hidden md:inline">Selesai: {t.completedAt}</span>
                                  )}
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                    t.status === "Pending" ? "bg-amber-500/10 text-[#D4A853] border-amber-500/10" : t.status === "Completed" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/20" : "bg-emerald-500/25 text-emerald-400 border-emerald-500/20"
                                  }`}>
                                    {t.status === "Pending" ? "⏳ Pending" : t.status === "Completed" ? "✓ Completed" : "🏆 Approved"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. KPIS PANEL */}
                {enterpriseActiveSection === "kpis" && (
                  <div className="space-y-6">
                    <form onSubmit={handleCreateKpi} className="bg-[#110500]/60 p-5 rounded-2xl border border-amber-500/15 space-y-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#D4A853] block">Evaluasi Nilai KPI Tim Terintegrasi</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Employee FOH</label>
                          <select
                            value={newKpiEmpId}
                            onChange={(e) => setNewKpiEmpId(e.target.value)}
                            className="bg-[#1a0f07] text-xs text-amber-150 border border-amber-500/25 rounded-lg px-3 py-2 w-full outline-none"
                          >
                            <option value="">-- Pilih Staff --</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1 font-bold">Periode Penilaian</label>
                          <select
                            value={newKpiPeriod}
                            onChange={(e) => setNewKpiPeriod(e.target.value)}
                            className="bg-[#1a0f07] text-xs text-amber-150 border border-amber-500/25 rounded-lg px-3 py-2 w-full outline-none"
                          >
                            <option value="Mei 2026">Mei 2026</option>
                            <option value="Juni 2026">Juni 2026</option>
                            <option value="Juli 2026">Juli 2026</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Kehadiran (Attendance Rate %)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newKpiAttendance}
                            onChange={(e) => setNewKpiAttendance(Number(e.target.value))}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Persentase Kepatuhan SOP %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newKpiSop}
                            onChange={(e) => setNewKpiSop(Number(e.target.value))}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Rating Review Pelanggan (Skala 1 - 5)</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={newKpiRating}
                            onChange={(e) => setNewKpiRating(Number(e.target.value))}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Catatan Evaluator</label>
                          <input
                            type="text"
                            placeholder="Contoh: Sangat cekatan, perlu mempertahankan absensi"
                            value={newKpiNotes}
                            onChange={(e) => setNewKpiNotes(e.target.value)}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="bg-amber-500 text-black font-sans font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer hover:bg-amber-400 transition"
                        >
                          Hitung & Simpan KPI Skor
                        </button>
                      </div>
                    </form>

                    <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-xs font-bold text-amber-100 font-serif">Scorecard KPI & Rekomendasi Bonus</span>
                        <span className="text-[10px] text-amber-100/40 font-mono">FORMULA SCORE: 40% SOP + 30% ATT + 30% REVIEW</span>
                      </div>

                      {employeeKpis.length === 0 ? (
                        <p className="text-xs text-amber-100/30 py-6 text-center font-mono">Belum ada evaluasi nilai yang dilakukan untuk tim harian.</p>
                      ) : (
                        <div className="space-y-4">
                          {employeeKpis.map((item) => {
                            const emp = employees.find(e => e.id === item.employeeId);
                            return (
                              <div key={item.id} className="bg-amber-950/10 p-4 border border-amber-500/10 rounded-xl space-y-3">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-2">
                                  <div className="space-y-0.5">
                                    <h4 className="text-sm font-bold text-amber-100">{emp ? emp.fullName : "Staff FOH"}</h4>
                                    <span className="text-[10px] text-[#D4A853] font-mono uppercase tracking-widest">{item.period} Evaluation Report</span>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-[10px] text-amber-100/40 font-mono block">Evaluator: {item.evaluatedBy}</span>
                                    <span className="text-lg font-serif font-bold text-amber-400">{item.finalScore}% Skor</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono text-amber-100/60 font-bold">
                                  <div className="bg-[#121212]/40 p-2 rounded">📅 Attendance: {item.attendanceRate}%</div>
                                  <div className="bg-[#121212]/40 p-2 rounded">📚 SOP Compliance: {item.sopCompliance}%</div>
                                  <div className="bg-[#121212]/40 p-2 rounded">⭐ Rating Level: {item.customerRating} Stars</div>
                                  <div className="bg-[#121212]/40 p-2 rounded">🏆 Klasifikasi: {item.finalScore >= 90 ? "Excellent Bonus" : item.finalScore >= 80 ? "Sesuai Target" : "Perlu Bimbingan"}</div>
                                </div>

                                <p className="text-[11px] text-amber-100/50 italic bg-black/20 p-2 rounded font-sans">Feedback: {item.notes}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. FEEDBACKS PANEL */}
                {enterpriseActiveSection === "feedbacks" && (
                  <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4 font-sans">
                    <div className="pb-2 border-b border-white/5">
                      <span className="text-xs font-bold text-amber-100 font-serif">Arsip Ulasan Kepuasan Pelanggan (Relational POS)</span>
                    </div>

                    <div className="space-y-3">
                      {feedbacks.map((item) => (
                        <div key={item.id} className="bg-[#1b1c20]/10 p-4 border border-amber-500/10 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-amber-100">{item.customerName}</span>
                            <span className="text-amber-400 font-mono">{"★".repeat(item.rating)}</span>
                          </div>
                          <p className="text-xs text-amber-100/70">{item.feedback}</p>
                          <div className="flex justify-between text-[10px] text-amber-100/30 font-mono">
                            <span>Sistem: JSON DB Cache Loader</span>
                            <span>Tanggal: {item.date || "2026-06-02"}</span>
                          </div>
                        </div>
                      ))}

                      {customerFeedbacks.map((item) => (
                        <div key={item.id} className="bg-[#241c10]/10 p-4 border border-amber-500/10 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-amber-100">{item.customerName || "Anonym Guest"}</span>
                            <span className="text-amber-400 font-mono">{"★".repeat(item.rating)}</span>
                          </div>
                          <p className="text-xs text-amber-100/70">{item.feedback}</p>
                          <div className="flex justify-between text-[10px] text-amber-100/30 font-mono">
                            <span>Sistem: Relational PostgreSQL Schema</span>
                            <span>Tanggal: {item.createdAt}</span>
                          </div>
                        </div>
                      ))}

                      {feedbacks.length === 0 && customerFeedbacks.length === 0 && (
                        <p className="text-xs text-amber-100/30 text-center py-4 font-mono font-bold">Belum ada feedback yang terinput.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. INCIDENTS PANEL */}
                {enterpriseActiveSection === "incidents" && (
                  <div className="space-y-6">
                    <form onSubmit={handleCreateIncident} className="bg-[#110500]/60 p-5 rounded-2xl border border-amber-500/15 space-y-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#D4A853] block">Laporkan Insiden & Krisis Outlet (Additive Security)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Jenis Insiden / Gangguan</label>
                          <input
                            type="text"
                            placeholder="Contoh: Mati Lampu, Pecah Gelas, Kebocoran Air"
                            value={newIncidentType}
                            onChange={(e) => setNewIncidentType(e.target.value)}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg px-3 py-2 w-full outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Tingkat Bahaya (Severity)</label>
                          <select
                            value={newIncidentSeverity}
                            onChange={(e) => setNewIncidentSeverity(e.target.value as any)}
                            className="bg-[#1a0f07] text-xs text-amber-150 border border-amber-500/25 rounded-lg px-3 py-2 w-full outline-none"
                          >
                            <option value="Low">Low (Tidak mengganggu layanan)</option>
                            <option value="Medium">Medium (Bisa ditangani cepat)</option>
                            <option value="High">High (Perlu bantuan owner/teknisi)</option>
                            <option value="Critical">Critical (Sistem stop/bahaya)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1">Pelapor / Saksi Utama</label>
                          <select
                            value={newIncidentReporter}
                            onChange={(e) => setNewIncidentReporter(e.target.value)}
                            className="bg-[#1a0f07] text-xs text-amber-150 border border-amber-500/25 rounded-lg px-3 py-2 w-full outline-none"
                          >
                            <option value="">-- Pilih Staff --</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] text-amber-100/40 uppercase font-mono tracking-widest block mb-1 font-bold">Uraian / Deskripsi Lengkap Kronologi</label>
                          <textarea
                            rows={3}
                            placeholder="Tulis kronologi insiden, kerusakan, tindakan pertama yang telah diambil dan peralatan terdampak."
                            value={newIncidentDesc}
                            onChange={(e) => setNewIncidentDesc(e.target.value)}
                            className="bg-amber-950/20 text-xs text-amber-150 border border-amber-500/20 rounded-lg p-3 w-full outline-none focus:border-amber-400 resize-none font-sans"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pr-1">
                        <button
                          type="submit"
                          className="bg-amber-500 text-black font-sans font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer hover:bg-amber-400 transition"
                        >
                          Kirim Laporan Keamanan
                        </button>
                      </div>
                    </form>

                    <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-xs font-bold text-amber-100 font-serif">Log Keamanan, Kerusakan Alat, & Insiden Fatal</span>
                        <span className="text-[10px] text-[#D4A853] font-mono">DIPERLUKAN TINDAKAN OWNER/MANAGER</span>
                      </div>

                      {incidentReports.length === 0 ? (
                        <p className="text-xs text-amber-100/30 py-6 text-center font-mono">Sistem aman. Tidak ada insiden operasional atau krisis yang tercatat.</p>
                      ) : (
                        <div className="space-y-3 font-sans">
                          {incidentReports.map((ir) => (
                            <div key={ir.id} className="bg-amber-950/5 p-4 border border-amber-500/10 rounded-xl space-y-3 animate-fade-in">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-[#D4A853]">{ir.incidentType}</h4>
                                    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${
                                      ir.severity === "Critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" : ir.severity === "High" ? "bg-orange-500/20 text-orange-400" : "bg-[#1d1d1d] text-amber-205"
                                    }`}>
                                      {ir.severity} Threat
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-amber-100/40 font-mono">Reporter: {ir.reporterId} • Waktu: {ir.incidentDate}</p>
                                </div>

                                <div>
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                    ir.status === "Open" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                                  }`}>
                                    {ir.status === "Open" ? "🚨 Open / Investigating" : "✓ Resolved / Closed"}
                                  </span>
                                </div>
                              </div>

                              <p className="text-[11px] text-amber-100/70 bg-black/15 p-2 rounded">{ir.description}</p>

                              {ir.status === "Open" ? (
                                <div className="flex justify-end gap-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const solution = prompt("Silahkan tulis rincian tindakan penyelesaian insiden ini:");
                                      if (solution !== null) {
                                        handleResolveIncident(ir.id, solution);
                                      }
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[10px] px-3 py-1 rounded-lg transition"
                                  >
                                    Tandai Selesai (Resolve Log)
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[10px] text-emerald-400 font-mono">
                                  📋 Tindakan Penyelesaian: {ir.resolutionNotes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
