import React, { useState, useEffect } from "react";
import { CoffeeOpsState, User, ShiftDefinition, ShiftSchedule, ShiftAttendanceLog, BreakLog, OvertimeLog, ShiftSwapRequest, StaffRoleDefinition } from "../types";
import { 
  Calendar, 
  Clock, 
  User as UserIcon, 
  ArrowLeftRight, 
  Check, 
  X, 
  ShieldAlert, 
  FileText, 
  Plus, 
  RefreshCw, 
  Copy, 
  Sparkles, 
  AlertCircle, 
  Play, 
  Coffee, 
  QrCode, 
  Download, 
  Trash, 
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileCheck,
  AlertTriangle
} from "lucide-react";

interface ShiftManagementProps {
  state: CoffeeOpsState;
  currentUser: User | null;
  activeRole: string;
  onUpdateState: (nextState: CoffeeOpsState) => void;
  triggerToast: (msg: string) => void;
}

// Default Shift Definitions
const DEFAULT_SHIFTS: ShiftDefinition[] = [
  { id: "s1", name: "Pagi (Morning)", code: "Morning", startTime: "07:00", endTime: "15:00", color: "border-emerald-500 bg-emerald-500/10 text-emerald-400" },
  { id: "s2", name: "Siang (Middle)", code: "Middle", startTime: "15:00", endTime: "23:00", color: "border-amber-500 bg-amber-500/10 text-amber-400" },
  { id: "s3", name: "Malam (Night)", code: "Night", startTime: "23:00", endTime: "07:00", color: "border-indigo-500 bg-indigo-500/10 text-indigo-400" },
  { id: "s4", name: "Penuh (Full Day)", code: "Full Day", startTime: "07:00", endTime: "23:00", color: "border-red-500 bg-red-500/10 text-red-450" },
  { id: "s5", name: "Kustom (Custom)", code: "Custom Shift", startTime: "10:00", endTime: "18:00", color: "border-cyan-500 bg-cyan-500/10 text-cyan-450" },
];

