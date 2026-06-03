import React, { useState, useRef } from "react";
import { useCamera } from "../hooks/useCamera";
import { CoffeeOpsState, DailyChecklistRecord, CalibrationLog, StockCheckLog, TemperatureLog, ShiftHandover, IncidentLogItem } from "../types";

const defaultChecklistRules: { id: string; type: "opening" | "closing" | "cleaning"; category: string; task: string }[] = [
  { id: "op-1", type: "opening", category: "Mesin Espresso", task: "Mesin menyala" },
  { id: "op-2", type: "opening", category: "Mesin Espresso", task: "Tekanan boiler normal" },
  { id: "op-3", type: "opening", category: "Mesin Espresso", task: "Group head bersih" },
  { id: "op-4", type: "opening", category: "Mesin Espresso", task: "Backflush selesai" },
  { id: "op-5", type: "opening", category: "Grinder", task: "Hopper bersih" },
  { id: "op-6", type: "opening", category: "Grinder", task: "Kalibrasi dilakukan" },
  { id: "op-7", type: "opening", category: "Grinder", task: "Dose sesuai standar" },
  { id: "op-8", type: "opening", category: "Bar", task: "Es batu tersedia" },
  { id: "op-9", type: "opening", category: "Bar", task: "Susu tersedia" },
  { id: "op-10", type: "opening", category: "Bar", task: "Syrup tersedia" },
  { id: "op-11", type: "opening", category: "Bar", task: "Cup tersedia" },
  { id: "op-12", type: "opening", category: "Kebersihan", task: "Lantai bersih" },
  { id: "op-13", type: "opening", category: "Kebersihan", task: "Toilet bersih" },
  { id: "op-14", type: "opening", category: "Kebersihan", task: "Area customer bersih" },
  
  { id: "cln-1", type: "cleaning", category: "Espresso Machine", task: "Backflush detergent" },
  { id: "cln-2", type: "cleaning", category: "Espresso Machine", task: "Backflush water" },
  { id: "cln-3", type: "cleaning", category: "Espresso Machine", task: "Steam wand cleaning" },
  { id: "cln-4", type: "cleaning", category: "Grinder", task: "Hopper cleaning" },
  { id: "cln-5", type: "cleaning", category: "Grinder", task: "Burr inspection" },
  { id: "cln-6", type: "cleaning", category: "Bar Area", task: "Counter cleaning" },
  { id: "cln-7", type: "cleaning", category: "Bar Area", task: "Sink cleaning" },

  { id: "cl-1", type: "closing", category: "Cash", task: "Cash Count (Hitung Kas Laci)" },
  { id: "cl-2", type: "closing", category: "Cash", task: "Rekonsiliasi EDC & Tunai dengan POS" },
  { id: "cl-3", type: "closing", category: "Inventory", task: "Cek Par Stock & Sisa Susu" },
  { id: "cl-4", type: "closing", category: "Mesin", task: "Backflush detergent grouphead" },
  { id: "cl-5", type: "closing", category: "Mesin", task: "Shutdown Mesin Espresso" },
  { id: "cl-6", type: "closing", category: "Mesin", task: "Bersihkan Milk Steam Wand" },
  { id: "cl-7", type: "closing", category: "Kebersihan", task: "Bersihkan Kulkas Bar" },
  { id: "cl-8", type: "closing", category: "Kebersihan", task: "Pel lantai Bar & Area Dining" },
  { id: "cl-9", type: "closing", category: "Kebersihan", task: "Buang sampah ke TPS" }
];

const defaultHandoverFields = [
  { id: "hof-1", label: "Sisa Susu Creamer" },
  { id: "hof-2", label: "Stok Vanilla Syrup" },
  { id: "hof-3", label: "Setelan Grinder Pagi" }
];

interface DailySopLogsProps {
  state: CoffeeOpsState;
  syncState: (nextState: CoffeeOpsState) => Promise<any> | any;
  triggerToast: (msg: string) => void;
}

