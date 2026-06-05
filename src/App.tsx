import React, { useState, useEffect } from "react";
import {
  CoffeeOpsState,
  MasterItem,
  IssueItem,
  WasteItem,
  PrDoc,
  GrnDoc,
  FifoBatch,
  TransferLog,
  BrandBranding,
  InventoryItemState,
  User,
  AttendanceLog
} from "./types";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import FifoTracker from "./components/FifoTracker";
import StorageManagement from "./components/StorageManagement";
import TransferBarang from "./components/TransferBarang";
import ProcurementHub from "./components/ProcurementHub";
import BarangMasuk from "./components/BarangMasuk";
import BarangKeluar from "./components/BarangKeluar";
import WasteLog from "./components/WasteLog";
import CogsManagement from "./components/CogsManagement";
import Report from "./components/Report";
import MasterBahan from "./components/MasterBahan";
import BrandingSettings from "./components/BrandingSettings";
import SupabaseEnterpriseSchema from "./components/SupabaseEnterpriseSchema";
import AssistantChat from "./components/AssistantChat";
import DailySopLogs from "./components/DailySopLogs";
import UserManagement from "./components/UserManagement";
import ShiftManagement from "./components/ShiftManagement";
import SmallwaresManagement from "./components/SmallwaresManagement";
import LoginOverlay from "./components/LoginOverlay";
import AccessRestricted from "./components/AccessRestricted";
import KPIManagement from "./components/KPIManagement";
import ErrorBoundary from "./components/ErrorBoundary";
import ServiceDepartment from "./components/ServiceDepartment";
import FohManagement from "./components/FohManagement";
import SopManagement from "./components/SopManagement";
import EquipmentCenter from "./components/EquipmentCenter";
import BusinessAnalytics from "./components/BusinessAnalytics";
import SystemManagement from "./components/SystemManagement";
import CashierPosCenter from "./components/CashierPosCenter";
import PaymentGatewaySetup from "./components/PaymentGatewaySetup";
import QrisTestCenter from "./components/QrisTestCenter";
import { initialStats } from "./data";