export default function ShiftManagement({
  state,
  currentUser,
  activeRole,
  onUpdateState,
  triggerToast
}: ShiftManagementProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "schedule" | "calendar" | "attendance" | "swap" | "reports">("dashboard");

  // Determine permissions based on role
  const isOwner = activeRole === "Owner";
  const isManagement = ["Owner", "Manager", "Supervisor"].includes(activeRole);

  // Read state lists, fallback to mock data if empty
  const users = state.users || [];
  
  const [shifts, setShifts] = useState<ShiftDefinition[]>(() => {
    return state.shifts && state.shifts.length > 0 ? state.shifts : DEFAULT_SHIFTS;
  });

  const [schedules, setSchedules] = useState<ShiftSchedule[]>(() => {
    if (state.shiftSchedules && state.shiftSchedules.length > 0) return state.shiftSchedules;
    
    // Seed some initial demo schedules for the current week to look beautiful
    const today = new Date();
    const demo: ShiftSchedule[] = [];
    const shiftIds = ["s1", "s2", "s3"];
    
    users.slice(0, 8).forEach((u, index) => {
      // Assign shift for 5 days of the week
      for (let d = -3; d <= 3; d++) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() + d);
        const dateStr = dateObj.toISOString().split("T")[0];
        
        // Skip some days for variety
        if ((index + d) % 4 !== 0) {
          demo.push({
            id: `sch-${u.id}-${d}`,
            userId: u.id,
            userName: u.name,
            role: u.role,
            date: dateStr,
            shiftId: shiftIds[(index + Math.abs(d)) % shiftIds.length],
            notes: d === 0 ? "Utamakan breafing pagi" : undefined
          });
        }
      }
    });
    return demo;
  });

  const [attendances, setAttendances] = useState<ShiftAttendanceLog[]>(() => {
    if (state.shiftAttendanceLogs && state.shiftAttendanceLogs.length > 0) return state.shiftAttendanceLogs;
    
    // Seed some attendance histories looking satisfying
    const today = new Date();
    const demo: ShiftAttendanceLog[] = [];
    
    users.slice(0, 6).forEach((u, index) => {
      for (let d = -3; d < 0; d++) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() + d);
        const dateStr = dateObj.toISOString().split("T")[0];
        const isLate = index % 3 === 0;
        
        demo.push({
          id: `att-${u.id}-${d}`,
          userId: u.id,
          userName: u.name,
          role: u.role,
          date: dateStr,
          shiftId: index % 2 === 0 ? "s1" : "s2",
          checkIn: isLate ? "07:22:15" : "06:54:10",
          checkOut: "15:05:00",
          status: isLate ? "Terlambat" : "Hadir",
          latenessMinutes: isLate ? 22 : 0,
          overtimeMinutes: index % 4 === 0 ? 90 : 0,
          qrScanned: true
        });
      }
    });
    return demo;
  });

  const [swaps, setSwaps] = useState<ShiftSwapRequest[]>(() => {
    if (state.shiftSwapRequests && state.shiftSwapRequests.length > 0) return state.shiftSwapRequests;
    
    // Default demo requests
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = tomorrowObj.toISOString().split("T")[0];
    
    return [
      {
        id: "swap-1",
        requestorId: users[1]?.id || "2",
        requestorName: users[1]?.name || "Andi Barista",
        targetId: users[2]?.id || "3",
        targetName: users[2]?.name || "Budi Cashier",
        dateRequested: todayStr,
        dateTarget: tomorrowStr,
        requestorShiftId: "s1",
        targetShiftId: "s2",
        status: "Pending",
        reason: "Ada acara keluarga mendadak besok pagi.",
        createdAt: todayStr
      }
    ];
  });

  const [overtimes, setOvertimes] = useState<OvertimeLog[]>(() => {
    return state.shiftOvertimeLogs || [];
  });

  const [breaks, setBreaks] = useState<BreakLog[]>(() => {
    return state.shiftBreakLogs || [];
  });

  // Local Notifications inside the module
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; type: "alert" | "info" | "success"; time: string }>>([
    { id: "n-1", text: "Jadwal Shift Mingguan untuk periode ini telah disetujui oleh Owner.", type: "success", time: "Baru saja" },
    { id: "n-2", text: "Andi Barista mengajukan tukar shift dengan Budi Cashier.", type: "info", time: "2 jam lalu" },
    { id: "n-3", text: "Budi Cashier terdeteksi terlambat 22 menit pada Shift Pagi.", type: "alert", time: "Hari ini" }
  ]);

  // State sync wrapper
  const syncShiftsState = (
    nextShifts: ShiftDefinition[],
    nextSched: ShiftSchedule[],
    nextAtt: ShiftAttendanceLog[],
    nextSwaps: ShiftSwapRequest[],
    nextOt: OvertimeLog[],
    nextBrk: BreakLog[]
  ) => {
    setShifts(nextShifts);
    setSchedules(nextSched);
    setAttendances(nextAtt);
    setSwaps(nextSwaps);
    setOvertimes(nextOt);
    setBreaks(nextBrk);

    const updatedState: CoffeeOpsState = {
      ...state,
      shifts: nextShifts,
      shiftSchedules: nextSched,
      shiftAttendanceLogs: nextAtt,
      shiftSwapRequests: nextSwaps,
      shiftOvertimeLogs: nextOt,
      shiftBreakLogs: nextBrk
    };
    onUpdateState(updatedState);
  };

  // ----------------------------------------------------
  // ROSTER SCHEDULE SCHEDULER STATES & LOGICS
  // ----------------------------------------------------
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
  });

  // Format Date array for current week (Monday to Sunday)
  const getWeekDates = (start: Date) => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(start);
      next.setDate(start.getDate() + i);
      dates.push(next);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeekStart);
  
  // Navigation for weeks
  const changeWeek = (direction: number) => {
    const next = new Date(selectedWeekStart);
    next.setDate(selectedWeekStart.getDate() + direction * 7);
    setSelectedWeekStart(next);
  };

  // Scheduler editing fields
  const [editingCell, setEditingCell] = useState<{ userId: string; date: string } | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("s1");
  const [cellNote, setCellNote] = useState<string>("");

  const handleAssignShift = (userId: string, dateStr: string) => {
    if (!isManagement) {
      triggerToast("⛔ Hanya Manager, Owner, atau Supervisor yang diizinkan mengedit jadwal shift.");
      return;
    }
    
    const userObj = users.find(u => u.id === userId);
    if (!userObj) return;

    // Check if shift is empty/unassigned to clear it
    if (selectedShiftId === "clear") {
      const filtered = schedules.filter(s => !(s.userId === userId && s.date === dateStr));
      syncShiftsState(shifts, filtered, attendances, swaps, overtimes, breaks);
      triggerToast(`✓ Shift telah dihapus dari ${userObj.name} pada tanggal ${dateStr}`);
      setEditingCell(null);
      return;
    }

    // Update or Insert schedule
    const existingIndex = schedules.findIndex(s => s.userId === userId && s.date === dateStr);
    const updated = [...schedules];

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        shiftId: selectedShiftId,
        notes: cellNote ? cellNote : undefined
      };
    } else {
      updated.push({
        id: `sch-${userId}-${dateStr}-${Date.now().toString().slice(-4)}`,
        userId: userId,
        userName: userObj.name,
        role: userObj.role,
        date: dateStr,
        shiftId: selectedShiftId,
        notes: cellNote ? cellNote : undefined
      });
    }

    // Add notification
    const addedNotification = [
      {
        id: `notify-${Date.now()}`,
        text: `Jadwal baru dirilis untuk ${userObj.name} pada ${dateStr}.`,
        type: "success" as const,
        time: "Baru saja"
      },
      ...notifications
    ];
    setNotifications(addedNotification);

    syncShiftsState(shifts, updated, attendances, swaps, overtimes, breaks);
    triggerToast(`✓ Berhasil menetapkan shift untuk ${userObj.name} pada ${dateStr}`);
    setEditingCell(null);
    setCellNote("");
  };

  // Copy Previous Week Schedule Logic
  const handleCopyPrevWeek = () => {
    if (!isManagement) {
      triggerToast("⛔ Hak akses ditolak.");
      return;
    }

    const prevWeekStart = new Date(selectedWeekStart);
    prevWeekStart.setDate(selectedWeekStart.getDate() - 7);
    const prevWeekDates = getWeekDates(prevWeekStart);

    let countCopied = 0;
    const tempSchedules = [...schedules];

    users.forEach((u) => {
      prevWeekDates.forEach((prevDate, dayIndex) => {
        const prevDateStr = prevDate.toISOString().split("T")[0];
        const existing = schedules.find(s => s.userId === u.id && s.date === prevDateStr);
        
        if (existing) {
          const targetDate = weekDates[dayIndex];
          const targetDateStr = targetDate.toISOString().split("T")[0];
          
          // Remove existing target day schedule if any to build cleanly
          const idxToRemove = tempSchedules.findIndex(s => s.userId === u.id && s.date === targetDateStr);
          if (idxToRemove >= 0) {
            tempSchedules.splice(idxToRemove, 1);
          }

          tempSchedules.push({
            id: `sch-${u.id}-${targetDateStr}-${dayIndex}-${Date.now().toString().slice(-4)}`,
            userId: u.id,
            userName: u.name,
            role: u.role,
            date: targetDateStr,
            shiftId: existing.shiftId,
            notes: existing.notes
          });
          countCopied++;
        }
      });
    });

    if (countCopied === 0) {
      triggerToast("⚠️ Tidak ada jadwal yang ditemukan pada minggu sebelumnya untuk disalin.");
      return;
    }

    syncShiftsState(shifts, tempSchedules, attendances, swaps, overtimes, breaks);
    triggerToast(`✓ Berhasil menduplikasi ${countCopied} jadwal dari minggu sebelumnya.`);
  };

  // Auto Rotate Shift Logic
  const handleAutoRotate = () => {
    if (!isManagement) {
      triggerToast("⛔ Hanya level Management yang diizinkan.");
      return;
    }

    // Auto assign shifts randomly but balanced for simulation purposes
    const tempSchedules = [...schedules];
    const activeShiftIds = ["s1", "s2", "s3"]; // Morning, Middle, Night
    let assigned = 0;

    users.forEach((user, userIdx) => {
      weekDates.forEach((date, i) => {
        const dateStr = date.toISOString().split("T")[0];
        // Skip Wednesday/Sunday for some users to simulate off-days
        const isOffDay = (userIdx + i) % 6 === 0;
        if (isOffDay) {
          // Clear if any
          const index = tempSchedules.findIndex(s => s.userId === user.id && s.date === dateStr);
          if (index >= 0) tempSchedules.splice(index, 1);
          return;
        }

        const idxToRemove = tempSchedules.findIndex(s => s.userId === user.id && s.date === dateStr);
        if (idxToRemove >= 0) {
          tempSchedules.splice(idxToRemove, 1);
        }

        // Cycle through standard shifts
        const shiftId = activeShiftIds[(userIdx + i) % activeShiftIds.length];
        tempSchedules.push({
          id: `sch-${user.id}-${dateStr}-${Date.now().toString().slice(-4)}`,
          userId: user.id,
          userName: user.name,
          role: user.role,
          date: dateStr,
          shiftId: shiftId,
          notes: "Auto-rotated shift"
        });
        assigned++;
      });
    });

    syncShiftsState(shifts, tempSchedules, attendances, swaps, overtimes, breaks);
    triggerToast(`✓ Otoritas rotasi otomatis berhasil! Menetapkan ${assigned} shift berimbang.`);
  };

  // ----------------------------------------------------
  // SHIFT SWAP STATES & LOGICS
  // ----------------------------------------------------
  const [swapRequestor, setSwapRequestor] = useState(currentUser?.id || "");
  const [swapTarget, setSwapTarget] = useState("");
  const [swapDateRequestor, setSwapDateRequestor] = useState<string>("");
  const [swapDateTarget, setSwapDateTarget] = useState<string>("");
  const [swapReason, setSwapReason] = useState("");

  const handleSubmitSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapRequestor || !swapTarget || !swapDateRequestor || !swapDateTarget || !swapReason) {
      triggerToast("⚠️ Mohon lengkapi seluruh kolom isian formulir penukaran shift.");
      return;
    }

    const reqUser = users.find(u => u.id === swapRequestor);
    const tarUser = users.find(u => u.id === swapTarget);

    if (!reqUser || !tarUser) return;

    // Look up the shifts occupied on those days
    const reqSch = schedules.find(s => s.userId === swapRequestor && s.date === swapDateRequestor);
    const tarSch = schedules.find(s => s.userId === swapTarget && s.date === swapDateTarget);

    if (!reqSch) {
      triggerToast(`⚠️ ${reqUser.name} tidak memiliki jadwal shift pada tanggal ${swapDateRequestor}`);
      return;
    }
    if (!tarSch) {
      triggerToast(`⚠️ ${tarUser.name} tidak memiliki jadwal shift pada tanggal ${swapDateTarget}`);
      return;
    }

    const newSwap: ShiftSwapRequest = {
      id: `swap-${Date.now()}`,
      requestorId: swapRequestor,
      requestorName: reqUser.name,
      targetId: swapTarget,
      targetName: tarUser.name,
      dateRequested: swapDateRequestor,
      dateTarget: swapDateTarget,
      requestorShiftId: reqSch.shiftId,
      targetShiftId: tarSch.shiftId,
      status: "Pending",
      createdAt: new Date().toISOString().split("T")[0],
      reason: swapReason
    };

    const nextSwaps = [newSwap, ...swaps];
    // Add internal notification
    const addedNotification = [
      {
        id: `notify-swap-${Date.now()}`,
        text: `Pengajuan tukar shift baru dari ${reqUser.name} kepada ${tarUser.name}.`,
         type: "info" as const,
        time: "Baru saja"
      },
      ...notifications
    ];
    setNotifications(addedNotification);

    syncShiftsState(shifts, schedules, attendances, nextSwaps, overtimes, breaks);
    triggerToast("✓ Berhasil menyimpan dan mengirimkan pengajuan tukar shift.");
    setSwapReason("");
    setSwapTarget("");
  };

  const handleApproveSwap = (swapId: string, approve: boolean) => {
    if (!isManagement) {
      triggerToast("⛔ Hanya management (Owner, Manager, Supervisor) yang berwenang menyetujui tukar shift.");
      return;
    }

    const swapObj = swaps.find(s => s.id === swapId);
    if (!swapObj) return;

    const nextSwaps = swaps.map(s => {
      if (s.id === swapId) {
        return { 
          ...s, 
          status: (approve ? "Approved" : "Rejected") as "Approved" | "Rejected",
          approvedBy: currentUser?.name || activeRole
        };
      }
      return s;
    });

    let nextSchedules = [...schedules];

    if (approve) {
      // Execute the actual roster swap in the schedule database!
      const reqSchIdx = schedules.findIndex(s => s.userId === swapObj.requestorId && s.date === swapObj.dateRequested);
      const tarSchIdx = schedules.findIndex(s => s.userId === swapObj.targetId && s.date === swapObj.dateTarget);

      if (reqSchIdx >= 0 && tarSchIdx >= 0) {
        const tempShiftId = nextSchedules[reqSchIdx].shiftId;
        nextSchedules[reqSchIdx].shiftId = nextSchedules[tarSchIdx].shiftId;
        nextSchedules[tarSchIdx].shiftId = tempShiftId;
      }
    }

    // Add alert notification
    const addedNotification = [
      {
        id: `notify-swap-resp-${Date.now()}`,
        text: `Pertukaran shift antara ${swapObj.requestorName} & ${swapObj.targetName} telah ${approve ? "DISETUJUI" : "DITOLAK"} oleh ${currentUser?.name || "Management"}.`,
        type: approve ? ("success" as const) : ("alert" as const),
        time: "Baru saja"
      },
      ...notifications
    ];
    setNotifications(addedNotification);

    syncShiftsState(shifts, nextSchedules, attendances, nextSwaps, overtimes, breaks);
    triggerToast(approve ? "✓ Pertukaran shift disetujui! Jadwal staff saling ditukar otomatis." : "✗ Pertukaran shift ditolak.");
  };

  // ----------------------------------------------------
  // REAL-TIME CLOCK IN & ATTENDANCE SYSTEM
  // ----------------------------------------------------
  const [selectedStaffToScan, setSelectedStaffToScan] = useState<string>(currentUser?.id || "");
  const [currentTimeManual, setCurrentTimeManual] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  });

  // Calculate lateness and perform physical clock-in
  const handleClockIn = (userId: string) => {
    const userObj = users.find(u => u.id === userId);
    if (!userObj) return;

    const todayStr = new Date().toISOString().split("T")[0];
    
    // Find expected scheduled shift for this staff today
    const todaysSch = schedules.find(s => s.userId === userId && s.date === todayStr);
    
    if (!todaysSch) {
      triggerToast(`⚠️ ${userObj.name} tidak memiliki jadwal shift kerja hari ini (${todayStr}).`);
      return;
    }

    const shiftObj = shifts.find(s => s.id === todaysSch.shiftId) || DEFAULT_SHIFTS[0];

    // Calculate latency
    // Expected start: hh:mm
    const [expH, expM] = shiftObj.startTime.split(":").map(Number);
    const [nowH, nowM] = currentTimeManual.split(":").map(Number);

    const expectedMinutes = expH * 60 + expM;
    const actualMinutes = nowH * 60 + nowM;
    const lateDiff = actualMinutes - expectedMinutes;

    let lateness = 0;
    let status: "Hadir" | "Terlambat" = "Hadir";
    
    // Check if it exceeds threshold (using branding config or fallback 15 mins)
    const threshold = state.branding.lateThresholdMinutes || 15;
    if (lateDiff > threshold) {
      lateness = lateDiff;
      status = "Terlambat";
    }

    // Check if already checked in today
    const alreadyAtt = attendances.find(a => a.userId === userId && a.date === todayStr);
    if (alreadyAtt && alreadyAtt.checkIn) {
      triggerToast(`⚠️ ${userObj.name} telah melakukan Clock In hari ini pada pukul ${alreadyAtt.checkIn}`);
      return;
    }

    const newAtt: ShiftAttendanceLog = {
      id: `att-${userId}-${todayStr}-${Date.now().toString().slice(-4)}`,
      userId: userId,
      userName: userObj.name,
      role: userObj.role,
      date: todayStr,
      shiftId: shiftObj.id,
      checkIn: `${currentTimeManual}:00`,
      status: status,
      latenessMinutes: lateness,
      overtimeMinutes: 0,
      qrScanned: true
    };

    const nextAtt = [newAtt, ...attendances];

    // Notification alert if late
    let currentNotif = [...notifications];
    if (status === "Terlambat") {
      currentNotif = [
        {
          id: `notif-late-${Date.now()}`,
          text: `🚨 ${userObj.name} terlambat ${lateness} menit masuk kerja! [Shift: ${shiftObj.name}]`,
          type: "alert" as const,
          time: "Baru saja"
        },
        ...currentNotif
      ];
    } else {
      currentNotif = [
        {
          id: `notif-in-${Date.now()}`,
          text: `✓ ${userObj.name} berhasil Clock In masuk kerja tepat waktu.`,
          type: "success" as const,
          time: "Baru saja"
        },
        ...currentNotif
      ];
    }
    setNotifications(currentNotif);

    syncShiftsState(shifts, schedules, nextAtt, swaps, overtimes, breaks);
    triggerToast(status === "Terlambat" 
      ? `🚨 Clock In Berhasil, Status: TERLAMBAT (${lateness} Menit)` 
      : '✓ Clock In Berhasil, Tepat waktu! Selamat bekerja! ✨'
    );
  };

  const handleClockOut = (userId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const logIndex = attendances.findIndex(a => a.userId === userId && a.date === todayStr);

    if (logIndex < 0) {
      triggerToast("⚠️ Anda belum melakukan Clock In hari ini! Silakan Masuk terlebih dahulu.");
      return;
    }

    const attLog = attendances[logIndex];
    if (attLog.checkOut) {
      triggerToast("⚠️ Anda sudah melakukan Clock Out pulang hari ini.");
      return;
    }

    // Calculate shift overtime
    const shiftObj = shifts.find(s => s.id === attLog.shiftId) || DEFAULT_SHIFTS[0];
    const [expH, expM] = shiftObj.endTime.split(":").map(Number);
    const [outH, outM] = currentTimeManual.split(":").map(Number);

    const expectedOutMinutes = expH * 60 + expM;
    const actualOutMinutes = outH * 60 + outM;
    const otDiff = actualOutMinutes - expectedOutMinutes;
    const overtime = otDiff > 30 ? otDiff : 0; // standard overtime starts only if exceeds 30 minutes

    const updated = [...attendances];
    updated[logIndex] = {
      ...attLog,
      checkOut: `${currentTimeManual}:00`,
      overtimeMinutes: overtime
    };

    if (overtime >  0) {
      // Record overtime log for audit
      const newOt: OvertimeLog = {
        id: `ot-${userId}-${Date.now()}`,
        attendanceLogId: attLog.id,
        userId: userId,
        userName: attLog.userName,
        hoursRequested: Math.round((overtime / 60) * 10) / 10,
        status: "Pending",
        reason: "Lemburan penyelesaian closingan kasir & stock opname.",
        date: todayStr
      };
      setOvertimes(prev => [newOt, ...prev]);
    }

    // Notification
    const addNotif = [
      {
        id: `notif-out-${Date.now()}`,
        text: `✓ ${attLog.userName} telah Clock Out pulang kerja pukul ${currentTimeManual}.`,
        type: "info" as const,
        time: "Baru saja"
      },
      ...notifications
    ];
    setNotifications(addNotif);

    syncShiftsState(shifts, schedules, updated, swaps, overtimes, breaks);
    triggerToast(overtime > 0 
      ? `✓ Clock Out Berhasil! Tercatat lemburan +${Math.round(overtime/10)/6} jam.` 
      : "✓ Clock Out Berhasil! Terima kasih atas dedikasi kerja Anda hari ini. ✨"
    );
  };

  // BREAK TIMING TRACER
  const handleToggleBreak = (userId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const attLog = attendances.find(a => a.userId === userId && a.date === todayStr);

    if (!attLog) {
      triggerToast("⚠️ Anda harus Clock In kerja terlebih dahulu!");
      return;
    }

    const updated = [...attendances];
    const attIdx = attendances.findIndex(a => a.id === attLog.id);

    if (!attLog.breakStartTime) {
      // Start break
      updated[attIdx] = {
        ...attLog,
        breakStartTime: `${currentTimeManual}:00`
      };
      triggerToast("⏱️ Break Time Dimulai! Selamat beristirahat.");
    } else if (attLog.breakStartTime && !attLog.breakEndTime) {
      // End break
      const [inH, inM] = attLog.breakStartTime.split(":").map(Number);
      const [outH, outM] = currentTimeManual.split(":").map(Number);
      const elapsed = (outH * 60 + outM) - (inH * 60 + inM);

      updated[attIdx] = {
        ...attLog,
        breakEndTime: `${currentTimeManual}:00`,
        totalBreakMinutes: elapsed > 0 ? elapsed : 0
      };
      triggerToast(`⏱️ Istirahat Selesai. Total durasi istirahat: ${elapsed} menit. Kembali bertugas!`);
    } else {
      triggerToast("⚠️ Anda telah menyelesaikan jatah satu kali istirahat (break time) pada shift hari ini.");
    }

    syncShiftsState(shifts, schedules, updated, swaps, overtimes, breaks);
  };

  // MANAGER OVERTIME ACTIONS
  const handleApproveOvertime = (otId: string, approve: boolean) => {
    if (!isManagement) {
      triggerToast("⛔ Hanya level management yang diizinkan untuk mengesahkan lemburan.");
      return;
    }
    const updated = overtimes.map(ot => {
      if (ot.id === otId) {
        return {
          ...ot,
          status: (approve ? "Approved" : "Rejected") as "Approved" | "Rejected",
          approvedBy: currentUser?.name || activeRole
        };
      }
      return ot;
    });
    setOvertimes(updated);
    syncShiftsState(shifts, schedules, attendances, swaps, updated, breaks);
    triggerToast(approve ? "✓ Lemburan staff berhasil disetujui!" : "✗ Lemburan staff ditolak.");
  };

  // ----------------------------------------------------
  // REPORT EXPORTING FUNCTIONS
  // ----------------------------------------------------
  const downloadReportFile = (type: "schedule" | "attendance" | "latency" | "overtime") => {
    let title = "";
    let csvContent = "";

    if (type === "schedule") {
      title = "REKAP_JADWAL_SHIFT_MINGGUAN.csv";
      csvContent = "ID Schedule,Nama Karyawan,Role,Tanggal Kerja,ID Shift,Nama Shift,Jam Mulai,Jam Selesai,Catatan\n";
      schedules.forEach((s) => {
        const sh = shifts.find(shf => shf.id === s.shiftId);
        csvContent += `"${s.id}","${s.userName}","${s.role}","${s.date}","${s.shiftId}","${sh?.name || ""}","${sh?.startTime || ""}","${sh?.endTime || ""}","${s.notes || "-"}"\n`;
      });
    } else if (type === "attendance") {
      title = "REKAP_ABSENSI_SHIFT_BULANAN.csv";
      csvContent = "ID Roster Log,Nama Karyawan,Role,Tanggal,Shift Mulai,Shift Selesai,Clock In,Clock Out,Status Kehadiran,Terlambat (Menit),Lembur (Menit)\n";
      attendances.forEach((a) => {
        const sh = shifts.find(shf => shf.id === a.shiftId);
        csvContent += `"${a.id}","${a.userName}","${a.role}","${a.date}","${sh?.startTime || ""}","${sh?.endTime || ""}","${a.checkIn}","${a.checkOut || "-"}","${a.status}","${a.latenessMinutes}","${a.overtimeMinutes}"\n`;
      });
    } else if (type === "latency") {
      title = "LAPORAN_REKAP_KETERLAMBATAN_ROSTER.csv";
      csvContent = "Nama Karyawan,Role,Tercatat Terlambat,Total Menit Keterlambatan,Sanksi Kebijakan Potong Insentif\n";
      const userLateness: { [name: string]: { role: string; count: number; total: number } } = {};
      attendances.forEach((a) => {
        if (a.status === "Terlambat") {
          if (!userLateness[a.userName]) {
            userLateness[a.userName] = { role: a.role, count: 0, total: 0 };
          }
          userLateness[a.userName].count += 1;
          userLateness[a.userName].total += a.latenessMinutes;
        }
      });
      Object.entries(userLateness).forEach(([nama, info]) => {
        const dendaRules = info.total > 60 ? "Potongan Rp 50,000 + Teguran Lisan" : "Peringatan Absensi";
        csvContent += `"${nama}","${info.role}","${info.count} kali","${info.total} menit","${dendaRules}"\n`;
      });
    } else {
      title = "LAPORAN_REKAP_OVERTIME_LEMBUR.csv";
      csvContent = "ID Overtime,Nama Karyawan,Tanggal Kerja,Jam Lemburan Diajukan,Status,Disahkan Oleh,Keterangan Alasan\n";
      overtimes.forEach((o) => {
        csvContent += `"${o.id}","${o.userName}","${o.date}","${o.hoursRequested} Jam","${o.status}","${o.approvedBy || "Belum dievaluasi"}","${o.reason}"\n`;
      });
    }

    // Direct Browser Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", title);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`✓ Unduhan berhasil dimulai: ${title}`);
  };

  // Month Calendar helpers
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const getMonthsDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Day of week of January 1
    const startOffset = firstDay.getDay(); // 0 is Sunday, 1 is Monday ...
    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

    // Prior Month filler
    const prevLastDay = new Date(year, month, 0).getDate();
    const offsetCorrection = startOffset === 0 ? 6 : startOffset - 1; // standard starting monday
    for (let i = offsetCorrection; i > 0; i--) {
      const d = prevLastDay - i + 1;
      const mStr = String((month === 0 ? 11 : month)).padStart(2, "0");
      const yStr = month === 0 ? year - 1 : year;
      days.push({
        dateStr: `${yStr}-${mStr}-${String(d).padStart(2, "0")}`,
        dayNum: d,
        isCurrentMonth: false
      });
    }

    // This month
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, "0");
      days.push({
        dateStr: `${year}-${mStr}-${String(d).padStart(2, "0")}`,
        dayNum: d,
        isCurrentMonth: true
      });
    }

    return days;
  };

  const calendarDays = getMonthsDays(currentMonth);

  return (
    <div className="space-y-6 text-amber-50 animate-fadeIn font-sans">
      {/* 🟢 Header Banner Dashboard Shift */}
      <div className="bg-gradient-to-r from-amber-500/15 via-[#231102] to-amber-500/5 border border-amber-500/25 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            <span className="text-[10px] font-mono tracking-widest text-[#D4A853] font-black uppercase bg-[#2e1c0c] px-2 py-0.5 rounded border border-amber-500/20">
              SHIFT OPERATIONS CENTER
            </span>
          </div>
          <h3 className="font-serif text-2xl font-black text-amber-50">
            📅 Manajemen Jadwal Shift &amp; Absensi Staff
          </h3>
          <p className="text-xs text-amber-150/65 leading-relaxed max-w-2xl">
            Sistem pengawasan roster kerja modular. Rancang penugasan mingguan berimbang, kelola persetujuan tukar shift, awasi clock in/out biometrik, pantau waktu break harian, dan pantau performa kehadiran operasional kedai.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              activeTab === "dashboard" ? "bg-amber-500 text-[#1a0a00] border-amber-400" : "bg-black/40 border-amber-500/20 hover:bg-amber-500/10 text-amber-100"
            }`}
          >
            📊 Ringkasan
          </button>
          
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              activeTab === "schedule" ? "bg-amber-500 text-[#1a0a00] border-amber-400" : "bg-black/40 border-amber-500/20 hover:bg-amber-500/10 text-amber-100"
            }`}
          >
            📋 Roster Mingguan
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              activeTab === "calendar" ? "bg-amber-500 text-[#1a0a00] border-amber-400" : "bg-black/40 border-amber-500/20 hover:bg-amber-500/10 text-amber-100"
            }`}
          >
            🗓️ Kalender Bulan
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              activeTab === "attendance" ? "bg-amber-500 text-[#1a0a00] border-amber-400" : "bg-black/40 border-amber-500/20 hover:bg-amber-500/10 text-amber-100"
            }`}
          >
            ⏱️ Clock In/Out &amp; QR
          </button>

          <button
            onClick={() => setActiveTab("swap")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              activeTab === "swap" ? "bg-amber-500 text-[#1a0a00] border-amber-400" : "bg-black/40 border-amber-500/20 hover:bg-amber-500/10 text-amber-100"
            }`}
          >
            ↔️ Tukar Shift
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              activeTab === "reports" ? "bg-amber-500 text-[#1a0a00] border-amber-400" : "bg-black/40 border-amber-500/20 hover:bg-amber-500/10 text-amber-100"
            }`}
          >
            🖨️ Ekspor Laporan
          </button>
        </div>
      </div>

      {/* ----------------- RINGKASAN DASHBOARD TAB ----------------- */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Active stats overview row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1a0a00]/40 border border-amber-500/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-[#D4A853] rounded-xl border border-amber-500/10">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-amber-100/40 uppercase font-mono">Staff Roster Aktif</span>
                <p className="text-lg font-bold font-serif text-amber-50">{users.length} Akun Terdaftar</p>
              </div>
            </div>

            <div className="bg-[#1a0a00]/40 border border-amber-500/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/10">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-amber-100/40 uppercase font-mono">Shift Berjalan Hari Ini</span>
                <p className="text-lg font-bold font-serif text-amber-50">
                  {schedules.filter(s => s.date === new Date().toISOString().split("T")[0]).length} Terjadwal
                </p>
              </div>
            </div>

            <div className="bg-[#1a0a00]/40 border border-amber-500/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/10">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-amber-100/40 uppercase font-mono">Tingkat Terlambat Minggu Ini</span>
                <p className="text-lg font-bold font-serif text-amber-50">
                  {attendances.filter(a => a.status === "Terlambat").length} Kali Rekaman
                </p>
              </div>
            </div>

            <div className="bg-[#1a0a00]/40 border border-amber-500/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/10">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-amber-100/40 uppercase font-mono">Tukar Shift Tertunda</span>
                <p className="text-lg font-bold font-serif text-amber-50">
                  {swaps.filter(s => s.status === "Pending").length} Pengajuan
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live active staff and interactive checklist */}
            <div className="lg:col-span-8 bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">🟢 Daftar Kehadiran Hari Ini ({new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })})</h4>
                  <p className="text-[11px] text-amber-200/50">Daftar staff yang dijadwalkan masuk kerja hari ini serta status clock in/out riil-nya.</p>
                </div>
                <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold uppercase animate-pulse">LIVE TRACKER</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-amber-200/50 font-mono text-[10px] uppercase">
                      <th className="py-2.5">Staff</th>
                      <th className="py-2.5">Role</th>
                      <th className="py-2.5">Shift Terjadwal</th>
                      <th className="py-2.5">Clock In</th>
                      <th className="py-2.5">Clock Out</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const todaySch = schedules.find(s => s.userId === user.id && s.date === todayStr);
                      const todayAtt = attendances.find(a => a.userId === user.id && a.date === todayStr);
                      
                      const shift = todaySch ? (shifts.find(sf => sf.id === todaySch.shiftId) || DEFAULT_SHIFTS[0]) : null;

                      return (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-3 font-semibold text-amber-250 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            {user.name}
                          </td>
                          <td className="py-3 text-[11px] text-amber-100/60 font-mono">{user.role}</td>
                          <td className="py-3">
                            {shift ? (
                              <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-bold ${shift.color}`}>
                                {shift.name} ({shift.startTime} - {shift.endTime})
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-100/30">Libur / Off</span>
                            )}
                          </td>
                          <td className="py-3 font-mono text-amber-300">{todayAtt?.checkIn || "—"}</td>
                          <td className="py-3 font-mono text-amber-300">{todayAtt?.checkOut || "—"}</td>
                          <td className="py-3">
                            {todayAtt ? (
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                                todayAtt.status === "Terlambat" ? "bg-red-500/10 text-red-400 border border-red-500/25" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                              }`}>
                                {todayAtt.status} {todayAtt.latenessMinutes > 0 ? `(${todayAtt.latenessMinutes}m)` : ""}
                              </span>
                            ) : todaySch ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#382006] text-amber-400/60 font-mono border border-amber-500/10">
                                Menunggu Absen
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-amber-100/20">
                                OFFLINE
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shift alert notifications panel */}
            <div className="lg:col-span-4 bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h4 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">🔔 Notifikasi &amp; Alert Log</h4>
                <p className="text-[11px] text-amber-200/50">Log otomatis aktivitas sistem absensi kerja.</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {notifications.map(notif => (
                  <div key={notif.id} className="p-3 bg-black/40 rounded-xl border border-amber-500/5 flex items-start gap-3">
                    <span className="text-base mt-0.5">
                      {notif.type === "alert" ? "📢" : notif.type === "success" ? "✅" : "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-amber-100 leading-normal font-medium">{notif.text}</p>
                      <span className="text-[9px] text-amber-100/30 font-mono mt-1 block">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- WEEKLY ROSTER SCHEDULER TAB ----------------- */}
      {activeTab === "schedule" && (
        <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h4 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">📋 Rencana &amp; Jadwal Shift Kerja Mingguan</h4>
              <p className="text-[11px] text-amber-205/50">Tetapkan penugasan shift harian karyawan. Klik pada kolom nama untuk menambah/mengubah jadwal mereka.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-black/50 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                <button onClick={() => changeWeek(-1)} className="text-amber-100 hover:text-amber-300 transition p-1 cursor-pointer font-bold"><ChevronLeft size={16} /></button>
                <span className="text-xs font-mono font-bold text-amber-300 whitespace-nowrap">
                  Pekan: {weekDates[0].toLocaleDateString("id-ID", { month: "short", day: "numeric" })} - {weekDates[6].toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <button onClick={() => changeWeek(1)} className="text-amber-100 hover:text-amber-300 transition p-1 cursor-pointer font-bold"><ChevronRight size={16} /></button>
              </div>

              {isManagement && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyPrevWeek}
                    className="bg-amber-500/10 hover:bg-amber-500/15 text-amber-200 border border-amber-500/25 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={13} /> Copy Pekan Lalu
                  </button>
                  <button
                    onClick={handleAutoRotate}
                    className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-3 py-1.5 rounded-xl text-[11px] font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={13} className="animate-spin-slow" /> Auto Rotate
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Color Guides */}
          <div className="flex flex-wrap items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/[0.03]">
            <span className="text-[10px] font-mono text-amber-100/40 uppercase">Legenda Shift harian:</span>
            {shifts.map(s => (
              <span key={s.id} className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${s.color}`}>
                {s.name} ({s.startTime} - {s.endTime})
              </span>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs table-fixed min-w-[800px]">
              <thead>
                <tr className="border-b border-white/5 text-amber-200/50 font-mono text-[10px] uppercase">
                  <th className="py-2.5 pl-2 w-[160px]">Karyawan</th>
                  {weekDates.map((date, idx) => (
                    <th key={idx} className="py-2.5 text-center">
                      <div>{date.toLocaleDateString("id-ID", { weekday: "short" })}</div>
                      <div className="text-[10px] text-amber-50 font-normal">{date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                    <td className="py-3 sticky left-0 bg-[#120501]/95 font-semibold text-amber-250 z-10 pl-2">
                      <div className="text-xs">{u.name}</div>
                      <div className="text-[9px] text-amber-100/40 font-mono tracking-wide">{u.role}</div>
                    </td>

                    {weekDates.map((date, dayIdx) => {
                      const dateStr = date.toISOString().split("T")[0];
                      const sRecord = schedules.find(s => s.userId === u.id && s.date === dateStr);
                      const shift = sRecord ? (shifts.find(sf => sf.id === sRecord.shiftId) || DEFAULT_SHIFTS[0]) : null;

                      const isEditingThis = editingCell?.userId === u.id && editingCell?.date === dateStr;

                      return (
                        <td 
                          key={dayIdx} 
                          className="py-2 text-center relative px-1"
                        >
                          {isEditingThis ? (
                            <div className="absolute inset-x-1 top-1 bg-[#1a0c04] border border-amber-500/50 rounded-xl p-2 z-20 space-y-1.5 shadow-2xl h-[125px]">
                              <select
                                value={selectedShiftId}
                                onChange={(e) => setSelectedShiftId(e.target.value)}
                                className="bg-black border border-amber-500/20 text-[10px] p-1 rounded text-amber-100 outline-none w-full font-bold"
                              >
                                {shifts.map(sf => (
                                  <option key={sf.id} value={sf.id} className="bg-amber-950 font-bold">{sf.name}</option>
                                ))}
                                <option value="clear" className="bg-red-950 text-red-300 font-bold">🚫 Kosongkan</option>
                              </select>
                              <input
                                type="text"
                                value={cellNote}
                                placeholder="Catatan shift..."
                                onChange={(e) => setCellNote(e.target.value)}
                                className="bg-black/40 border border-amber-500/15 p-1 text-[9px] rounded text-amber-150 outline-none w-full"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleAssignShift(u.id, dateStr)}
                                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-amber-950 text-[9px] py-1 font-bold rounded transition cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCell(null)}
                                  className="flex-1 bg-black text-amber-100 text-[9px] py-1 rounded transition border border-white/10 cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (isManagement) {
                                  setSelectedShiftId(sRecord?.shiftId || "s1");
                                  setCellNote(sRecord?.notes || "");
                                  setEditingCell({ userId: u.id, date: dateStr });
                                } else {
                                  triggerToast("ℹ️ Anda hanya diperkenankan melihat jadwal. Hubungi management untuk pergantian roster.");
                                }
                              }}
                              className={`w-full py-2.5 rounded-xl border transition flex flex-col items-center justify-center gap-0.5 min-h-[50px] cursor-pointer ${
                                shift 
                                  ? `${shift.color} hover:brightness-125` 
                                  : "border-dashed border-white/5 hover:border-amber-500/20 text-amber-100/10 hover:text-amber-300/40"
                              }`}
                            >
                              {shift ? (
                                <>
                                  <span className="text-[10px] font-bold">{shift.name.split(" ")[0]}</span>
                                  <span className="text-[8px] font-mono opacity-80">{shift.startTime}</span>
                                  {sRecord?.notes && (
                                    <span className="text-[7.5px] font-mono text-cyan-300 tracking-wide truncate max-w-[80px]" title={sRecord.notes}>
                                      💬 catat
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] font-medium font-mono uppercase tracking-widest text-amber-100/10">Off</span>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3 mt-4 text-[11px] text-amber-200/70">
            <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-250 block">Panduan Hak Akses Roster Mengedit Roster:</span>
              <p>
                Owner, Manager, &amp; Supervisor dibekali kewenangan langsung melakukan klik pada grid kalender mana pun untuk dengan instan mengatur ulang shift kerja mingguan kru. Sementara peran kru/staff biasa dikunci dalam mode read-only dan hanya dapat mengisolasikan peninjauan jadwal shift miliknya masing-masing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- INTERACTIVE MONTH MONTH CALENDAR TAB ----------------- */}
      {activeTab === "calendar" && (
        <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h4 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">🗓️ Struktur Kalender Interaktif Bulanan</h4>
              <p className="text-[11px] text-amber-200/50">Pemetaan visual penugasan roster shift kru secara bulanan.</p>
            </div>

            <div className="flex items-center gap-2 bg-black/50 border border-amber-500/20 px-3 py-1 rounded-xl">
              <button 
                onClick={() => {
                  const copy = new Date(currentMonth);
                  copy.setMonth(currentMonth.getMonth() - 1);
                  setCurrentMonth(copy);
                }}
                className="text-amber-105 hover:text-amber-300 transition p-1 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-mono font-bold text-amber-300">
                {currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </span>
              <button 
                onClick={() => {
                  const copy = new Date(currentMonth);
                  copy.setMonth(currentMonth.getMonth() + 1);
                  setCurrentMonth(copy);
                }}
                className="text-amber-105 hover:text-amber-300 transition p-1 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Weekdays header */}
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day, dIdx) => (
              <div key={dIdx} className="text-center text-[10px] font-mono uppercase font-black text-[#D4A853] py-1 border-b border-white/5">
                {day}
              </div>
            ))}

            {/* Days Grid */}
            {calendarDays.map((day, idx) => {
              // Find schedule assigned on this specific dateStr
              const daySchedules = schedules.filter(s => s.date === day.dateStr);

              return (
                <div 
                  key={idx} 
                  className={`min-h-[90px] border p-2 rounded-xl flex flex-col justify-between transition ${
                    day.isCurrentMonth 
                      ? "bg-black/35 border-amber-500/10 text-amber-50" 
                      : "bg-[#1e0a00]/5 border-transparent opacity-30 text-amber-50/40"
                  }`}
                >
                  <span className="text-xs font-mono font-bold self-end">{day.dayNum}</span>

                  <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[60px] scrollbar-thin">
                    {daySchedules.slice(0, 3).map((sc, scIdx) => {
                      const shift = shifts.find(sf => sf.id === sc.shiftId) || DEFAULT_SHIFTS[0];
                      const shiftBadgeStyle = shift.id === "s1" ? "bg-emerald-500" : shift.id === "s2" ? "bg-amber-500" : shift.id === "s3" ? "bg-indigo-500" : "bg-red-500";
                      return (
                        <div 
                          key={scIdx} 
                          className="flex items-center gap-1.5 text-[8.5px] leading-tight font-medium bg-white/[0.03] p-1 rounded border border-white/5"
                          title={`${sc.userName}: ${shift.name}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full inline-block shrink-0 ${shiftBadgeStyle}`}></span>
                          <span className="truncate text-amber-100/70">{sc.userName.substring(0, 10)}</span>
                        </div>
                      );
                    })}

                    {daySchedules.length > 3 && (
                      <div className="text-[7px] text-center text-amber-450 font-bold font-mono">
                        +{daySchedules.length - 3} Staff Lagi
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- CORE CLOCK IN OR OUT WITH QR CODE TAB ----------------- */}
      {activeTab === "attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="border-b border-white/5 pb-3">
              <h4 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">📱 Portal Biometrik &amp; Absensi Shift</h4>
              <p className="text-[11px] text-amber-205/50">Simulasikan clock in masuk kerja, mencatat rekam istirahat harian, serta check out pulang dengan lateness checking otomatis.</p>
            </div>

            {/* Simulated environment controllers */}
            <div className="bg-black/30 border border-amber-500/10 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-amber-150 uppercase tracking-wider font-mono font-bold block">Pilih Kru Untuk Absensi</label>
                <select
                  value={selectedStaffToScan}
                  onChange={(e) => setSelectedStaffToScan(e.target.value)}
                  className="bg-black border border-amber-500/20 text-xs p-2.5 rounded-xl text-amber-100 outline-none w-full font-semibold"
                >
                  <option value="" disabled>-- Pilih Karyawan --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id} className="bg-amber-950 font-semibold">{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-amber-150 uppercase tracking-wider font-mono font-bold block">Simulasi Jam Masuk/Pulang (WIB)</label>
                <input
                  type="time"
                  value={currentTimeManual}
                  onChange={(e) => setCurrentTimeManual(e.target.value)}
                  className="bg-black border border-amber-500/20 text-xs p-2.5 rounded-xl text-amber-100 outline-none w-full font-mono font-bold text-center"
                />
              </div>
            </div>

            {/* Interactive check in/out console panel */}
            {selectedStaffToScan ? (() => {
              const u = users.find(user => user.id === selectedStaffToScan);
              if (!u) return null;

              const todayStr = new Date().toISOString().split("T")[0];
              const todaySch = schedules.find(s => s.userId === u.id && s.date === todayStr);
              const todayAtt = attendances.find(a => a.userId === u.id && a.date === todayStr);
              
              const assignedShift = todaySch ? (shifts.find(sf => sf.id === todaySch.shiftId) || DEFAULT_SHIFTS[0]) : null;

              return (
                <div className="space-y-5 animate-fadeIn">
                  <div className="p-5 bg-gradient-to-r from-amber-500/5 to-transparent border border-[#D4A853]/15 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-amber-400 font-mono tracking-widest font-bold uppercase">Active Identity Session</span>
                      <p className="text-sm font-bold text-amber-50">{u.name}</p>
                      <p className="text-xs text-amber-100/50">Jabatan: {u.role} | ID: {u.staffCode || `STF-0${u.id}`}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[9px] text-amber-150 font-mono block uppercase">Jadwal Hari Ini:</span>
                      {assignedShift ? (
                        <span className={`inline-block border rounded-full px-3 py-0.5 text-xs font-bold ${assignedShift.color}`}>
                          {assignedShift.name} ({assignedShift.startTime} - {assignedShift.endTime})
                        </span>
                      ) : (
                        <span className="text-xs text-amber-100/25 italic">Libur / Tidak Terjadwal</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Clock in card */}
                    <div className="p-4 bg-black/45 rounded-2xl border border-emerald-500/10 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-bold">1. Entry Portal</span>
                          <span className="text-lg">📥</span>
                        </div>
                        <p className="text-xs text-amber-100/60 leading-normal mt-2">Mulai absen masuk. Jam ketepatan waktu di bawah threshold keterlambatan.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClockIn(u.id)}
                        disabled={!!todayAtt?.checkIn}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          todayAtt?.checkIn 
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/50 cursor-not-allowed" 
                            : "bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg"
                        }`}
                      >
                        {todayAtt?.checkIn ? `✓ In ${todayAtt.checkIn}` : "Absen Clock In"}
                      </button>
                    </div>

                    {/* Break logs card */}
                    <div className="p-4 bg-black/45 rounded-2xl border border-cyan-500/10 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider font-bold">2. Rest Track</span>
                          <span className="text-lg">⏱️</span>
                        </div>
                        <p className="text-xs text-amber-100/60 leading-normal mt-2">Gunakan istirahat shift agar durasi break terdokumentasikan rapi di audit log.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleBreak(u.id)}
                        disabled={!todayAtt || !!todayAtt.breakEndTime}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          !todayAtt 
                            ? "bg-[#291e14]/50 text-amber-100/15 border border-white/5 cursor-not-allowed"
                            : todayAtt.breakStartTime && !todayAtt.breakEndTime 
                              ? "bg-cyan-500 hover:bg-cyan-600 text-black animate-pulse" 
                              : todayAtt.breakEndTime 
                                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400/50 cursor-not-allowed"
                                : "bg-black/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                        }`}
                      >
                        {!todayAtt 
                          ? "Offline" 
                          : todayAtt.breakStartTime && !todayAtt.breakEndTime 
                            ? "End Rest Time" 
                            : todayAtt.breakEndTime 
                              ? `Selesai Rest (${todayAtt.totalBreakMinutes}m)` 
                              : "Start Rest Break"
                        }
                      </button>
                    </div>

                    {/* Clock out card */}
                    <div className="p-4 bg-black/45 rounded-2xl border border-amber-500/10 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#D4A853] font-mono uppercase tracking-wider font-bold">3. Exit Portal</span>
                          <span className="text-lg">📤</span>
                        </div>
                        <p className="text-xs text-amber-100/60 leading-normal mt-2">Mulai absen pulang. Lemburan otomatis diverifikasi bila melewati jam shift.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClockOut(u.id)}
                        disabled={!todayAtt || !!todayAtt.checkOut}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          !todayAtt 
                            ? "bg-[#291e14]/50 text-amber-100/15 border border-white/5 cursor-not-allowed"
                            : todayAtt.checkOut 
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-300/50 cursor-not-allowed" 
                              : "bg-amber-500 hover:bg-amber-600 text-black shadow-lg"
                        }`}
                      >
                        {todayAtt?.checkOut ? `✓ Out ${todayAtt.checkOut}` : "Absen Clock Out"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="p-8 text-center bg-black/20 border border-dashed border-amber-500/10 rounded-2xl text-amber-100/30 text-xs">
                💡 Silakan pilih salah satu kru pada kolom di atas untuk mensimulasikan gerbang absensi clock-in, clock-out ataupun break time harian mereka.
              </div>
            )}
          </div>

          {/* RIGHT COL: PESONAL STAFF QR CARD */}
          <div className="lg:col-span-4 bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h4 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">🎫 Personal Staff QR Code</h4>
                <p className="text-[11px] text-amber-200/50">Otorisasi scan QR digital tiap kru.</p>
              </div>

              {(() => {
                const u = users.find(usr => usr.id === selectedStaffToScan) || users[0];
                if (!u) return <div className="text-center text-[11px] text-amber-100/40 opacity-50">Kru tidak ditemukan</div>;

                const tokenValue = `COFFEEOPS-AUTH-STF-${u.id}-${u.role.toUpperCase()}`;

                return (
                  <div className="bg-gradient-to-b from-[#211103] to-[#120501] border border-[#D4A853]/20 rounded-2xl p-5 text-center space-y-4 relative overflow-hidden shadow-inner flex flex-col items-center">
                    {/* Retro coffee-beans background glow */}
                    <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-full filter blur-xl"></div>
                    
                    <span className="text-[9px] font-mono bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      COFFEEOPS ROSTER PASS
                    </span>

                    {/* Simulated High-Res Custom QR Layout inside CSS to make it incredibly look realistic */}
                    <div className="h-32 w-32 bg-amber-50 p-3 rounded-xl border-4 border-[#D4A853] relative flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                      {/* Generates a nice retro algorithmic grid representation using dots */}
                      <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-90">
                        {"1010101001111000101011110".split("").map((ch, bitIdx) => (
                          <div 
                            key={bitIdx} 
                            className={`rounded-sm ${ch === "1" ? "bg-amber-955" : "bg-transparent"} ${
                              bitIdx === 0 || bitIdx === 4 || bitIdx === 20 || bitIdx === 24 
                                ? "bg-amber-950 border border-amber-900" 
                                : ""
                            }`}
                          ></div>
                        ))}
                      </div>
                      <div className="absolute inset-0 m-auto h-8 w-8 bg-amber-50 border border-[#D4A853] rounded-lg flex items-center justify-center font-serif font-black text-xs text-amber-950">
                        {u.name.substring(0,1).toUpperCase()}{u.name.substring(u.name.indexOf(" ")+1, u.name.indexOf(" ")+2).toUpperCase() || "O"}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-amber-50">{u.name}</p>
                      <p className="text-[10px] text-amber-100/35 font-mono">{u.role}</p>
                      <span className="text-[9px] text-amber-300 font-mono select-all block bg-black/40 px-2 py-0.5 rounded border border-white/5 mt-1.5 truncate max-w-[200px]">
                        {tokenValue}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        triggerToast(`✓ Otorisasi Staff Token disalin: ${tokenValue}`);
                      }}
                      className="text-[10px] font-mono font-bold text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={11} /> Salin Kode Otorisasi
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="bg-black/40 p-3.5 rounded-xl border border-amber-500/10 text-[10.5px] text-amber-200/50 mt-4 font-mono leading-relaxed">
              🔑 Gunakan token di atas atau kumpulkan pas scan QR digital ini dalam smartphone masing-masing karyawan untuk instan tap gerbang mesin.
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SHIFT SWAP SYSTEM TAB ----------------- */}
      {activeTab === "swap" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Swap Request form */}
          <div className="lg:col-span-5 bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h4 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">✍️ Pengajuan Pertukaran Shift Kerja baru</h4>
              <p className="text-[11px] text-amber-200/50">Formulir pengalihan roster antar rekan satu outlet harian.</p>
            </div>

            <form onSubmit={handleSubmitSwap} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-100/40 uppercase font-mono block">Pemohon (Awal)</label>
                  <select
                    value={swapRequestor}
                    onChange={(e) => setSwapRequestor(e.target.value)}
                    className="bg-black border border-amber-500/15 focus:border-[#D4A853] p-2.5 rounded-xl text-amber-100 outline-none w-full"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id} className="bg-amber-955">{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-100/40 uppercase font-mono block">Rekan Tujuan</label>
                  <select
                    value={swapTarget}
                    onChange={(e) => setSwapTarget(e.target.value)}
                    className="bg-black border border-amber-500/15 focus:border-[#D4A853] p-2.5 rounded-xl text-amber-100 outline-none w-full"
                  >
                    <option value="">-- Cari Rekan --</option>
                    {users.filter(u => u.id !== swapRequestor).map(u => (
                      <option key={u.id} value={u.id} className="bg-amber-955">{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-100/40 uppercase font-mono block">Tanggal Shift Pemohon</label>
                  <input
                    type="date"
                    value={swapDateRequestor}
                    onChange={(e) => setSwapDateRequestor(e.target.value)}
                    className="bg-black border border-amber-500/15 p-2.5 rounded-xl text-amber-100 outline-none w-full text-center"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-100/40 uppercase font-mono block">Tanggal Shift Target</label>
                  <input
                    type="date"
                    value={swapDateTarget}
                    onChange={(e) => setSwapDateTarget(e.target.value)}
                    className="bg-black border border-amber-500/15 p-2.5 rounded-xl text-amber-100 outline-none w-full text-center"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase font-mono block">Alasan Penukaran</label>
                <textarea
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Contoh: Ada keperluan keluarga mendadak atau urusan perkuliahan..."
                  className="bg-black/40 border border-amber-500/15 p-3 rounded-xl text-amber-100 outline-none w-full h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeftRight size={13} /> Kirim Pengajuan Tukar
              </button>
            </form>
          </div>

          {/* Swap request queue logs */}
          <div className="lg:col-span-7 bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h4 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">📋 Riwayat &amp; Status Pengajuan Tukar Shift</h4>
              <p className="text-[11px] text-amber-205/50">Daftar rekap persetujuan perpindahan jadwal harian staff.</p>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1">
              {swaps.map(req => {
                const reqUser = users.find(u => u.id === req.requestorId);
                const tarUser = users.find(u => u.id === req.targetId);
                const reqSh = shifts.find(s => s.id === req.requestorShiftId) || DEFAULT_SHIFTS[0];
                const tarSh = shifts.find(s => s.id === req.targetShiftId) || DEFAULT_SHIFTS[0];

                return (
                  <div key={req.id} className="p-4 bg-black/45 rounded-2xl border border-amber-500/10 space-y-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono tracking-widest text-[#D4A853] font-bold uppercase block">ID REQUEST: {req.id}</span>
                        <span className="text-[10px] text-amber-100/40 font-mono">Dibuat: {req.createdAt}</span>
                      </div>

                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        req.status === "Approved" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                          : req.status === "Rejected" 
                            ? "bg-red-500/10 text-red-405 border border-red-500/25" 
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse"
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl space-y-1">
                        <div className="text-[10px] text-amber-100/40 uppercase font-mono">Pihak 1 (Pemohon)</div>
                        <p className="font-bold text-amber-250 truncate">{req.requestorName}</p>
                        <span className={`inline-block mt-1 text-[9px] font-bold border rounded-full px-2 py-0.5 ${reqSh.color}`}>
                          {req.dateRequested} / {reqSh.name}
                        </span>
                      </div>

                      <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl space-y-1">
                        <div className="text-[10px] text-amber-100/40 uppercase font-mono">Pihak 2 (Tujuan)</div>
                        <p className="font-bold text-amber-250 truncate">{req.targetName}</p>
                        <span className={`inline-block mt-1 text-[9px] font-bold border rounded-full px-2 py-0.5 ${tarSh.color}`}>
                          {req.dateTarget} / {tarSh.name}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#1e0a01]/60 rounded-xl border border-amber-500/5 text-xs text-amber-100/75 leading-relaxed italic">
                      💡 <b>Alasan:</b> "{req.reason}"
                    </div>

                    {req.status === "Pending" && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleApproveSwap(req.id, true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3  py-1.5 rounded-xl transition cursor-pointer"
                        >
                          Approve Swap
                        </button>
                        <button
                          onClick={() => handleApproveSwap(req.id, false)}
                          className="bg-red-600 hover:bg-red-750 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          Reject Request
                        </button>
                      </div>
                    )}

                    {req.status === "Approved" && req.approvedBy && (
                      <div className="text-[10.5px] font-mono text-emerald-400 text-right">
                        ✓ Disetujui oleh: <b>{req.approvedBy}</b>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- REPORTS EXPORT SYSTEM TAB ----------------- */}
      {activeTab === "reports" && (
        <div className="bg-[#120501]/80 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
          <div className="border-b border-white/5 pb-3">
            <h4 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">🖨️ Ekspor &amp; Rekapitulasi Laporan Shift Operasional</h4>
            <p className="text-[11px] text-amber-200/50">Unduh data instan dalam format CSV terstruktur (kompatibel penuh dengan Microsoft Excel, Google Sheets &amp; PDF parser).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Laporan 1: Jadwal Shift */}
            <div className="p-5 bg-black/45 rounded-2xl border border-amber-500/10 flex flex-col justify-between shadow-lg hover:border-amber-500/30 transition duration-300">
              <div className="space-y-2">
                <div className="bg-amber-500/10 text-amber-400 p-2.5 rounded-xl inline-block border border-amber-500/10">
                  <Calendar className="h-5 w-5" />
                </div>
                <h5 className="font-serif font-bold text-sm text-amber-50">Laporan Jadwal Shift</h5>
                <p className="text-[11px] text-amber-100/50 leading-relaxed">Ekspor rekapitulasi data rencana sebaran shift kerja mingguan (roster) seluruh staff secara transparan.</p>
              </div>

              <button
                type="button"
                onClick={() => downloadReportFile("schedule")}
                className="mt-6 w-full bg-[#1b0a01] hover:bg-amber-500 hover:text-[#1a0a00]/95 text-amber-300 border border-amber-500/30 p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={13} /> Ekspor CSV Roster
              </button>
            </div>

            {/* Laporan 2: Absensi */}
            <div className="p-5 bg-black/45 rounded-2xl border border-amber-500/10 flex flex-col justify-between shadow-lg hover:border-amber-500/30 transition duration-300">
              <div className="space-y-2">
                <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl inline-block border border-emerald-500/10">
                  <Clock className="h-5 w-5" />
                </div>
                <h5 className="font-serif font-bold text-sm text-amber-50">Log Kehadiran Harian</h5>
                <p className="text-[11px] text-amber-100/50 leading-relaxed">Ekspor rekap presisi penugasan, clock-in, clock-out, break-time, serta total jam kerja produktif bulanan staff.</p>
              </div>

              <button
                type="button"
                onClick={() => downloadReportFile("attendance")}
                className="mt-6 w-full bg-[#1b0a01] hover:bg-amber-500 hover:text-[#1a0a00]/95 text-amber-300 border border-amber-500/30 p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={13} /> Ekspor CSV Absensi
              </button>
            </div>

            {/* Laporan 3: Rekap keterlambatan */}
            <div className="p-5 bg-black/45 rounded-2xl border border-amber-500/10 flex flex-col justify-between shadow-lg hover:border-amber-500/30 transition duration-300">
              <div className="space-y-2">
                <div className="bg-red-500/10 text-red-400 p-2.5 rounded-xl inline-block border border-red-500/10">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h5 className="font-serif font-bold text-sm text-amber-50">Rekap Keterlambatan</h5>
                <p className="text-[11px] text-amber-100/50 leading-relaxed">Ekspor rekap kalkulasi akumulasi menit terlambat beserta analisis denda insentif per periode kerja.</p>
              </div>

              <button
                type="button"
                onClick={() => downloadReportFile("latency")}
                className="mt-6 w-full bg-[#1b0a01] hover:bg-amber-500 hover:text-[#1a0a00]/95 text-amber-300 border border-amber-500/30 p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={13} /> Ekspor Keterlambatan
              </button>
            </div>

            {/* Laporan 4: Rekap overtime */}
            <div className="p-5 bg-black/45 rounded-2xl border border-amber-500/10 flex flex-col justify-between shadow-lg hover:border-amber-500/30 transition duration-300">
              <div className="space-y-2">
                <div className="bg-[#D4A853]/10 text-[#D4A853] p-2.5 rounded-xl inline-block border border-[#D4A853]/15">
                  <FileCheck className="h-5 w-5" />
                </div>
                <h5 className="font-serif font-bold text-sm text-amber-50">Rekap Overtime Lembur</h5>
                <p className="text-[11px] text-amber-100/50 leading-relaxed">Ekspor audit log jam lemburan terverifikasi yang diajukan staff pada akhir shift untuk keperluan payroll keuangan.</p>
              </div>

              <button
                type="button"
                onClick={() => downloadReportFile("overtime")}
                className="mt-6 w-full bg-[#1b0a01] hover:bg-amber-500 hover:text-[#1a0a00]/95 text-amber-300 border border-amber-500/30 p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={13} /> Ekspor Audit Lembur
              </button>
            </div>
          </div>

          <div className="bg-[#291605]/50 border border-amber-500/10 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-amber-200 uppercase block">🔐 Ringkasan Otoritas Laporan Finansial:</span>
              <p className="text-[11px] text-amber-100/60 max-w-2xl leading-normal">
                Dokumen laporan rekapitulasi di atas diisolasi dan diasuransikan kerahasiaannya. Hanya kru berkedudukan <b>Owner</b> atau <b>Manager</b> yang diizinkan mengunduh audit log guna kebutuhan perhitungan gaji bulanan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ SECURITY AUDIT STATUS */}
      <div className="bg-black/35 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert size={15} className="text-amber-400" />
          <span className="text-amber-100/50">Keamanan Akses Roster:</span>
          <span className="text-[#D4A853] font-bold uppercase text-[10px] tracking-widest bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
            ROLE-BASED STATUS ENABLED
          </span>
        </div>
        <p className="text-amber-100/35 text-[10px] font-mono">
          System Core ID: SB-COF-SCH-2026 • Verified TLS 1.3
        </p>
      </div>

    </div>
  );
}