export default function DailySopLogs({ state, syncState, triggerToast }: DailySopLogsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "checklists" | "calibration" | "stockcheck" | "temp" | "handover" | "incidents">("dashboard");
  
  // Active date filter (Default to today)
  const todayStr = "2026-06-01";
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const users = state.users || [
    { id: "u1", name: "Dario Owner", role: "Owner" },
    { id: "u2", name: "Mega Manager", role: "Manager" },
    { id: "u3", name: "Adit Barista", role: "Barista" }
  ];

  // Helper selectors
  const checklists = state.dailyChecklists || [];
  const calibrations = state.calibrationLogs || [];
  const stockChecks = state.stockCheckLogs || [];
  const temps = state.temperatureLogs || [];
  const handovers = state.shiftHandovers || [];
  const incidents = state.incidentLogs || [];

  // ==========================================
  // 1. OPENING / CLOSING / CLEANING CHECKLIST STATE & ACTIONS
  // ==========================================
  const [chkType, setChkType] = useState<"opening" | "closing" | "cleaning">("opening");
  const [chkStaff, setChkStaff] = useState(users[0]?.name || "");
  const [chkShift, setChkShift] = useState("Pagi");
  const [chkOutlet, setChkOutlet] = useState("Bar Utama");
  const [chkNotes, setChkNotes] = useState("");
  const [chkPhoto, setChkPhoto] = useState<string>("");

  // Camera hook setup
  const camera = useCamera();
  const sopVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment");

  const startCheckingCamera = async (facing: "user" | "environment" = "environment") => {
    setCameraError("");
    try {
      setCameraFacing(facing);
      const stream = await camera.start(facing);
      setTimeout(() => {
        if (sopVideoRef.current) {
          sopVideoRef.current.srcObject = stream;
        }
      }, 100);
      triggerToast(`🎥 Kamera hardware aktif (${facing === "environment" ? "Belakang" : "Depan"})`);
    } catch (err: any) {
      setCameraError(err.message || "Gagal membuka akses kamera.");
      triggerToast("⚠️ Gagal mengakses kamera.");
    }
  };

  const handleCapturePhoto = () => {
    if (!sopVideoRef.current) return;
    const dataUrl = camera.capture(sopVideoRef.current);
    if (dataUrl) {
      setChkPhoto(dataUrl);
      camera.stop();
      triggerToast("🎉 Berhasil mengambil foto bukti harian!");
    } else {
      triggerToast("⚠️ Gagal menangkap gambar dari frame video.");
    }
  };

  const handleNativeCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setChkPhoto(reader.result as string);
      triggerToast("✓ Foto bukti berhasil terunggah!");
    };
    reader.readAsDataURL(file);
  };

  // Dynamic checklist templates from state or fallback
  const sopRules = state.dailySopChecklistRules || defaultChecklistRules;

  const [activeChecklistItems, setActiveChecklistItems] = useState<{ id: string; category: string; task: string; completed: boolean }[]>(() => {
    return (state.dailySopChecklistRules || defaultChecklistRules)
      .filter((r) => r.type === "opening")
      .map((r) => ({ id: r.id, category: r.category, task: r.task, completed: false }));
  });

  const handleSwitchChecklistType = (type: "opening" | "closing" | "cleaning") => {
    setChkType(type);
    const currentRules = state.dailySopChecklistRules || defaultChecklistRules;
    const filtered = currentRules
      .filter((r) => r.type === type)
      .map((r) => ({ id: r.id, category: r.category, task: r.task, completed: false }));
    setActiveChecklistItems(filtered);
  };

  const handleToggleChecklistItem = (id: string) => {
    setActiveChecklistItems(activeChecklistItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  // Sync active checklist items dynamic update when custom rules are changed
  React.useEffect(() => {
    const currentRules = state.dailySopChecklistRules || defaultChecklistRules;
    const currentCompletedMap = new Map(activeChecklistItems.map(item => [item.id, item.completed]));
    const updated = currentRules
      .filter((r) => r.type === chkType)
      .map((r) => ({
        id: r.id,
        category: r.category,
        task: r.task,
        completed: currentCompletedMap.get(r.id) || false
      }));
    setActiveChecklistItems(updated);
  }, [state.dailySopChecklistRules, chkType]);

  // Checklist Rule configuration states
  const [showRulesConfig, setShowRulesConfig] = useState(false);
  const [newRuleTask, setNewRuleTask] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState("Mesin Espresso");
  const [newRuleType, setNewRuleType] = useState<"opening" | "closing" | "cleaning">("opening");

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRuleTask, setEditingRuleTask] = useState("");
  const [editingRuleCategory, setEditingRuleCategory] = useState("");

  const handleAddSopRule = async () => {
    if (!newRuleTask) {
      triggerToast("Isi nama peraturan rincian checklist terlebih dahulu!");
      return;
    }
    const rulesList = state.dailySopChecklistRules || defaultChecklistRules;
    const newRule = {
      id: `sop-rule-${Date.now()}`,
      type: newRuleType,
      category: newRuleCategory,
      task: newRuleTask
    };
    
    await syncState({
      ...state,
      dailySopChecklistRules: [...rulesList, newRule]
    });
    triggerToast("✓ Peraturan checklist baru ditambahkan!");
    setNewRuleTask("");
  };

  const handleDeleteSopRule = async (id: string) => {
    if (!window.confirm("Hapus rincian peraturan ini? Ini akan membuangnya dari template checklist mendatang.")) {
      return;
    }
    const rulesList = state.dailySopChecklistRules || defaultChecklistRules;
    await syncState({
      ...state,
      dailySopChecklistRules: rulesList.filter(r => r.id !== id)
    });
    triggerToast("🗑️ Peraturan checklist berhasil dihapus!");
  };

  const handleSaveEditedSopRule = async (id: string) => {
    if (!editingRuleTask) {
      triggerToast("Nama tugas tidak boleh kosong!");
      return;
    }
    const rulesList = state.dailySopChecklistRules || defaultChecklistRules;
    await syncState({
      ...state,
      dailySopChecklistRules: rulesList.map(r => r.id === id ? { ...r, task: editingRuleTask, category: editingRuleCategory } : r)
    });
    triggerToast("✓ Rincian peraturan checklist berhasil diperbarui!");
    setEditingRuleId(null);
  };

  const handleSubmitChecklist = async () => {
    if (!chkStaff) {
      triggerToast("Pilih staff penanggungjawab terlebih dahulu.");
      return;
    }

    const completedCount = activeChecklistItems.filter(i => i.completed).length;
    const progressPercent = Math.round((completedCount / activeChecklistItems.length) * 100);
    
    let statusValue: "Belum Dikerjakan" | "Sedang Dikerjakan" | "Selesai" = "Belum Dikerjakan";
    if (progressPercent === 100) statusValue = "Selesai";
    else if (progressPercent > 0) statusValue = "Sedang Dikerjakan";

    const newRecord: DailyChecklistRecord = {
      id: `CH-${Date.now()}`,
      type: chkType,
      date: selectedDate,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      staff: chkStaff,
      shift: chkShift,
      outlet: chkOutlet,
      status: statusValue,
      notes: chkNotes || undefined,
      photoUrl: chkPhoto || undefined,
      items: activeChecklistItems
    };

    const nextState = {
      ...state,
      dailyChecklists: [newRecord, ...(state.dailyChecklists || [])],
      activities: [
        {
          id: `ACT-${Date.now()}`,
          icon: "✅",
          text: `SOP Checklist ${chkType.toUpperCase()} diisi oleh ${chkStaff} (${progressPercent}% Selesai, Status: ${statusValue})`,
          type: "info" as const,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        },
        ...(state.activities || [])
      ]
    };

    await syncState(nextState);
    triggerToast(`✓ SOP Checklist ${chkType} tersimpan.`);
    
    // Clear notes & photo
    setChkNotes("");
    setChkPhoto("");
    // Re-initialize current items to uncompleted
    handleSwitchChecklistType(chkType);
  };

  // ==========================================
  // 2. CALIBRATION DIAL-IN LOGS ACTIONS
  // ==========================================
  const [calBeans, setCalBeans] = useState("Ethiopia Blend");
  const [calDose, setCalDose] = useState(18.0);
  const [calYield, setCalYield] = useState(36.0);
  const [calTime, setCalTime] = useState(29);
  const [calGrinder, setCalGrinder] = useState("4.2");
  const [calBarista, setCalBarista] = useState(users[0]?.name || "");
  const [calStatus, setCalStatus] = useState<"Pass" | "Fail">("Pass");
  const [calNotes, setCalNotes] = useState("");

  const handleSubmitCalibration = async () => {
    if (!calBarista) {
      triggerToast("Pilih Barista penanggungjawab.");
      return;
    }

    const newCalRecord: CalibrationLog = {
      id: `CAL-${Date.now()}`,
      date: selectedDate,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      coffeeBatch: calBeans,
      dose: calDose,
      yield: calYield,
      timeSec: calTime,
      grinderSetting: calGrinder,
      barista: calBarista,
      status: calStatus,
      notes: calNotes || undefined
    };

    const nextState = {
      ...state,
      calibrationLogs: [newCalRecord, ...(state.calibrationLogs || [])],
      activities: [
        {
          id: `ACT-${Date.now()}`,
          icon: "☕",
          text: `Dial-In Kalibrasi oleh ${calBarista}: ${calBeans}, setting ${calGrinder} (${calStatus})`,
          type: "info" as const,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        },
        ...(state.activities || [])
      ]
    };

    await syncState(nextState);
    triggerToast(`✓ Log Kalibrasi dial-in tersimpan (${calStatus}).`);
    setCalNotes("");
  };

  // ==========================================
  // 3. STOCK CHECK (AUDITING & VARIANCE REPORT)
  // ==========================================
  // Prepare our items list with System Quantity
  // Summing the location 'bar' and 'gudang' stock levels
  const [checkedItemsState, setCheckedItemsState] = useState<{ [code: string]: number }>({});
  const [stockCheckNotes, setStockCheckNotes] = useState("");
  const [stockCheckStaff, setStockCheckStaff] = useState(users[0]?.name || "");

  const handleStockCheckedChange = (code: string, val: number) => {
    setCheckedItemsState({
      ...checkedItemsState,
      [code]: val
    });
  };

  const handleSaveStockCheck = async () => {
    if (!stockCheckStaff) {
      triggerToast("Pilih staff yang mengaudit.");
      return;
    }

    const auditItemsList = state.master.map(item => {
      const activeInv = state.inventory[item.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
      const systemQty = Math.max(0, activeInv.awal + activeInv.masuk - activeInv.keluar - activeInv.waste);
      const actualQty = checkedItemsState[item.code] !== undefined ? checkedItemsState[item.code] : systemQty;
      const variance = actualQty - systemQty;
      const itemPrice = item.price || 0;
      const varianceCost = parseFloat((variance * itemPrice).toFixed(2));

      return {
        code: item.code,
        name: item.name,
        systemQty,
        actualQty,
        unit: item.unit,
        variance,
        varianceCost
      };
    });

    const finalAuditItems = auditItemsList.filter(ai => ai.variance !== 0);

    const newAuditLog: StockCheckLog = {
      id: `SC-${Date.now()}`,
      date: selectedDate,
      staff: stockCheckStaff,
      items: auditItemsList,
      notes: stockCheckNotes || undefined
    };

    // Construct next system state
    // Automatically deduct or add variance to current stock by posting into wastewater or adjusting stock counts
    const adjustedInventory = { ...state.inventory };
    const generatedWastes = [...(state.wastes || [])];
    const generatedActivities = [...(state.activities || [])];

    finalAuditItems.forEach(ai => {
      // If we find leakage or deficit, we dynamically insert a waste record to reconcile the books!
      if (ai.variance < 0) {
        generatedWastes.push({
          id: `WST-RECON-${Date.now()}-${ai.code}`,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          rawDate: selectedDate,
          code: ai.code,
          name: ai.name,
          qty: Math.abs(ai.variance),
          unit: ai.unit,
          cause: "Selisih Audit Fisik (Stock Opname)",
          loss: Math.abs(ai.varianceCost),
          by: stockCheckStaff,
          action: "Re-adjustment"
        });

        // Mutate inventory to sync actual books
        adjustedInventory[ai.code] = {
          ...adjustedInventory[ai.code],
          waste: parseFloat((adjustedInventory[ai.code].waste + Math.abs(ai.variance)).toFixed(4))
        };
      } else if (ai.variance > 0) {
        // Surplus adjustments are placed into inside receiving
        adjustedInventory[ai.code] = {
          ...adjustedInventory[ai.code],
          masuk: parseFloat((adjustedInventory[ai.code].masuk + ai.variance).toFixed(4))
        };
      }
    });

    generatedActivities.unshift({
      id: `ACT-${Date.now()}`,
      icon: "📋",
      text: `Stock Opname Audit oleh ${stockCheckStaff} (${finalAuditItems.length} item selisih disesuaikan)`,
      type: "info" as const,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    });

    const nextState = {
      ...state,
      inventory: adjustedInventory,
      wastes: generatedWastes,
      stockCheckLogs: [newAuditLog, ...(state.stockCheckLogs || [])],
      activities: generatedActivities
    };

    await syncState(nextState);
    triggerToast(`✓ Re-rekonsiliasi Stock Opname aman. ${finalAuditItems.length} selisih disinkronkan ke pembukuan!`);
    setCheckedItemsState({});
    setStockCheckNotes("");
  };

  // ==========================================
  // 4. TEMPERATURE LOGS
  // ==========================================
  const [tempStaff, setTempStaff] = useState(users[0]?.name || "");
  const [chillerT, setChillerT] = useState(3.0);
  const [freezerT, setFreezerT] = useState(-18.0);
  const [milkStorageT, setMilkStorageT] = useState(4.0);
  const [tempNotes, setTempNotes] = useState("");

  const handleSubmitTemp = async () => {
    if (!tempStaff) {
      triggerToast("Pilih staff penanggungjawab pencatat suhu.");
      return;
    }

    // Safety checks: Chiller should be 2-4°C, Freezer below -15°C, Milk storage 2-4°C
    const isAlert = chillerT < 1 || chillerT > 6 || freezerT > -12 || milkStorageT < 1 || milkStorageT > 5;
    const statusVal: "OK" | "ALERT" = isAlert ? "ALERT" : "OK";

    const newTempRecord: TemperatureLog = {
      id: `TMP-${Date.now()}`,
      date: selectedDate,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      staff: tempStaff,
      chillerTemp: chillerT,
      freezerTemp: freezerT,
      milkStorageTemp: milkStorageT,
      status: statusVal,
      notes: tempNotes || undefined
    };

    const nextState = {
      ...state,
      temperatureLogs: [newTempRecord, ...(state.temperatureLogs || [])],
      activities: [
        {
          id: `ACT-${Date.now()}`,
          icon: "🌡️",
          text: `Suhu area dingin dicatat ${tempStaff}: Chiller ${chillerT}°C, Freezer ${freezerT}°C (${statusVal})`,
          type: "info" as const,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        },
        ...(state.activities || [])
      ]
    };

    await syncState(nextState);
    triggerToast(`✓ Log suhu tercatat (${statusVal}).`);
    setTempNotes("");
    if (isAlert) {
      alert(`⚠️ PERINGATAN: Suhu tidak berada dalam rentang aman standar kualitas! Harap periksa pintu pendingin atau kompresor.`);
    }
  };

  // ==========================================
  // EDIT & DELETE OPERATIONS FOR ALL RECORDS
  // ==========================================
  const [editingRecord, setEditingRecord] = useState<{
    type: "checklist" | "calibration" | "stockcheck" | "temp" | "handover" | "incident";
    data: any;
  } | null>(null);

  const handleDeleteRecord = async (
    type: "checklist" | "calibration" | "stockcheck" | "temp" | "handover" | "incident",
    id: string
  ) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data laporan ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    let nextState = { ...state };
    let message = "";

    if (type === "checklist") {
      nextState.dailyChecklists = (state.dailyChecklists || []).filter(item => item.id !== id);
      message = "Laporan checklist berhasil dihapus.";
    } else if (type === "calibration") {
      nextState.calibrationLogs = (state.calibrationLogs || []).filter(item => item.id !== id);
      message = "Laporan kalibrasi berhasil dihapus.";
    } else if (type === "stockcheck") {
      nextState.stockCheckLogs = (state.stockCheckLogs || []).filter(item => item.id !== id);
      message = "Laporan stock opname berhasil dihapus.";
    } else if (type === "temp") {
      nextState.temperatureLogs = (state.temperatureLogs || []).filter(item => item.id !== id);
      message = "Laporan suhu berhasil dihapus.";
    } else if (type === "handover") {
      nextState.shiftHandovers = (state.shiftHandovers || []).filter(item => item.id !== id);
      message = "Memo serah terima berhasil dihapus.";
    } else if (type === "incident") {
      nextState.incidentLogs = (state.incidentLogs || []).filter(item => item.id !== id);
      message = "Laporan insiden berhasil dihapus.";
    }

    nextState.activities = [
      {
        id: `ACT-${Date.now()}`,
        icon: "🗑️",
        text: `Data ${type} id ${id} telah dihapus dari sistem.`,
        type: "info" as const,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      },
      ...(state.activities || [])
    ];

    await syncState(nextState);
    triggerToast(message);
  };

  const handleSaveEditedRecord = async () => {
    if (!editingRecord) return;
    const { type, data } = editingRecord;
    let nextState = { ...state };
    let message = "";

    if (type === "checklist") {
      nextState.dailyChecklists = (state.dailyChecklists || []).map(item => item.id === data.id ? data : item);
      message = "Laporan checklist berhasil diperbarui.";
    } else if (type === "calibration") {
      nextState.calibrationLogs = (state.calibrationLogs || []).map(item => item.id === data.id ? data : item);
      message = "Laporan kalibrasi berhasil diperbarui.";
    } else if (type === "stockcheck") {
      nextState.stockCheckLogs = (state.stockCheckLogs || []).map(item => item.id === data.id ? data : item);
      message = "Laporan stock opname berhasil diperbarui.";
    } else if (type === "temp") {
      nextState.temperatureLogs = (state.temperatureLogs || []).map(item => item.id === data.id ? data : item);
      message = "Laporan suhu berhasil diperbarui.";
    } else if (type === "handover") {
      nextState.shiftHandovers = (state.shiftHandovers || []).map(item => item.id === data.id ? data : item);
      message = "Memo serah terima berhasil diperbarui.";
    } else if (type === "incident") {
      nextState.incidentLogs = (state.incidentLogs || []).map(item => item.id === data.id ? data : item);
      message = "Laporan insiden berhasil diperbarui.";
    }

    nextState.activities = [
      {
        id: `ACT-${Date.now()}`,
        icon: "✏️",
        text: `Data ${type} id ${data.id} berhasil diperbarui di sistem.`,
        type: "info" as const,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      },
      ...(state.activities || [])
    ];

    await syncState(nextState);
    triggerToast(`✓ ${message}`);
    setEditingRecord(null);
  };

  // ==========================================
  // 5. SHIFT HANDOVER DIALOGUE
  // ==========================================
  const [hFromShift, setHFromShift] = useState("Pagi");
  const [hToShift, setHToShift] = useState("Siang");
  const [hStaffFrom, setHStaffFrom] = useState(users[0]?.name || "");
  const [hStaffTo, setHStaffTo] = useState(users[1]?.name || "");
  const [hNotes, setHNotes] = useState("");

  // Handover fields: Dynamic settings & values
  const handoverFields = state.customHandoverFields || defaultHandoverFields;
  const [customHandoverValues, setCustomHandoverValues] = useState<{ [id: string]: string }>({
    "hof-1": "4 Liter",
    "hof-2": "Hampir habis",
    "hof-3": "4.2 stable"
  });

  // Handover custom fields modification states
  const [showHandoverFieldsConfig, setShowHandoverFieldsConfig] = useState(false);
  const [newHandoverFieldLabel, setNewHandoverFieldLabel] = useState("");
  const [editingHandoverFieldId, setEditingHandoverFieldId] = useState<string | null>(null);
  const [editingHandoverFieldLabel, setEditingHandoverFieldLabel] = useState("");

  const handleAddHandoverField = async () => {
    if (!newHandoverFieldLabel) {
      triggerToast("Isi rincian kolom serah terima terlebih dahulu.");
      return;
    }
    const fieldsList = state.customHandoverFields || defaultHandoverFields;
    const newField = {
      id: `hof-${Date.now()}`,
      label: newHandoverFieldLabel
    };
    await syncState({
      ...state,
      customHandoverFields: [...fieldsList, newField]
    });
    triggerToast("✓ Rincian checklist serah terima baru ditambahkan!");
    setNewHandoverFieldLabel("");
  };

  const handleDeleteHandoverField = async (id: string) => {
    if (!window.confirm("Hapus rincian kolom serah terima ini dari checklist mendatang?")) {
      return;
    }
    const fieldsList = state.customHandoverFields || defaultHandoverFields;
    await syncState({
      ...state,
      customHandoverFields: fieldsList.filter(f => f.id !== id)
    });
    triggerToast("🗑️ Rincian kolom serah terima dihapus!");
  };

  const handleSaveEditedHandoverField = async (id: string) => {
    if (!editingHandoverFieldLabel) {
      triggerToast("Rincian kolom tidak boleh kosong!");
      return;
    }
    const fieldsList = state.customHandoverFields || defaultHandoverFields;
    await syncState({
      ...state,
      customHandoverFields: fieldsList.map(f => f.id === id ? { ...f, label: editingHandoverFieldLabel } : f)
    });
    triggerToast("✓ Kolom serah terima diperbarui!");
    setEditingHandoverFieldId(null);
  };

  const handleSubmitHandover = async () => {
    if (!hStaffFrom || !hStaffTo) {
      triggerToast("Pilih Barista Pagi dan Barista Penerima.");
      return;
    }

    const activeFields = state.customHandoverFields || defaultHandoverFields;
    const itemValues = activeFields.map(f => ({
      label: f.label,
      value: customHandoverValues[f.id] || ""
    }));

    const newHandover: ShiftHandover = {
      id: `HND-${Date.now()}`,
      date: selectedDate,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      fromShift: hFromShift,
      toShift: hToShift,
      staffFrom: hStaffFrom,
      staffTo: hStaffTo,
      notes: hNotes,
      items: itemValues,
      isConfirmed: false
    };

    const nextState = {
      ...state,
      shiftHandovers: [newHandover, ...(state.shiftHandovers || [])],
      activities: [
        {
          id: `ACT-${Date.now()}`,
          icon: "🤝",
          text: `Handover Shift diajukan dari ${hStaffFrom} ke ${hStaffTo} (${hFromShift} ➔ ${hToShift})`,
          type: "info" as const,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        },
        ...(state.activities || [])
      ]
    };

    await syncState(nextState);
    triggerToast("✓ Handover diajukan. Menunggu konfirmasi Barista penerima!");
    setHNotes("");
  };

  const handleConfirmHandover = async (id: string) => {
    const nextState = { ...state };
    nextState.shiftHandovers = (nextState.shiftHandovers || []).map(h => {
      if (h.id === id) {
        return {
          ...h,
          isConfirmed: true,
          confirmedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        };
      }
      return h;
    });

    nextState.activities = [
      {
        id: `ACT-${Date.now()}`,
        icon: "🤝",
        text: `Handover Shift berhasil dikonfirmasi & diterima penuh`,
        type: "info" as const,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      },
      ...(nextState.activities || [])
    ];

    await syncState(nextState);
    triggerToast("✓ Handover berhasil dikonfirmasi!");
  };

  // ==========================================
  // 6. INCIDENT LOG ENTRY
  // ==========================================
  const [incPic, setIncPic] = useState(users[0]?.name || "");
  const [incCategory, setIncCategory] = useState<"Mesin Rusak" | "Grinder Macet" | "Komplain Customer" | "Barang Hilang" | "Lainnya">("Komplain Customer");
  const [incDesc, setIncDesc] = useState("");
  const [incAction, setIncAction] = useState("");

  const handleSubmitIncident = async () => {
    if (!incPic || !incDesc) {
      triggerToast("Isi detail laporan kejadian operasional.");
      return;
    }

    const newInc: IncidentLogItem = {
      id: `INC-${Date.now()}`,
      date: selectedDate,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      pic: incPic,
      category: incCategory,
      description: incDesc,
      actionTaken: incAction
    };

    const nextState = {
      ...state,
      incidentLogs: [newInc, ...(state.incidentLogs || [])],
      activities: [
        {
          id: `ACT-${Date.now()}`,
          icon: "🚨",
          text: `Kejadian tercatat (${incCategory}): ${incDesc.slice(0, 50)}...`,
          type: "info" as const,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        },
        ...(state.activities || [])
      ]
    };

    await syncState(nextState);
    triggerToast(`✓ Kejadian ${incCategory} dicatat.`);
    setIncDesc("");
    setIncAction("");
  };

  // ==========================================
  // 7. OWNER DAILY OPERATIONAL DASHBOARD
  // ==========================================
  // Calculate today's dashboard KPIs
  const todayChecklists = checklists.filter(c => c.date === selectedDate);
  const openingDone = todayChecklists.find(c => c.type === "opening")?.status === "Selesai";
  const closingDone = todayChecklists.find(c => c.type === "closing")?.status === "Selesai";
  const cleaningPercent = (() => {
    const clnItem = todayChecklists.find(c => c.type === "cleaning");
    if (!clnItem) return 0;
    const completed = clnItem.items.filter(i => i.completed).length;
    return Math.round((completed / clnItem.items.length) * 100);
  })();

  const calibrationDone = calibrations.some(c => c.date === selectedDate && c.status === "Pass") ? "Selesai (Pass)" : calibrations.some(c => c.date === selectedDate) ? "Ada (Fail)" : "Belum Kalibrasi";
  const todayWastesLoss = state.wastes.filter(w => w.rawDate === selectedDate).reduce((sum, w) => sum + (w.loss || 0), 0);
  const todayIncidentCount = incidents.filter(i => i.date === selectedDate).length;
  const todayStockVariancesCount = stockChecks.filter(s => s.date === selectedDate).length;

  // ==========================================
  // AI OPERATION ASSISTANT CHATBOT
  // ==========================================
  const [aiQuery, setAiQuery] = useState("");
  const [aiChatLog, setAiChatLog] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Halo! Saya Asisten AI CoffeeOps. Saya dapat menjawab status checklist opening/closing, total waste kopi seminggu ini, laporan insiden harian, staff yang mangkir mengisi jurnal, dan detail barang selisih kualifikasi (variance)." }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Local rule-based intelligence for instant responses
  const getLocalAIResponse = (query: string): string => {
    const qLower = query.toLowerCase();

    if (qLower.includes("opening") || qLower.includes("buka") || qLower.includes("checklist")) {
      const op = checklists.find(c => c.type === "opening" && c.date === todayStr);
      if (op) {
        const checked = op.items.filter(i => i.completed).length;
        const tot = op.items.length;
        return `### 📋 STATUS OPENING CHECKLIST HARI INI (${todayStr})
*   **Petugas**: ${op.staff}
*   **Shift**: ${op.shift}
*   **Status**: **${op.status}** (${checked}/${tot} tugas selesai)
*   **Waktu Checklist**: ${op.time} WIB
*   **Catatan Barista**: "${op.notes || "Tidak ada catatan kustom."}"

Semua mesin espresso, grinder, dan persiapan sanitasi bar utama terpantau ${op.status === "Selesai" ? "siap tempur 100%!" : "dalam progres pengerjaan."}`;
      } else {
        return `⚠️ **Peringatan**: Opening Checklist untuk hari ini (**${todayStr}**) **belum diisi atau dikerjakan sama sekali** oleh staff shift pagi. Segera infokan kru di Bar Utama untuk mengisi checklist demi kestabilan rasa.`;
      }
    }

    if (qLower.includes("waste") || qLower.includes("kerugian") || qLower.includes("rugi") || qLower.includes("kopi")) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const weeklyCoffeeWaste = state.wastes.filter(w => {
        const wasteDate = new Date(w.rawDate);
        return wasteDate >= sevenDaysAgo && w.name.toLowerCase().includes("kopi");
      });

      const totalQty = weeklyCoffeeWaste.reduce((sum, w) => sum + (w.qty || 0), 0);
      const totalLossVal = weeklyCoffeeWaste.reduce((sum, w) => sum + (w.loss || 0), 0);

      return `### 🗑️ DETAIL WASTE KOPI 7 HARI TERAKHIR
Tercatat total ada **${weeklyCoffeeWaste.length} kejadian pemborosan kopi** dalam seminggu ke belakang.
*   **Total Kopi Terbuang**: **${totalQty.toFixed(2)} kg**
*   **Total Estimasi Kerugian HPP**: **Rp ${totalLossVal.toLocaleString("id-ID")}**

**Penyebab Terbanyak:**
${weeklyCoffeeWaste.length === 0 ? "- *(Tidak ada pemborosan kopi terdata. Efisiensi luar biasa!)*" : weeklyCoffeeWaste.slice(0, 3).map(w => `- **${w.name}** (${w.qty} kg) akibat *${w.cause}* oleh ${w.by}.`).join("\n")}

**Saran Pencegahan**: Lakukan kalibrasi (dial-in) maksimal 1 kali menggunakan mangkok tamp kecil untuk menakar gramasi basah, batasi shot terbuang.`;
    }

    if (qLower.includes("incident") || qLower.includes("insiden") || qLower.includes("kejadian") || qLower.includes("masalah")) {
      const todayIncs = incidents.filter(i => i.date === todayStr);
      if (todayIncs.length > 0) {
        return `### 🚨 LAPORAN INSIDEN HARI INI (${todayStr})
Tercatat **${todayIncs.length} kejadian luar biasa** di toko:

` + todayIncs.map((i, idx) => `**${idx + 1}. [${i.category}]** dilaporkan oleh **${i.pic}** pada jam ${i.time} WIB.
*   *Deskripsi*: "${i.description}"
*   *Tindakan*: "${i.actionTaken}"`).join("\n\n");
      } else {
        return `🟢 **Aman**: Tidak terdapat insiden operasional atau komplen customer yang dilaporkan hari ini (**${todayStr}**). Layanan berjalan kondusif murni.`;
      }
    }

    if (qLower.includes("belum") || qLower.includes("mengisi") || qLower.includes("sop") || qLower.includes("isi") || qLower.includes("jurnal")) {
      // Find staff logged in attending checkins today but having no checklist entries
      const checkedInStaff = (state.attendance || [])
        .filter(a => a.date === todayStr)
        .map(a => a.userName);
      
      const actualStaffWhoLoggedSop = checklists
        .filter(c => c.date === todayStr)
        .map(c => c.staff);

      const slackerStaff = checkedInStaff.filter(name => !actualStaffWhoLoggedSop.includes(name));

      if (slackerStaff.length > 0) {
        return `### 👥 AUDIT KEDISIPLINAN SOP CHECKLIST (${todayStr})
Ada **${slackerStaff.length} staff** yang sudah melakukan absensi **Check-In** hari ini namun **Belum mengisi jurnal SOP checklist**:
\n` + slackerStaff.map(s => `- **${s}** (Shift aktif hari ini)`).join("\n") + `
\n*Harap manajer segera menegur kru yang bersangkutan untuk melengkapi administrasi operasional harian.*`;
      } else {
        return `🎉 **Luar biasa disiplin!** Semua staff yang hadir kerja hari ini (**${todayStr}**) sudah menuntaskan kewajiban mengisi dan menandatangani SOP checklist harian dengan lengkap!`;
      }
    }

    if (qLower.includes("variance") || qLower.includes("selisih") || qLower.includes("beda")) {
      const allAuditLogs = stockChecks || [];
      const variancesFrequency: { [item: string]: number } = {};
      
      allAuditLogs.forEach(log => {
        log.items.forEach(it => {
          if (it.variance !== 0) {
            variancesFrequency[it.name] = (variancesFrequency[it.name] || 0) + 1;
          }
        });
      });

      const sortedVariances = Object.entries(variancesFrequency).sort((a, b) => b[1] - a[1]);

      if (sortedVariances.length > 0) {
        return `### 📦 ANALISIS BAHAN PALING SERING SELISIH (VARIANCE)
Berdasarkan histori hasil Stock Opname sebelumnya, berikut adalah daftar barang yang kerap mengalami ketidakcocokan jumlah aktual fisik vs komputer:
\n` + sortedVariances.slice(0, 3).map(([name, count]) => `- **${name}**: Mengalami selisih sebanyak **${count} kali** audit.`).join("\n") + `

**Rekomendasi Akurasi:**
1.  Susu Full Cream sering mengalami kebocoran pencatatan karena porsi pouring yang berlebih.
2.  Gula pasir sering meleset akibat pemakaian di luar takaran SOP cup latte. Barista wajib menggunakan jigger timbangan.`;
      } else {
        return `🟢 **Sempurna**: Tidak ada ketidakcocokan data pencatatan/variance historis yang mendominasi di draf stock opname. Semua mutasi tercatat seimbang.`;
      }
    }

    return `### Asisten AI CoffeeOps (Offline Pro-Active Engine)
Maaf, saya tidak memahami pertanyaan spesifik Anda secara lokal. Coba klik tombol cepat di bawah atau tanyakan tentang:
- **Checklist Opening/Closing** ("Opening checklist", "status checklist")
- **Total Waste Kopi** ("waste kopi minggu ini", "total kerugian")
- **Insiden Toko** ("insiden hari ini", "incident laporan")
- **Disiplin Staff mengisi register** ("siapa yang belum mengisi SOP log")
- **Akurasi & Selisih Audit** ("barang sering variance")`;
  };

  const handleSendAiQuery = async (queryText?: string) => {
    const finalQuery = queryText || aiQuery;
    if (!finalQuery.trim()) return;

    // Push User prompt
    setAiChatLog(prev => [...prev, { sender: "user", text: finalQuery }]);
    setAiQuery("");
    setIsAiTyping(true);

    // Dynamic Server-side backend query via Gemini
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${finalQuery} (Konteks data harian SOP: ${JSON.stringify({ 
            checklists: checklists.slice(0, 5), 
            calibrations: calibrations.slice(0, 5), 
            temps: temps.slice(0, 5),
            incidents: incidents.slice(0, 5),
            handovers: handovers.slice(0, 5),
            attendanceStaff: state.attendance || []
          })})`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiChatLog(prev => [...prev, { sender: "ai", text: data.reply }]);
      } else {
        // Fallback to rules if error
        const localAns = getLocalAIResponse(finalQuery);
        setAiChatLog(prev => [...prev, { sender: "ai", text: localAns }]);
      }
    } catch {
      const localAns = getLocalAIResponse(finalQuery);
      setAiChatLog(prev => [...prev, { sender: "ai", text: localAns }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-amber-100 p-1">
      
      {/* Date & Subtitle Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1a0a00]/70 p-5 rounded-2xl border border-amber-500/10 gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-amber-300">📋 Buku Jurnal SOP &amp; Operasional Cafe harian</h2>
          <p className="text-[11px] text-amber-250/50 mt-1">
            Reconciliasi audit harian, kalibrasi dial-in barista, kontrol suhu ruang pendingin bar, serah terima shift, dan insiden operasional terikat kepatuhan.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-amber-500/10 shrink-0">
          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Tanggal Audit:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-amber-100 font-mono font-bold text-xs select-none outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#D4A853]/10 pb-3">
        <button
          onClick={() => setActiveSubTab("dashboard")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${activeSubTab === "dashboard" ? "bg-amber-500 text-black shadow-lg" : "bg-black/30 text-amber-100/60 hover:text-amber-100 hover:bg-black/50"}`}
        >
          📊 Dashboard &amp; AI Assistant
        </button>
        <button
          onClick={() => setActiveSubTab("checklists")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${activeSubTab === "checklists" ? "bg-amber-500 text-black shadow-lg" : "bg-black/30 text-amber-100/60 hover:text-amber-100 hover:bg-black/50"}`}
        >
          ✅ Checklist Pembukaan &amp; Tutup
        </button>
        <button
          onClick={() => setActiveSubTab("calibration")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${activeSubTab === "calibration" ? "bg-amber-500 text-black shadow-lg" : "bg-black/30 text-amber-100/60 hover:text-amber-100 hover:bg-black/50"}`}
        >
          ☕ Kalibrasi Dial-In
        </button>
        <button
          onClick={() => setActiveSubTab("stockcheck")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${activeSubTab === "stockcheck" ? "bg-amber-500 text-black shadow-lg" : "bg-black/30 text-amber-100/60 hover:text-amber-100 hover:bg-black/50"}`}
        >
          📦 Stock Opname (Variance)
        </button>
        <button
          onClick={() => setActiveSubTab("temp")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${activeSubTab === "temp" ? "bg-amber-500 text-black shadow-lg" : "bg-black/30 text-amber-100/60 hover:text-amber-100 hover:bg-black/50"}`}
        >
          🌡️ Suhu &amp; Sanitasi
        </button>
        <button
          onClick={() => setActiveSubTab("handover")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${activeSubTab === "handover" ? "bg-amber-500 text-black shadow-lg" : "bg-black/30 text-amber-100/60 hover:text-amber-100 hover:bg-black/50"}`}
        >
          🤝 Shift Handover
        </button>
        <button
          onClick={() => setActiveSubTab("incidents")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${activeSubTab === "incidents" ? "bg-amber-500 text-black shadow-lg" : "bg-black/30 text-amber-100/60 hover:text-amber-100 hover:bg-black/50"}`}
        >
          🚨 Kejadian Luar Biasa
        </button>
      </div>

      {/* ==========================================
          SUBTAB 1: OWNER DASHBOARD & AI ASSISTANT
          ========================================== */}
      {activeSubTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Owner Dashboard Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10">
              <h3 className="font-serif font-bold text-amber-300 text-base mb-4">📈 KPI Patuh Jurnal Hari Ini</h3>
              
              <div className="space-y-4">
                {/* 1. Opening Checklist Status */}
                <div className="flex justify-between items-center bg-black/25 p-3 rounded-xl border border-amber-500/5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🚪</span>
                    <div>
                      <p className="text-[11px] font-bold text-amber-100">Opening Checklist</p>
                      <p className="text-[9px] text-amber-100/40">Kesiapan operasional mesin &amp; bar</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${openingDone ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {openingDone ? "Selesai" : "Belum Isi"}
                  </span>
                </div>

                {/* 2. Calibration Dial In */}
                <div className="flex justify-between items-center bg-black/25 p-3 rounded-xl border border-amber-500/5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">☕</span>
                    <div>
                      <p className="text-[11px] font-bold text-amber-100">Espresso Kalibrasi</p>
                      <p className="text-[9px] text-amber-100/40">Akurasi gramasi taste &amp; yield shot</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${calibrationDone.includes("Selesai") ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {calibrationDone}
                  </span>
                </div>

                {/* 3. Cleaning Log */}
                <div className="flex justify-between items-center bg-black/25 p-3 rounded-xl border border-amber-500/5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">✨</span>
                    <div>
                      <p className="text-[11px] font-bold text-amber-100">Pemberihan &amp; Sanitasi</p>
                      <p className="text-[9px] text-amber-100/40">Kehigienisan grinder &amp; backflush</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${cleaningPercent === 100 ? "bg-green-500/15 text-green-400" : cleaningPercent > 0 ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}`}>
                    {cleaningPercent}% Selesai
                  </span>
                </div>

                {/* 4. Closing Checklist */}
                <div className="flex justify-between items-center bg-black/25 p-3 rounded-xl border border-amber-500/5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🔒</span>
                    <div>
                      <p className="text-[11px] font-bold text-amber-100">Closing Checklist</p>
                      <p className="text-[9px] text-amber-100/40">Rekonsiliasi laci uang &amp; shutdown</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${closingDone ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {closingDone ? "Selesai" : "Belum Isi"}
                  </span>
                </div>

                {/* 5. Today's Waste loss */}
                <div className="flex justify-between items-center bg-black/25 p-3 rounded-xl border border-amber-500/5 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🗑️</span>
                    <div>
                      <p className="text-[11px] font-bold text-amber-100">Kerugian Waste Toko</p>
                      <p className="text-[9px] text-amber-100/40">Nominal bahan terbuang hari ini</p>
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold">
                    Rp {todayWastesLoss.toLocaleString("id-ID")}
                  </span>
                </div>

                {/* 6. Today's Incidents logs */}
                <div className="flex justify-between items-center bg-black/25 p-3 rounded-xl border border-amber-500/5 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🚨</span>
                    <div>
                      <p className="text-[11px] font-bold text-amber-100">Insiden / Komplain</p>
                      <p className="text-[9px] text-amber-100/40">Masalah mesin / barang hilang</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${todayIncidentCount > 0 ? "bg-red-500 text-black animate-pulse" : "bg-green-500/15 text-green-450"}`}>
                    {todayIncidentCount}
                  </span>
                </div>

                {/* 7. Today's Variances */}
                <div className="flex justify-between items-center bg-black/25 p-3 rounded-xl border border-amber-500/5 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📦</span>
                    <div>
                      <p className="text-[11px] font-bold text-amber-100">Selisih Opname (Variance)</p>
                      <p className="text-[9px] text-amber-100/40">Jumlah ketidakcocokan aktual</p>
                    </div>
                  </div>
                  <span className="text-[#D4A853] font-bold">
                    {todayStockVariancesCount} Item
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Operation Assistant Chatbot Panel */}
          <div className="lg:col-span-2 bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 flex flex-col justify-between h-[520px]">
            <div>
              <div className="flex items-center justify-between border-b border-[#D4A853]/15 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-serif font-bold text-amber-300 text-sm">Virtual AI Operations Coach</h3>
                    <p className="text-[10px] text-amber-100/40">Asisten pemantauan SOP &amp; mitigasi pemborosan loss</p>
                  </div>
                </div>
                <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                  REAL-TIME SYNCED
                </span>
              </div>

              {/* Message Log viewport */}
              <div className="h-[280px] overflow-y-auto space-y-3.5 mb-4 pr-1 custom-scrollbar">
                {aiChatLog.map((chat, idx) => (
                  <div key={idx} className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      chat.sender === "user" 
                        ? "bg-[#D4A853] text-black font-semibold rounded-tr-none shadow-md" 
                        : "bg-black/35 text-amber-100 border border-amber-500/5 rounded-tl-none whitespace-pre-wrap"
                    }`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-black/35 text-amber-100/50 rounded-2xl p-3 text-xs leading-relaxed rounded-tl-none italic animate-pulse">
                      Mengetik respon analitis dari database harian...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Input area */}
            <div>
              {/* Quick Action prompts */}
              <div className="flex flex-wrap gap-1.5 mb-3 border-t border-amber-500/5 pt-3">
                <button
                  type="button"
                  onClick={() => handleSendAiQuery("Apakah opening checklist sudah selesai?")}
                  className="bg-black/25 hover:bg-amber-500/15 border border-[#D4A853]/15 rounded-lg px-2.5 py-1 text-[10px] text-amber-250 cursor-pointer transition"
                >
                  Opening Checklist?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAiQuery("Berapa waste kopi minggu ini?")}
                  className="bg-black/25 hover:bg-amber-500/15 border border-[#D4A853]/15 rounded-lg px-2.5 py-1 text-[10px] text-amber-250 cursor-pointer transition"
                >
                  Waste kopi seminggu?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAiQuery("Ada incident hari ini?")}
                  className="bg-black/25 hover:bg-amber-500/15 border border-[#D4A853]/15 rounded-lg px-2.5 py-1 text-[10px] text-amber-250 cursor-pointer transition"
                >
                  Incidents hari ini?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAiQuery("Siapa yang belum mengisi SOP log?")}
                  className="bg-black/25 hover:bg-amber-500/15 border border-[#D4A853]/15 rounded-lg px-2.5 py-1 text-[10px] text-amber-250 cursor-pointer transition"
                >
                  Mangkir SOP checklist?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAiQuery("Barang apa yang sering variance?")}
                  className="bg-black/25 hover:bg-amber-500/15 border border-[#D4A853]/15 rounded-lg px-2.5 py-1 text-[10px] text-amber-250 cursor-pointer transition"
                >
                  Barang sering selisih?
                </button>
              </div>

              {/* Chat Input form */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendAiQuery(); }} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik pertanyaan operasional..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="flex-1 bg-black/45 border border-[#D4A853]/25 px-4.5 py-2.5 rounded-xl outline-none focus:border-amber-400 text-xs text-amber-100 font-sans"
                />
                <button
                  type="submit"
                  disabled={isAiTyping || !aiQuery.trim()}
                  className="bg-[#D4A853] hover:bg-amber-400 disabled:opacity-50 disabled:bg-[#D4A853]/30 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-5 text-xs transition cursor-pointer"
                >
                  Kirim
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          SUBTAB 2: OPENING & CLOSING CHECKLISTS
          ========================================== */}
      {activeSubTab === "checklists" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-xs">
          
          {/* Checklist Form */}
          <div className="lg:col-span-2 bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4">
            
            {/* Template type picker tabs */}
            <div className="flex bg-black/45 p-1 rounded-xl border border-amber-500/5">
              <button
                type="button"
                onClick={() => handleSwitchChecklistType("opening")}
                className={`flex-1 py-1.5 text-[10.5px] font-bold rounded-lg cursor-pointer transition ${chkType === "opening" ? "bg-[#D4A853] text-black" : "text-amber-100/50 hover:text-amber-155"}`}
              >
                🚪 Opening Checklist
              </button>
              <button
                type="button"
                onClick={() => handleSwitchChecklistType("cleaning")}
                className={`flex-1 py-1.5 text-[10.5px] font-bold rounded-lg cursor-pointer transition ${chkType === "cleaning" ? "bg-[#D4A853] text-black" : "text-amber-100/50 hover:text-amber-155"}`}
              >
                ✨ Cleaning &amp; Sanitasi
              </button>
              <button
                type="button"
                onClick={() => handleSwitchChecklistType("closing")}
                className={`flex-1 py-1.5 text-[10.5px] font-bold rounded-lg cursor-pointer transition ${chkType === "closing" ? "bg-[#D4A853] text-black" : "text-amber-100/50 hover:text-amber-155"}`}
              >
                🔒 Closing Checklist
              </button>
            </div>

            {/* Checklist attributes block */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-amber-250/60 text-[9px] uppercase mb-1 font-mono">Staff Pengisi</label>
                <select
                  value={chkStaff}
                  onChange={(e) => setChkStaff(e.target.value)}
                  className="w-full bg-black/45 text-amber-100 border border-[#D4A853]/15 rounded-xl px-2.5 py-2 select-none text-[11px]"
                >
                  <option value="">-- Pilih Kru --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-amber-250/60 text-[9px] uppercase mb-1 font-mono">Shift Layanan</label>
                <select
                  value={chkShift}
                  onChange={(e) => setChkShift(e.target.value)}
                  className="w-full bg-black/45 text-amber-100 border border-[#D4A853]/15 rounded-xl px-2.5 py-2 select-none text-[11px]"
                >
                  <option value="Pagi">Pagi (Check-In Pagi)</option>
                  <option value="Siang">Siang (Siang/Sore)</option>
                  <option value="Malam">Malam (Closing Shift)</option>
                </select>
              </div>

              <div>
                <label className="block text-amber-250/60 text-[9px] uppercase mb-1 font-mono">Outlet / Pos</label>
                <input
                  type="text"
                  value={chkOutlet}
                  onChange={(e) => setChkOutlet(e.target.value)}
                  className="w-full bg-black/35 text-amber-100 border border-[#D4A853]/15 rounded-xl px-2.5 py-2 text-[11px] outline-none"
                />
              </div>
            </div>

            {/* Simulated & Web Camera file upload block */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-3">
                <label className="block text-amber-250/60 text-[9px] uppercase font-mono">Foto Bukti Kelayakan SOP &amp; Ops (Mandatori/Bukti Foto)</label>
                
                <div className="flex flex-wrap gap-2">
                  {/* Native Upload Option */}
                  <input
                    type="file"
                    accept="image/*"
                    id="sop-native-camera"
                    className="hidden"
                    onChange={handleNativeCameraFile}
                  />
                  <label
                    htmlFor="sop-native-camera"
                    className="bg-[#1b0a04] hover:bg-amber-600 border border-amber-500/25 hover:border-amber-400 text-amber-205 hover:text-black hover:font-bold px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                  >
                    📸 Upload dari Perangkat / Kamera HP
                  </label>

                  {/* WebCam live option */}
                  <button
                    type="button"
                    onClick={() => {
                      if (camera.active) {
                        camera.stop();
                      } else {
                        startCheckingCamera("environment");
                      }
                    }}
                    className={`border px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      camera.active && cameraFacing === "environment"
                        ? "bg-amber-500 text-black border-amber-400"
                        : "bg-[#120701] text-amber-100/70 border-amber-500/20 hover:text-amber-100"
                    }`}
                  >
                    📷 Kamera Belakang (Live Webcam)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (camera.active) {
                        camera.stop();
                      } else {
                        startCheckingCamera("user");
                      }
                    }}
                    className={`border px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      camera.active && cameraFacing === "user"
                        ? "bg-amber-500 text-black border-amber-400"
                        : "bg-[#120701] text-amber-100/70 border-amber-500/20 hover:text-amber-100"
                    }`}
                  >
                    👤 Kamera Depan (Live Webcam)
                  </button>
                </div>

                {camera.active && (
                  <div className="bg-black/90 border border-amber-500/30 p-3 rounded-xl flex flex-col items-center gap-3">
                    <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-amber-500/10">
                      <video
                        ref={sopVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
                      />
                    </div>
                    {cameraError && <p className="text-[10px] text-red-400 font-mono">{cameraError}</p>}
                    <div className="flex gap-2 w-full max-w-sm">
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs py-2 rounded-lg transition"
                      >
                        Capture Snapshot 📸
                      </button>
                      <button
                        type="button"
                        onClick={() => camera.stop()}
                        className="bg-zinc-805 text-amber-205 text-xs px-3 py-2 rounded-lg hover:bg-zinc-700 transition"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* Legacy text input alternative */}
                <input
                  type="text"
                  placeholder="Atau tempel link url foto bukti di sini..."
                  value={chkPhoto.startsWith("data:") ? "" : chkPhoto}
                  onChange={(e) => setChkPhoto(e.target.value)}
                  className="w-full bg-black/45 text-amber-150 border border-[#D4A853]/15 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Photo Preview Thumbnail */}
              <div className="md:col-span-4 flex flex-col items-center justify-center bg-black/30 p-4 rounded-xl border border-[#D4A853]/10 space-y-2 min-h-[140px]">
                <span className="text-[9px] text-amber-250/40 font-mono tracking-wider uppercase">Snapshot Pratinjau</span>
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-amber-500/20 bg-amber-950/5 flex items-center justify-center relative">
                  {chkPhoto ? (
                    <>
                      <img
                        src={chkPhoto}
                        alt="Bukti Checklist"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setChkPhoto("")}
                        className="absolute bottom-1 right-1 bg-red-600/80 hover:bg-red-500 text-white p-1 rounded-md text-[10px] uppercase font-mono font-bold transition duration-150"
                        title="Hapus foto ini"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-amber-100/20 font-mono text-center">Belum ada foto</span>
                  )}
                </div>
                {chkPhoto && (
                  <span className="text-[9px] text-[#D4A853] font-mono">
                    {chkPhoto.startsWith("data:") ? "Format Base64 JPEG" : "Format URL Gambar"}
                  </span>
                )}
              </div>
            </div>

            {/* Checklist tasks mapping */}
            <div className="bg-black/25 p-4 rounded-xl border border-amber-500/5 space-y-2">
              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider font-semibold">📋 DAFTAR KELAYAKAN TUGAS:</span>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {activeChecklistItems.map(item => (
                  <label
                    key={item.id}
                    className="flex justify-between items-center bg-[#1c0c00] p-2.5 rounded-lg border border-[#D4A853]/5 hover:border-amber-400/20 cursor-pointer select-none transition"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(item.id)}
                        className="scale-110 accent-amber-500"
                      />
                      <div className="text-left">
                        <span className="bg-amber-400/10 text-amber-400 text-[8.5px] px-1.5 py-0.5 rounded uppercase tracking-wide font-bold mr-1.5">
                          {item.category}
                        </span>
                        <span className="text-amber-100 text-[11px] font-medium">{item.task}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold font-mono ${item.completed ? "text-green-400" : "text-amber-150/20"}`}>
                      {item.completed ? "✓ SIAP" : "✖ TUNDA"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Rules Setup accordion button */}
            <div className="border border-amber-500/10 rounded-xl bg-black/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRulesConfig(!showRulesConfig)}
                className="w-full text-left p-3 flex justify-between items-center text-amber-300 font-bold bg-[#1d0e04]/40 hover:bg-[#1d0e04]/70 transition cursor-pointer select-none"
              >
                <span>🛠️ Kelola Tata Tertib &amp; Peraturan Checklist ({chkType === "opening" ? "Opening" : chkType === "closing" ? "Closing" : "Cleaning"})</span>
                <span>{showRulesConfig ? "▲ Sembunyikan" : "▼ Tampilkan"}</span>
              </button>
              
              {showRulesConfig && (
                <div className="p-4 border-t border-amber-500/10 space-y-3.5 bg-black/35 animate-slideDown">
                  
                  {/* Add New Rule form */}
                  <div className="space-y-2 bg-[#1b0a02]/30 p-3 rounded-lg border border-amber-500/5">
                    <span className="text-[10px] text-amber-250 font-mono block font-semibold">➕ TAMBAH PERATURAN CHECKLIST BARU:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8.5px] uppercase font-mono text-amber-100/50 mb-1">Kategori Bagian</label>
                        <input
                          type="text"
                          placeholder="e.g. Grinder / Kebersihan"
                          value={newRuleCategory}
                          onChange={(e) => setNewRuleCategory(e.target.value)}
                          className="w-full bg-black/45 border border-amber-500/15 p-1.5 rounded text-amber-100 text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[8.5px] uppercase font-mono text-amber-100/50 mb-1">Checklist Type</label>
                        <select
                          value={newRuleType}
                          onChange={(e) => setNewRuleType(e.target.value as any)}
                          className="w-full bg-[#1c0c00] border border-amber-500/15 p-1.5 rounded text-amber-100 text-[11px]"
                        >
                          <option value="opening">🚪 Opening Checklist</option>
                          <option value="cleaning">✨ Cleaning &amp; Sanitasi</option>
                          <option value="closing">🔒 Closing Checklist</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[8.5px] uppercase font-mono text-amber-100/50 mb-1">Rincian Tugas Peraturan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Buang ampas kopi, keringkan sisa air sink..."
                        value={newRuleTask}
                        onChange={(e) => setNewRuleTask(e.target.value)}
                        className="w-full bg-black/45 border border-amber-500/15 p-1.5 rounded text-amber-100 text-[11px]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSopRule}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3 py-1.5 rounded text-[10px] uppercase transition cursor-pointer w-full mt-1.5"
                    >
                      ➕ Daftarkan Peraturan Baru
                    </button>
                  </div>

                  {/* Active List of custom rules for current type */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-amber-250 font-mono block font-semibold">📋 DAFTAR RINCIAN SEKARANG DI SISTEM:</span>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {sopRules.filter(r => r.type === chkType).map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-amber-500/5 text-[10.5px]">
                          {editingRuleId === item.id ? (
                            <div className="flex-1 flex gap-2 items-center">
                              <input
                                type="text"
                                value={editingRuleCategory}
                                onChange={(e) => setEditingRuleCategory(e.target.value)}
                                className="bg-black border border-amber-500/10 p-1 rounded text-amber-100 text-[10px] w-24"
                              />
                              <input
                                type="text"
                                value={editingRuleTask}
                                onChange={(e) => setEditingRuleTask(e.target.value)}
                                className="bg-black border border-amber-500/10 p-1 rounded text-amber-100 text-[10px] flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditedSopRule(item.id)}
                                className="text-green-400 font-bold text-[10px]"
                              >
                                ✓ Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingRuleId(null)}
                                className="text-gray-400 text-[10px]"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="text-left">
                                <span className="bg-amber-500/10 text-amber-300 px-1 py-0.5 rounded text-[8px] font-mono mr-1.5 uppercase font-[#bold]">{item.category}</span>
                                <span className="text-amber-100">{item.task}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRuleId(item.id);
                                    setEditingRuleTask(item.task);
                                    setEditingRuleCategory(item.category);
                                  }}
                                  className="text-amber-400 hover:text-amber-350 cursor-pointer"
                                  title="Ubah rincian"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSopRule(item.id)}
                                  className="text-red-400 hover:text-red-350 cursor-pointer"
                                  title="Hapus peraturan"
                                >
                                  🗑️
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Notes textarea and Submit button */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-amber-250/60 text-[9px] uppercase mb-1 font-mono">Tanggapan kru / Catatan tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Seandainya ada grouphead bocor atau kas laci selisih, kabarkan di sini..."
                  value={chkNotes}
                  onChange={(e) => setChkNotes(e.target.value)}
                  className="w-full bg-black/45 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitChecklist}
                className="w-full bg-[#D4A853] hover:bg-amber-400 text-black font-semibold rounded-xl py-2.5 transition shadow"
              >
                💾 Kirim Laporan Checklist Kepatuhan ({activeChecklistItems.filter(i => i.completed).length} dari {activeChecklistItems.length} Selesai)
              </button>
            </div>

          </div>

          {/* Checklist History Logs Sidebar */}
          <div className="lg:col-span-1 bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4 max-h-[750px] overflow-y-auto">
            <h3 className="font-serif font-bold text-amber-300 text-sm">🕰️ Histori SOP Checklist Terkirim</h3>
            
            {checklists.length === 0 ? (
              <p className="text-amber-100/30 py-10 text-center italic">Tidak ada audit checklist kualifikasi tersimpan.</p>
            ) : (
              <div className="space-y-3">
                {checklists.map(c => {
                  const doneCount = c.items.filter(i => i.completed).length;
                  const totCount = c.items.length;
                  return (
                    <div key={c.id} className="bg-black/35 p-3 rounded-xl border border-amber-500/10 hover:border-amber-400 transition space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-amber-400/80 font-mono text-[9px]">{c.date} ({c.time} WIB)</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${c.status === "Selesai" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                          {c.type.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-left space-y-0.5">
                        <p className="text-[11px] font-bold text-amber-100">{c.staff} — {c.shift} Shift</p>
                        <p className="text-[10px] text-amber-150/40">Outlet: {c.outlet}</p>
                      </div>

                      <div className="bg-black/10 py-1 px-2 rounded flex justify-between items-center text-[9.5px]">
                        <span className="text-amber-150/40">Item Siap:</span>
                        <span className="font-bold text-amber-200">{doneCount}/{totCount} ({Math.round((doneCount/totCount)*100)}%)</span>
                      </div>

                      {c.notes && (
                        <p className="text-[9.5px] italic text-[#D4A853]/60 bg-black/15 p-1.5 rounded leading-relaxed">
                          " {c.notes} "
                        </p>
                      )}

                      {c.photoUrl && (
                        <div className="pt-1.5 border-b border-amber-500/5 pb-2">
                          <img
                            src={c.photoUrl}
                            alt="Bukti Checklist"
                            referrerPolicy="no-referrer"
                            className="w-full h-24 object-cover rounded-lg border border-amber-500/10"
                            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingRecord({ type: "checklist", data: JSON.parse(JSON.stringify(c)) })}
                          className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black transition text-[9px] uppercase font-bold font-mono"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord("checklist", c.id)}
                          className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition text-[9px] uppercase font-bold font-mono"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==========================================
          SUBTAB 3: CALIBRATION DIAL-IN LOGS
          ========================================== */}
      {activeSubTab === "calibration" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-xs">
          
          {/* Form Create */}
          <div className="bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm">☕ Dial-In Kalibrasi Pagi (Espresso)</h3>
            <p className="text-[10.5px] text-amber-100/50">Mencegah shot yang sia-sia terbuang dengan mencatatkan setelan grinder, gramasi dose, serta volume yield kopi.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-amber-250 mb-1">Barista Pengkalibrasi</label>
                <select
                  value={calBarista}
                  onChange={(e) => setCalBarista(e.target.value)}
                  className="w-full bg-[#1c0c00] text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">-- Pilih Barista --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Biji Kopi (Batch Kopi)</label>
                <input
                  type="text"
                  placeholder="Ethiopia Blend / Gayo Natural"
                  value={calBeans}
                  onChange={(e) => setCalBeans(e.target.value)}
                  className="w-full bg-black/35 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-amber-250 text-[10px] mb-1">Dose (Gram)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calDose}
                    onChange={(e) => setCalDose(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/35 text-[#D4A853] font-mono font-bold border border-[#D4A853]/15 rounded-xl px-3 py-2 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-amber-250 text-[10px] mb-1">Yield (Gram)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calYield}
                    onChange={(e) => setCalYield(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/35 text-[#D4A853] font-mono font-bold border border-[#D4A853]/15 rounded-xl px-3 py-2 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-amber-250 text-[10px] mb-1">Waktu (Detik)</label>
                  <input
                    type="number"
                    value={calTime}
                    onChange={(e) => setCalTime(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-black/35 text-[#D4A853] font-mono font-bold border border-[#D4A853]/15 rounded-xl px-3 py-2 text-xs text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-250 mb-1">Setting Grinder (Giling)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 4.2 atau Fine 10"
                    value={calGrinder}
                    onChange={(e) => setCalGrinder(e.target.value)}
                    className="w-full bg-black/35 text-amber-100 font-mono text-center border border-[#D4A853]/15 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-amber-250 mb-1">Status Tasting</label>
                  <select
                    value={calStatus}
                    onChange={(e) => setCalStatus(e.target.value as any)}
                    className="w-full bg-[#1c0c00] text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="Pass">🟢 Pass (Tasted OK)</option>
                    <option value="Fail">🔴 Fail (Over/Under)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Catatan Profil Ekstraksi</label>
                <textarea
                  rows={2}
                  placeholder="Rasa manis/bright/terlalu asam..."
                  value={calNotes}
                  onChange={(e) => setCalNotes(e.target.value)}
                  className="w-full bg-black/45 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitCalibration}
                className="w-full bg-[#D4A853] hover:bg-amber-400 text-black font-semibold rounded-xl py-2 transition"
              >
                ☕ Daftarkan Kalibrasi Dial-In Selesai
              </button>
            </div>
          </div>

          {/* List Calibration logs */}
          <div className="lg:col-span-2 bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm">📜 Jurnal Histori Kalibrasi Espresso</h3>
            
            {calibrations.length === 0 ? (
              <p className="text-amber-100/30 py-20 text-center italic">Belum ada dial-in espresso terdata.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-amber-500/10">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-black/55 text-amber-300 uppercase text-[9px] tracking-wider border-b border-amber-500/15">
                      <th className="p-3">Tanggal / Jam</th>
                      <th className="p-3">Barista</th>
                      <th className="p-3">Biji / Grinder</th>
                      <th className="p-3 text-center">Dose</th>
                      <th className="p-3 text-center">Yield</th>
                      <th className="p-3 text-center">Detik</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/5">
                    {calibrations.map((cal, idx) => (
                      <tr key={idx} className="hover:bg-black/15 transition text-amber-100/80">
                        <td className="p-3 whitespace-nowrap">
                          {cal.date} <span className="text-amber-100/30 font-sans text-[9px]">{cal.time}</span>
                        </td>
                        <td className="p-3 font-sans text-amber-100 font-bold whitespace-nowrap">
                          {cal.barista}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-amber-200">{cal.coffeeBatch}</span>
                          <span className="block text-[9px] text-[#D4A853]/50">Setting: {cal.grinderSetting}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-amber-300">{cal.dose}g</td>
                        <td className="p-3 text-center font-bold text-amber-350">{cal.yield}g</td>
                        <td className="p-3 text-center font-bold text-amber-100">{cal.timeSec}s</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${cal.status === "Pass" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-500"}`}>
                            {cal.status}
                          </span>
                        </td>
                        <td className="p-3 font-sans italic text-amber-250/60 leading-relaxed truncate max-w-sm" title={cal.notes}>
                          {cal.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==========================================
          SUBTAB 4: STOCK AUDITING & VARIANCE REPORTS
          ========================================== */}
      {activeSubTab === "stockcheck" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-xs">
          
          {/* Auditing Table Form */}
          <div className="lg:col-span-2 bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-3">
              <div>
                <h3 className="font-serif font-bold text-amber-300 text-sm">📦 Jurnal Stock Opname Live Audit</h3>
                <p className="text-[10px] text-amber-150/40">Sistem membandingkan stock terhitung komputer vs audit fisik lapangan Anda secara real-time.</p>
              </div>
              
              <div className="shrink-0 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-amber-500/10">
                <span className="text-[9px] font-mono text-amber-400">Auditor:</span>
                <select
                  value={stockCheckStaff}
                  onChange={(e) => setStockCheckStaff(e.target.value)}
                  className="bg-transparent text-amber-100 border-none outline-none text-[11px] cursor-pointer"
                >
                  <option value="">-- Pilih Kru --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-amber-500/10">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="bg-black/55 text-amber-300 uppercase text-[9px] border-b border-amber-500/15">
                    <th className="p-3">Nama Bahan Baku</th>
                    <th className="p-3 text-center">Stok Buku (Awal)</th>
                    <th className="p-3 text-center font-serif text-amber-300">Stok Aktual Fisik</th>
                    <th className="p-3 text-center">Selisih (Variance)</th>
                    <th className="p-3 text-right">Potensi Rugi/Untung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/5">
                  {state.master.map(item => {
                    // Qty calculation
                    const activeInv = state.inventory[item.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
                    const systemQty = Math.max(0, activeInv.awal + activeInv.masuk - activeInv.keluar - activeInv.waste);
                    
                    const actualQty = checkedItemsState[item.code] !== undefined ? checkedItemsState[item.code] : systemQty;
                    const variance = actualQty - systemQty;
                    const varCost = variance * (item.price || 0);

                    return (
                      <tr key={item.code} className="hover:bg-black/15 transition select-none">
                        <td className="p-3 font-sans">
                          <p className="font-bold text-amber-100">{item.name}</p>
                          <span className="text-[9px] text-amber-100/35 font-mono">Code: {item.code} | Unit: {item.unit}</span>
                        </td>
                        <td className="p-3 text-center text-amber-200">
                          {systemQty.toLocaleString("id-ID", { maximumFractionDigits: 3 })} {item.unit}
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            step="any"
                            placeholder={systemQty.toString()}
                            value={checkedItemsState[item.code] || ""}
                            onChange={(e) => handleStockCheckedChange(item.code, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-black/55 border border-[#D4A853]/25 rounded-md text-center py-1 outline-none text-[#D4A853] font-bold text-xs font-mono"
                          />
                        </td>
                        <td className={`p-3 text-center font-bold font-mono ${variance < 0 ? "text-red-400" : variance > 0 ? "text-green-400" : "text-amber-100/30"}`}>
                          {variance > 0 ? `+${variance.toFixed(2)}` : variance < 0 ? `${variance.toFixed(2)}` : "Tetap"}
                        </td>
                        <td className={`p-3 text-right font-bold font-mono ${variance < 0 ? "text-red-300" : variance > 0 ? "text-green-300" : "text-amber-100/30"}`}>
                          {variance !== 0 ? `Rp ${varCost.toLocaleString("id-ID", { maximumFractionDigits: 0 })}` : "Seimbang"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Reconciliation Submit action */}
            <div className="space-y-3">
              <div>
                <label className="block text-amber-250 mb-1">Catatan Stock Opname (Variance Reason)</label>
                <textarea
                  rows={2}
                  placeholder="Kenapa bisa selisih? Kemasan bocor, lupa catat waste, rincian susut timbangan..."
                  value={stockCheckNotes}
                  onChange={(e) => setStockCheckNotes(e.target.value)}
                  className="w-full bg-black/45 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none text-xs"
                />
              </div>

              <div className="flex bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl items-start gap-3">
                <span className="text-lg">📢</span>
                <p className="text-[10px] text-amber-100/60 leading-relaxed font-sans">
                  <b>AUTOMATIC RECONCILIATION ENGINE</b>: Sistem akan memotong/merekonsilisasi stok akhir secara otomatis. Kekurangan fisik akan diposting sebagai <b>Waste Log (Kerugian Toko)</b> agar keuangan buku tetap konsisten.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveStockCheck}
                className="w-full bg-[#D4A853] hover:bg-amber-400 text-black font-semibold rounded-xl py-2.5 transition"
              >
                💾 Posting Hasil Stock Opname &amp; Reconcile Selisih
              </button>
            </div>
          </div>

          {/* List historical Opnames */}
          <div className="lg:col-span-1 bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4 max-h-[750px] overflow-y-auto">
            <h3 className="font-serif font-bold text-amber-300 text-sm">🕰️ Histori Stock Opname (Audit)</h3>
            
            {stockChecks.length === 0 ? (
              <p className="text-amber-100/30 py-12 text-center italic">Belum ada Stock Opname tercatat.</p>
            ) : (
              <div className="space-y-3.5">
                {stockChecks.map((log, idx) => {
                  const selCount = log.items.filter(i => i.variance !== 0).length;
                  const totalRugi = log.items.filter(i => i.variance < 0).reduce((sum, i) => sum + Math.abs(i.varianceCost), 0);

                  return (
                    <div key={idx} className="bg-black/35 p-3 rounded-xl border border-amber-500/10 hover:border-amber-400 transition space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-amber-300/80">{log.date}</span>
                        <span className="text-amber-100/30">ID: {log.id.slice(0, 8)}</span>
                      </div>
                      
                      <div className="text-left leading-relaxed">
                        <p className="font-bold text-amber-100">Kru Auditor: {log.staff}</p>
                        <p className="text-[10px] text-amber-100/50">Item Selisih: {selCount} item adjusted.</p>
                        {totalRugi > 0 && (
                          <p className="text-[10px] text-red-400 font-mono font-bold">Kerugian Reconcile: Rp {totalRugi.toLocaleString("id-ID")}</p>
                        )}
                      </div>

                      {log.notes && (
                        <p className="text-[9.5px] italic text-[#D4A853]/60 bg-black/15 p-1 rounded">
                          " {log.notes} "
                        </p>
                      )}

                      <div className="border-t border-amber-500/5 pt-1.5 space-y-1">
                        <span className="text-[8.5px] font-mono uppercase text-amber-150/30">Mutasi Selisih:</span>
                        {log.items.filter(i => i.variance !== 0).slice(0, 3).map(i => (
                          <div key={i.code} className="flex justify-between text-[10.5px] font-mono border-b border-amber-500/5 pb-0.5 text-amber-250/70">
                            <span>{i.name}</span>
                            <span className={i.variance < 0 ? "text-red-400" : "text-green-400"}>
                              {i.variance > 0 ? `+${i.variance}` : i.variance} {i.unit}
                            </span>
                          </div>
                        ))}
                        {selCount > 3 && (
                          <span className="block text-[9px] text-center text-amber-100/30 italic">+{selCount - 3} item selisih lainnya...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==========================================
          SUBTAB 5: SANITATION & COOLER TEMPERATURE LOGS
          ========================================== */}
      {activeSubTab === "temp" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-xs">
          
          {/* Temperature Log Input Form */}
          <div className="bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm">🌡️ Audit Suhu Pendingin Bar (Cold Chain)</h3>
            <p className="text-[10.5px] text-amber-100/50">Membantu menjaga kesegaran susu full cream dan kawat bahan short-shelf agar berada di rentang standar dingin optimal.</p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-amber-250 mb-1">Pencatat Suhu</label>
                <select
                  value={tempStaff}
                  onChange={(e) => setTempStaff(e.target.value)}
                  className="w-full bg-[#1c0c00] text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">-- Pilih Kru --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Suhu Bar Chiller utama (°C)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="-5"
                    max="15"
                    step="0.5"
                    value={chillerT}
                    onChange={(e) => setChillerT(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className={`font-mono font-bold text-sm w-12 text-center py-1 rounded bg-black/45 ${chillerT < 1 || chillerT > 6 ? "text-red-400 animate-pulse border border-red-500/20" : "text-[#D4A853]"}`}>
                    {chillerT}°C
                  </span>
                </div>
                <span className="block text-[8.5px] text-amber-100/30 mt-0.5">Standar dingin: 2°C s.d 4°C (Safe Zone)</span>
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Suhu Milk Storage Freezer (°C)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="-30"
                    max="5"
                    step="0.5"
                    value={freezerT}
                    onChange={(e) => setFreezerT(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className={`font-mono font-bold text-sm w-12 text-center py-1 rounded bg-black/45 ${freezerT > -12 ? "text-red-400 animate-pulse border border-red-500/20" : "text-[#D4A853]"}`}>
                    {freezerT}°C
                  </span>
                </div>
                <span className="block text-[8.5px] text-amber-100/30 mt-0.5">Standar dingin: Di bawah -15°C (Safe Zone)</span>
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Suhu Milk Storage Kulkas Tengah (°C)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="-2"
                    max="12"
                    step="0.5"
                    value={milkStorageT}
                    onChange={(e) => setMilkStorageT(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className={`font-mono font-bold text-sm w-12 text-center py-1 rounded bg-black/45 ${milkStorageT < 1 || milkStorageT > 5 ? "text-red-400 animate-pulse border border-red-500/20" : "text-[#D4A853]"}`}>
                    {milkStorageT}°C
                  </span>
                </div>
                <span className="block text-[8.5px] text-amber-100/30 mt-0.5">Standar dingin: 2°C s.d 4°C (Safe Zone)</span>
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Catatan Kepatuhan Chiller</label>
                <textarea
                  rows={2}
                  placeholder="Adanya es menumpuk, karet pintu sobek, motor berisik..."
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  className="w-full bg-black/45 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitTemp}
                className="w-full bg-[#D4A853] hover:bg-amber-400 text-black font-semibold rounded-xl py-2 transition"
              >
                🌡️ Catat Log &amp; Rekap Suhu Operasional
              </button>
            </div>
          </div>

          {/* Histori Suhu */}
          <div className="lg:col-span-2 bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm">📜 Jurnal Histori Suhu Pendingin</h3>
            
            {temps.length === 0 ? (
              <p className="text-amber-100/30 py-20 text-center italic">Belum ada jurnal suhu tercatat.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-amber-500/10">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-black/55 text-amber-300 uppercase text-[9px] border-b border-amber-500/15">
                      <th className="p-3">Tanggal / Waktu</th>
                      <th className="p-3">Staff Pencatat</th>
                      <th className="p-3 text-center">Chiller Bar</th>
                      <th className="p-3 text-center">Milk Freezer</th>
                      <th className="p-3 text-center">Kulkas Susu</th>
                      <th className="p-3 text-center">Satus</th>
                      <th className="p-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/5">
                    {temps.map((t, idx) => (
                      <tr key={idx} className="hover:bg-black/15 transition text-amber-100/80">
                        <td className="p-3 whitespace-nowrap">
                          {t.date} <span className="text-amber-100/30 font-sans text-[9px]">{t.time}</span>
                        </td>
                        <td className="p-3 font-bold text-amber-100 font-sans">{t.staff}</td>
                        <td className="p-3 text-center text-amber-300 font-bold">{t.chillerTemp}°C</td>
                        <td className="p-3 text-center text-amber-300 font-bold">{t.freezerTemp}°C</td>
                        <td className="p-3 text-center text-amber-350 font-bold">{t.milkStorageTemp}°C</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${t.status === "OK" ? "bg-green-500/15 text-green-400" : "bg-red-500/20 text-red-400 animate-pulse"}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 italic text-amber-250/60 font-sans leading-relaxed truncate max-w-xs">{t.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==========================================
          SUBTAB 6: SHIFT OPERATIONAL HANDOVERS
          ========================================== */}
      {activeSubTab === "handover" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-xs">
          
          {/* Handover Form */}
          <div className="bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm">🤝 Ajukan Serah Terima Shift (Handover)</h3>
            <p className="text-[10.5px] text-amber-100/50">Mencegah desinkronisasi setelan grinder, sisa susu, atau bumbu sirup kustom saat pergantian kru.</p>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-250 mb-1">Dari Shift</label>
                  <select
                    value={hFromShift}
                    onChange={(e) => setHFromShift(e.target.value)}
                    className="w-full bg-[#1c0c00] text-amber-100 border border-[#D4A853]/15 rounded-xl px-2.5 py-1.5 text-xs"
                  >
                    <option value="Pagi">Pagi</option>
                    <option value="Siang">Siang</option>
                    <option value="Sore">Sore</option>
                  </select>
                </div>
                <div>
                  <label className="block text-amber-250 mb-1">Ke Shift</label>
                  <select
                    value={hToShift}
                    onChange={(e) => setHToShift(e.target.value)}
                    className="w-full bg-[#1c0c00] text-amber-100 border border-[#D4A853]/15 rounded-xl px-2.5 py-1.5 text-xs"
                  >
                    <option value="Siang">Siang</option>
                    <option value="Sore">Sore</option>
                    <option value="Malam">Malam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-250 mb-1">Barista Pagi (Asal)</label>
                  <select
                    value={hStaffFrom}
                    onChange={(e) => setHStaffFrom(e.target.value)}
                    className="w-full bg-[#1c0c00] text-amber-100 border border-[#D4A853]/15 rounded-xl px-2.5 py-1.5 text-xs"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-amber-250 mb-1">Barista Siang (Penerima)</label>
                  <select
                    value={hStaffTo}
                    onChange={(e) => setHStaffTo(e.target.value)}
                    className="w-full bg-[#1c0c00] text-amber-100 border border-[#D4A853]/15 rounded-xl px-2.5 py-1.5 text-xs"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Handover Specific Fields mapped dynamically */}
              <div className="bg-[#1c0c00] border border-amber-500/10 p-3.5 rounded-xl space-y-3">
                <span className="text-[9px] font-mono text-amber-300 uppercase tracking-widest font-bold block mb-1">🛠️ REKAP STATUS BAHAN &amp; ALAT BAR:</span>
                
                {handoverFields.map(f => (
                  <div key={f.id}>
                    <label className="block text-amber-100/50 text-[9px] font-mono mb-1 uppercase">{f.label}</label>
                    <input
                      type="text"
                      value={customHandoverValues[f.id] || ""}
                      onChange={(e) => {
                        setCustomHandoverValues({
                          ...customHandoverValues,
                          [f.id]: e.target.value
                        });
                      }}
                      className="w-full bg-black/45 border border-amber-500/10 px-2 py-1 text-xs rounded text-amber-100 placeholder-amber-500/25"
                      placeholder={`Masukkan rincian ${f.label}`}
                    />
                  </div>
                ))}
              </div>

              {/* Collapsible Configulator for handover fields */}
              <div className="border border-amber-500/10 rounded-xl bg-black/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowHandoverFieldsConfig(!showHandoverFieldsConfig)}
                  className="w-full text-left p-2.5 flex justify-between items-center text-[10.5px] text-amber-300 font-bold bg-[#1d0e04]/40 hover:bg-[#1d0e04]/70 transition cursor-pointer select-none"
                >
                  <span>⚙️ Kelola Aturan &amp; Rincian Handover</span>
                  <span>{showHandoverFieldsConfig ? "▲ Sembunyikan" : "▼ Tampilkan"}</span>
                </button>

                {showHandoverFieldsConfig && (
                  <div className="p-3 border-t border-amber-500/10 space-y-3 bg-black/35">
                    
                    {/* Add new field */}
                    <div className="space-y-1.5 p-2 bg-[#1b0a02]/30 rounded border border-amber-500/5">
                      <span className="text-[9px] text-amber-250 font-mono block font-semibold">➕ TAMBAH KOLOM SERAH TERIMA:</span>
                      <input
                        type="text"
                        placeholder="Contoh: Sisa Susu Oat, Piring Bersih..."
                        value={newHandoverFieldLabel}
                        onChange={(e) => setNewHandoverFieldLabel(e.target.value)}
                        className="w-full bg-black/45 border border-amber-500/15 p-1 rounded text-amber-100 text-[10.5px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddHandoverField}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-1 rounded text-[9.5px] uppercase transition cursor-pointer w-full mt-1"
                      >
                        Tambah Kolom
                      </button>
                    </div>

                    {/* Manage active list */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-amber-250 font-mono block font-semibold">📋 DAFTAR KOLOM AKTIF:</span>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {handoverFields.map(f => (
                          <div key={f.id} className="flex justify-between items-center bg-black/35 p-1.5 rounded border border-amber-500/5 text-[10px]">
                            {editingHandoverFieldId === f.id ? (
                              <div className="flex-1 flex gap-1.5 items-center">
                                <input
                                  type="text"
                                  value={editingHandoverFieldLabel}
                                  onChange={(e) => setEditingHandoverFieldLabel(e.target.value)}
                                  className="bg-black border border-amber-500/10 p-0.5 rounded text-amber-100 text-[10px] flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedHandoverField(f.id)}
                                  className="text-green-400 font-bold"
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingHandoverFieldId(null)}
                                  className="text-gray-400"
                                >
                                  ✖
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-amber-100">{f.label}</span>
                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingHandoverFieldId(f.id);
                                      setEditingHandoverFieldLabel(f.label);
                                    }}
                                    className="text-amber-400 hover:text-amber-350 cursor-pointer text-[10px]"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteHandoverField(f.id)}
                                    className="text-red-400 hover:text-red-350 cursor-pointer text-[10px]"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Pesan operasional / Memo serah terima</label>
                <textarea
                  rows={3}
                  placeholder="Info kas laci, order supplier yang belum dikonfirmasi..."
                  value={hNotes}
                  onChange={(e) => setHNotes(e.target.value)}
                  className="w-full bg-black/45 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitHandover}
                className="w-full bg-[#D4A853] hover:bg-amber-400 text-black font-semibold rounded-xl py-2 transition"
              >
                🤝 Kirim Memo Serah Terima (Handover)
              </button>
            </div>
          </div>

          {/* Handover List and Actions */}
          <div className="lg:col-span-2 bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm">📜 Jurnal Arsip Memo Serah Terima</h3>
            
            {handovers.length === 0 ? (
              <p className="text-amber-100/30 py-20 text-center italic">Belum ada serah terima shift terdata.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {handovers.map((h, idx) => (
                  <div key={idx} className="bg-black/35 rounded-2xl border border-amber-500/10 p-4.5 space-y-3 hover:border-amber-400 transition relative">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-amber-300/80 font-mono">{h.date} | {h.time}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${h.isConfirmed ? "bg-green-500/15 text-green-400" : "bg-red-500/20 text-red-400 animate-pulse"}`}>
                        {h.isConfirmed ? "DIKONFIRMASI" : "MENUNGGU RESPOND"}
                      </span>
                    </div>

                    <div className="text-left space-y-1">
                      <p className="text-[12px] font-bold text-amber-100">
                        🤝 {h.staffFrom} ➔ {h.staffTo}
                      </p>
                      <p className="text-[10px] text-amber-100/40 uppercase font-mono tracking-wide">
                        Layanan: {h.fromShift} Shift ke {h.toShift} Shift
                      </p>
                    </div>

                    {/* Specifications list */}
                    <div className="bg-black/20 p-2.5 rounded-xl border border-amber-500/5 space-y-1 font-mono text-[10px]">
                      {h.items.map((it, iIdx) => (
                        <div key={iIdx} className="flex justify-between border-b border-amber-500/5 pb-0.5 last:border-none">
                          <span className="text-amber-100/40">{it.label}:</span>
                          <span className="text-amber-200 font-bold">{it.value}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-amber-250/70 leading-relaxed italic bg-black/15 p-2 rounded-lg">
                      " {h.notes} "
                    </p>

                    {/* Confirmation Action for the targeted Barista */}
                    {!h.isConfirmed && (
                      <button
                        type="button"
                        onClick={() => handleConfirmHandover(h.id)}
                        className="w-full mt-2 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-black font-bold tracking-wide transition cursor-pointer text-center text-[10.5px]"
                      >
                        ✓ Konfirmasi Terima Operasional Shift Baru
                      </button>
                    )}

                    {h.isConfirmed && (
                      <div className="flex items-center gap-1 text-[10px] text-green-400/60 font-mono mt-1 text-center justify-center">
                        <span>Diterima pada jam {h.confirmedAt || "Sekarang"}</span>
                      </div>
                    )}

                    <div className="flex justify-end gap-1.5 pt-2 border-t border-amber-500/5 mt-1">
                      <button
                        type="button"
                        onClick={() => setEditingRecord({ type: "handover", data: JSON.parse(JSON.stringify(h)) })}
                        className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black transition text-[9px] uppercase font-bold font-mono"
                      >
                        ✏️ Edit Memo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord("handover", h.id)}
                        className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition text-[9px] uppercase font-bold font-mono"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==========================================
          SUBTAB 7: OPERATIONS INCIDENT REPORTING
          ========================================== */}
      {activeSubTab === "incidents" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-xs">
          
          {/* Incident Input Form */}
          <div className="bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm">🚨 Laporan Kejadian Luar Biasa (Incident Log)</h3>
            <p className="text-[10.5px] text-amber-100/50">Mendokumentasikan segala musibah teknis kancah, kehilangan barang, hingga keluhan pelanggan agar terdengar oleh owner.</p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-amber-250 mb-1">Kategori Kejadian</label>
                <select
                  value={incCategory}
                  onChange={(e) => setIncCategory(e.target.value as any)}
                  className="w-full bg-[#1c0c00] text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Mesin Rusak">🛠️ Mesin Rusak / Error</option>
                  <option value="Grinder Macet">⚙️ Grinder Macet / Kalibrasi Rusak</option>
                  <option value="Komplain Customer">🗣️ Komplain / Keluhan Customer</option>
                  <option value="Barang Hilang">💸 Barang Hilang / Defisit Nominal</option>
                  <option value="Lainnya">⚠️ Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Penanggung Jawab (PIC)</label>
                <select
                  value={incPic}
                  onChange={(e) => setIncPic(e.target.value)}
                  className="w-full bg-[#1c0c00] text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 text-xs"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Kronologi Kejadian</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tulis urutan kejadian lengkap saat air mesin tidak panas, dsb..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full bg-black/45 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Tindakan Sementara Yang Diambil</label>
                <textarea
                  rows={2}
                  placeholder="Matikan saklar grinder, diskon 20%, ganti cup espresso..."
                  value={incAction}
                  onChange={(e) => setIncAction(e.target.value)}
                  className="w-full bg-black/45 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitIncident}
                className="w-full bg-[#D4A853] hover:bg-amber-400 text-black font-semibold rounded-xl py-2 transition shadow-md"
              >
                🚨 Ajukan Laporan Kejadian Lapangan
              </button>
            </div>
          </div>

          {/* Jurnal Incident History  */}
          <div className="lg:col-span-2 bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 space-y-4">
            <h3 className="font-serif font-bold text-amber-300 text-sm">📜 Buku Register Musibah &amp; Incident Toko</h3>
            
            {incidents.length === 0 ? (
              <p className="text-amber-100/30 py-20 text-center italic">Tidak ada insiden tercatat.</p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {incidents.map((inc, idx) => (
                  <div key={idx} className="bg-black/35 rounded-2xl border border-red-500/15 p-4.5 space-y-2.5 relative">
                    <div className="absolute top-4.5 right-4.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-bold font-mono tracking-wider bg-red-400/10 text-red-400 uppercase border border-red-500/10">
                        {inc.category}
                      </span>
                    </div>

                    <div className="text-left space-y-0.5 max-w-[70%]">
                      <span className="text-[10px] font-mono text-amber-300/80">{inc.date} | {inc.time} WIB</span>
                      <p className="text-xs font-bold text-amber-100">Dilaporkan oleh: {inc.pic}</p>
                    </div>

                    <div className="space-y-1.5 border-t border-amber-500/5 pt-2 text-[11px] leading-relaxed">
                      <p className="text-amber-100/95 font-medium bg-[#1c0a0a]/30 p-2.5 rounded border border-red-500/5">
                        <b className="text-red-400 font-bold block uppercase text-[8.5px] font-mono mb-1">🚨 Kronologi Musibah:</b>
                        "{inc.description}"
                      </p>
                      
                      {inc.actionTaken && (
                        <p className="text-amber-200/90 font-mono bg-black/15 p-2 rounded text-[10px]">
                          <b className="text-[#D4A853] font-bold font-serif mr-1">Tindakan Diambil:</b>
                          {inc.actionTaken}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-1.5 pt-2 border-t border-amber-500/5 mt-1">
                      <button
                        type="button"
                        onClick={() => setEditingRecord({ type: "incident", data: JSON.parse(JSON.stringify(inc)) })}
                        className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black transition text-[9px] uppercase font-bold font-mono"
                      >
                        ✏️ Edit Catatan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord("incident", inc.id)}
                        className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition text-[9px] uppercase font-bold font-mono"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-xs">
          <div className="bg-[#120701] border-2 border-[#D4A853]/50 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-3">
              <h3 className="text-sm font-serif font-bold text-amber-300">
                ✏️ Edit Detail Laporan - {editingRecord.type.toUpperCase()} ({editingRecord.data.id})
              </h3>
              <button
                type="button"
                className="text-amber-100/40 hover:text-amber-100 font-mono text-base font-bold"
                onClick={() => setEditingRecord(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
              {/* Type 1: Checklist */}
              {editingRecord.type === "checklist" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-amber-250 mb-1">Staf Penanggung Jawab</label>
                    <input
                      type="text"
                      className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                      value={editingRecord.data.staff || ""}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord,
                        data: { ...editingRecord.data, staff: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-amber-250 mb-1">Shift Laporan</label>
                    <input
                      type="text"
                      className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                      value={editingRecord.data.shift || ""}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord,
                        data: { ...editingRecord.data, shift: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-amber-250 mb-1">Catatan Tambahan</label>
                    <textarea
                      rows={3}
                      className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                      value={editingRecord.data.notes || ""}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord,
                        data: { ...editingRecord.data, notes: e.target.value }
                      })}
                    />
                  </div>
                  
                  {/* Inline item completion editor */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] text-amber-300 font-semibold block uppercase">Edit Status Check Item:</span>
                    <div className="space-y-1 bg-black/25 p-2.5 rounded border border-amber-500/5 max-h-36 overflow-y-auto">
                      {(editingRecord.data.items || []).map((it: any, iIdx: number) => (
                        <label key={iIdx} className="flex gap-2 items-center text-amber-100 text-[11px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={it.completed}
                            onChange={(e) => {
                              const updatedItems = [...editingRecord.data.items];
                              updatedItems[iIdx] = { ...it, completed: e.target.checked };
                              setEditingRecord({
                                ...editingRecord,
                                data: { ...editingRecord.data, items: updatedItems }
                              });
                            }}
                            className="accent-amber-500"
                          />
                          <span>{it.task}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Type 2: Handover */}
              {editingRecord.type === "handover" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-amber-250 mb-1">Dari Shift</label>
                      <input
                        type="text"
                        className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                        value={editingRecord.data.fromShift || ""}
                        onChange={(e) => setEditingRecord({
                          ...editingRecord,
                          data: { ...editingRecord.data, fromShift: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-amber-250 mb-1">Ke Shift</label>
                      <input
                        type="text"
                        className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                        value={editingRecord.data.toShift || ""}
                        onChange={(e) => setEditingRecord({
                          ...editingRecord,
                          data: { ...editingRecord.data, toShift: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-amber-250 mb-1">Dari Kru (PIC)</label>
                      <input
                        type="text"
                        className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                        value={editingRecord.data.staffFrom || ""}
                        onChange={(e) => setEditingRecord({
                          ...editingRecord,
                          data: { ...editingRecord.data, staffFrom: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-amber-250 mb-1">Penerima Kru</label>
                      <input
                        type="text"
                        className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                        value={editingRecord.data.staffTo || ""}
                        onChange={(e) => setEditingRecord({
                          ...editingRecord,
                          data: { ...editingRecord.data, staffTo: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-amber-250 mb-1">Pesan Operasional / Memo</label>
                    <textarea
                      rows={3}
                      className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                      value={editingRecord.data.notes || ""}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord,
                        data: { ...editingRecord.data, notes: e.target.value }
                      })}
                    />
                  </div>

                  {/* Handover fields editor */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] text-amber-300 font-semibold block uppercase">Nilai Rekap Status Bahan &amp; Alat:</span>
                    <div className="space-y-2 bg-black/25 p-2.5 rounded border border-amber-500/5">
                      {(editingRecord.data.items || []).map((it: any, iIdx: number) => (
                        <div key={iIdx}>
                          <label className="block text-[9px] text-amber-100/50 mb-0.5">{it.label}</label>
                          <input
                            type="text"
                            className="w-full bg-black border border-amber-500/10 p-1 rounded text-amber-100 text-[11px]"
                            value={it.value}
                            onChange={(e) => {
                              const updatedItems = [...editingRecord.data.items];
                              updatedItems[iIdx] = { ...it, value: e.target.value };
                              setEditingRecord({
                                ...editingRecord,
                                data: { ...editingRecord.data, items: updatedItems }
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Type 3: Incident Log */}
              {editingRecord.type === "incident" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-amber-250 mb-1">Kru Pelapor (PIC)</label>
                    <input
                      type="text"
                      className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                      value={editingRecord.data.pic || ""}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord,
                        data: { ...editingRecord.data, pic: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-amber-250 mb-1">Kategori Kejadian</label>
                    <select
                      value={editingRecord.data.category || ""}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord,
                        data: { ...editingRecord.data, category: e.target.value as any }
                      })}
                      className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                    >
                      <option value="Mesin Rusak">🛠️ Mesin Rusak / Error</option>
                      <option value="Grinder Macet">⚙️ Grinder Macet / Kalibrasi Rusak</option>
                      <option value="Komplain Customer">🗣️ Komplain / Keluhan Customer</option>
                      <option value="Barang Hilang">💸 Barang Hilang / Defisit Nominal</option>
                      <option value="Lainnya">⚠️ Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-amber-250 mb-1">Kronologi Kejadian</label>
                    <textarea
                      rows={3}
                      className="w-full bg-black/45 border border-amber-500/15 p-2 rounded text-amber-100"
                      value={editingRecord.data.description || ""}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord,
                        data: { ...editingRecord.data, description: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-amber-250 mb-1">Tindakan Sementara Yang Diambil</label>
                    <textarea
                      rows={2}
                      className="w-full bg-[#1c0a00]/30 border border-amber-500/15 p-2 rounded text-amber-100"
                      value={editingRecord.data.actionTaken || ""}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord,
                        data: { ...editingRecord.data, actionTaken: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-amber-500/10">
              <button
                type="button"
                onClick={handleSaveEditedRecord}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2.5 rounded-xl transition cursor-pointer"
              >
                💾 Simpan Perubahan Catatan
              </button>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="bg-black/40 border border-amber-500/20 text-amber-100/70 py-2.5 px-4 rounded-xl hover:bg-black/60 transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