export default function App() {
  const [state, setState] = useState<CoffeeOpsState>(initialStats);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // PWA & Connection Engine States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showUpdateAvailable, setShowUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasFetchedState, setHasFetchedState] = useState(false);

  // User Authentication, Attendance, & RBAC State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const rememberMe = localStorage.getItem("coffeeops_rememberMe") === "true";
    const expiryStr = localStorage.getItem("coffeeops_loginExpiry");
    const expiry = expiryStr ? parseInt(expiryStr) : 0;
    
    // Check if new tab session
    const isNewSession = !sessionStorage.getItem("coffeeops_sessionActive");
    if (isNewSession) {
      sessionStorage.setItem("coffeeops_sessionActive", "true");
      if (!rememberMe) {
        localStorage.removeItem("coffeeops_currentUser");
        localStorage.removeItem("coffeeops_rememberMe");
        localStorage.removeItem("coffeeops_loginExpiry");
        localStorage.removeItem("coffeeops_sessionId");
        return null;
      }
    }

    // Check 7 day limit expiration
    if (rememberMe && expiry && Date.now() > expiry) {
      localStorage.removeItem("coffeeops_currentUser");
      localStorage.removeItem("coffeeops_rememberMe");
      localStorage.removeItem("coffeeops_loginExpiry");
      localStorage.removeItem("coffeeops_sessionId");
      return null;
    }

    const saved = localStorage.getItem("coffeeops_currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  const activeRole = currentUser?.role || "Barista";

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let device = "Desktop";
    if (/Mobi|Android|iPhone/i.test(ua)) {
      device = "Mobile";
    } else if (/Tablet|iPad/i.test(ua)) {
      device = "Tablet";
    }

    let browser = "Chrome";
    if (/Firefox/i.test(ua)) {
      browser = "Firefox";
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
      browser = "Safari";
    } else if (/Edge/i.test(ua)) {
      browser = "Microsoft Edge";
    }

    const ip = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
    return { device, browser, ip };
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("coffeeops_currentUser", JSON.stringify(user));

    // Register active device session
    const info = getDeviceInfo();
    const sessId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newSession = {
      id: sessId,
      userId: user.id,
      userName: user.name,
      role: user.role,
      device: info.device,
      browser: info.browser,
      ip: info.ip,
      loginTime: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    localStorage.setItem("coffeeops_sessionId", sessId);

    const updatedSessions = [newSession, ...(state.deviceSessions || [])];
    const nextState = {
      ...state,
      deviceSessions: updatedSessions
    };
    nextState.activities = addActivity("🔑", `Staf ${user.name} (${user.role}) login ke sistem`, "info");
    logActivityGlobal(nextState, "LOGIN", `Staf ${user.name} (${user.role}) login ke sistem`, user.name);
    
    const newAudit = {
      id: "AUD-" + Date.now().toString().slice(-4),
      user: user.name,
      role: user.role,
      action: "Login Sesi Baru",
      page: "Kiosk Login",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      device: info.device,
      ip: info.ip
    };
    nextState.auditLogs = [newAudit, ...(state.auditLogs || [])].slice(0, 30);

    syncStateWithServer(nextState);

    if (user.role === "Waiter" || user.role === "Head Waiter") {
      setActiveTab("foh");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleLogout = () => {
    const userBeforeLogout = currentUser;
    const sessId = localStorage.getItem("coffeeops_sessionId");
    setCurrentUser(null);
    localStorage.removeItem("coffeeops_currentUser");
    localStorage.removeItem("coffeeops_rememberMe");
    localStorage.removeItem("coffeeops_loginExpiry");
    localStorage.removeItem("coffeeops_sessionId");

    let nextSessions = state.deviceSessions || [];
    if (sessId && state.deviceSessions) {
      nextSessions = (state.deviceSessions || []).filter(s => s.id !== sessId);
    }

    const nextState = {
      ...state,
      deviceSessions: nextSessions
    };

    if (userBeforeLogout) {
      nextState.activities = addActivity("🚪", `Staf ${userBeforeLogout.name} (${userBeforeLogout.role}) logout dari sistem`, "info");
      logActivityGlobal(nextState, "LOGOUT", `Staf ${userBeforeLogout.name} (${userBeforeLogout.role}) logout dari sistem`, userBeforeLogout.name);
      
      const newAudit = {
        id: "AUD-" + Date.now().toString().slice(-4),
        user: userBeforeLogout.name,
        role: userBeforeLogout.role,
        action: "Logout Sesi",
        page: "Logout Button",
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        device: "Web Browser",
        ip: "Client Local"
      };
      nextState.auditLogs = [newAudit, ...(state.auditLogs || [])].slice(0, 30);
    }

    syncStateWithServer(nextState);
  };

  const handleAddUser = async (newUser: Omit<User, "id">) => {
    const id = "u-" + Math.floor(Math.random() * 1000000);
    const userObj: User = {
      id,
      ...newUser
    };

    const nextState = { ...state };
    nextState.users = [...(nextState.users || []), userObj];
    nextState.activities = addActivity("👤", `Mendaftarkan karyawan baru: ${newUser.name} (${newUser.role})`, "info");
    logActivityGlobal(nextState, "CREATE_EMPLOYEE", `Mendaftarkan karyawan baru: ${newUser.name} (${newUser.role})`, newUser.name);
    setState(nextState);

    try {
      const response = await fetch(getServerUrl("/api/employees"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userObj)
      });
      if (response.ok) {
        triggerToast(`✓ Karyawan ${newUser.name} berhasil didaftarkan.`);
        await fetchStateFromServer(true);
      } else {
        triggerToast("Gagal menyimpan ke database cloud, menggunakan memori lokal.");
        syncStateWithServer(nextState);
      }
    } catch (err) {
      console.error("Failed to post user:", err);
      syncStateWithServer(nextState);
    }
  };

  const handleUpdateUserPin = async (id: string, newPin: string) => {
    const nextState = { ...state };
    if (!nextState.users) return;
    const userIdx = nextState.users.findIndex((u) => u.id === id);
    if (userIdx !== -1) {
      const updatedUser = { ...nextState.users[userIdx], pin: newPin };
      nextState.users[userIdx] = updatedUser;
      nextState.activities = addActivity("⚙️", `Memperbarui PIN login keamananan staf ${updatedUser.name}`, "info");
      setState(nextState);

      try {
        const response = await fetch(getServerUrl(`/api/employees/${id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedUser)
        });
        if (response.ok) {
          triggerToast("✓ PIN staf berhasil diubah.");
          await fetchStateFromServer(true);
        } else {
          syncStateWithServer(nextState);
        }
      } catch (err) {
        console.error("Failed to update PIN:", err);
        syncStateWithServer(nextState);
      }
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const nextState = { ...state };
    if (!nextState.users) return;
    const userIdx = nextState.users.findIndex((u) => u.id === updatedUser.id);
    if (userIdx !== -1) {
      const liveUser = {
        ...nextState.users[userIdx],
        ...updatedUser,
        updatedAt: new Date().toISOString()
      };
      nextState.users[userIdx] = liveUser;
      nextState.activities = addActivity("⚙️", `Memperbarui informasi karyawan ${updatedUser.name} (${updatedUser.role})`, "info");
      logActivityGlobal(nextState, "UPDATE_EMPLOYEE", `Memperbarui informasi karyawan ${updatedUser.name} (${updatedUser.role})`, updatedUser.name);

      if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(liveUser);
        localStorage.setItem("coffeeops_currentUser", JSON.stringify(liveUser));
      }
      setState(nextState);

      try {
        const response = await fetch(getServerUrl(`/api/employees/${updatedUser.id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(liveUser)
        });
        if (response.ok) {
          triggerToast("✓ Data karyawan berhasil diperbarui.");
          await fetchStateFromServer(true);
        } else {
          syncStateWithServer(nextState);
        }
      } catch (err) {
        console.error("Failed to update user:", err);
        syncStateWithServer(nextState);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    const nextState = { ...state };
    if (!nextState.users) return;
    const user = nextState.users.find((u) => u.id === id);
    nextState.users = nextState.users.filter((u) => u.id !== id);
    nextState.activities = addActivity("⚙️", `Menghapus akun kru: ${user?.name || "Staf"}`, "info");
    if (user) {
      logActivityGlobal(nextState, "DELETE_EMPLOYEE", `Menghapus akun kru: ${user.name} (${user.role})`, user.name);
    }
    setState(nextState);

    try {
      const response = await fetch(getServerUrl(`/api/employees/${id}`), {
        method: "DELETE"
      });
      if (response.ok) {
        triggerToast("Akun kru berhasil dihapus.");
        await fetchStateFromServer(true);
      } else {
        syncStateWithServer(nextState);
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      syncStateWithServer(nextState);
    }
  };

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Modal Edit Contexts
  const [modalEditIndex, setModalEditIndex] = useState<number | null>(null);
  const [modalEditCode, setModalEditCode] = useState<string | null>(null);
  const [modalStorageLoc, setModalStorageLoc] = useState<"gudang" | "bar" | null>(null);
  const [transferFromTo, setTransferFromTo] = useState<{ from: "gudang" | "bar"; to: "gudang" | "bar" } | null>(null);

  // Form Inputs State (Issue)
  const [issueForm, setIssueForm] = useState({
    code: "",
    qty: 0,
    cat: "Pemakaian Produksi",
    by: "",
    shift: "Pagi (06:00–14:00)",
    note: ""
  });

  // Form Inputs State (Waste)
  const [wasteForm, setWasteForm] = useState({
    code: "",
    qty: 0,
    cause: "Kadaluarsa / Expired",
    loss: 0,
    by: "",
    action: "",
    rawDate: ""
  });

  // Form Inputs State (FIFO)
  const [fifoForm, setFifoForm] = useState({
    code: "",
    qty: 0,
    inDate: new Date().toISOString().split("T")[0],
    expDate: ""
  });

  // Form Inputs State (Master Item)
  const [masterForm, setMasterForm] = useState({
    code: "",
    name: "",
    unit: "kg",
    par: 1,
    price: 0,
    supplier: "",
    temp: "Suhu Ruang 20-25°C",
    shelf: "3 bulan",
    loc: "gudang" as "gudang" | "bar" | "both"
  });

  // Form Inputs State (GRN)
  const [grnMeta, setGrnMeta] = useState({
    no: "",
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    by: "",
    dest: "gudang" as "gudang" | "bar" | "both"
  });
  const [grnRows, setGrnRows] = useState<{ code: string; qty: number; conditions: string; expDate: string }[]>([
    { code: "", qty: 0, conditions: "✓ Baik", expDate: "" }
  ]);

  // Form Inputs State (PR)
  const [prMeta, setPrMeta] = useState({
    no: "",
    date: new Date().toISOString().split("T")[0],
    by: "",
    supplier: ""
  });
  const [prRows, setPrRows] = useState<{ code: string; qty: number; price: number }[]>([
    { code: "", qty: 0, price: 0 }
  ]);

  // Form Inputs State (Transfer)
  const [tfForm, setTfForm] = useState({
    code: "",
    qty: 0,
    by: "",
    reason: "",
    date: new Date().toISOString().split("T")[0]
  });

  // Form Inputs State (Opname)
  const [opnameQuantities, setOpnameQuantities] = useState<{ [code: string]: number }>({});
  const [opnameBy, setOpnameBy] = useState("");

  // Confirmation Modal Context
  const [confirmContext, setConfirmContext] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);

  // Helper date/time formatters
  const nowStr = () => {
    const d = new Date();
    return d.toISOString().replace("T", " ").substring(0, 19);
  };

  const getTodayDate = () => {
    return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  // ── SINKRONISASI API ONLINE ──
  const getServerUrl = (path: string): string => {
    const customHost = localStorage.getItem("coffeeops_api_endpoint");
    if (customHost) {
      return `${customHost}${path}`;
    }
    const isCapacitor = (window as any).Capacitor || window.location.protocol === "capacitor:" || window.location.protocol === "app:";
    if (isCapacitor) {
      const defaultRemoteHost = "https://ais-pre-mctbu5vfrmwupdg2tutota-343615724277.asia-east1.run.app";
      return `${defaultRemoteHost}${path}`;
    }
    return path;
  };

  const fetchStateFromServer = async (silent = false) => {
    try {
      const response = await fetch(getServerUrl("/api/state"));
      if (response.ok) {
        const serverState = await response.json();
        let mergedState: CoffeeOpsState = {
          ...serverState,
          users: serverState.users || [],
          suppliers: serverState.suppliers || initialStats.suppliers,
          supplierMapping: serverState.supplierMapping || initialStats.supplierMapping,
          pos: serverState.pos || initialStats.pos,
          auditLogs: serverState.auditLogs || initialStats.auditLogs
        };

        // Cache the successful server state to browser's secure cache for high-performance UI rendering only (no database overwrite)
        try {
          localStorage.setItem("coffeeops_db_state", JSON.stringify(mergedState));
        } catch (e) {
          console.error("Failed to cache database state to localStorage:", e);
        }

        setState(mergedState);
        setIsConnected(true);
        setLastUpdate(getTodayDate());
      } else {
        if (!silent) setIsConnected(false);
      }
    } catch (err) {
      if (!silent) setIsConnected(false);
    } finally {
      setHasFetchedState(true);
    }
  };

  const syncStateWithServer = async (updatedState: CoffeeOpsState) => {
    // Immediate local state update for fast UX
    setState(updatedState);
    
    // Commit to browser persistent localstorage mirroring immediately
    try {
      localStorage.setItem("coffeeops_db_state", JSON.stringify(updatedState));
    } catch (e) {
      console.error("Failed to commit database state to localStorage:", e);
    }

    try {
      const response = await fetch(getServerUrl("/api/state"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedState)
      });
      if (response.ok) {
        setIsConnected(true);
        setLastUpdate(getTodayDate());
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      setIsConnected(false);
    }
  };

  // Fetch initial state & start polling sync
  useEffect(() => {
    fetchStateFromServer();
    const interval = setInterval(() => {
      fetchStateFromServer(true);
    }, 10000); // Pulse check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // PWA Registration & Event Bindings
  useEffect(() => {
    const isBannerDismissed = localStorage.getItem("coffeeops_install_dismissed") === "true";

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isBannerDismissed) {
        setShowInstallBanner(true);
      }
    };

    const handleOnline = () => {
      setIsOffline(false);
      setIsConnected(true);
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 5000);
      fetchStateFromServer(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsConnected(false);
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register PWA Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        setRegistration(reg);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setShowUpdateAvailable(true);
              }
            });
          }
        });

        if (reg.waiting) {
          setShowUpdateAvailable(true);
        }
      }).catch((e) => {
        console.warn("Service Worker registration failed/unsupported:", e);
      });
    }

    let refreshing = false;
    navigator.serviceWorker?.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissInstall = () => {
    localStorage.setItem("coffeeops_install_dismissed", "true");
    setShowInstallBanner(false);
  };

  const handleApplyUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  // Inactivity limit mapper based on user roles (Staff: 15m, Supervisor: 30m, Manager: 60m)
  const getInactivityLimit = (role: string): number | null => {
    if (role === "Owner") return null; // Disabled for Owner
    if (role === "Manager") return 60 * 60 * 1000;
    if (role.toLowerCase().includes("supervisor") || role.toLowerCase().includes("head")) {
      return 30 * 60 * 1000;
    }
    return 15 * 60 * 1000; // All other staff
  };

  // security: Auto logout inactive user sessions
  useEffect(() => {
    if (!currentUser) return;
    const limit = getInactivityLimit(currentUser.role);
    if (!limit) return;

    let timer: any;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        handleLogout();
        alert("🛡️ Keamanan CoffeeOps: Sesi Anda telah otomatis ditutup (Auto-Logout) karena tidak ada aktivitas operasional.");
      }, limit);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    resetTimer();

    events.forEach(evt => window.addEventListener(evt, resetTimer));

    return () => {
      clearTimeout(timer);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser]);

  // security: Validate if current device session ID has been revoked/forced out remotely by Admin
  useEffect(() => {
    if (!currentUser || !hasFetchedState) return;
    const currentSessionId = localStorage.getItem("coffeeops_sessionId");
    if (!currentSessionId) return;

    const revokedList = state.revokedSessionIds || [];
    if (revokedList.includes(currentSessionId)) {
      handleLogout();
      alert("🛡️ Keamanan CoffeeOps: Perangkat/sesi Anda telah dikeluarkan secara remote oleh Owner atau Manager.");
    }
  }, [state.revokedSessionIds, currentUser, hasFetchedState]);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    const timeout = setTimeout(() => {
      setToastMessage((prev) => prev === message ? null : prev);
    }, 4000);
  };

  const addActivity = (icon: string, text: string, type: "in" | "out" | "waste" | "pr" | "transfer" | "info") => {
    const act = {
      id: "ACT-" + Date.now().toString(),
      icon,
      text,
      type,
      time: nowStr()
    };
    const nextActs = [act, ...(state.activities || [])].slice(0, 50);
    return nextActs;
  };

  const logStockMovement = (
    nextState: CoffeeOpsState,
    itemId: string,
    type: "IN" | "OUT" | "ADJUST",
    quantity: number,
    beforeStock: number,
    afterStock: number,
    reason: string,
    createdBy?: string
  ) => {
    const newMovement = {
      id: "SM-" + Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6),
      item_id: itemId,
      type,
      quantity,
      before_stock: beforeStock,
      after_stock: afterStock,
      reason,
      created_by: createdBy || currentUser?.name || "System",
      created_at: new Date().toISOString()
    };
    nextState.stockMovements = [newMovement, ...(nextState.stockMovements || [])];
  };

  const logActivityGlobal = (
    nextState: CoffeeOpsState,
    action: "LOGIN" | "LOGOUT" | "CREATE_EMPLOYEE" | "UPDATE_EMPLOYEE" | "DELETE_EMPLOYEE" | "ADD_STOCK" | "REMOVE_STOCK" | "CREATE_SALE" | "CLOCK_IN" | "CLOCK_OUT",
    description: string,
    userId?: string
  ) => {
    const newGlobalLog = {
      id: "GL-" + Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6),
      user_id: userId || currentUser?.name || "System",
      action,
      description,
      created_at: new Date().toISOString()
    };
    nextState.activityLogsGlobal = [newGlobalLog, ...(nextState.activityLogsGlobal || [])];
  };

  // ── MODAL OPERATIONAL HANDLERS ──
  
  // Submit Issue
  const handleIssueSubmit = () => {
    if (!issueForm.code || issueForm.qty <= 0) {
      triggerToast("Pilihlah bahan dan masukkan volume pengeluaran harian.");
      return;
    }

    const m = state.master.find(x => x.code === issueForm.code);
    if (!m) return;

    const nextState = { ...state };
    
    // update inventory tracker statistics
    const prevInv = nextState.inventory[issueForm.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
    nextState.inventory[issueForm.code] = {
      ...prevInv,
      keluar: prevInv.keluar + issueForm.qty
    };

    const beforeStock = Math.max(0, prevInv.awal + prevInv.masuk - prevInv.keluar - prevInv.waste);
    const afterStock = Math.max(0, beforeStock - issueForm.qty);
    logStockMovement(
      nextState,
      issueForm.code,
      "OUT",
      issueForm.qty,
      beforeStock,
      afterStock,
      `Pemakaian: ${issueForm.cat} (${issueForm.note || "Tanpa catatan"})`,
      issueForm.by || "Staff Barista"
    );

    // adjust storage levels based on item location
    if (m.loc === "gudang") {
      const currentGudangQty = nextState.storage.gudang[issueForm.code] || 0;
      nextState.storage.gudang[issueForm.code] = Math.max(0, parseFloat((currentGudangQty - issueForm.qty).toFixed(4)));
    } else if (m.loc === "bar") {
      const currentBarQty = nextState.storage.bar[issueForm.code] || 0;
      nextState.storage.bar[issueForm.code] = Math.max(0, parseFloat((currentBarQty - issueForm.qty).toFixed(4)));
    } else {
      // both
      const currentBar = nextState.storage.bar[issueForm.code] || 0;
      if (currentBar >= issueForm.qty) {
        nextState.storage.bar[issueForm.code] = parseFloat((currentBar - issueForm.qty).toFixed(4));
      } else {
        nextState.storage.bar[issueForm.code] = 0;
        const remaining = issueForm.qty - currentBar;
        const currentGudang = nextState.storage.gudang[issueForm.code] || 0;
        nextState.storage.gudang[issueForm.code] = Math.max(0, parseFloat((currentGudang - remaining).toFixed(4)));
      }
    }

    if (modalEditIndex !== null) {
      // rollback previous index first
      const oldIssue = nextState.issues[modalEditIndex];
      const oldM = state.master.find(x => x.code === oldIssue.code);
      if (oldM) {
        if (oldM.loc === "gudang") {
          const prevGudang = nextState.storage.gudang[oldIssue.code] || 0;
          nextState.storage.gudang[oldIssue.code] = prevGudang + oldIssue.qty;
        } else {
          const prevBar = nextState.storage.bar[oldIssue.code] || 0;
          nextState.storage.bar[oldIssue.code] = prevBar + oldIssue.qty;
        }
      }
      
      const prevInvOld = nextState.inventory[oldIssue.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
      nextState.inventory[oldIssue.code] = {
        ...prevInvOld,
        keluar: Math.max(0, prevInvOld.keluar - oldIssue.qty)
      };

      // edit existing issue
      nextState.issues[modalEditIndex] = {
        id: oldIssue.id,
        time: nowStr(),
        isoDate: new Date().toISOString(),
        code: issueForm.code,
        name: m.name,
        qty: issueForm.qty,
        unit: m.unit,
        cat: issueForm.cat,
        by: issueForm.by || "Staff Barista",
        shift: issueForm.shift,
        note: issueForm.note
      };
      
      triggerToast(`✓ Log pengeluaran ${m.name} berhasil diperbarui.`);
    } else {
      // insert new issue log
      const newIssue: IssueItem = {
        id: "IS-" + Date.now().toString().substring(10),
        time: nowStr(),
        isoDate: new Date().toISOString(),
        code: issueForm.code,
        name: m.name,
        qty: issueForm.qty,
        unit: m.unit,
        cat: issueForm.cat,
        by: issueForm.by || "Staff Barista",
        shift: issueForm.shift,
        note: issueForm.note
      };
      
      nextState.issues = [newIssue, ...(nextState.issues || [])];
      nextState.activities = addActivity("📤", `Pemakaian ${issueForm.qty} ${m.unit} ${m.name} oleh ${issueForm.by || "Staff"} (Stok Berkurang)`, "out");
      logActivityGlobal(nextState, "REMOVE_STOCK", `Pemakaian ${issueForm.qty} ${m.unit} ${m.name} oleh ${issueForm.by || "Staff"}`, issueForm.by || "Staff");
      triggerToast(`✓ Pemakaian ${issueForm.qty} ${m.unit} ${m.name} disimpan.`);
    }

    syncStateWithServer(nextState);
    setActiveModal(null);
  };

  const handleDeleteIssue = (index: number) => {
    setConfirmContext({
      title: "Batalkan Pengeluaran",
      desc: "Menghapus catatan pemakaian ini akan mengembalikan jumlah stok kembali ke tempat penyimpanannya.",
      onConfirm: () => {
        const nextState = { ...state };
        const target = nextState.issues[index];
        
        // restore storage based on item location
        const m = state.master.find(x => x.code === target.code);
        if (m) {
          if (m.loc === "gudang") {
            const currentGudang = nextState.storage.gudang[target.code] || 0;
            nextState.storage.gudang[target.code] = currentGudang + target.qty;
          } else {
            const currentBar = nextState.storage.bar[target.code] || 0;
            nextState.storage.bar[target.code] = currentBar + target.qty;
          }
        }

        // restore inventory stats
        const prevInv = nextState.inventory[target.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
        nextState.inventory[target.code] = {
          ...prevInv,
          keluar: Math.max(0, prevInv.keluar - target.qty)
        };

        const beforeStock = Math.max(0, prevInv.awal + prevInv.masuk - prevInv.keluar - prevInv.waste);
        const afterStock = beforeStock + target.qty;
        logStockMovement(
          nextState,
          target.code,
          "IN",
          target.qty,
          beforeStock,
          afterStock,
          `Hapus Catatan Pemakaian: Stok dikembalikan`,
          currentUser?.name || "System"
        );

        nextState.issues.splice(index, 1);
        nextState.activities = addActivity("📤", `Menghapus catatan pemakaian bahan ${target.name} (Stok Dikembalikan)`, "info");
        logActivityGlobal(nextState, "ADD_STOCK", `Hapus catatan pemakaian bahan ${target.name} (Stok dikembalikan: ${target.qty} ${target.unit})`);

        syncStateWithServer(nextState);
        setConfirmContext(null);
        triggerToast("Catatan pengeluaran harian dibatalkan.");
      }
    });
  };

  // Submit Waste
  const handleWasteSubmit = () => {
    if (!wasteForm.code || wasteForm.qty <= 0) {
      triggerToast("Pilihlah bahan dan masukkan volume waste.");
      return;
    }

    const m = state.master.find(x => x.code === wasteForm.code);
    if (!m) return;

    const nextState = { ...state };
    
    // update inventory statistics
    const prevInv = nextState.inventory[wasteForm.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
    nextState.inventory[wasteForm.code] = {
      ...prevInv,
      waste: prevInv.waste + wasteForm.qty
    };

    const beforeStock = Math.max(0, prevInv.awal + prevInv.masuk - prevInv.keluar - prevInv.waste);
    const afterStock = Math.max(0, beforeStock - wasteForm.qty);
    logStockMovement(
      nextState,
      wasteForm.code,
      "OUT",
      wasteForm.qty,
      beforeStock,
      afterStock,
      `Waste: ${wasteForm.cause} — Tindakan: ${wasteForm.action || "Tidak ada"}`,
      wasteForm.by || "Supervisor"
    );

    // Deduct from storage based on item location
    if (m.loc === "gudang") {
      const currentGudang = nextState.storage.gudang[wasteForm.code] || 0;
      nextState.storage.gudang[wasteForm.code] = Math.max(0, parseFloat((currentGudang - wasteForm.qty).toFixed(4)));
    } else if (m.loc === "bar") {
      const currentBar = nextState.storage.bar[wasteForm.code] || 0;
      nextState.storage.bar[wasteForm.code] = Math.max(0, parseFloat((currentBar - wasteForm.qty).toFixed(4)));
    } else {
      // both
      const currentBar = nextState.storage.bar[wasteForm.code] || 0;
      if (currentBar >= wasteForm.qty) {
        nextState.storage.bar[wasteForm.code] = parseFloat((currentBar - wasteForm.qty).toFixed(4));
      } else {
        nextState.storage.bar[wasteForm.code] = 0;
        const remaining = wasteForm.qty - currentBar;
        const currentGudang = nextState.storage.gudang[wasteForm.code] || 0;
        nextState.storage.gudang[wasteForm.code] = Math.max(0, parseFloat((currentGudang - remaining).toFixed(4)));
      }
    }

    const estLoss = wasteForm.loss || (m.price * wasteForm.qty);

    if (modalEditIndex !== null) {
      const oldWaste = nextState.wastes[modalEditIndex];
      const prevInvOld = nextState.inventory[oldWaste.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
      nextState.inventory[oldWaste.code] = {
        ...prevInvOld,
        waste: Math.max(0, prevInvOld.waste - oldWaste.qty)
      };

      // Rollback old waste qty to storage
      const oldM = state.master.find(x => x.code === oldWaste.code);
      if (oldM) {
        if (oldM.loc === "gudang") {
          nextState.storage.gudang[oldWaste.code] = (nextState.storage.gudang[oldWaste.code] || 0) + oldWaste.qty;
        } else {
          nextState.storage.bar[oldWaste.code] = (nextState.storage.bar[oldWaste.code] || 0) + oldWaste.qty;
        }
      }

      nextState.wastes[modalEditIndex] = {
        id: oldWaste.id,
        time: nowStr(),
        rawDate: wasteForm.rawDate || new Date().toISOString().split("T")[0],
        code: wasteForm.code,
        name: m.name,
        qty: wasteForm.qty,
        unit: m.unit,
        cause: wasteForm.cause,
        loss: estLoss,
        by: wasteForm.by || "Supervisor",
        action: wasteForm.action
      };
      triggerToast(`✓ Catatan waste ${m.name} diperbarui & stok tersinkronisasi.`);
    } else {
      const newWaste: WasteItem = {
        id: "W-" + Date.now().toString().substring(10),
        time: nowStr(),
        rawDate: wasteForm.rawDate || new Date().toISOString().split("T")[0],
        code: wasteForm.code,
        name: m.name,
        qty: wasteForm.qty,
        unit: m.unit,
        cause: wasteForm.cause,
        loss: estLoss,
        by: wasteForm.by || "Supervisor",
        action: wasteForm.action
      };

      nextState.wastes = [newWaste, ...(nextState.wastes || [])];
      nextState.activities = addActivity("🗑", `Mencatat waste ${m.name} sebanyak ${wasteForm.qty} ${m.unit} — ${wasteForm.cause} (Stok Berkurang)`, "waste");
      logActivityGlobal(nextState, "REMOVE_STOCK", `Mencatat waste ${m.name} sebanyak ${wasteForm.qty} ${m.unit} - Kerugian: Rp ${estLoss.toLocaleString("id-ID")}`, wasteForm.by || "Supervisor");
      triggerToast(`✓ Waste ${m.name} sebanyak ${wasteForm.qty} ${m.unit} dicatatkan & stok berkurang.`);
    }

    syncStateWithServer(nextState);
    setActiveModal(null);
  };

  const handleDeleteWaste = (index: number) => {
    setConfirmContext({
      title: "Hapus Catatan Waste",
      desc: "Menghapus catatan ini akan merubah laporan rekap kerugian cafe harian.",
      onConfirm: () => {
        const nextState = { ...state };
        const target = nextState.wastes[index];

        const prevInv = nextState.inventory[target.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
        nextState.inventory[target.code] = {
          ...prevInv,
          waste: Math.max(0, prevInv.waste - target.qty)
        };

        const beforeStock = Math.max(0, prevInv.awal + prevInv.masuk - prevInv.keluar - prevInv.waste);
        const afterStock = beforeStock + target.qty;
        logStockMovement(
          nextState,
          target.code,
          "IN",
          target.qty,
          beforeStock,
          afterStock,
          `Hapus Catatan Waste: Stok dikembalikan`,
          currentUser?.name || "System"
        );

        // restore storage based on item location
        const m = state.master.find(x => x.code === target.code);
        if (m) {
          if (m.loc === "gudang") {
            nextState.storage.gudang[target.code] = (nextState.storage.gudang[target.code] || 0) + target.qty;
          } else {
            nextState.storage.bar[target.code] = (nextState.storage.bar[target.code] || 0) + target.qty;
          }
        }

        nextState.wastes.splice(index, 1);
        nextState.activities = addActivity("🗑", `Hapus pencatatan waste ${target.name} (Stok Dikembalikan)`, "info");
        logActivityGlobal(nextState, "ADD_STOCK", `Hapus pencatatan waste ${target.name} (Stok Dikembalikan: ${target.qty} ${target.unit})`);

        syncStateWithServer(nextState);
        setConfirmContext(null);
        triggerToast("Catatan log waste dihapus & stok dikembalikan.");
      }
    });
  };

  // Submit GRN (Incoming Supply)
  const handleGRNSubmit = () => {
    if (!grnMeta.supplier) {
      triggerToast("Masukkan nama supplier terlebih dahulu.");
      return;
    }

    const validRows = grnRows.filter(r => r.code && r.qty > 0);
    if (validRows.length === 0) {
      triggerToast("Tambahkan minimal satu jenis bahan baku yang diterima.");
      return;
    }

    const nextState = { ...state };
    const itemsRow: any[] = [];
    let totalQty = 0;

    validRows.forEach(row => {
      const m = state.master.find(x => x.code === row.code);
      if (!m) return;

      // Add to inventory received statistics
      const prevInv = nextState.inventory[row.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
      nextState.inventory[row.code] = {
        ...prevInv,
        masuk: prevInv.masuk + row.qty
      };

      const beforeStock = Math.max(0, prevInv.awal + prevInv.masuk - prevInv.keluar - prevInv.waste);
      const afterStock = beforeStock + row.qty;
      logStockMovement(
        nextState,
        row.code,
        "IN",
        row.qty,
        beforeStock,
        afterStock,
        `Penerimaan GRN Supplier: ${grnMeta.supplier}`,
        grnMeta.by || "Staff Receiving"
      );

      // Add to physical location storage
      if (grnMeta.dest === "gudang" || grnMeta.dest === "both") {
        const addition = grnMeta.dest === "both" ? row.qty / 2 : row.qty;
        nextState.storage.gudang[row.code] = (nextState.storage.gudang[row.code] || 0) + addition;
      }
      if (grnMeta.dest === "bar" || grnMeta.dest === "both") {
        const addition = grnMeta.dest === "both" ? row.qty / 2 : row.qty;
        nextState.storage.bar[row.code] = (nextState.storage.bar[row.code] || 0) + addition;
      }

      // Populate FIFO batch with expiry dates
      nextState.fifo[row.code] = nextState.fifo[row.code] || [];
      nextState.fifo[row.code].push({
        qty: row.qty,
        inDate: grnMeta.date,
        expDate: row.expDate || new Date(Date.now() + 86400 * 7 * 1000).toISOString().split("T")[0],
        used: false
      });
      // resort batches
      nextState.fifo[row.code].sort((a,b) => new Date(a.inDate).getTime() - new Date(b.inDate).getTime());

      itemsRow.push({
        code: row.code,
        name: m.name,
        qty: row.qty,
        unit: m.unit,
        kondisi: row.conditions
      });
      totalQty += row.qty;
    });

    const newGRNDoc: GrnDoc = {
      id: "G-" + Date.now().toString(),
      no: grnMeta.no || "GRN-" + Date.now().toString().substring(8),
      date: grnMeta.date,
      supplier: grnMeta.supplier,
      by: grnMeta.by || "Staff Receiving",
      dest: grnMeta.dest,
      items: itemsRow,
      totalQty,
      totalItems: itemsRow.length
    };

    nextState.grns = [newGRNDoc, ...(nextState.grns || [])];
    nextState.activities = addActivity("📥", `Menerima Supply dari ${grnMeta.supplier} - ${itemsRow.length} item berhasil disimpan`, "in");
    logActivityGlobal(nextState, "ADD_STOCK", `Menerima Supply dari ${grnMeta.supplier} - No: ${newGRNDoc.no} (${itemsRow.length} item)`, grnMeta.by || "Staff Receiving");

    syncStateWithServer(nextState);
    setActiveModal(null);
    triggerToast(`✓ GRN ${newGRNDoc.no} berhasil disimpan dan stok ter-update harian.`);
  };

  const handleDeleteGRN = (index: number) => {
    setConfirmContext({
      title: "Hapus Laporan GRN",
      desc: "Aksi ini akan memotong balik kuantitas dari Chiller Bar & Gudang Utama. FIFO batch pemesanan akan dihapus.",
      onConfirm: () => {
        const nextState = { ...state };
        const grn = nextState.grns[index];

        grn.items.forEach(it => {
          const prevInv = nextState.inventory[it.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
          nextState.inventory[it.code] = {
            ...prevInv,
            masuk: Math.max(0, prevInv.masuk - it.qty)
          };

          const beforeStock = Math.max(0, prevInv.awal + prevInv.masuk - prevInv.keluar - prevInv.waste);
          const afterStock = Math.max(0, beforeStock - it.qty);
          logStockMovement(
            nextState,
            it.code,
            "OUT",
            it.qty,
            beforeStock,
            afterStock,
            `Hapus / Batal Laporan GRN: ${grn.no}`,
            currentUser?.name || "System"
          );

          if (grn.dest === "gudang" || grn.dest === "both") {
            const deduction = grn.dest === "both" ? it.qty / 2 : it.qty;
            const currentGudang = nextState.storage.gudang[it.code] || 0;
            nextState.storage.gudang[it.code] = Math.max(0, currentGudang - deduction);
          }
          if (grn.dest === "bar" || grn.dest === "both") {
            const deduction = grn.dest === "both" ? it.qty / 2 : it.qty;
            const currentBar = nextState.storage.bar[it.code] || 0;
            nextState.storage.bar[it.code] = Math.max(0, currentBar - deduction);
          }

          // remove from FIFO list
          if (nextState.fifo[it.code]) {
            nextState.fifo[it.code] = nextState.fifo[it.code].filter(b => b.qty !== it.qty);
          }
        });

        nextState.grns.splice(index, 1);
        nextState.activities = addActivity("📥", `Membatalkan penerimaan GRN ${grn.no}`, "info");
        logActivityGlobal(nextState, "REMOVE_STOCK", `Membatalkan penerimaan GRN No: ${grn.no} (${grn.items.length} jenis item)`);

        syncStateWithServer(nextState);
        setConfirmContext(null);
        triggerToast("Laporan GRN dihapus.");
      }
    });
  };

  // Submit PR (Purchase Request)
  const handlePRSubmit = () => {
    if (!prMeta.supplier) {
      triggerToast("Masukkan nama supplier tujuan.");
      return;
    }

    const validRows = prRows.filter(r => r.code && r.qty > 0);
    if (validRows.length === 0) {
      triggerToast("Masukkan minimal satu item untuk dilanjutkan.");
      return;
    }

    const nextState = { ...state };
    let grandTotal = 0;
    const prItems = validRows.map(row => {
      const m = state.master.find(x => x.code === row.code);
      const prc = row.price || m?.price || 0;
      grandTotal += row.qty * prc;
      return {
        code: row.code,
        name: m?.name || "Bahan",
        qty: row.qty,
        unit: m?.unit || "unit",
        price: prc,
        subtotal: row.qty * prc
      };
    });

    const newPRDoc: PrDoc = {
      id: "P-" + Date.now().toString(),
      no: prMeta.no || "PR-" + Date.now().toString().substring(8),
      date: prMeta.date,
      by: prMeta.by || "Cafe Manager",
      supplier: prMeta.supplier,
      items: prItems,
      total: grandTotal,
      status: "Menunggu Approval"
    };

    nextState.prs = [newPRDoc, ...(nextState.prs || [])];
    nextState.activities = addActivity("🛒", `Mendaftarkan PR ${newPRDoc.no} untuk ${prMeta.supplier} - total Rp ${grandTotal.toLocaleString("id-ID")}`, "pr");

    syncStateWithServer(nextState);
    setActiveModal(null);
    triggerToast(`✓ Purchase Request ${newPRDoc.no} diajukan.`);
  };

  const handleApprovePR = (no: string) => {
    const nextState = { ...state };
    const prIdx = nextState.prs.findIndex(p => p.no === no);
    if (prIdx === -1) return;

    nextState.prs[prIdx].status = "Disetujui";
    nextState.activities = addActivity("🛒", `PR ${no} telah disetujui (Approved) oleh Owner`, "pr");

    syncStateWithServer(nextState);
    triggerToast(`✓ PR ${no} berhasil disetujui.`);
  };

  const handleDeletePR = (index: number) => {
    setConfirmContext({
      title: "Hapus Purchase Request",
      desc: "Menghapus pengajuan PR ini tidak akan memotong stok yang berjalan.",
      onConfirm: () => {
        const nextState = { ...state };
        const pr = nextState.prs[index];
        nextState.prs.splice(index, 1);
        nextState.activities = addActivity("🛒", `Hapus Purchase Request ${pr.no}`, "info");

        syncStateWithServer(nextState);
        setConfirmContext(null);
        triggerToast("Form PR telah dihapus.");
      }
    });
  };

  // Submit FIFO Batch
  const handleFifoSubmit = () => {
    if (!fifoForm.code || fifoForm.qty <= 0) {
      triggerToast("Masukkan bahan dan volume batch.");
      return;
    }

    const m = state.master.find(x => x.code === fifoForm.code);
    if (!m) return;

    const nextState = { ...state };
    nextState.fifo[fifoForm.code] = nextState.fifo[fifoForm.code] || [];
    nextState.fifo[fifoForm.code].push({
      qty: fifoForm.qty,
      inDate: fifoForm.inDate,
      expDate: fifoForm.expDate || new Date(Date.now() + 86450 * 7 * 1000).toISOString().split("T")[0],
      used: false
    });
    nextState.fifo[fifoForm.code].sort((a,b) => new Date(a.inDate).getTime() - new Date(b.inDate).getTime());

    nextState.activities = addActivity("🔄", `Mendaftarkan batch FIFO baru untuk ${m.name}`, "info");

    syncStateWithServer(nextState);
    setActiveModal(null);
    triggerToast(`✓ Batch FIFO baru ditambahkan untuk ${m.name}.`);
  };

  const handleMarkBatchUsed = (code: string, idx: number) => {
    const nextState = { ...state };
    if (nextState.fifo[code] && nextState.fifo[code][idx]) {
      nextState.fifo[code][idx].used = true;
      const m = state.master.find(x => x.code === code);
      nextState.activities = addActivity("🔄", `Membatasi/Habis batch tertua untuk ${m?.name || "Bahan"}`, "info");
      
      syncStateWithServer(nextState);
      triggerToast("✓ Batch ditandai habis. Antrean FIFO bergeser.");
    }
  };

  // Submit Stock Opname
  const handleOpnameSubmit = () => {
    const nextState = { ...state };
    
    Object.entries(opnameQuantities).forEach(([code, rawVal]) => {
      const value = Number(rawVal) || 0;
      const prev = nextState.inventory[code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
      const prevStock = Math.max(0, prev.awal + prev.masuk - prev.keluar - prev.waste);
      const diff = value - prevStock;

      nextState.inventory[code] = {
        awal: value,
        masuk: 0,
        keluar: 0,
        waste: 0
      };

      // split stock 50/50 default or put in primary default location for storages
      const m = state.master.find(x => x.code === code);
      if (m) {
        if (m.loc === "gudang") {
          nextState.storage.gudang[code] = value;
          nextState.storage.bar[code] = 0;
        } else if (m.loc === "bar") {
          nextState.storage.bar[code] = value;
          nextState.storage.gudang[code] = 0;
        } else {
          nextState.storage.gudang[code] = Math.ceil(value * 0.6);
          nextState.storage.bar[code] = Math.floor(value * 0.4);
        }

        if (diff !== 0) {
          logStockMovement(
            nextState,
            code,
            "ADJUST",
            Math.abs(diff),
            prevStock,
            value,
            `Stock Opname: ${diff > 0 ? "+" : ""}${diff} ${m.unit}`,
            opnameBy || "Staff"
          );
        }
      }
    });

    nextState.activities = addActivity("📋", `Staff ${opnameBy || "Staff"} merubah catatan Stock Opname harian`, "in");
    logActivityGlobal(nextState, "ADD_STOCK", `Staff ${opnameBy || "Staff"} merubah catatan Stock Opname harian`);

    syncStateWithServer(nextState);
    setActiveModal(null);
    triggerToast("✓ Hasil stock opname disimpan. Seluruh stok ter-sinkronisasi.");
  };

  // Submit Master
  const handleMasterSubmit = () => {
    if (!masterForm.code || !masterForm.name) {
      triggerToast("Isilah kode bahan dan nama bahan baku.");
      return;
    }

    const nextState = { ...state };
    const newItem: MasterItem = {
      code: masterForm.code,
      name: masterForm.name,
      unit: masterForm.unit,
      par: masterForm.par,
      price: masterForm.price,
      supplier: masterForm.supplier || "Supplier Lokal",
      temp: masterForm.temp,
      shelf: masterForm.shelf,
      loc: masterForm.loc
    };

    if (modalEditCode !== null) {
      const idIdx = nextState.master.findIndex(x => x.code === modalEditCode);
      if (idIdx !== -1) {
        nextState.master[idIdx] = newItem;
        triggerToast(`✓ Bahan ${masterForm.name} diperbarui.`);
      }
    } else {
      if (nextState.master.some(x => x.code === masterForm.code)) {
        triggerToast("Gagal: Kode bahan sudah dipakai!");
        return;
      }
      nextState.master.push(newItem);
      nextState.inventory[masterForm.code] = { awal: 0, masuk: 0, keluar: 0, waste: 0 };
      nextState.storage.gudang[masterForm.code] = 0;
      nextState.storage.bar[masterForm.code] = 0;
      triggerToast(`✓ Bahan ${masterForm.name} disimpan ke Master.`);
    }

    syncStateWithServer(nextState);
    setActiveModal(null);
  };

  const handleDeleteMaster = (code: string) => {
    const m = state.master.find(x => x.code === code);
    setConfirmContext({
      title: "Hapus Dari Master Database",
      desc: `Apakah Anda yakin ingin menghapus "${m?.name}"? Aksi ini akan menghapus spesifikasi dasar bahan.`,
      onConfirm: () => {
        const nextState = { ...state };
        nextState.master = nextState.master.filter(x => x.code !== code);
        syncStateWithServer(nextState);
        setConfirmContext(null);
        triggerToast("Bahan dihapus dari database master.");
      }
    });
  };

  // Submit Add Stock Storage Directly
  const [storAddForm, setStorAddForm] = useState({ code: "", qty: 1, by: "" });
  const handleDirectStockAddSubmit = () => {
    if (!storAddForm.code || storAddForm.qty <= 0 || !modalStorageLoc) return;

    const m = state.master.find(x => x.code === storAddForm.code);
    if (!m) return;

    const nextState = { ...state };
    const prevStock = nextState.storage[modalStorageLoc][storAddForm.code] || 0;
    nextState.storage[modalStorageLoc][storAddForm.code] = prevStock + storAddForm.qty;

    // update inventory received stats as well
    const prevInv = nextState.inventory[storAddForm.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
    nextState.inventory[storAddForm.code] = {
      ...prevInv,
      masuk: prevInv.masuk + storAddForm.qty
    };

    const targetLabel = modalStorageLoc === "gudang" ? state.branding.storageGudangName : state.branding.storageBarName;
    nextState.activities = addActivity(modalStorageLoc === "gudang" ? "🏗️" : "❄️", `Koreksi Manual: Tambah ${storAddForm.qty} ${m.unit} ${m.name} di ${targetLabel} oleh ${storAddForm.by || "Staff"}`, "in");

    syncStateWithServer(nextState);
    setActiveModal(null);
    triggerToast("✓ Stok berhasil ditambahkan.");
  };

  // Direct edit qty on Storage
  const handleDirectEditStockQtySubmit = (loc: "gudang" | "bar", code: string, nextValue: number) => {
    const nextState = { ...state };
    nextState.storage[loc][code] = Math.max(0, nextValue);
    
    // update inventory tracker statistics so that it is connected with harian
    const prevInv = nextState.inventory[code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
    const newTotalQty = (nextState.storage.gudang[code] || 0) + (nextState.storage.bar[code] || 0);
    // Adjust 'awal' so that 'awal + masuk - keluar - waste = newTotalQty'
    nextState.inventory[code] = {
      ...prevInv,
      awal: Math.max(0, parseFloat((newTotalQty - prevInv.masuk + prevInv.keluar + prevInv.waste).toFixed(4)))
    };

    const itemObj = state.master.find(x => x.code === code) || (state.homemadeIngredients || []).find(h => h.id === code);
    const itemName = itemObj ? itemObj.name : code;
    const label = loc === "gudang" ? state.branding.storageGudangName : state.branding.storageBarName;
    nextState.activities = addActivity("⚙️", `Mengubah stok ${itemName} di ${label} secara manual menjadi ${nextValue} (Sinkron Harian)`, "info");

    syncStateWithServer(nextState);
    triggerToast("✓ Jumlah stok dikoreksi & ter-sinkronisasi dengan inventory harian.");
  };

  // Submit Internal Mutasi Transfer
  const handleTransferSubmit = () => {
    if (!tfForm.code || tfForm.qty <= 0 || !transferFromTo) {
      triggerToast("Lengkapi form transfer terlebih dahulu.");
      return;
    }

    const { from, to } = transferFromTo;
    const currentFromSource = state.storage[from][tfForm.code] || 0;
    if (tfForm.qty > currentFromSource) {
      const fromLabel = from === "gudang" ? state.branding.storageGudangName : state.branding.storageBarName;
      triggerToast(`Gagal: Stok terbatas harian! Stok di ${fromLabel} hanya ${currentFromSource}.`);
      return;
    }

    const m = state.master.find(x => x.code === tfForm.code);
    if (!m) return;

    const nextState = { ...state };
    
    // deduct source
    nextState.storage[from][tfForm.code] = currentFromSource - tfForm.qty;
    // add to target destination
    const currentTargetDest = nextState.storage[to][tfForm.code] || 0;
    nextState.storage[to][tfForm.code] = currentTargetDest + tfForm.qty;

    const newTx: TransferLog = {
      id: "TX-" + Date.now().toString(),
      time: nowStr(),
      date: tfForm.date,
      code: tfForm.code,
      name: m.name,
      qty: tfForm.qty,
      unit: m.unit,
      from,
      to,
      reason: tfForm.reason || "Mutasi harian operasional",
      by: tfForm.by || "Staff"
    };

    nextState.transfers = [newTx, ...(nextState.transfers || [])];
    
    const fromLbl = from === "gudang" ? state.branding.storageGudangName : state.branding.storageBarName;
    const toLbl = to === "gudang" ? state.branding.storageGudangName : state.branding.storageBarName;
    nextState.activities = addActivity("↔️", `Mutasi ${tfForm.qty} ${m.unit} ${m.name} : ${fromLbl} ➡️ ${toLbl}`, "transfer");

    syncStateWithServer(nextState);
    setActiveModal(null);
    triggerToast(`✓ Mutasi stok internal ${newTx.qty} ${newTx.unit} ${newTx.name} diselesaikan.`);
  };

  const handleDeleteTransfer = (index: number) => {
    setConfirmContext({
      title: "Batalkan Mutasi Transfer",
      desc: "Menghapus pemindahan ini akan mengembalikan kuantitas stok ke posisi asal harian.",
      onConfirm: () => {
        const nextState = { ...state };
        const tx = nextState.transfers[index];

        // reverse stok
        nextState.storage[tx.to][tx.code] = Math.max(0, (nextState.storage[tx.to][tx.code] || 0) - tx.qty);
        nextState.storage[tx.from][tx.code] = (nextState.storage[tx.from][tx.code] || 0) + tx.qty;

        nextState.transfers.splice(index, 1);
        nextState.activities = addActivity("↔️", `Membatalkan mutasi internal ${tx.name}`, "info");

        syncStateWithServer(nextState);
        setConfirmContext(null);
        triggerToast("Catatan transfer dibatalkan.");
      }
    });
  };

  // Reset database back to default factory
  const handleResetDatabase = () => {
    setConfirmContext({
      title: "Apakah Anda Yakin Ingin Reset?",
      desc: "Perhatian: Ini akan mengembalikan semua data operasional termasuk log pembelian, logs barang keluar, dan FIFO ke pengaturan awal cafe Axes Coffee.",
      onConfirm: () => {
        syncStateWithServer(initialStats);
        setConfirmContext(null);
        setActiveTab("dashboard");
        triggerToast("Database diatur ulang.");
      }
    });
  };

  // Tab Titles lookup for Akses Terbatas screen
  const tabTitles: { [key: string]: string } = {
    dashboard: "Dashboard",
    cashier_pos: "Cashier POS Center",
    foh: "Front of House (FOH)",
    service_dept: "Service Department",
    inventory: "Inventory Harian",
    kpi: "KPI & Performa Karyawan",
    fifo: "FIFO Tracker",
    storage: "Stok Gudang & Bar",
    transfer: "Transfer Barang",
    procurement: "Procurement & Supplier",
    receiving: "Barang Masuk (GRN)",
    issue: "Barang Keluar",
    waste: "Waste & Loss Log",
    report: "Laporan Bulanan",
    master: "Master Bahan Baku",
    branding: "Kustomisasi Brand",
    supabase: "Supabase Core SaaS",
    absensi: "Presensi & Absensi Karyawan",
    users: "Akses Login & Kru",
    midtrans_setup: "Payment Gateway Setup",
    qris_tester: "QRIS Test Center",
  };

  const isTabRestricted = (tabId: string, role: string) => {
    if (tabId === "midtrans_setup" || tabId === "qris_tester") {
      return role !== "Owner";
    }
    if (role === "Owner" || role === "Manager") return false;

    if (role === "Waiter" || role === "Head Waiter") {
      return !["foh", "absensi"].includes(tabId);
    }
    if (tabId === "foh") {
      return !["Owner", "Manager", "Supervisor", "Head Waiter", "Waiter"].includes(role);
    }

    if (role === "Service Staff") {
      return !["service_dept", "absensi"].includes(tabId);
    }
    if (tabId === "service_dept") return true;
    if (tabId === "kpi") return true;
    if (role === "Head Barista") {
      return ["users", "branding", "report", "supabase"].includes(tabId);
    }
    if (role === "Barista") {
      return ["users", "branding", "report", "cogs", "procurement", "supabase"].includes(tabId);
    }
    if (role === "Cashier") {
      const allowedCashierTabs = ["dashboard", "cashier_pos", "sop_mgmt", "kpi", "dailysop", "absensi", "midtrans_setup", "qris_tester"];
      return !allowedCashierTabs.includes(tabId);
    }
    return false;
  };

  return (
    <ErrorBoundary>
      <div className="bg-[#05180c] min-h-screen font-sans text-amber-50 selection:bg-amber-500/30">
      {/* Kiosk PIN Login Overlay */}
      {!currentUser && (
        <LoginOverlay state={state} onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Sidebar navigation */}
      <Sidebar
        state={state}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastUpdate={lastUpdate}
        activeRole={activeRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Sidebar mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-45 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main layout container wrapper */}
      <div className="lg:pl-64 pl-0 min-h-screen flex flex-col w-full overflow-x-hidden">
        {/* Top bar header */}
        <Topbar
          state={state}
          activeTab={activeTab}
          onOpenQuickInput={() => {
            // direct opens action option prompt
            setActiveModal("quickInput");
          }}
          onOpenAiAssistant={() => setIsAiOpen(true)}
          isConnected={isConnected}
          currentUser={currentUser}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {state.disasterRecoveryActive && (
          <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-y border-red-500/30 px-6 py-3 flex items-center justify-between text-amber-50 shadow-xl animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-xl">🚨</span>
              <div>
                <h4 className="font-mono text-xs font-bold text-red-400">DISASTER RECOVERY CONTINGENCY MODE ACTIVE</h4>
                <p className="text-[10px] text-amber-200/60 font-sans mt-0.5">
                  Core Cloud Database is currently offline (simulation active). Running on Secure Local Offline Cache. State is Read-Only.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                SAFE LOCAL TERMINAL
              </span>
              <button
                onClick={() => {
                  if (activeRole === "Owner") {
                    const nextState = { ...state, disasterRecoveryActive: false };
                    syncStateWithServer(nextState);
                    triggerToast("✓ Koneksi database normal pulih sepenuhnya. Cloud API online.");
                  } else {
                    triggerToast("🔒 Privilese Terkunci: Hanya Owner yang dapat menonaktifkan mode Disaster.");
                  }
                }}
                className="text-[9px] font-mono font-black text-red-300 hover:text-red-200 hover:underline cursor-pointer"
              >
                [ PULIHKAN KONEKSI ]
              </button>
            </div>
          </div>
        )}

        {/* Content body component mapping */}
        <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto pb-24">
          {isTabRestricted(activeTab, activeRole) ? (
            <AccessRestricted
              activeTab={activeTab}
              activeRole={activeRole}
              onLogout={handleLogout}
              tabLabel={tabTitles[activeTab] || activeTab}
            />
          ) : (
            <>
              {activeTab === "dashboard" && (
                <Dashboard
                  state={state}
                  currentUser={currentUser}
                  onNavigate={setActiveTab}
                  activeRole={activeRole}
                  syncState={syncStateWithServer}
                  triggerToast={triggerToast}
                />
              )}
              {activeTab === "service_dept" && (
                <ServiceDepartment
                  state={state}
                  syncState={syncStateWithServer}
                  triggerToast={triggerToast}
                  currentUser={currentUser}
                />
              )}
              {activeTab === "foh" && (
                <FohManagement
                  state={state}
                  syncState={syncStateWithServer}
                  triggerToast={triggerToast}
                  currentUser={currentUser}
                />
              )}
              {activeTab === "cashier_pos" && (
                <CashierPosCenter
                  state={state}
                  syncState={syncStateWithServer}
                  triggerToast={triggerToast}
                  currentUser={currentUser}
                />
              )}
              {activeTab === "midtrans_setup" && (
                <PaymentGatewaySetup
                  state={state}
                  syncState={syncStateWithServer}
                  triggerToast={triggerToast}
                  currentUser={currentUser}
                />
              )}
              {activeTab === "qris_tester" && (
                <QrisTestCenter
                  state={state}
                  syncState={syncStateWithServer}
                  triggerToast={triggerToast}
                  currentUser={currentUser}
                />
              )}
          {activeTab === "inventory" && (
            <Inventory
              state={state}
              onOpenOpname={() => {
                // preset quantities and open opname modal
                const initInp: { [code: string]: number } = {};
                state.master.forEach(m => {
                  const s = state.inventory[m.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
                  initInp[m.code] = Math.max(0, s.awal + s.masuk - s.keluar - s.waste);
                });
                setOpnameQuantities(initInp);
                setOpnameBy("");
                setActiveModal("opname");
              }}
            />
          )}
          {activeTab === "fifo" && (
            <FifoTracker
              state={state}
              onOpenAddBatch={() => {
                setFifoForm({
                  code: state.master[0]?.code || "",
                  qty: 0,
                  inDate: new Date().toISOString().split("T")[0],
                  expDate: ""
                });
                setActiveModal("addFifo");
              }}
              onMarkBatchUsed={handleMarkBatchUsed}
            />
          )}
          {activeTab === "storage" && (
            <StorageManagement
              state={state}
              onOpenAddStock={(loc) => {
                setModalStorageLoc(loc);
                setStorAddForm({ code: state.master[0]?.code || "", qty: 10, by: "" });
                setActiveModal("directAddStock");
              }}
              onOpenTransfer={(from, to, preCode) => {
                setTransferFromTo({ from, to });
                setTfForm({
                  code: preCode || state.master[0]?.code || "",
                  qty: 0,
                  by: "",
                  reason: from === "gudang" ? "Persiapan Bar Shift" : "Return sisa bar",
                  date: new Date().toISOString().split("T")[0]
                });
                setActiveModal("transferStock");
              }}
              onEditStock={(loc, code) => {
                const currentQty = (state.storage[loc] && state.storage[loc][code]) || 0;
                const itemObj = state.master.find(x => x.code === code) || (state.homemadeIngredients || []).find(h => h.id === code);
                const itemName = itemObj ? itemObj.name : code;
                const ans = prompt(`Edit Qty Stok secara manual untuk: ${itemName}\nStok Saat ini: ${currentQty}.\nMasukkan jumlah baru:`, String(currentQty));
                if (ans !== null) {
                  const valParsed = parseFloat(ans);
                  if (!isNaN(valParsed) && valParsed >= 0) {
                    handleDirectEditStockQtySubmit(loc, code, valParsed);
                  } else {
                    triggerToast("Masukkan angka yang benar.");
                  }
                }
              }}
            />
          )}
          {activeTab === "transfer" && (
            <TransferBarang
              state={state}
              onOpenTransfer={(from, to) => {
                setTransferFromTo({ from, to });
                setTfForm({
                  code: state.master[0]?.code || "",
                  qty: 0,
                  by: "",
                  reason: from === "gudang" ? "Persiapan Bar Shift" : "Return sisa bar",
                  date: new Date().toISOString().split("T")[0]
                });
                setActiveModal("transferStock");
              }}
              onDeleteTransfer={handleDeleteTransfer}
            />
          )}
          {activeTab === "procurement" && (
            <ProcurementHub
              state={state}
              currentUser={currentUser}
              syncState={syncStateWithServer}
              triggerToast={triggerToast}
            />
          )}
          {activeTab === "receiving" && (
            <BarangMasuk
              state={state}
              onOpenGRN={() => {
                setGrnMeta({
                  no: "GRN-" + Date.now().toString().substring(8),
                  date: new Date().toISOString().split("T")[0],
                  supplier: "",
                  by: "",
                  dest: "gudang"
                });
                setGrnRows([{ code: state.master[0]?.code || "", qty: 1, conditions: "✓ Baik", expDate: "" }]);
                setActiveModal("grnForm");
              }}
              onDeleteGRN={handleDeleteGRN}
            />
          )}
          {activeTab === "issue" && (
            <BarangKeluar
              state={state}
              onOpenIssue={(editIdx) => {
                if (editIdx !== undefined) {
                  const tar = state.issues[editIdx];
                  setIssueForm({
                    code: tar.code,
                    qty: tar.qty,
                    cat: tar.cat,
                    by: tar.by,
                    shift: tar.shift,
                    note: tar.note || ""
                  });
                  setModalEditIndex(editIdx);
                } else {
                  setIssueForm({
                    code: state.master[0]?.code || "",
                    qty: 0,
                    cat: "Pemakaian Produksi",
                    by: "",
                    shift: "Pagi (06:00–14:00)",
                    note: ""
                  });
                  setModalEditIndex(null);
                }
                setActiveModal("issueForm");
              }}
              onDeleteIssue={handleDeleteIssue}
            />
          )}
          {activeTab === "waste" && (
            <WasteLog
              state={state}
              onOpenWaste={(editIdx) => {
                if (editIdx !== undefined) {
                  const tar = state.wastes[editIdx];
                  setWasteForm({
                    code: tar.code,
                    qty: tar.qty,
                    cause: tar.cause,
                    loss: tar.loss,
                    by: tar.by,
                    action: tar.action || "",
                    rawDate: tar.rawDate || ""
                  });
                  setModalEditIndex(editIdx);
                } else {
                  setWasteForm({
                    code: state.master[0]?.code || "",
                    qty: 0,
                    cause: "Kadaluarsa / Expired",
                    loss: 0,
                    by: "",
                    action: "",
                    rawDate: ""
                  });
                  setModalEditIndex(null);
                }
                setActiveModal("wasteForm");
              }}
              onDeleteWaste={handleDeleteWaste}
            />
          )}
          {activeTab === "cogs" && (
            <CogsManagement
              state={state}
              currentUser={currentUser}
              syncState={syncStateWithServer}
              triggerToast={triggerToast}
            />
          )}
          {activeTab === "report" && (
            <Report
              state={state}
              onImportBackup={(backupPayload) => {
                syncStateWithServer(backupPayload);
                triggerToast("✓ Data backup database berhasil dipulihkan secara penuh.");
              }}
            />
          )}
          {activeTab === "shift_mgmt" && (
            <ShiftManagement
              state={state}
              currentUser={currentUser}
              activeRole={activeRole}
              onUpdateState={(nextState) => syncStateWithServer(nextState)}
              triggerToast={triggerToast}
            />
          )}
          {activeTab === "smallwares_mgmt" && (
            <SmallwaresManagement
              state={state}
              currentUser={currentUser}
              activeRole={activeRole}
              onUpdateState={(nextState) => syncStateWithServer(nextState)}
              triggerToast={triggerToast}
            />
          )}
          {activeTab === "sop_mgmt" && (
            <SopManagement
              state={state}
              syncState={syncStateWithServer}
              currentUser={currentUser}
              activeRole={activeRole}
            />
          )}
          {activeTab === "equipment" && (
            <EquipmentCenter
              state={state}
              syncState={syncStateWithServer}
              currentUser={currentUser}
              activeRole={activeRole}
            />
          )}
          {activeTab === "analytics" && (
            <BusinessAnalytics
              state={state}
              syncState={syncStateWithServer}
              currentUser={currentUser}
              activeRole={activeRole}
            />
          )}
          {activeTab === "kpi" && (
            <KPIManagement
              state={state}
              currentUser={currentUser}
              activeRole={activeRole}
            />
          )}
          {activeTab === "dailysop" && (
            <DailySopLogs
              state={state}
              syncState={syncStateWithServer}
              triggerToast={triggerToast}
            />
          )}
          {activeTab === "users" && (
            <UserManagement
              state={state}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUserPin={handleUpdateUserPin}
              onDeleteUser={handleDeleteUser}
              onUpdateUser={handleUpdateUser}
              syncState={syncStateWithServer}
            />
          )}
          {activeTab === "master" && (
            <MasterBahan
              state={state}
              onOpenMaster={(code) => {
                if (code !== undefined) {
                  const tar = state.master.find(x => x.code === code);
                  if (tar) {
                    setMasterForm({
                      code: tar.code,
                      name: tar.name,
                      unit: tar.unit,
                      par: tar.par,
                      price: tar.price,
                      supplier: tar.supplier,
                      temp: tar.temp,
                      shelf: tar.shelf,
                      loc: tar.loc
                    });
                    setModalEditCode(code);
                  }
                } else {
                  setMasterForm({
                    code: "BK-" + (state.master.length + 1).toString().padStart(3, "0"),
                    name: "",
                    unit: "kg",
                    par: 2,
                    price: 25000,
                    supplier: "",
                    temp: "Suhu Ruang 20-25°C",
                    shelf: "3 bulan",
                    loc: "gudang"
                  });
                  setModalEditCode(null);
                }
                setActiveModal("masterForm");
              }}
              onDeleteMaster={handleDeleteMaster}
            />
          )}
          {activeTab === "branding" && (
            <BrandingSettings
              state={state}
              onUpdateBranding={(brandingPayload, navigationPayload) => {
                const nextState = { 
                  ...state, 
                  branding: brandingPayload,
                  ...(navigationPayload ? { navigationSettings: navigationPayload } : {})
                };
                syncStateWithServer(nextState);
                triggerToast("✓ Data Branding & Menu Navigasi berhasil disimpan.");
              }}
              onImportBackup={(backupPayload) => {
                syncStateWithServer(backupPayload);
                triggerToast("✓ Laporan backup database berhasil dipulihkan secara penuh.");
              }}
              onResetDB={handleResetDatabase}
            />
          )}
          {activeTab === "system_mgmt" && (
            <SystemManagement
              state={state}
              syncState={syncStateWithServer}
              currentUser={currentUser}
              activeRole={activeRole}
            />
          )}
          </>
          )}
        </main>
      </div>

      {/* Floating Smart Asisten AI drawer */}
      <AssistantChat
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        brandName={state.branding.name}
      />

      {/* ── ALL MODALS REGISTRY ── */}

      {/* 1. Quick Action selector popup */}
      {activeModal === "quickInput" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/20 p-6 rounded-2xl w-full max-w-sm relative text-amber-50">
            <h4 className="font-serif font-bold text-sm text-amber-100 border-b border-amber-500/10 pb-2">➕ Pilih Input Operasional</h4>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: "📤 Penggunaan Bar", id: "issueForm", action: () => {
                  setIssueForm({ code: state.master[0]?.code || "", qty: 0, cat: "Pemakaian Produksi", by: "", shift: "Pagi (06:00–14:00)", note: "" });
                  setModalEditIndex(null);
                }},
                { label: "🗑 Waste / Loss Log", id: "wasteForm", action: () => {
                  setWasteForm({ code: state.master[0]?.code || "", qty: 0, cause: "Kadaluarsa / Expired", loss: 0, by: "", action: "", rawDate: "" });
                  setModalEditIndex(null);
                }},
                { label: "📥 GRN Supply Masuk", id: "grnForm", action: () => {
                  setGrnMeta({ no: "GRN-" + Date.now().toString().substring(8), date: new Date().toISOString().split("T")[0], supplier: "", by: "", dest: "gudang" });
                  setGrnRows([{ code: state.master[0]?.code || "", qty: 10, conditions: "✓ Baik", expDate: "" }]);
                }},
                { label: "🛒 Form Belanja PR", id: "purchaseForm", action: () => {
                  setPrMeta({ no: "PR-" + Date.now().toString().substring(8), date: new Date().toISOString().split("T")[0], by: "", supplier: "" });
                  setPrRows([{ code: state.master[0]?.code || "", qty: 1, price: state.master[0]?.price || 0 }]);
                }},
                { label: "🔄 FIFO Batch", id: "addFifo", action: () => {
                  setFifoForm({ code: state.master[0]?.code || "", qty: 10, inDate: new Date().toISOString().split("T")[0], expDate: "" });
                }},
                { label: "🔧 Transfer Stok", id: "transferStock", action: () => {
                  setTransferFromTo({ from: "gudang", to: "bar" });
                  setTfForm({ code: state.master[0]?.code || "", qty: 5, by: "", reason: "Persiapan Bar Shift Pagi", date: new Date().toISOString().split("T")[0] });
                }}
              ].map(actionItem => (
                <button
                  key={actionItem.label}
                  onClick={() => {
                    actionItem.action();
                    setActiveModal(actionItem.id);
                  }}
                  className="bg-[#FAF0E6]/5 border border-amber-400/5 hover:border-amber-400/20 rounded-xl p-3 text-left text-xs hover:bg-amber-500/5 font-semibold transition cursor-pointer"
                >
                  {actionItem.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full bg-[#FAF0E6]/10 hover:bg-[#FAF0E6]/15 hover:text-white rounded-lg py-2 text-xs font-semibold cursor-pointer transition text-amber-200"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* 2. Issue Modal */}
      {activeModal === "issueForm" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/25 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h4 className="font-serif font-bold text-sm text-amber-100 pb-2 border-b border-amber-500/10">
              {modalEditIndex !== null ? "📝 Edit Pengeluaran / Pemakaian" : "📤 Catat Barang Keluar"}
            </h4>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Bahan Baku</label>
              <select
                value={issueForm.code}
                onChange={(e) => setIssueForm({ ...issueForm, code: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
              >
                {state.master.map(m => (
                  <option key={m.code} value={m.code} className="bg-amber-950 text-amber-100">
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Volume Keluar</label>
                <input
                  type="number"
                  value={issueForm.qty || ""}
                  onChange={(e) => setIssueForm({ ...issueForm, qty: parseFloat(e.target.value) || 0 })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Waktu Shift</label>
                <select
                  value={issueForm.shift}
                  onChange={(e) => setIssueForm({ ...issueForm, shift: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                >
                  <option className="bg-amber-950">Pagi (06:00–14:00)</option>
                  <option className="bg-amber-950">Siang (13:00–21:00)</option>
                  <option className="bg-amber-950">Malam (20:00–23:00)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Kategori</label>
                <select
                  value={issueForm.cat}
                  onChange={(e) => setIssueForm({ ...issueForm, cat: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                >
                  <option className="bg-amber-950">Pemakaian Produksi</option>
                  <option className="bg-amber-950">Tester / Sample</option>
                  <option className="bg-amber-950">Event / Catering</option>
                  <option className="bg-amber-950">Kegiatan Training</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Nama Barista</label>
                <input
                  type="text"
                  value={issueForm.by}
                  onChange={(e) => setIssueForm({ ...issueForm, by: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  placeholder="Dario Juru Saji"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Catatan Pendukung (Opsional)</label>
              <input
                type="text"
                value={issueForm.note}
                onChange={(e) => setIssueForm({ ...issueForm, note: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                placeholder="Contoh: Espresso pagi lancar"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent hover:bg-[#FAF0E6]/5 text-amber-100/60 hover:text-amber-100 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition border border-amber-500/10"
              >
                Batal
              </button>
              <button
                onClick={handleIssueSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95"
              >
                {modalEditIndex !== null ? "Perbarui" : "Simpan Catatan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Waste Modal */}
      {activeModal === "wasteForm" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/25 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h4 className="font-serif font-bold text-sm text-red-300 pb-2 border-b border-amber-500/10">
              {modalEditIndex !== null ? "📝 Edit Laporan Waste/Loss" : "🗑 Catat Waste / Loss"}
            </h4>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Bahan Baku</label>
              <select
                value={wasteForm.code}
                onChange={(e) => setWasteForm({ ...wasteForm, code: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
              >
                {state.master.map(m => (
                  <option key={m.code} value={m.code} className="bg-amber-950 text-amber-100">
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Volume Terbuang</label>
                <input
                  type="number"
                  value={wasteForm.qty || ""}
                  onChange={(e) => setWasteForm({ ...wasteForm, qty: parseFloat(e.target.value) || 0 })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Penyebab Waste</label>
                <select
                  value={wasteForm.cause}
                  onChange={(e) => setWasteForm({ ...wasteForm, cause: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                >
                  <option className="bg-amber-950">Kadaluarsa / Expired</option>
                  <option className="bg-amber-950">Tumpah / Spilled</option>
                  <option className="bg-amber-950">Kesalahan Barista (Overportion)</option>
                  <option className="bg-amber-950">Bahan Rusak / Spoiled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Taksiran Kerugian (Rupiah)</label>
                <input
                  type="number"
                  value={wasteForm.loss || ""}
                  onChange={(e) => setWasteForm({ ...wasteForm, loss: parseFloat(e.target.value) || 0 })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  placeholder="Kosongi untuk harga default"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Dicatat Oleh</label>
                <input
                  type="text"
                  value={wasteForm.by}
                  onChange={(e) => setWasteForm({ ...wasteForm, by: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  placeholder="Mega Supervisor"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Tindakan Pencegahan / Korektif</label>
              <textarea
                value={wasteForm.action}
                onChange={(e) => setWasteForm({ ...wasteForm, action: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full min-h-[60px]"
                placeholder="Contoh: Susu disimpan chiller setelah buka"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent hover:bg-[#FAF0E6]/5 text-amber-100/60 hover:text-amber-100 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-amber-500/10"
              >
                Batal
              </button>
              <button
                onClick={handleWasteSubmit}
                className="bg-red-650 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95"
              >
                {modalEditIndex !== null ? "Perbarui" : "Simpan Waste"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. GRN Modal Form (Wide) */}
      {activeModal === "grnForm" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/25 rounded-2xl w-full max-w-2xl p-6 space-y-4">
            <h4 className="font-serif font-bold text-sm text-amber-100 pb-2 border-b border-amber-500/10">📥 Form Penerimaan Barang Masuk (Goods Received)</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">No. GRN Document</label>
                <input
                  type="text"
                  value={grnMeta.no}
                  onChange={(e) => setGrnMeta({ ...grnMeta, no: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 focus:border-amber-400/40 outline-none"
                  placeholder="Auto (GRN-xxxxxx)"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Tanggal Penerimaan</label>
                <input
                  type="date"
                  value={grnMeta.date}
                  onChange={(e) => setGrnMeta({ ...grnMeta, date: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Nama Supplier / Distributor</label>
                <input
                  type="text"
                  value={grnMeta.supplier}
                  onChange={(e) => setGrnMeta({ ...grnMeta, supplier: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 focus:border-amber-400/40 outline-none"
                  placeholder="Tanamera / Oatside"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Petugas Penerima</label>
                <input
                  type="text"
                  value={grnMeta.by}
                  onChange={(e) => setGrnMeta({ ...grnMeta, by: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 focus:border-amber-400/40 outline-none"
                  placeholder="Mega / Dario"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Lokasi Alokasi Penyimpanan</label>
                <select
                  value={grnMeta.dest}
                  onChange={(e) => setGrnMeta({ ...grnMeta, dest: e.target.value as any })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                >
                  <option value="gudang" className="bg-amber-950">🏗️ {state.branding.storageGudangName}</option>
                  <option value="bar" className="bg-amber-950">❄️ {state.branding.storageBarName}</option>
                  <option value="both" className="bg-amber-950">Keduanya (Dibagi 50/50)</option>
                </select>
              </div>
            </div>

            <h5 className="text-[10px] text-amber-100/40 uppercase font-bold tracking-wider font-mono pt-2">Daftar Bahan Yang Di-supply</h5>
            <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
              {grnRows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={row.code}
                    onChange={(e) => {
                      const copy = [...grnRows];
                      copy[idx].code = e.target.value;
                      setGrnRows(copy);
                    }}
                    className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-lg p-2 text-xs text-amber-100 flex-1 outline-none"
                  >
                    <option value="" className="bg-amber-950">Pilih Bahan...</option>
                    {state.master.map(m => (
                      <option key={m.code} value={m.code} className="bg-amber-950">{m.name} ({m.unit})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={row.qty || ""}
                    onChange={(e) => {
                      const copy = [...grnRows];
                      copy[idx].qty = parseFloat(e.target.value) || 0;
                      setGrnRows(copy);
                    }}
                    className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-lg p-2 text-xs text-amber-100 w-20 outline-none text-right"
                    placeholder="Qty"
                  />
                  <input
                    type="date"
                    value={row.expDate}
                    onChange={(e) => {
                      const copy = [...grnRows];
                      copy[idx].expDate = e.target.value;
                      setGrnRows(copy);
                    }}
                    className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-lg p-2 text-xs text-amber-100 w-32 outline-none"
                    title="Tanggal Expiry"
                  />
                  <button
                    onClick={() => setGrnRows(grnRows.filter((_, rIdx) => rIdx !== idx))}
                    className="bg-red-500/10 text-red-400 p-2 rounded-lg text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setGrnRows([...grnRows, { code: "", qty: 10, conditions: "✓ Baik", expDate: "" }])}
              className="text-xs bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 rounded-lg py-1 px-3"
            >
              + Tambah Item Baris
            </button>

            <div className="flex justify-end gap-3 pt-4 border-t border-amber-500/10">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent hover:bg-[#FAF0E6]/5 text-amber-100/60 hover:text-amber-100 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-amber-500/10"
              >
                Batal
              </button>
              <button
                onClick={handleGRNSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95"
              >
                Simpan &amp; Update Stok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PR Form Modal (Wide) */}
      {activeModal === "purchaseForm" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/25 rounded-2xl w-full max-w-2xl p-6 space-y-4">
            <h4 className="font-serif font-bold text-sm text-amber-100 pb-2 border-b border-amber-500/10">📑 Buat Purchase Request</h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Nomor PR Pengajuan</label>
                <input
                  type="text"
                  value={prMeta.no}
                  onChange={(e) => setPrMeta({ ...prMeta, no: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 focus:border-amber-400/40 outline-none"
                  placeholder="PR-xxxxxx"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Tanggal Ajuan</label>
                <input
                  type="date"
                  value={prMeta.date}
                  onChange={(e) => setPrMeta({ ...prMeta, date: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Supplier Target</label>
                <input
                  type="text"
                  value={prMeta.supplier}
                  onChange={(e) => setPrMeta({ ...prMeta, supplier: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 focus:border-amber-400/40 outline-none"
                  placeholder="Toffin / Oatside"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Dibuat Oleh</label>
              <input
                type="text"
                value={prMeta.by}
                onChange={(e) => setPrMeta({ ...prMeta, by: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                placeholder="Dario Cafe Manager"
              />
            </div>

            <h5 className="text-[10px] text-amber-100/40 uppercase font-bold tracking-wider font-mono pt-2">Daftar Kebutuhan Pembelian</h5>
            <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
              {prRows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={row.code}
                    onChange={(e) => {
                      const copy = [...prRows];
                      copy[idx].code = e.target.value;
                      // auto load price
                      const tarM = state.master.find(x => x.code === e.target.value);
                      if (tarM) copy[idx].price = tarM.price;
                      setPrRows(copy);
                    }}
                    className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-lg p-2 text-xs text-amber-100 flex-1 outline-none"
                  >
                    <option value="" className="bg-amber-950">Pilih bahan...</option>
                    {state.master.map(m => (
                      <option key={m.code} value={m.code} className="bg-amber-950">{m.name} ({m.unit})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={row.qty || ""}
                    onChange={(e) => {
                      const copy = [...prRows];
                      copy[idx].qty = parseFloat(e.target.value) || 0;
                      setPrRows(copy);
                    }}
                    className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-lg p-2 text-xs text-amber-100 w-20 outline-none text-right"
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    value={row.price || ""}
                    onChange={(e) => {
                      const copy = [...prRows];
                      copy[idx].price = parseFloat(e.target.value) || 0;
                      setPrRows(copy);
                    }}
                    className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-lg p-2 text-xs text-amber-100 w-32 outline-none text-right"
                    placeholder="Harga Satuan"
                  />
                  <div className="text-xs text-amber-300 font-mono w-24 text-right">
                    Rp {(row.qty * row.price).toLocaleString("id-ID")}
                  </div>
                  <button
                    onClick={() => setPrRows(prRows.filter((_, rIdx) => rIdx !== idx))}
                    className="bg-red-500/10 text-red-400 p-2 rounded-lg text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  const firstCode = state.master[0]?.code || "";
                  const firstPrice = state.master[0]?.price || 0;
                  setPrRows([...prRows, { code: firstCode, qty: 1, price: firstPrice }]);
                }}
                className="text-xs bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 rounded-lg py-1 px-3"
              >
                + Tambah Item Belanjaan
              </button>
              <div className="text-xs text-amber-100/50">
                Estimasi Total: <span className="font-serif text-amber-300 font-bold text-sm">
                  Rp {prRows.reduce((s, r) => s + (r.qty * r.price), 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-amber-500/10">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent hover:bg-[#FAF0E6]/5 text-amber-100/60 hover:text-amber-100 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-amber-500/10"
              >
                Batal
              </button>
              <button
                onClick={handlePRSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95"
              >
                Ajukan PR Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Opname Form Modal */}
      {activeModal === "opname" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/25 rounded-2xl w-full max-w-xl p-6 space-y-4">
            <h4 className="font-serif font-bold text-sm text-amber-100 pb-2 border-b border-amber-500/10">📝 Input Stock Opname (Koreksi Awal)</h4>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1 bg-[#FAF0E6]/2 w-1/2 p-2 rounded">
                <span className="text-[9px] text-[#D4A853] font-mono uppercase font-bold">tanggal opname</span>
                <span className="text-xs font-semibold">{new Date().toLocaleDateString("id-ID")}</span>
              </div>
              <div className="flex flex-col gap-1 w-1/2">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Nama Petugas Opname</label>
                <input
                  type="text"
                  value={opnameBy}
                  onChange={(e) => setOpnameBy(e.target.value)}
                  placeholder="Mega / Dario"
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none focus:border-amber-400/40"
                />
              </div>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 divide-y divide-amber-500/5">
              {state.master.map(m => (
                <div key={m.code} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="text-xs font-bold text-amber-100 max-w-[60%] truncate">{m.name} ({m.unit})</div>
                  <input
                    type="number"
                    value={opnameQuantities[m.code] !== undefined ? opnameQuantities[m.code] : ""}
                    onChange={(e) => {
                      setOpnameQuantities({
                        ...opnameQuantities,
                        [m.code]: parseFloat(e.target.value) || 0
                      });
                    }}
                    className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-lg p-2 text-xs text-amber-300 w-24 text-right outline-none focus:border-amber-400/40 font-mono font-bold"
                    placeholder="Qty Akhir"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-amber-500/10">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent hover:bg-[#FAF0E6]/5 text-amber-100/60 hover:text-amber-100 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-amber-500/10"
              >
                Batal
              </button>
              <button
                onClick={handleOpnameSubmit}
                className="bg-[#D4A853] hover:bg-amber-600 text-amber-950 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95"
              >
                Simpan Opname
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. FIFO Batch Modal */}
      {activeModal === "addFifo" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/25 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h4 className="font-serif font-bold text-sm text-amber-100 pb-2 border-b border-amber-100/10">🔄 Tambah Batch Baru</h4>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Bahan Baku</label>
              <select
                value={fifoForm.code}
                onChange={(e) => setFifoForm({ ...fifoForm, code: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
              >
                {state.master.map(m => (
                  <option key={m.code} value={m.code} className="bg-amber-950">{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Qty Batch Baru</label>
              <input
                type="number"
                value={fifoForm.qty || ""}
                onChange={(e) => setFifoForm({ ...fifoForm, qty: parseFloat(e.target.value) || 0 })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full text-right"
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Tanggal Masuk</label>
                <input
                  type="date"
                  value={fifoForm.inDate}
                  onChange={(e) => setFifoForm({ ...fifoForm, inDate: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Tanggal Expiry</label>
                <input
                  type="date"
                  value={fifoForm.expDate}
                  onChange={(e) => setFifoForm({ ...fifoForm, expDate: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent hover:bg-[#FAF0E6]/5 text-amber-100/60 hover:text-amber-100 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-amber-500/10"
              >
                Batal
              </button>
              <button
                onClick={handleFifoSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95"
              >
                Tambah Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Master Item Modal Editor */}
      {activeModal === "masterForm" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/25 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h4 className="font-serif font-bold text-sm text-amber-100 pb-2 border-b border-amber-100/10">
              {modalEditCode !== null ? "📝 Edit Spesifikasi Master" : "📋 Tambah Bahan Baku Baru"}
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 col-span-1">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Kode Item</label>
                <input
                  type="text"
                  value={masterForm.code}
                  onChange={(e) => setMasterForm({ ...masterForm, code: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                  placeholder="BK-010"
                  disabled={modalEditCode !== null}
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Nama Bahan Baku</label>
                <input
                  type="text"
                  value={masterForm.name}
                  onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                  placeholder="Susu Fresh Milk"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Satuan Ukur</label>
                <input
                  type="text"
                  value={masterForm.unit}
                  onChange={(e) => setMasterForm({ ...masterForm, unit: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                  placeholder="kg / liter / pcs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">PAR Level (Min)</label>
                <input
                  type="number"
                  value={masterForm.par || ""}
                  onChange={(e) => setMasterForm({ ...masterForm, par: parseFloat(e.target.value) || 0 })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none text-right"
                  placeholder="2"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  value={masterForm.price || ""}
                  onChange={(e) => setMasterForm({ ...masterForm, price: parseFloat(e.target.value) || 0 })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none text-right"
                  placeholder="15000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Distributor Utama</label>
                <input
                  type="text"
                  value={masterForm.supplier}
                  onChange={(e) => setMasterForm({ ...masterForm, supplier: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                  placeholder="Oatside Distributor"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Default Storage Area</label>
                <select
                  value={masterForm.loc}
                  onChange={(e) => setMasterForm({ ...masterForm, loc: e.target.value as any })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                >
                  <option value="gudang" className="bg-amber-950">🏗️ Gudang Utama</option>
                  <option value="bar" className="bg-amber-950">❄️ Bar Chiller</option>
                  <option value="both" className="bg-amber-950">Keduanya</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Suhu Ruang Ideal</label>
                <input
                  type="text"
                  value={masterForm.temp}
                  onChange={(e) => setMasterForm({ ...masterForm, temp: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                  placeholder="2-4°C Kulkas / Suhu Ruang"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Daya Tahan (Buka)</label>
                <input
                  type="text"
                  value={masterForm.shelf}
                  onChange={(e) => setMasterForm({ ...masterForm, shelf: e.target.value })}
                  className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                  placeholder="Max 24 jam sesudah buka"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent hover:bg-[#FAF0E6]/5 text-amber-100/60 hover:text-amber-100 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-amber-500/10"
              >
                Batal
              </button>
              <button
                onClick={handleMasterSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95"
              >
                Simpan Bahan baku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Direct Transfer stok harian Modal */}
      {activeModal === "transferStock" && transferFromTo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/25 rounded-2xl w-full max-w-sm p-6 space-y-4 text-amber-50">
            <h4 className="font-serif font-bold text-sm text-sky-300 pb-2 border-b border-amber-500/10 flex items-center gap-1.5">
              <span>↔️</span>
              <span>
                Transfer: {transferFromTo.from === "gudang" ? state.branding.storageGudangName : state.branding.storageBarName} ➡️ {transferFromTo.to === "gudang" ? state.branding.storageGudangName : state.branding.storageBarName}
              </span>
            </h4>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Pilih Bahan Baku</label>
              <select
                value={tfForm.code}
                onChange={(e) => setTfForm({ ...tfForm, code: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
              >
                {state.master
                  .filter(m => transferFromTo.from === "gudang" ? (m.loc === "gudang" || m.loc === "both") : (m.loc === "bar" || m.loc === "both"))
                  .map(m => (
                    <option key={m.code} value={m.code} className="bg-amber-950 text-amber-100">
                      {m.name} (Stok: {state.storage[transferFromTo.from]?.[m.code] || 0} {m.unit})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Qty Yang Dipindahkan</label>
              <input
                type="number"
                value={tfForm.qty || ""}
                onChange={(e) => setTfForm({ ...tfForm, qty: parseFloat(e.target.value) || 0 })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full text-right"
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Petugas Pelaksana</label>
              <input
                type="text"
                value={tfForm.by}
                onChange={(e) => setTfForm({ ...tfForm, by: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                placeholder="Dario Juru Saji"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Alasan Transfer / Catatan</label>
              <input
                type="text"
                value={tfForm.reason}
                onChange={(e) => setTfForm({ ...tfForm, reason: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                placeholder="Contoh: Refill Chiller Shift Pagi"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent hover:bg-[#FAF0E6]/5 text-amber-100/60 hover:text-amber-100 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-amber-500/10"
              >
                Batal
              </button>
              <button
                onClick={handleTransferSubmit}
                className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95"
              >
                Simpan Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Direct Add stock directe manual storage modal */}
      {activeModal === "directAddStock" && modalStorageLoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/25 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h4 className="font-serif font-bold text-sm text-yellow-400 pb-2 border-b border-amber-100/10">
              🛠️ Tambah Stok: {modalStorageLoc === "gudang" ? state.branding.storageGudangName : state.branding.storageBarName}
            </h4>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Bahan Baku</label>
              <select
                value={storAddForm.code}
                onChange={(e) => setStorAddForm({ ...storAddForm, code: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
              >
                {state.master.map(m => (
                  <option key={m.code} value={m.code} className="bg-amber-950 text-amber-100">{m.name} ({m.unit})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Qty Penambahan</label>
              <input
                type="number"
                value={storAddForm.qty || ""}
                onChange={(e) => setStorAddForm({ ...storAddForm, qty: parseFloat(e.target.value) || 0 })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full text-right"
                placeholder="10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono font-bold">Petugas Pencatat</label>
              <input
                type="text"
                value={storAddForm.by}
                onChange={(e) => setStorAddForm({ ...storAddForm, by: e.target.value })}
                className="bg-[#FAF0E6]/5 border border-amber-500/15 rounded-xl p-2 text-xs text-amber-100 outline-none"
                placeholder="Supervisor"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent hover:bg-[#FAF0E6]/5 text-amber-100/60 hover:text-amber-100 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-amber-500/10"
              >
                Batal
              </button>
              <button
                onClick={handleDirectStockAddSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GLOBAL INTERACTIVE CONFIRM DELETE ── */}
      {confirmContext && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e0c02] border border-[#D4A853]/25 p-6 rounded-2xl w-full max-w-sm text-center text-amber-50 space-y-4">
            <span className="text-3xl">⚠️</span>
            <h4 className="font-serif font-bold text-sm text-amber-100">{confirmContext.title}</h4>
            <p className="text-xs text-amber-200/50 leading-relaxed font-medium">{confirmContext.desc}</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmContext(null)}
                className="bg-transparent hover:bg-[#FAF0E6]/5 border border-amber-500/10 text-amber-200 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                onClick={confirmContext.onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HIGH FIDELITY PWA OVERLAYS & TOASTS ── */}

      {/* 1. System Auto Update Toast */}
      {showUpdateAvailable && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm bg-[#150a04] border border-amber-500/30 p-4 rounded-xl shadow-2xl text-amber-50 animate-bounce flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <span className="text-xl">🚀</span>
            <div>
              <h5 className="font-serif font-bold text-xs text-amber-100">Pembaruan Sistem Tersedia!</h5>
              <p className="text-[10px] text-amber-200/60 leading-relaxed font-sans mt-0.5">Versi baru CoffeeOps telah dirilis secara live. Silakan perbarui untuk mendapatkan performa terbaik.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 text-[10px]">
            <button
              onClick={() => setShowUpdateAvailable(false)}
              className="px-3 py-1.5 rounded-lg border border-amber-500/10 hover:bg-[#FAF0E6]/5 text-amber-100 font-medium cursor-pointer"
            >
              Nanti Saja
            </button>
            <button
              onClick={handleApplyUpdate}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-amber-950 font-bold hover:bg-amber-600 transition active:scale-95 cursor-pointer"
            >
              Segarkan Sekarang
            </button>
          </div>
        </div>
      )}

      {/* 2. PWA Add to Home Screen (iPad & Android promotion card) */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm bg-[#0a180f]/95 backdrop-blur-md border border-[#D4A853]/30 p-5 rounded-2xl shadow-3xl text-amber-50 animate-fade-in flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-[#FAF0E6]/5 p-2 rounded-xl border border-amber-500/15">
              <img
                src="https://img.icons8.com/isometric/48/coffee-to-go.png"
                alt="CoffeeOps Icon"
                className="w-10 h-10 object-contain animate-pulse"
              />
            </div>
            <div>
              <h5 className="font-serif font-bold text-xs text-amber-100">Unduh CoffeeOps di Perangkat</h5>
              <p className="text-[10px] text-amber-200/60 leading-relaxed font-sans mt-0.5">
                Aktifkan fitur kasir offline, sinkronisasi waktu nyata, dan login cepat tanpa membuka browser berulang kali.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 text-[10px]">
            <button
              onClick={handleDismissInstall}
              className="px-3 py-1.5 rounded-lg border border-amber-500/10 hover:bg-[#FAF0E6]/5 text-amber-200/70 hover:text-amber-100 font-semibold cursor-pointer"
            >
              Abaikan
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-1.5 rounded-lg bg-[#D4A853] text-amber-950 font-bold hover:bg-[#c39744] transition active:scale-95 cursor-pointer"
            >
              Tambahkan Ke Beranda
            </button>
          </div>
        </div>
      )}

      {/* 3. Realtime Connection Offline Monitor Banner */}
      {showOfflineToast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full border shadow-lg text-[10px] font-bold flex items-center gap-2.5 animate-bounce transition-all ${
          isOffline 
            ? "bg-red-950/95 border-red-500/40 text-red-200" 
            : "bg-emerald-950/95 border-emerald-500/40 text-emerald-200"
        }`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${isOffline ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span>{isOffline ? "MODE OFFLINE AKTIF — Transaksi harian di-cache aman." : "KONEKSI KEMBALI ONLINE — Sinkronisasi Supabase sukses."}</span>
        </div>
      )}

      {/* 4. Custom Enterprise Glassmorphic Toast layer overlay */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-[100] max-w-xs bg-black/90 backdrop-blur-md border border-[#D4A853]/40 p-4 rounded-xl shadow-2xl text-amber-50 flex items-center gap-2.5 animate-pulse">
          <span className="text-base text-amber-400">🛎️</span>
          <p className="text-xs font-medium text-amber-100 leading-normal">{toastMessage}</p>
        </div>
      )}

      </div>
    </ErrorBoundary>
  );
}
// handleFirestoreError is bypassed as local cloud REST synchronization takes place.
