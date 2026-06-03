import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart,
  CreditCard,
  Users,
  Printer,
  TrendingUp,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  Search,
  Calendar,
  Award,
  RefreshCw,
  X,
  Receipt,
  CheckCircle,
  Gift,
  AlertTriangle,
  RotateCcw,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Download,
  AlertCircle,
  Hash,
  Laptop,
  Play,
  Tablet,
  Database
} from "lucide-react";
import { CoffeeOpsState, User, AuditLogItem } from "../types";
import {
  posProducts,
  defaultCustomers,
  defaultPrinters,
  initialShiftState,
  computeLoyaltyTier,
  getTierColor,
  PosProduct,
  PosCustomer,
  PosPrinter,
  PosOrder,
  ShiftDrawerState
} from "./cashier/posData";

interface CashierPosCenterProps {
  state: CoffeeOpsState;
  syncState: (nextState: CoffeeOpsState) => Promise<any> | any;
  triggerToast: (msg: string) => void;
  currentUser: User | null;
}

export default function CashierPosCenter({
  state,
  syncState,
  triggerToast,
  currentUser
}: CashierPosCenterProps) {
  const actualRole = currentUser?.role || "Cashier";
  const labelRole = currentUser?.name || "Kasir Utama";

  // Role Emulation and Permission Management
  const [activeRole, setActiveRole] = useState<"Owner" | "Manager" | "Cashier" | "FOH" | "Barista">(() => {
    return (actualRole as any) || "Cashier";
  });

  useEffect(() => {
    setActiveRole((actualRole as any) || "Cashier");
  }, [actualRole]);

  // Enterprise POS Collections
  const [devices, setDevices] = useState<any[]>(() => {
    return state.pos_devices || [
      {
        id: "DEV-101",
        name: "Panda Bluetooth Tablet POS",
        lastConnected: "2026-06-03 10:20:11",
        battery: 92,
        firmware: "v3.1.2",
        status: "Online",
        assignedStation: "Main Cashier Counter",
        assignedUser: "Dario Varsel",
        connectionHistory: [
          { timestamp: "2026-06-03 08:00:22", action: "Booted and connected" },
          { timestamp: "2026-06-03 10:20:11", action: "Heartbeat ping success" }
        ]
      },
      {
        id: "DEV-102",
        name: "Terminal Handheld FOH 1",
        lastConnected: "2026-06-03 09:14:45",
        battery: 68,
        firmware: "v3.1.0",
        status: "Online",
        assignedStation: "FOH Floor 1",
        assignedUser: "Chaca Waiter",
        connectionHistory: [
          { timestamp: "2026-06-03 09:14:45", action: "Registered with Station" }
        ]
      }
    ];
  });

  const [receiptSettings, setReceiptSettings] = useState<any>(() => {
    return state.receipt_settings || {
      headerText: "COFFEE OPS - THE PREMIUM BREW\nKawasan Sudirman No. 12, Jakarta",
      footerText: "Terima kasih atas kunjungan Anda!\nFollow Instagram kami di @coffeeops.premium\nWifi: PremiumBrew / Pass: kopisusu99",
      showCashierName: true,
      showTableNumber: true,
      autoPrintKitchenCopy: true,
      printCopiesCount: 1,
      logoUrl: "COFFEE OPS",
      qrPaymentFooter: true
    };
  });

  const [pluginSettings, setPluginSettings] = useState<any>(() => {
    return state.plugin_settings || {
      whatsappInvoice: {
        enabled: true,
        autoSend: true,
        messageTemplate: "Halo *{{customer}}*, berikut adalah invoice digital dari CoffeeOps untuk pesanan Anda ({{orderNo}}) sebesar *{{total}}*. Terima kasih!",
        resendCount: 5
      },
      midtransQris: {
        enabled: true,
        autoGenerate: true,
        apiKey: "SB-Midtrans-Sandbox-SecretKey-120x992",
        feeHandling: "Merchant Bears",
        expiredMinutes: 15
      },
      selfOrder: {
        enabled: true,
        tableScanEnabled: true,
        autoAcceptToCashier: false,
        defaultPaymentDirect: true
      },
      kitchenDisplay: {
        enabled: true,
        soundNotification: true,
        autoRefreshIntervalSeconds: 10
      }
    };
  });

  const [printerLogs, setPrinterLogs] = useState<any[]>(() => {
    return state.printer_logs || [
      { id: "log-1", printerId: "prn-1", timestamp: "2026-06-03 10:15:22", message: "Print transaction receipt order TX-2051", status: "Success" },
      { id: "log-2", printerId: "prn-3", timestamp: "2026-06-03 10:15:30", message: "Print kitchen duplicate order TX-2051", status: "Success" },
      { id: "log-3", printerId: "prn-2", timestamp: "2026-06-03 09:44:11", message: "Test Page Printing failed: connection offline", status: "Failed" }
    ];
  });

  const [refundLogs, setRefundLogs] = useState<any[]>(() => {
    return state.refund_logs || [
      { id: "ref-1", orderId: "TX-9988", amount: 35000, reason: "Salah input rasa latte", timestamp: "2026-06-02 15:44:00", approvedBy: "Mega Manager" },
      { id: "ref-2", orderId: "TX-9921", amount: 25000, reason: "Croissant gosong", timestamp: "2026-06-02 18:20:10", approvedBy: "Mega Manager" }
    ];
  });

  const [paymentQrisList, setPaymentQrisList] = useState<any[]>(() => {
    return state.payment_qris || [];
  });

  const [cashierPermissions, setCashierPermissions] = useState<any>(() => {
    return state.cashier_permissions || {
      fields: {
        editPOS: ["Owner", "Manager"],
        approveVoidRefund: ["Owner", "Manager"],
        seeAnalytics: ["Owner", "Manager"],
        transactions: ["Owner", "Manager", "Cashier", "FOH"],
        print: ["Owner", "Manager", "Cashier"],
        shiftOpening: ["Owner", "Manager", "Cashier"],
        kitchenQueue: ["Owner", "Manager", "Barista", "Kitchen"]
      }
    };
  });

  // Modals controllers for Settings & Devices
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceFormId, setDeviceFormId] = useState("");
  const [deviceFormName, setDeviceFormName] = useState("");
  const [deviceFormStation, setDeviceFormStation] = useState("");
  const [deviceFormUser, setDeviceFormUser] = useState("");
  const [deviceFormFirmware, setDeviceFormFirmware] = useState("v3.2.0");
  const [deviceFormBattery, setDeviceFormBattery] = useState(100);
  const [deviceFormStatus, setDeviceFormStatus] = useState<"Online" | "Offline" | "Maintenance">("Online");
  const [editingDevice, setEditingDevice] = useState<any | null>(null);

  // Unified backup settings simulation
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Delete entity confirmation flow
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    show: boolean;
    type: "device" | "printer" | "customer";
    id: string;
    name: string;
  }>({ show: false, type: "device", id: "", name: "" });

  // Self-Order list (Incoming table orders)
  const [selfOrders, setSelfOrders] = useState<any[]>([
    { id: "so-1", table: "Meja 3", time: "10 mins ago", items: "1x Americano Hot, 1x Butter Croissant", subtotal: 53000, status: "Pending Decision" },
    { id: "so-2", table: "Meja 5", time: "Just now", items: "1x Kyoto Uji Matcha, 1x Nasi Goreng Kampung", subtotal: 82000, status: "Pending Decision" }
  ]);

  // Kitchen Display System (KDS) Active Queue state
  const [kdsQueue, setKdsQueue] = useState<any[]>([
    { id: "q-101", orderNo: "TX-2051", table: "Meja 2", items: [{ name: "Caffe Latte Full Cream", qty: 2 }, { name: "Beef Carbonara Pasta", qty: 1 }], type: "Barista & Kitchen", timestamp: "10:15", status: "preparing", isNew: false },
    { id: "q-102", orderNo: "TX-2052", table: "Take Away", items: [{ name: "Nasi Goreng Kampung", qty: 1 }], type: "Kitchen", timestamp: "10:18", status: "pending", isNew: true },
    { id: "q-103", orderNo: "TX-2049", table: "Meja 1 (VIP)", items: [{ name: "Double Espresso", qty: 1 }], type: "Barista", timestamp: "09:55", status: "completed", isNew: false }
  ]);

  // Shift & Cash Drawer Local State preserved inside sessionStorage / localStorage or state
  const [shiftState, setShiftState] = useState<ShiftDrawerState>(() => {
    const saved = localStorage.getItem("coffeeops_shift_state_v2");
    return saved ? JSON.parse(saved) : { ...initialShiftState };
  });

  useEffect(() => {
    localStorage.setItem("coffeeops_shift_state_v2", JSON.stringify(shiftState));
  }, [shiftState]);

  // POS core UI States
  const [activeSection, setActiveSection] = useState<"dashboard" | "pos" | "tables" | "customers" | "printer" | "shift" | "analytics" | "kds" | "plugins">("dashboard");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Printer Bluetooth system mock state
  const [printers, setPrinters] = useState<PosPrinter[]>(defaultPrinters);
  const [isScanning, setIsScanning] = useState(false);
  const [lastPrintLog, setLastPrintLog] = useState("Tidak ada pencetakan");

  // Local collection of customers
  const [customers, setCustomers] = useState<PosCustomer[]>(() => {
    const saved = localStorage.getItem("coffeeops_customers_db");
    return saved ? JSON.parse(saved) : defaultCustomers;
  });

  useEffect(() => {
    localStorage.setItem("coffeeops_customers_db", JSON.stringify(customers));
  }, [customers]);

  // Tables integration mapping FohTable or customized
  const initialFohTables = [
    { id: "tbl-1", name: "Meja 1 (VIP)", status: "Reserved" },
    { id: "tbl-2", name: "Meja 2", status: "Occupied" },
    { id: "tbl-3", name: "Meja 3", status: "Available" },
    { id: "tbl-4", name: "Meja 4", status: "Cleaning" },
    { id: "tbl-5", name: "Meja 5", status: "Available" },
    { id: "tbl-6", name: "Meja 6", status: "Occupied" },
    { id: "tbl-7", name: "Meja 7 Premium", status: "Available" },
    { id: "tbl-8", name: "Meja Bar 1", status: "Available" }
  ];

  const [tablesList, setTablesList] = useState(() => {
    return state.fohTables && state.fohTables.length > 0
      ? state.fohTables.map(t => ({
          ...t,
          status: t.status === "Cleaning Needed" ? "Cleaning" : t.status
        }))
      : initialFohTables;
  });

  // Cart Interactive State
  interface CartItem {
    product: PosProduct;
    qty: number;
    notes: string;
    modifier: string;
    selectedAddOns: string[];
    priceWithAddOns: number;
    id: string; // unique cart line ID
  }

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("Take Away");
  const [orderType, setOrderType] = useState<"Dine In" | "Take Away" | "Delivery" | "Reservation" | "Pre Order">("Take Away");
  const [selectedCust, setSelectedCust] = useState<PosCustomer | null>(null);

  // Modifier Custom Modal state
  const [activeModifyingItem, setActiveModifyingItem] = useState<CartItem | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [tempModifier, setTempModifier] = useState("");
  const [tempAddOns, setTempAddOns] = useState<string[]>([]);

  // Diskon System
  interface DiscountOption {
    id: string;
    name: string;
    type: "percentage" | "fixed" | "happy" | "membership" | "voucher";
    val: number;
    requireManagerApproval: boolean;
  }

  const discounts: DiscountOption[] = [
    { id: "disc-1", name: "Diskon Member VIP (10%)", type: "membership", val: 0.10, requireManagerApproval: false },
    { id: "disc-2", name: "Promo Happy Hour (15%)", type: "happy", val: 0.15, requireManagerApproval: true },
    { id: "disc-3", name: "Kupon Potongan Flat Rp 20rb", type: "voucher", val: 20000, requireManagerApproval: false },
    { id: "disc-4", name: "Promo Flash Sale Spesial (25%)", type: "percentage", val: 0.25, requireManagerApproval: true }
  ];

  const [selectedDiscount, setSelectedDiscount] = useState<DiscountOption | null>(null);

  // Approval Manager Security Overlap
  const [approvalModal, setApprovalModal] = useState<{
    show: boolean;
    purpose: "discount" | "refund" | "void" | "close_shift";
    payload?: any;
    errorMessage?: string;
  }>({ show: false, purpose: "discount" });

  const [managerPin, setManagerPin] = useState("");

  // Payment System Form
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Debit Card" | "Credit Card" | "QRIS" | "E-Wallet" | "Bank Transfer" | "Split Payment">("Cash");
  const [cashAmountPaid, setCashAmountPaid] = useState<string>("");
  const [splitPaymentAmounts, setSplitPaymentAmounts] = useState({ cash: 0, nonCash: 0 });

  // Receipt popup display
  const [lastCompletedOrder, setLastCompletedOrder] = useState<PosOrder | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  // Barista & Kitchen Auto-tickets queue
  const [printedBaristaTicket, setPrintedBaristaTicket] = useState<any | null>(null);
  const [printedKitchenTicket, setPrintedKitchenTicket] = useState<any | null>(null);

  // Customer Management states
  const [custNameInput, setCustNameInput] = useState("");
  const [custPhoneInput, setCustPhoneInput] = useState("");
  const [custEmailInput, setCustEmailInput] = useState("");
  const [custBdayInput, setCustBdayInput] = useState("");

  // Opening Shift floating Dialog
  const [openingModal, setOpeningModal] = useState(!shiftState.isShiftActive);
  const [modalOpeningVal, setModalOpeningVal] = useState("500000");

  // Re-sync printers list
  const activePrinter = printers.find(p => p.connected);

  // Standard metrics
  const todayTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return (state.sales || []).filter(s => s.date === todayStr);
  }, [state.sales]);

  const totalRevenueToday = useMemo(() => {
    return todayTransactions.reduce((sum, s) => sum + s.totalRevenue, 0);
  }, [todayTransactions]);

  const statsAverageValue = useMemo(() => {
    return todayTransactions.length > 0 ? Math.round(totalRevenueToday / todayTransactions.length) : 0;
  }, [todayTransactions, totalRevenueToday]);

  const openOrdersCount = tablesList.filter(t => t.status === "Occupied" || t.status === "Reserved").length;

  const lowStockAlertsCount = useMemo(() => {
    return state.master.filter(m => {
      const i = state.inventory[m.code] || { awal: 0, masuk: 0, keluar: 0, waste: 0 };
      const current = Math.max(0, i.awal + i.masuk - i.keluar - i.waste);
      return current <= m.par;
    }).length;
  }, [state.inventory, state.master]);

  // Filtered menu
  const filteredProducts = useMemo(() => {
    return posProducts.filter(p => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  // Billing calculation values
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.priceWithAddOns * item.qty), 0);
  }, [cart]);

  const appliedDiscountValue = useMemo(() => {
    if (!selectedDiscount) return 0;
    if (selectedDiscount.type === "percentage" || selectedDiscount.type === "happy" || selectedDiscount.type === "membership") {
      return Math.round(cartSubtotal * selectedDiscount.val);
    }
    if (selectedDiscount.type === "voucher") {
      return Math.min(cartSubtotal, selectedDiscount.val);
    }
    return 0;
  }, [selectedDiscount, cartSubtotal]);

  const calculatedTax = useMemo(() => {
    // 10% tax
    return Math.round((cartSubtotal - appliedDiscountValue) * 0.10);
  }, [cartSubtotal, appliedDiscountValue]);

  const calculatedTotal = useMemo(() => {
    return Math.max(0, (cartSubtotal - appliedDiscountValue) + calculatedTax);
  }, [cartSubtotal, appliedDiscountValue, calculatedTax]);

  // Custom Toast trigger
  const inform = (msg: string) => {
    triggerToast(msg);
  };

  const checkTabPermStatic = (role: string, tabId: string): boolean => {
    const roleReqs: { [key: string]: string[] } = {
      dashboard: [],
      pos: ["Owner", "Manager", "Cashier", "FOH"],
      tables: ["Owner", "Manager", "Cashier", "FOH"],
      customers: ["Owner", "Manager", "Cashier"],
      printer: ["Owner", "Manager", "Cashier"],
      shift: ["Owner", "Manager", "Cashier"],
      analytics: ["Owner", "Manager"],
      kds: [],
      plugins: ["Owner", "Manager"]
    };
    const req = roleReqs[tabId];
    if (!req || req.length === 0) return true;
    return req.includes(role);
  };

  // Helper date/time formatters
  const nowStr = () => {
    const d = new Date();
    return d.toISOString().replace("T", " ").substring(0, 19);
  };

  const getLocalDateOnly = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Add Item to cart
  const handleAddToCart = (product: PosProduct) => {
    if (!shiftState.isShiftActive) {
      setOpeningModal(true);
      inform("Peringatan: Shift Kasir belum dibuka!");
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id && item.modifier === "Standard" && item.selectedAddOns.length === 0);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        product,
        qty: 1,
        notes: "",
        modifier: product.modifiers[0] || "Standard",
        selectedAddOns: [],
        priceWithAddOns: product.price,
        id: `cart-line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      };
      setCart([...cart, newItem]);
    }
    inform(`✓ Ditambahkan: ${product.name}`);
  };

  // Remove / Decqty
  const handleDecQty = (itemLineId: string) => {
    const target = cart.find(item => item.id === itemLineId);
    if (!target) return;

    if (target.qty <= 1) {
      setCart(cart.filter(item => item.id !== itemLineId));
    } else {
      setCart(cart.map(item => item.id === itemLineId ? { ...item, qty: item.qty - 1 } : item));
    }
  };

  const handleIncQty = (itemLineId: string) => {
    setCart(cart.map(item => item.id === itemLineId ? { ...item, qty: item.qty + 1 } : item));
  };

  const handleDeleteCartLine = (itemLineId: string) => {
    setCart(cart.filter(item => item.id !== itemLineId));
  };

  // Edit Modifiers / Add-ons / Notes on cart line
  const handleOpenModifyItem = (item: CartItem) => {
    setActiveModifyingItem(item);
    setTempNotes(item.notes);
    setTempModifier(item.modifier);
    setTempAddOns(item.selectedAddOns);
  };

  const handleSaveModifyItem = () => {
    if (!activeModifyingItem) return;

    // Calculate updated price based on addons
    let addOnPrice = 0;
    tempAddOns.forEach(name => {
      const match = activeModifyingItem.product.addOns.find(a => a.name === name);
      if (match) addOnPrice += match.price;
    });

    const updatedPrice = activeModifyingItem.product.price + addOnPrice;

    setCart(cart.map(item => {
      if (item.id === activeModifyingItem.id) {
        return {
          ...item,
          modifier: tempModifier,
          notes: tempNotes,
          selectedAddOns: tempAddOns,
          priceWithAddOns: updatedPrice
        };
      }
      return item;
    }));

    setActiveModifyingItem(null);
    inform("✓ Catatan & modifier item diperbarui.");
  };

  // Manage Tables quick selection
  const handleSelectTable = (tblName: string, tblId?: string) => {
    setSelectedTable(tblName);
    setOrderType(tblName === "Take Away" ? "Take Away" : "Dine In");

    if (tblId) {
      // update tables list to Occupied
      setTablesList(tablesList.map(t => {
        if (t.id === tblId && t.status === "Available") {
          return { ...t, status: "Occupied" };
        }
        return t;
      }));
    }
  };

  // Custom User / Customer Quick Register
  const handleAddNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custNameInput || !custPhoneInput) {
      inform("Lengkapi Nama dan Nomor HP!");
      return;
    }

    const newC: PosCustomer = {
      id: `cust-reg-${Date.now()}`,
      name: custNameInput,
      phone: custPhoneInput,
      email: custEmailInput || "-",
      birthday: custBdayInput || "2000-01-01",
      visitCount: 1,
      totalSpending: 0,
      points: 0
    };

    const nextC = [newC, ...customers];
    setCustomers(nextC);
    setSelectedCust(newC);
    
    setCustNameInput("");
    setCustPhoneInput("");
    setCustEmailInput("");
    setCustBdayInput("");
    inform(`✓ Member Baru ${newC.name} berhasil didaftarkan!`);
  };

  // Discount validation with Security Pin Manager/Owner
  const handleSelectDiscount = (disc: DiscountOption) => {
    if (disc.requireManagerApproval) {
      setApprovalModal({
        show: true,
        purpose: "discount",
        payload: disc
      });
    } else {
      setSelectedDiscount(disc);
      inform(`✓ Voucher Diterapkan: ${disc.name}`);
    }
  };

  const handleVerifyManagerApproval = () => {
    // Standard PINs check: Mega Manager is '8888', Owner Dario is '1234'
    const allowedPins = ["1234", "8888", "2222", "7777"]; // manager, owner, head staff
    if (allowedPins.includes(managerPin)) {
      const purpose = approvalModal.purpose;
      const payload = approvalModal.payload;

      setApprovalModal({ show: false, purpose: "discount" });
      setManagerPin("");

      if (purpose === "discount") {
        setSelectedDiscount(payload);
        inform(`✓ Diskon Disetujui Manajer: ${payload.name}`);
        writeAuditLog(`Manager Approved Special Discount: ${payload.name}`);
      } else if (purpose === "refund") {
        executeRefund(payload);
      } else if (purpose === "void") {
        executeVoid(payload);
      } else if (purpose === "close_shift") {
        executeCloseShift(payload);
      }
    } else {
      setApprovalModal({
        ...approvalModal,
        errorMessage: "PIN Manajer Salah! Kode ditolak."
      });
    }
  };

  // Write audit trail handler
  const writeAuditLog = (actionMsg: string) => {
    const timestamp = nowStr();
    const info = getDeviceInfo();
    const newLog: AuditLogItem = {
      id: `pos-audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user: currentUser?.name || "Kasir Utama",
      role: actualRole,
      action: actionMsg,
      page: "CASHIER POS CENTER",
      timestamp,
      device: info.device,
      ip: info.ip
    };

    const nextState = {
      ...state,
      auditLogs: [newLog, ...(state.auditLogs || [])]
    };
    syncState(nextState);
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let device = "Desktop POS Terminal";
    if (/Mobi/i.test(ua)) device = "Mobile Handheld POS";
    else if (/Tablet|iPad/i.test(ua)) device = "Tablet Terminal";
    return { device, ip: "192.168.1.155" };
  };

  // Opening shift trigger
  const handleOpenShift = () => {
    const floatAmount = parseFloat(modalOpeningVal) || 0;
    setShiftState(prev => ({
      ...prev,
      cashOpening: floatAmount,
      cashClosingExpected: floatAmount,
      isShiftActive: true
    }));
    setOpeningModal(false);
    inform(`🚀 Shift Kasir Dibuka! Modal: Rp ${floatAmount.toLocaleString("id-ID")}`);
    writeAuditLog(`Opening cash shift started. Modal float: ${floatAmount}`);
  };

  // Closing shift verify
  const handleTriggerCloseShift = (actualVal: number, reportNotes: string) => {
    setApprovalModal({
      show: true,
      purpose: "close_shift",
      payload: { actualVal, reportNotes }
    });
  };

  const executeCloseShift = (payload: { actualVal: number; reportNotes: string }) => {
    const expected = shiftState.cashOpening + shiftState.cashSales - shiftState.refundsAmount - shiftState.voidAmount;
    const diff = payload.actualVal - expected;

    const newHistory = {
      openedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString().replace("T", " ").substring(0, 16),
      closedAt: nowStr().substring(0, 16),
      opening: shiftState.cashOpening,
      expected,
      actual: payload.actualVal,
      difference: diff,
      cashierName: labelRole
    };

    setShiftState(prev => ({
      ...prev,
      isShiftActive: false,
      cashOpening: 500000,
      cashSales: 0,
      nonCashSales: 0,
      refundsAmount: 0,
      voidAmount: 0,
      cashClosingExpected: 500000,
      cashClosingActual: 500000,
      history: [newHistory, ...(prev.history || [])],
      notes: payload.reportNotes
    }));

    inform("🔒 Shift Kasir berhasil ditutup dan data selisih diaudit!");
    writeAuditLog(`Shift closed. Expected: Rp ${expected}, Actual: Rp ${payload.actualVal}. Difference: Rp ${diff}`);
  };

  // Checkout and Auto Printer Receipt Integration
  const handleProcessOrderSubmit = () => {
    if (cart.length === 0) {
      inform("Keranjang kosong!");
      return;
    }
    setCashAmountPaid(calculatedTotal.toString());
    setSplitPaymentAmounts({ cash: Math.round(calculatedTotal / 2), nonCash: Math.round(calculatedTotal / 2) });
    setShowPaymentModal(true);
  };

  // Complete Payment Action (Update Inventory, Insert Sales, Trigger Receipt)
  const handleCompleteSuccessPayment = () => {
    setShowPaymentModal(false);

    const generatedOrderNumber = `POS-${Date.now().toString().substring(8, 12)}-${Math.floor(Math.random() * 900) + 100}`;
    const timestamp = nowStr();
    const todayStr = getLocalDateOnly();

    const orderDoc: PosOrder = {
      id: generatedOrderNumber,
      tableId: selectedTable,
      tableName: selectedTable,
      type: orderType,
      items: cart.map(i => ({
        product: i.product,
        qty: i.qty,
        notes: i.notes,
        selectedModifier: i.modifier,
        selectedAddOns: i.selectedAddOns
      })),
      customerName: selectedCust ? selectedCust.name : "Guest",
      discountId: selectedDiscount?.id,
      discountName: selectedDiscount?.name,
      discountAmount: appliedDiscountValue,
      subtotal: cartSubtotal,
      tax: calculatedTax,
      total: calculatedTotal
    };

    // Auto Recipe Stock Deductions Logic (HIGH FIDELITY)
    const nextStorage = { ...state.storage };
    const nextInventory = { ...state.inventory };
    const nextIssues = [...state.issues];

    cart.forEach(cartLine => {
      const matchedProd = posProducts.find(p => p.id === cartLine.product.id);
      if (matchedProd && matchedProd.recipe && matchedProd.recipe.length > 0) {
        matchedProd.recipe.forEach(recipeIng => {
          const ingredientCode = recipeIng.code;
          const totalIngQtyNeeded = recipeIng.qty * cartLine.qty;

          // 1. Deduct from bar storage
          if (nextStorage.bar && nextStorage.bar[ingredientCode] !== undefined) {
            nextStorage.bar[ingredientCode] = Math.max(0, nextStorage.bar[ingredientCode] - totalIngQtyNeeded);
          }

          // 2. Add to exited inventory (keluar)
          if (nextInventory[ingredientCode]) {
            nextInventory[ingredientCode].keluar = (nextInventory[ingredientCode].keluar || 0) + totalIngQtyNeeded;
          }

          // 3. Append to operational issue log
          const matchedMaster = state.master.find(m => m.code === ingredientCode);
          nextIssues.unshift({
            id: `IS-${Date.now()}-${ingredientCode}`,
            time: timestamp,
            isoDate: new Date().toISOString(),
            code: ingredientCode,
            name: matchedMaster?.name || "Bahan Baku POS",
            qty: totalIngQtyNeeded,
            unit: matchedMaster?.unit || "unit",
            cat: "Pemakaian POS (Auto)",
            by: labelRole,
            shift: `Shift Kasir Aktif`,
            note: `Auto-cut resep menu ${cartLine.qty}x ${cartLine.product.name}`
          });
        });
      }
    });

    // Insertion of sale transaction record for financial reports
    const newSaleTran = {
      id: generatedOrderNumber,
      recipeId: cart[0]?.product.id || "R-001",
      recipeName: cart.map(c => `${c.qty}x ${c.product.name}`).join(", ").substring(0, 100),
      qty: cart.reduce((s, i) => s + i.qty, 0),
      sellPrice: calculatedTotal,
      totalRevenue: calculatedTotal,
      totalCost: Math.round(calculatedTotal * 0.35), // estimated 35% COGS fallback
      date: todayStr,
      by: labelRole
    };

    // Update Customer spending & points
    if (selectedCust) {
      const pointsEarned = Math.floor(calculatedTotal / 10000); // 1 point per 10k spending
      setCustomers(customers.map(c => {
        if (c.id === selectedCust.id) {
          const nextCount = c.visitCount + 1;
          const nextSpending = c.totalSpending + calculatedTotal;
          return {
            ...c,
            visitCount: nextCount,
            totalSpending: nextSpending,
            points: c.points + pointsEarned
          };
        }
        return c;
      }));
    }

    // Bookkeep shift state sales (Cash vs Non-Cash)
    const isCashPayment = paymentMethod === "Cash" || paymentMethod === "Split Payment";
    const addedCashSales = paymentMethod === "Cash"
      ? calculatedTotal
      : paymentMethod === "Split Payment" ? splitPaymentAmounts.cash : 0;
    const addedNonCashSales = paymentMethod !== "Cash" && paymentMethod !== "Split Payment"
      ? calculatedTotal
      : paymentMethod === "Split Payment" ? splitPaymentAmounts.nonCash : 0;

    setShiftState(prev => ({
      ...prev,
      cashSales: prev.cashSales + addedCashSales,
      nonCashSales: prev.nonCashSales + addedNonCashSales,
      cashClosingExpected: prev.cashClosingExpected + addedCashSales
    }));

    // Construct the updated overall state
    const nextState: CoffeeOpsState = {
      ...state,
      storage: nextStorage,
      inventory: nextInventory,
      issues: nextIssues,
      sales: [newSaleTran, ...(state.sales || [])]
    };

    // Sync payload immediately
    syncState(nextState);

    // Save for automated receipt printing on finishing
    setLastCompletedOrder(orderDoc);
    setLastPrintLog(`Struk ${generatedOrderNumber} dicetak otomatis`);

    // Route barista and kitchen tickets automatically
    routeAutoprintJobs(orderDoc);

    // Clear cart & variables
    setCart([]);
    setSelectedCust(null);
    setSelectedDiscount(null);
    setShowReceiptModal(true);
    inform(`✓ Transaksi ${generatedOrderNumber} Berhasil Disimpan & Sinkronisasi.`);
    writeAuditLog(`Completed Sale Order: ${generatedOrderNumber} (Rp ${calculatedTotal})`);
  };

  // Route automatic barista and kitchen jobs
  const routeAutoprintJobs = (order: PosOrder) => {
    // Collect beverages
    const drinks = order.items.filter(i =>
      ["Espresso", "Milk Beverage", "Manual Brew", "Tea", "Non Coffee"].includes(i.product.category)
    );
    // Collect foods
    const foods = order.items.filter(i =>
      ["Food", "Pastry"].includes(i.product.category)
    );

    if (drinks.length > 0) {
      setPrintedBaristaTicket({
        orderNo: order.id,
        table: order.tableName,
        items: drinks,
        time: nowStr()
      });
    } else {
      setPrintedBaristaTicket(null);
    }

    if (foods.length > 0) {
      setPrintedKitchenTicket({
        orderNo: order.id,
        table: order.tableName,
        items: foods,
        time: nowStr()
      });
    } else {
      setPrintedKitchenTicket(null);
    }
  };

  // Refund workflow
  const handleTriggerRefund = (item: any) => {
    setApprovalModal({
      show: true,
      purpose: "refund",
      payload: item
    });
  };

  const executeRefund = (payload: any) => {
    // reduce shift state
    setShiftState(prev => ({
      ...prev,
      refundsAmount: prev.refundsAmount + payload.totalRevenue
    }));
    
    // clear sale in audit
    const remainingSales = (state.sales || []).filter(s => s.id !== payload.id);
    syncState({
      ...state,
      sales: remainingSales
    });

    inform(`✓ Refund Transaksi ${payload.id} sebesar ${payload.totalRevenue.toLocaleString("id-ID")} disetujui!`);
    writeAuditLog(`REFUND APPROVED for order ${payload.id}. Amount: ${payload.totalRevenue}`);
  };

  // Void workflow
  const handleTriggerVoid = (item: any) => {
    setApprovalModal({
      show: true,
      purpose: "void",
      payload: item
    });
  };

  const executeVoid = (payload: any) => {
    setShiftState(prev => ({
      ...prev,
      voidAmount: prev.voidAmount + payload.totalRevenue
    }));

    const remainingSales = (state.sales || []).filter(s => s.id !== payload.id);
    syncState({
      ...state,
      sales: remainingSales
    });

    inform(`✓ VOID TRANSAKSI ${payload.id} senilai ${payload.totalRevenue.toLocaleString("id-ID")} berhasil diselesaikan.`);
    writeAuditLog(`VOID TRANSACTION APPROVED for order ID ${payload.id}`);
  };

  // Scanning Bluetooth Thermal Printers
  const handleScanBTPrinters = () => {
    setIsScanning(true);
    inform("Mencari Printer Panda Bluetooth...");
    setTimeout(() => {
      setIsScanning(false);
      inform("✓ Selesai memindai perangkat sekitar.");
    }, 2500);
  };

  const handleConnectPrinter = (pId: string) => {
    setPrinters(printers.map(p => {
      if (p.id === pId) return { ...p, connected: true, status: "Connected" };
      return { ...p, connected: false, status: "Disconnected" };
    }));
    inform("✓ Printer berhasil disambungkan!");
  };

  const handleDisconnectPrinter = (pId: string) => {
    setPrinters(printers.map(p => {
      if (p.id === pId) return { ...p, connected: false, status: "Disconnected" };
      return p;
    }));
    inform("Koneksi printer diputuskan.");
  };

  // Enterprise helper: save everything to parent sync
  const parentSyncEnterprise = (updatedDevices = devices, updatedReceipt = receiptSettings, updatedPlugins = pluginSettings, updatedLogs = printerLogs, updatedRefunds = refundLogs, updatedQris = paymentQrisList) => {
    const nextState: CoffeeOpsState = {
      ...state,
      pos_devices: updatedDevices,
      device_registry: updatedDevices,
      receipt_settings: updatedReceipt,
      plugin_settings: updatedPlugins,
      printer_logs: updatedLogs,
      refund_logs: updatedRefunds,
      payment_qris: updatedQris,
      cashier_permissions: cashierPermissions
    };
    syncState(nextState);
  };

  // Test printing page with logs
  const handleTestPrintPage = () => {
    const printer = activePrinter || printers[0];
    if (!printer) {
      inform("Peringatan: Tidak ada printer terhubung!");
      return;
    }
    const timestamp = nowStr();
    setLastPrintLog(`Test Print @ ${timestamp}`);
    
    // Add to printer logs database
    const newLog = {
      id: `log-${Date.now()}`,
      printerId: printer.id,
      timestamp,
      message: `Test page print request for ${printer.name} (${printer.size}) - OK`,
      status: "Success" as const
    };
    const nextLogs = [newLog, ...printerLogs];
    setPrinterLogs(nextLogs);
    parentSyncEnterprise(devices, receiptSettings, pluginSettings, nextLogs);
    inform(`✓ Mengirim halaman uji cetak thermal (${printer.size}) ke printer: ${printer.name}`);
    writeAuditLog(`Triggered Test Print on printer: ${printer.name}`);
  };

  // Restart printer simulator
  const handleRestartPrinter = (pId: string) => {
    const target = printers.find(p => p.id === pId);
    if (!target) return;
    inform(`🔄 Merestart printer ${target.name}...`);
    setTimeout(() => {
      inform(`✓ Printer ${target.name} berhasil direstart & otomatis terhubung kembali!`);
      const timestamp = nowStr();
      const newLog = {
        id: `log-${Date.now()}`,
        printerId: pId,
        timestamp,
        message: `Printer hardware cold-reboot & automated reconnect sequence: SUCCESS`,
        status: "Success" as const
      };
      const nextLogs = [newLog, ...printerLogs];
      setPrinterLogs(nextLogs);
      parentSyncEnterprise(devices, receiptSettings, pluginSettings, nextLogs);
      writeAuditLog(`Cold-rebooted printer device: ${target.name}`);
    }, 1200);
  };

  // Sync devices simulator
  const handleSyncDevices = () => {
    inform("🔄 Mensinkronisasikan daftar POS Device & Printer Logs dengan Server Cloud...");
    setTimeout(() => {
      inform("✓ Sinkronisasi berhasil! Semua data POS multi-outlet up to date.");
      writeAuditLog("Manually triggered enterprise POS devices cloud synchronization");
    }, 800);
  };

  // CRUD POS Devices
  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = nowStr();
    if (editingDevice) {
      // Edit device
      const updated = devices.map(d => {
        if (d.id === editingDevice.id) {
          return {
            ...d,
            name: deviceFormName || d.name,
            assignedStation: deviceFormStation || d.assignedStation,
            assignedUser: deviceFormUser || d.assignedUser,
            status: deviceFormStatus,
            battery: deviceFormBattery,
            firmware: deviceFormFirmware,
            lastConnected: timestamp,
            connectionHistory: [
              { timestamp, action: `Configuration updated. Status: ${deviceFormStatus}` },
              ...d.connectionHistory
            ]
          };
        }
        return d;
      });
      setDevices(updated);
      parentSyncEnterprise(updated);
      inform(`✓ Device ${deviceFormName} berhasil diupdate.`);
      writeAuditLog(`Updated POS Device configurations for: ${deviceFormName} (${editingDevice.id})`);
    } else {
      // Add device
      const newId = deviceFormId || `DEV-${Math.floor(100 + Math.random() * 900)}`;
      const newDevice = {
        id: newId,
        name: deviceFormName || "Generic Android POS Terminal",
        lastConnected: timestamp,
        battery: deviceFormBattery || 100,
        firmware: deviceFormFirmware || "v3.2.0",
        status: deviceFormStatus || "Online",
        assignedStation: deviceFormStation || "Cashier Secondary Counter",
        assignedUser: deviceFormUser || "Staff On Duty",
        connectionHistory: [
          { timestamp, action: "Device provisioned and registered" }
        ]
      };
      const updated = [...devices, newDevice];
      setDevices(updated);
      parentSyncEnterprise(updated);
      inform(`✓ Device Baru terdaftar: ${newDevice.name}`);
      writeAuditLog(`Registered new Enterprise POS Device: ${newDevice.name} [${newId}]`);
    }
    setShowDeviceModal(false);
    setEditingDevice(null);
  };

  const handleOpenAddDevice = () => {
    setEditingDevice(null);
    setDeviceFormId(`DEV-${Math.floor(100 + Math.random() * 900)}`);
    setDeviceFormName("");
    setDeviceFormStation("Bar Counter 2");
    setDeviceFormUser("Adit Barista");
    setDeviceFormFirmware("v3.2.0");
    setDeviceFormBattery(100);
    setDeviceFormStatus("Online");
    setShowDeviceModal(true);
  };

  const handleOpenEditDevice = (dev: any) => {
    setEditingDevice(dev);
    setDeviceFormId(dev.id);
    setDeviceFormName(dev.name);
    setDeviceFormStation(dev.assignedStation);
    setDeviceFormUser(dev.assignedUser);
    setDeviceFormFirmware(dev.firmware);
    setDeviceFormBattery(dev.battery);
    setDeviceFormStatus(dev.status);
    setShowDeviceModal(true);
  };

  const handleDeleteDeviceSequence = (dev: any) => {
    setDeleteConfirmModal({
      show: true,
      type: "device",
      id: dev.id,
      name: dev.name
    });
  };

  const executeConfirmedDelete = () => {
    const { type, id, name } = deleteConfirmModal;
    if (type === "device") {
      const updated = devices.filter(d => d.id !== id);
      setDevices(updated);
      parentSyncEnterprise(updated);
      inform(`✓ Device ${name} berhasil dihapus dari registry.`);
      writeAuditLog(`Deleted POS Device registry for: ${name} (${id})`);
    }
    setDeleteConfirmModal({ show: false, type: "device", id: "", name: "" });
  };

  // Diagnostics and Firmware simulator
  const handleTriggerDeviceDiagnostics = (devId: string) => {
    const dev = devices.find(d => d.id === devId);
    if (!dev) return;
    inform(`🔍 Melakukan diagnosa hardware mendalam pada ${dev.name}...`);
    setTimeout(() => {
      inform(`✓ Diagnosa Selesai untuk ${dev.name}: CPU OK, RAM OK, Storage 84% Free, Bluetooth Signal Strong!`);
      const updated = devices.map(d => {
        if (d.id === devId) {
          return {
            ...d,
            connectionHistory: [
              { timestamp: nowStr(), action: "Diagnostics run: 100% healthy specs" },
              ...d.connectionHistory
            ]
          };
        }
        return d;
      });
      setDevices(updated);
      parentSyncEnterprise(updated);
      writeAuditLog(`Ran system diagnostics validation check on device: ${dev.name}`);
    }, 1500);
  };

  const handleTriggerFirmwareUpdate = (devId: string) => {
    const dev = devices.find(d => d.id === devId);
    if (!dev) return;
    inform(`🔄 Mengunduh & Memasang firmware OTA baru pada ${dev.name}...`);
    setTimeout(() => {
      const nextVer = `v${(parseFloat(dev.firmware.replace("v", "")) + 0.1).toFixed(1)}`;
      inform(`✓ Sukses! ${dev.name} berhasil diupdate ke firmware ${nextVer}`);
      const updated = devices.map(d => {
        if (d.id === devId) {
          return {
            ...d,
            firmware: nextVer,
            connectionHistory: [
              { timestamp: nowStr(), action: `Firmware OTA update applied to version ${nextVer}` },
              ...d.connectionHistory
            ]
          };
        }
        return d;
      });
      setDevices(updated);
      parentSyncEnterprise(updated);
      writeAuditLog(`OTA firmware upgrade successfully deployed on device ${dev.name} to ${nextVer}`);
    }, 2000);
  };

  // Self-Order acceptance flow
  const handleAcceptSelfOrder = (order: any) => {
    inform(`✓ Menerima order dari ${order.table} sebesar Rp ${order.subtotal.toLocaleString("id-ID")}`);
    // Simulate converting this to a real POS checkout or active table status
    setSelfOrders(selfOrders.filter(so => so.id !== order.id));
    
    // Auto add to active table order in tablesList
    const matchedTableNum = order.table.replace("Meja ", "");
    const updatedTables = tablesList.map(t => {
      if (t.name.includes(matchedTableNum)) {
        return { ...t, status: "Occupied" };
      }
      return t;
    });
    setTablesList(updatedTables);
    
    // Write KDS Queue item for baristas and kitchen
    const newKdsId = `q-${Math.floor(100 + Math.random() * 900)}`;
    const itemsList = order.items ? order.items : [{ name: "Kyoto Uji Matcha Latte", qty: 1 }, { name: "Nasi Goreng Kampung", qty: 1 }];
    setKdsQueue([
      {
        id: newKdsId,
        orderNo: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        table: order.table,
        items: itemsList,
        type: "Food & Beverage",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        status: "pending",
        isNew: true
      },
      ...kdsQueue
    ]);
    
    writeAuditLog(`Self-Order accepted for ${order.table} from customer scan QR Menu`);
  };

  const handleDeclineSelfOrder = (orderId: string) => {
    setSelfOrders(selfOrders.filter(so => so.id !== orderId));
    inform("⚠ Order mandiri dibatalkan/ditolak.");
    writeAuditLog(`Rejected incoming Self-Order message reference ID: ${orderId}`);
  };

  // Export functions
  const handleExportTransactions = (format: "PDF" | "Excel") => {
    inform(`📥 Memulai proses kompilasi ekspor penjualan hari ini dalam format ${format}...`);
    setTimeout(() => {
      inform(`✓ Sukses! File ekspor CoffeeOps_Transactions_${getLocalDateOnly()}.${format === "PDF" ? "pdf" : "xlsx"} telah terunduh.`);
      writeAuditLog(`Exported daily transactions logs as ${format} spreadsheet/document`);
    }, 1500);
  };

  // Enterprise Database backup and restore simulator
  const handleBackupDatabase = () => {
    setIsBackingUp(true);
    inform("💾 Membuat backup database operasional CoffeeOps...");
    setTimeout(() => {
      setIsBackingUp(false);
      inform(`✓ Backup manual berhasil! Enkripsi AES256 selesai. File: backup_coffeeops_${Date.now()}.bin`);
      writeAuditLog("Manually triggered encrypted local DB backup image");
    }, 1800);
  };

  const handleRestoreBackup = () => {
    inform("🔄 Mengunggah & Memvalidasi restore image database...");
    setTimeout(() => {
      inform("✓ Sukses mengembalikan database ke rollback point 2026-06-03 01:00 UTC!");
      writeAuditLog("Restored database from secured rollback BIN point successfully");
    }, 1500);
  };

  // Standard interactive table styles
  const getTableColor = (status: "Available" | "Occupied" | "Reserved" | "Cleaning") => {
    switch (status) {
      case "Occupied": return "bg-red-950/50 text-red-400 border-red-500/25";
      case "Reserved": return "bg-amber-950/40 text-amber-300 border-amber-500/25";
      case "Cleaning": return "bg-indigo-950/40 text-indigo-300 border-indigo-500/25";
      default: return "bg-emerald-950/30 text-emerald-400 border-emerald-500/20";
    }
  };

  // Render SVG interactive charts for manager / owner
  const renderInteractiveSalesChart = () => {
    const historicalData = [
      { date: "Mon", val: 1250000 },
      { date: "Tue", val: 1480000 },
      { date: "Wed", val: 1850000 },
      { date: "Thu", val: 1690000 },
      { date: "Fri", val: 2450000 },
      { date: "Sat", val: 3200000 },
      { date: "Sun", val: 2900000 }
    ];

    const maxVal = 3500000;
    const width = 500;
    const height = 180;
    const points = historicalData.map((d, i) => {
      const x = 40 + i * (width - 60) / (historicalData.length - 1);
      const y = height - 25 - (d.val / maxVal) * (height - 50);
      return { x, y, ...d };
    });

    const pathStr = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return (
      <div className="bg-[#210f03]/60 border border-[#D4A853]/15 rounded-xl p-5 mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-amber-200">Tren Penjualan Mingguan (Rupiah)</div>
          <span className="text-[10px] text-amber-100/40 font-mono">Senin - Minggu</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Grids */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const hVal = height - 25 - p * (height - 50);
            return (
              <g key={i}>
                <line x1="35" y1={hVal} x2={width - 20} y2={hVal} stroke="#D4A853" strokeOpacity="0.08" strokeDasharray="3,3" />
                <text x="30" y={hVal + 3} fill="#D4A853" fillOpacity="0.35" fontSize="8" textAnchor="end" fontFamily="monospace">
                  {Math.round((maxVal * p) / 1000)}k
                </text>
              </g>
            );
          })}
          {/* Smooth area gradient */}
          <path
            d={`${pathStr} L ${points[points.length - 1].x} ${height - 25} L ${points[0].x} ${height - 25} Z`}
            fill="url(#goldGradient)"
            opacity="0.12"
          />
          {/* Trend line */}
          <path d={pathStr} fill="none" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Interactive nodes */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#140700" stroke="#D4A853" strokeWidth="2" />
              <text x={p.x} y={height - 8} fill="#D4A853" fillOpacity="0.6" fontSize="9" textAnchor="middle" fontFamily="monospace">
                {p.date}
              </text>
              {/* Tooltip hover */}
              <text x={p.x} y={p.y - 10} fill="#FFF" fontSize="9" textAnchor="middle" fontFamily="monospace" className="opacity-0 group-hover:opacity-100 font-bold transition duration-200 bg-neutral-900 px-1">
                Rp {p.val / 1000}k
              </text>
            </g>
          ))}
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4A853" />
              <stop offset="100%" stopColor="#140700" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#110500] text-amber-50 p-4 lg:p-7 pt-20">
      
      {/* ── TOP HEADER SUB-ROUTING (DASHBOARD HEAD) ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#D4A853]/15 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#D4A853] uppercase tracking-widest leading-none">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            CASHIER POS CENTER • LIVE TRANS-SYNC
          </div>
          <h1 className="font-serif text-3xl font-semibold text-amber-100 tracking-tight mt-1">
            Cashier Management System
          </h1>
          <p className="text-xs text-amber-100/40 mt-0.5">
            Sistem operasional entri POS harian, update stok resep real-time, cetak thermal Panda BT & manajemen laci kas.
          </p>
        </div>

        {/* Roles Access Quick Switching with Dynamic Emulator */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
          {/* Role Choice dropdown emulator */}
          <div className="flex items-center gap-2 bg-neutral-950 border border-[#D4A853]/30 px-3 py-2 rounded-xl">
            <ShieldCheck className="h-4 w-4 text-[#D4A853]" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[#D4A853] font-mono leading-none tracking-widest font-bold uppercase">Role Emulasi</span>
              <select
                value={activeRole}
                onChange={(e) => {
                  const nextRole = e.target.value as any;
                  setActiveRole(nextRole);
                  // Auto redirect if active tab is totally blocked
                  const check = checkTabPermStatic(nextRole, activeSection);
                  if (!check) {
                    setActiveSection("dashboard");
                  }
                  inform(`✓ Hak akses emulasi diubah ke: ${nextRole}`);
                  writeAuditLog(`Switched active access role workspace to: ${nextRole}`);
                }}
                className="bg-transparent text-amber-50 text-xs font-bold border-0 focus:ring-0 focus:outline-none cursor-pointer p-0 mt-0.5"
              >
                <option value="Owner" className="bg-neutral-900 text-amber-100">Owner 👑 (Full Access)</option>
                <option value="Manager" className="bg-neutral-900 text-amber-100">Manager 💼 (Edit & voids)</option>
                <option value="Cashier" className="bg-neutral-900 text-amber-100">Cashier 💵 (Sales & Shift)</option>
                <option value="FOH" className="bg-neutral-900 text-amber-100">Front of House 🍽️ (Waitstaff)</option>
                <option value="Barista" className="bg-neutral-900 text-amber-100">Barista ☕ (KDS Preparation)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              if (activeRole !== "Owner" && activeRole !== "Manager") {
                inform("❌ Akses Ditolak: Hanya Akun Owner & Manager yang diizinkan mengedit POS.");
                return;
              }
              setShowSettingsModal(true);
            }}
            className="w-full md:w-auto bg-gradient-to-r from-amber-950 to-neutral-900 hover:from-amber-900 hover:to-neutral-950 border border-[#D4A853]/40 text-amber-100 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>⚙️ Pengaturan POS</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs row */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#D4A853]/10 pb-3 mb-6">
        {[
          { id: "dashboard", label: "Dashboard", roleReq: [] },
          { id: "pos", label: "Cashier POS Center", roleReq: ["Owner", "Manager", "Cashier", "FOH"] },
          { id: "tables", label: "Meja Interaktif", roleReq: ["Owner", "Manager", "Cashier", "FOH"] },
          { id: "customers", label: "CRM Pelanggan", roleReq: ["Owner", "Manager", "Cashier"] },
          { id: "printer", label: "Hardware & Device", roleReq: ["Owner", "Manager", "Cashier"] },
          { id: "shift", label: "Shift & Laci Kas", roleReq: ["Owner", "Manager", "Cashier"] },
          { id: "analytics", label: "Omset & Analytics", roleReq: ["Owner", "Manager"] },
          { id: "kds", label: "KDS Queue Monitor", roleReq: [] },
          { id: "plugins", label: "Roadmap Plugins", roleReq: ["Owner", "Manager"] }
        ].map((tab) => {
          const isAllowedDef = tab.roleReq.length === 0 || tab.roleReq.includes(activeRole);
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id as any);
                writeAuditLog(`Navigated tab selection to: ${tab.label}`);
              }}
              className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold border transition flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-[#D4A853] text-[#1a0f02] border-[#D4A853] font-bold shadow"
                  : isAllowedDef
                  ? "bg-black/40 text-amber-150/70 border-white/5 hover:bg-[#D4A853]/10 hover:text-amber-100"
                  : "bg-black/10 text-neutral-600 border-dashed border-neutral-800/60 hover:bg-neutral-900/40 hover:text-neutral-400"
              }`}
            >
              <span>{tab.label}</span>
              {!isAllowedDef && (
                <span className="text-[10px] text-amber-500 shrink-0">🔒</span>
              )}
              {tab.id === "kds" && kdsQueue.filter(q => q.status === "pending").length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0">
                  {kdsQueue.filter(q => q.status === "pending").length}
                </span>
              )}
            </button>
          );
        })}
      </div>


      {/* ── STATUS ALERT HEADER PANEL OR LOGIN STATIONS ── */}
      <div className="bg-[#261203] border border-[#D4A853]/15 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <Clock className="h-4 w-4 text-[#D4A853] shrink-0" />
            <div className="leading-tight">
              <span className="text-[10px] block opacity-40 uppercase font-mono">Waktu</span>
              <span className="font-mono font-medium">{new Date().toLocaleTimeString("id-ID")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <Briefcase className="h-4 w-4 text-[#D4A853] shrink-0" />
            <div className="leading-tight">
              <span className="text-[10px] block opacity-40 uppercase font-mono">Kasir Aktif</span>
              <span className="font-medium">{labelRole}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <Printer className="h-4 w-4 text-[#D4A853] shrink-0" />
            <div className="leading-tight">
              <span className="text-[10px] block opacity-40 uppercase font-mono">Bluetooth Printer</span>
              <span className={`font-mono font-bold uppercase text-[10px] ${activePrinter ? "text-emerald-400" : "text-amber-400"}`}>
                {activePrinter ? `✓ ${activePrinter.name}` : "✖ Tidak Terhubung"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <div className="leading-tight">
              <span className="text-[10px] block opacity-40 uppercase font-mono">Internet</span>
              <span className="font-mono font-medium text-emerald-400">ONLINE</span>
            </div>
          </div>
        </div>

        {/* Warning Badge for missing printer */}
        {!activePrinter && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/35 text-amber-300 text-xs px-3 py-1.5 rounded-lg animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              <span className="font-semibold block">Printer Bluetooth Tidak Aktif</span>
              <span className="text-[10px] block opacity-75">Gagal mencetak struk secara offline. Samba/Panda BT perlu disambungkan!</span>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN CONDITIONAL RENDERING ── */}
      <AnimatePresence mode="wait">
        
        {/* SECTION 1: POS DASHBOARD */}
        {activeSection === "dashboard" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick action alert bar */}
            {!shiftState.isShiftActive && (
              <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-red-300">Konter Kasir Belum Dibuka</h3>
                  <p className="text-xs text-amber-100/55 mt-1">Harap lakukan pencatatan modal awal shift ("Modal Awal") sebelum melayani transaksi penjualan.</p>
                </div>
                <button
                  onClick={() => setOpeningModal(true)}
                  className="bg-[#D4A853] hover:bg-[#c29845] text-[#140700] px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Mulai Shift & Input Modal
                </button>
              </div>
            )}

            {/* Grid of operational KPI boxes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-[#D4A853]/10 p-5 rounded-xl shadow-lg relative overflow-hidden">
                <span className="text-[10px] font-mono text-amber-200/40 uppercase block">Pendapatan Hari Ini</span>
                <span className="text-xl lg:text-2xl font-serif font-bold text-amber-100 mt-1 block">
                  Rp {totalRevenueToday.toLocaleString("id-ID")}
                </span>
                <div className="text-[9px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                  <span>✓ Terkonvergensikan</span>
                </div>
              </div>

              <div className="bg-neutral-900 border border-[#D4A853]/10 p-5 rounded-xl shadow-lg relative overflow-hidden">
                <span className="text-[10px] font-mono text-amber-200/40 uppercase block">Total Transaksi</span>
                <span className="text-xl lg:text-2xl font-serif font-bold text-amber-100 mt-1 block">
                  {todayTransactions.length} Sales
                </span>
                <div className="text-[9px] text-amber-100/40 mt-1">
                  Dari POS terminal lokal harian
                </div>
              </div>

              <div className="bg-neutral-900 border border-[#D4A853]/10 p-5 rounded-xl shadow-lg relative overflow-hidden">
                <span className="text-[10px] font-mono text-amber-200/40 uppercase block">Rata-Rata Tiket</span>
                <span className="text-xl lg:text-2xl font-serif font-bold text-amber-100 mt-1 block">
                  Rp {statsAverageValue.toLocaleString("id-ID")}
                </span>
                <div className="text-[9px] text-[#D4A853] font-mono mt-1">
                  Transaksi Aktif
                </div>
              </div>

              <div className="bg-neutral-900 border border-[#D4A853]/10 p-5 rounded-xl shadow-lg relative overflow-hidden">
                <span className="text-[10px] font-mono text-amber-200/40 uppercase block">Pesanan Terbuka (FOH)</span>
                <span className="text-xl lg:text-2xl font-serif font-bold text-amber-100 mt-1 block">
                  {openOrdersCount} Orders
                </span>
                <div className="text-[9px] text-amber-300 font-mono mt-1">
                  Meja Occupied/Reserved
                </div>
              </div>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/40 border border-[#D4A853]/10 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-200/30 uppercase block">Shift Aktif</span>
                  <span className="text-sm font-semibold text-amber-100 mt-1 block">
                    {shiftState.isShiftActive ? "Pagi & Siang (Kru Cashier)" : "Shift Ditutup"}
                  </span>
                </div>
                <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center text-[#D4A853]">
                  <Clock className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-black/40 border border-[#D4A853]/10 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-200/30 uppercase block">Panda Bluetooth Status</span>
                  <span className="text-sm font-semibold text-amber-100 mt-1 block">
                    {activePrinter ? `Termis connected (${activePrinter.size})` : "Disconnected Device"}
                  </span>
                </div>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${activePrinter ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  <Printer className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-black/40 border border-red-500/10 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-200/30 uppercase block">Bahan Kritis Par</span>
                  <span className={`text-sm font-semibold mt-1 block ${lowStockAlertsCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {lowStockAlertsCount} Bahan Menipis
                  </span>
                </div>
                <div className="h-9 w-9 rounded-full bg-red-500/15 flex items-center justify-center text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Quick access grid panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Sales History List */}
              <div className="bg-neutral-900 border border-[#D4A853]/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg font-semibold text-amber-100">Daftar Transaksi Kasir Hari Ini</h3>
                  <button
                    onClick={() => setActiveSection("shift")}
                    className="text-xs text-[#D4A853] hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {todayTransactions.length === 0 ? (
                    <div className="text-center py-10 text-xs text-amber-100/30">Belum ada transaksi terekam harian.</div>
                  ) : (
                    todayTransactions.map((tx, idx) => (
                      <div key={idx} className="bg-black/35 p-3 rounded-lg flex items-center justify-between text-xs border border-[#D4A853]/5 hover:border-[#D4A853]/15 transition">
                        <div>
                          <div className="font-mono font-bold text-amber-200">{tx.id}</div>
                          <div className="text-[10px] text-amber-100/40 mt-0.5">{tx.recipeName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-amber-100">Rp {tx.sellPrice.toLocaleString("id-ID")}</div>
                          <button
                            onClick={() => handleTriggerVoid(tx)}
                            className="text-[9px] text-red-400 hover:underline hover:text-red-300 font-medium mt-0.5 font-mono ml-2 inline-block"
                          >
                            VOID
                          </button>
                          <button
                            onClick={() => handleTriggerRefund(tx)}
                            className="text-[9px] text-amber-400 hover:underline hover:text-amber-300 font-medium mt-0.5 font-mono ml-2 inline-block"
                          >
                            REFUND
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Static Recipe Deductions Rules View */}
              <div className="bg-neutral-900 border border-[#D4A853]/10 rounded-xl p-5 space-y-3">
                <h3 className="font-serif text-lg font-semibold text-amber-100">Mekanisme Pengurangan Stok Auto</h3>
                <p className="text-xs text-amber-100/50">
                  Untuk setiap menu yang dipesan via POS, mesin kasir secara otomatis mengidentifikasi resep dan memotong bahan baku pada database harian.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="bg-black/25 p-3 rounded-lg text-xs font-mono space-y-1">
                    <div className="text-amber-300 font-semibold uppercase">1 Cappuccino Special</div>
                    <div className="text-amber-100/60 leading-relaxed">
                      • Mengurangi Biji Espresso (BK-001) sebanyak 18g
                      <br />• Mengurangi Susu Greenfields (SU-001) sebanyak 150ml
                    </div>
                  </div>
                  <div className="bg-black/25 p-3 rounded-lg text-xs font-mono space-y-1">
                    <div className="text-amber-300 font-semibold uppercase">1 Kyoto Matcha Latte</div>
                    <div className="text-amber-100/60 leading-relaxed">
                      • Mengurangi Matcha Powder (PW-002) sebanyak 6 gr
                      <br />• Mengurangi Susu Greenfields (SU-001) sebanyak 150ml
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 2: ORDER ENTRY (POS GRID LAYOUT) */}
        {activeSection === "pos" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* Left section: Product Browsing Grid (8 cols) */}
            <div className="xl:col-span-7 space-y-4">
              
              {/* Category selector & Search */}
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Cari menu kopi, pastry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1e1106] border border-[#D4A853]/20 rounded-lg py-2 pl-9 pr-4 text-xs text-amber-100 placeholder-amber-400/40 outline-none focus:border-[#D4A853]/55"
                  />
                  <Search className="h-4 w-4 text-amber-400/40 absolute left-3 top-2.5" />
                </div>

                {/* Grid categories button carousel */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
                  {["All", "Espresso", "Milk Beverage", "Manual Brew", "Tea", "Non Coffee", "Food", "Pastry"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                        activeCategory === cat
                          ? "bg-[#D4A853] text-[#140700] border-[#D4A853]"
                          : "bg-[#180a02] text-amber-200/50 border-[#D4A853]/10 hover:text-amber-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu products grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="bg-neutral-900 border border-[#D4A853]/10 p-3.5 rounded-xl flex flex-col justify-between cursor-pointer hover:border-[#D4A853]/50 transition group shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-3xl filter drop-shadow group-hover:scale-110 transition shrink-0">{p.imageUrl}</span>
                      <span className="text-[9px] bg-amber-500/10 text-[#D4A853] rounded px-1.5 py-0.5 uppercase tracking-wide font-mono self-start font-bold">
                        {p.category}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-serif font-semibold text-sm text-amber-100 group-hover:text-amber-200 transition line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#D4A853]/5">
                        <span className="font-mono text-xs font-bold text-[#D4A853]">
                          Rp {p.price.toLocaleString("id-ID")}
                        </span>
                        <div className="h-5 w-5 bg-[#D4A853]/10 group-hover:bg-[#D4A853] rounded flex items-center justify-center text-[#D4A853] group-hover:text-black transition">
                          <Plus className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right section: Active Cart panel (5 cols) */}
            <div className="xl:col-span-5 bg-neutral-900 border border-[#D4A853]/15 rounded-xl flex flex-col h-[calc(100vh-180px)] overflow-hidden shadow-lg">
              
              {/* Cart Header */}
              <div className="p-4 bg-black/40 border-b border-[#D4A853]/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-[#D4A853]" />
                  <h3 className="font-serif font-bold text-base text-amber-150">Keranjang Kasir</h3>
                </div>
                <span className="bg-[#D4A853]/15 text-[#D4A853] font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {cart.length} Baris
                </span>
              </div>

              {/* Quick Table Placement selector */}
              <div className="p-3 bg-[#1e1106]/40 border-b border-[#D4A853]/10 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-amber-200/70">
                  <span className="font-semibold text-[11px] uppercase tracking-wider font-mono">TIPE:</span>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as any)}
                    className="bg-black/60 border border-[#D4A853]/15 rounded px-2 py-0.5 text-xs text-[#D4A853] font-semibold"
                  >
                    <option value="Dine In">Dine In</option>
                    <option value="Take Away">Take Away</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Reservation">Reservation</option>
                    <option value="Pre Order">Pre Order</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-amber-200/70">
                  <span className="font-semibold text-[11px] uppercase tracking-wider font-mono">LOKASI:</span>
                  <select
                    value={selectedTable}
                    onChange={(e) => handleSelectTable(e.target.value)}
                    className="bg-black/60 border border-[#D4A853]/15 rounded px-2 py-0.5 text-xs text-[#D4A853] font-semibold"
                  >
                    <option value="Take Away">Take Away Counter</option>
                    {tablesList.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.status})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Customer select */}
              <div className="p-3 bg-black/10 border-b border-[#D4A853]/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-amber-450 shrink-0" />
                  <div className="text-left">
                    <span className="text-[10px] block text-amber-100/40 uppercase font-mono">Pelanggan</span>
                    <select
                      value={selectedCust ? selectedCust.id : ""}
                      onChange={(e) => {
                        const match = customers.find(c => c.id === e.target.value);
                        setSelectedCust(match || null);
                      }}
                      className="bg-transparent text-xs text-amber-200 focus:outline-none focus:underline max-w-40 font-bold"
                    >
                      <option value="">-- Guest --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({computeLoyaltyTier(c.visitCount, c.totalSpending)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedCust && (
                  <div className="text-right">
                    <span className="text-[10px] block text-amber-100/40 font-mono">Poin Tersedia</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{selectedCust.points} QPs</span>
                  </div>
                )}
              </div>

              {/* Cart items lists (Scrollable middle) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-amber-100/20 py-20">
                    <ShoppingCart className="h-12 w-12 text-amber-100/10 mb-2" />
                    <p className="text-sm">Keranjang kosong.</p>
                    <p className="text-xs opacity-60">Ketuk menu di sebelah kiri untuk berbelanja.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="bg-black/20 border border-[#D4A853]/5 hover:border-[#D4A853]/10 p-3 rounded-xl flex items-start gap-3 relative transition group">
                      <span className="text-2xl pt-1 shrink-0">{item.product.imageUrl}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold font-serif text-amber-50 truncate pr-6">
                            {item.product.name}
                          </h4>
                          <span className="text-xs font-mono font-bold text-[#D4A853] shrink-0">
                            Rp {(item.priceWithAddOns * item.qty).toLocaleString("id-ID")}
                          </span>
                        </div>

                        {/* Custom subnotes modifier */}
                        <div className="text-[10px] text-[#D4A853] mt-0.5 space-x-1.5 flex flex-wrap font-mono items-center">
                          <span className="bg-[#D4A853]/10 px-1.5 py-0.2 rounded">{item.modifier}</span>
                          {item.selectedAddOns.map((a, i) => (
                            <span key={i} className="text-amber-100/40">+ {a}</span>
                          ))}
                        </div>

                        {item.notes && (
                          <div className="text-[10px] text-amber-300 italic mt-1 font-mono">
                            Ket: &ldquo;{item.notes}&rdquo;
                          </div>
                        )}

                        {/* Interactive edit note trigger */}
                        <button
                          onClick={() => handleOpenModifyItem(item)}
                          className="text-[9px] text-[#D4A853]/45 absolute top-3 right-3 group-hover:text-[#D4A853] hover:underline"
                        >
                          EDIT
                        </button>

                        {/* Qty incrementer */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDecQty(item.id)}
                              className="h-6 w-6 rounded bg-[#1e1106] border border-[#D4A853]/10 flex items-center justify-center text-[#D4A853] hover:bg-[#D4A853]/15"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-mono text-xs w-6 text-center font-bold">{item.qty}</span>
                            <button
                              onClick={() => handleIncQty(item.id)}
                              className="h-6 w-6 rounded bg-[#1e1106] border border-[#D4A853]/10 flex items-center justify-center text-[#D4A853] hover:bg-[#D4A853]/15"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteCartLine(item.id)}
                            className="text-[10px] text-red-400/40 hover:text-red-450 hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Billing totals section & checkout billing trigger (Bottom) */}
              <div className="p-4 bg-black/45 border-t border-[#D4A853]/15 space-y-3 shrink-0">
                
                {/* Promo list picker popup dropdown */}
                <div className="flex items-center justify-between bg-[#210e01]/40 border border-[#D4A853]/10 px-3 py-2 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="font-medium">
                      {selectedDiscount ? selectedDiscount.name : "Kupon & Voucher Diskon"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedDiscount && (
                      <button
                        onClick={() => setSelectedDiscount(null)}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Batal
                      </button>
                    )}
                    <select
                      value={selectedDiscount ? selectedDiscount.id : ""}
                      onChange={(e) => {
                        const match = discounts.find(d => d.id === e.target.value);
                        if (match) handleSelectDiscount(match);
                        else setSelectedDiscount(null);
                      }}
                      className="bg-transparent focus:outline-none text-[#D4A853] font-semibold text-xs text-right cursor-pointer"
                    >
                      <option value="">-- Terapkan Promo --</option>
                      {discounts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-amber-100/50">
                    <span>Subtotal</span>
                    <span>Rp {cartSubtotal.toLocaleString("id-ID")}</span>
                  </div>
                  {appliedDiscountValue > 0 && (
                    <div className="flex items-center justify-between text-emerald-400 font-semibold">
                      <span>Diskon ({selectedDiscount?.name.split("(")[1]?.split(")")[0] || "Promo"})</span>
                      <span>- Rp {appliedDiscountValue.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-amber-100/50">
                    <span>Pajak (PPN 10%)</span>
                    <span>Rp {calculatedTax.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#D4A853]/10 text-sm font-bold text-amber-50">
                    <span>TOTAL TAGIHAN</span>
                    <span className="text-[#D4A853] text-base font-serif">Rp {calculatedTotal.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <button
                  onClick={handleProcessOrderSubmit}
                  disabled={cart.length === 0}
                  className="w-full bg-[#D4A853] hover:bg-[#bda148] disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-[#140700] py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-1"
                >
                  <CreditCard className="h-4 w-4" />
                  BAYAR SEKARANG ({cart.reduce((s, i) => s + i.qty, 0)} Items)
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 3: TABLE MANAGEMENT */}
        {activeSection === "tables" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-amber-100">Visual Layout Meja & Status FOH</h2>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Available</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400"></span> Occupied</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-300"></span> Reserved</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-400"></span> Cleaning</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tablesList.map((tbl) => {
                const colStyle = getTableColor(tbl.status as "Available" | "Occupied" | "Reserved" | "Cleaning");
                return (
                  <div
                    key={tbl.id}
                    className={`border p-5 rounded-2xl flex flex-col justify-between h-36 ${colStyle} transition-all duration-300 shadow`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">🪑</span>
                        <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold font-mono tracking-wider bg-black/35">
                          {tbl.status}
                        </span>
                      </div>
                      <h4 className="font-serif text-base font-bold text-amber-50 mt-4 leading-tight">{tbl.name}</h4>
                    </div>

                    <div className="flex items-center gap-1 pt-1 mt-1 border-t border-white/5">
                      <select
                        value={tbl.status}
                        onChange={(e) => {
                          const updated = tablesList.map(t => t.id === tbl.id ? { ...t, status: e.target.value as any } : t);
                          setTablesList(updated);
                          // Auto sync back to global state
                          const nextState = {
                            ...state,
                            fohTables: updated.map(t => ({
                              ...t,
                              status: (t.status === "Cleaning" ? "Cleaning Needed" : t.status) as "Available" | "Occupied" | "Reserved" | "Cleaning Needed"
                            }))
                          };
                          syncState(nextState);
                          inform(`✓ Status ${tbl.name} diubah ke: ${e.target.value}`);
                        }}
                        className="bg-black/40 border-0 rounded text-[10px] text-amber-100 px-1 py-0.5 focus:outline-none"
                      >
                        <option value="Available">Available</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Reserved">Reserved</option>
                        <option value="Cleaning">Cleaning</option>
                      </select>

                      <button
                        onClick={() => handleSelectTable(tbl.name, tbl.id)}
                        className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded cursor-pointer font-bold uppercase tracking-tight"
                      >
                        POS Order
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* SECTION 4: CUSTOMER DATABASE & LOYALTY */}
        {activeSection === "customers" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Quick adding form */}
            <div className="lg:col-span-4 bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-5 shadow h-fit">
              <h3 className="font-serif text-lg font-bold text-amber-100 mb-4">Registrasi Anggota Loyalitas</h3>
              <form onSubmit={handleAddNewCustomer} className="space-y-3.5">
                <div>
                  <label className="text-[10px] block opacity-50 uppercase font-mono mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={custNameInput}
                    onChange={(e) => setCustNameInput(e.target.value)}
                    className="w-full bg-[#1c0f04] border border-[#D4A853]/20 rounded-lg p-2.5 text-xs text-amber-100 focus:outline-none focus:border-[#D4A853]"
                  />
                </div>
                <div>
                  <label className="text-[10px] block opacity-50 uppercase font-mono mb-1">Nomor HP (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxxx"
                    value={custPhoneInput}
                    onChange={(e) => setCustPhoneInput(e.target.value)}
                    className="w-full bg-[#1c0f04] border border-[#D4A853]/20 rounded-lg p-2.5 text-xs text-amber-100 focus:outline-none focus:border-[#D4A853]"
                  />
                </div>
                <div>
                  <label className="text-[10px] block opacity-50 uppercase font-mono mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={custEmailInput}
                    onChange={(e) => setCustEmailInput(e.target.value)}
                    className="w-full bg-[#1c0f04] border border-[#D4A853]/20 rounded-lg p-2.5 text-xs text-amber-100 focus:outline-none focus:border-[#D4A853]"
                  />
                </div>
                <div>
                  <label className="text-[10px] block opacity-50 uppercase font-mono mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={custBdayInput}
                    onChange={(e) => setCustBdayInput(e.target.value)}
                    className="w-full bg-[#1c0f04] border border-[#D4A853]/20 rounded-lg p-2.5 text-xs text-amber-100 focus:outline-none focus:border-[#D4A853]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#D4A853] hover:bg-[#b38e46] text-[#140700] py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Plus className="h-4 w-4" />
                  Daftarkan Anggota Baru
                </button>
              </form>
            </div>

            {/* Loyalty list database view */}
            <div className="lg:col-span-8 bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-5 shadow">
              <h3 className="font-serif text-lg font-bold text-amber-100 mb-4">Database & Klasifikasi Anggota</h3>
              <div className="space-y-3 overflow-y-auto max-h-[480px] custom-scrollbar">
                {customers.map((c) => {
                  const tier = computeLoyaltyTier(c.visitCount, c.totalSpending);
                  const tierCol = getTierColor(tier);
                  const pointRewardEarned = c.points;
                  
                  return (
                    <div
                      key={c.id}
                      className="bg-black/25 p-4 rounded-xl border border-[#D4A853]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-amber-100">{c.name}</h4>
                          <span className={`text-[9px] px-2 py-0.2 rounded border font-bold font-mono uppercase shrink-0 ${tierCol}`}>
                            {tier} MEMBER
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[10px] text-amber-100/40 mt-1.5 font-mono">
                          <span>HP: {c.phone}</span>
                          <span>Email: {c.email}</span>
                          <span>Bday: {c.birthday}</span>
                        </div>
                      </div>

                      <div className="text-right sm:self-center">
                        <div className="text-xs font-semibold text-amber-200">
                          Total Spending: Rp {c.totalSpending.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-amber-100/40 mt-1">
                          Visits: <span className="text-amber-100 font-bold">{c.visitCount} Kali</span> • Poin:{" "}
                          <span className="text-emerald-400 font-bold">{pointRewardEarned} QP</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCust(c);
                            setActiveSection("pos");
                            inform(`✓ ${c.name} dipilih untuk Transaksi POS.`);
                          }}
                          className="bg-[#D4A853]/10 hover:bg-[#D4A853] hover:text-black border border-[#D4A853]/25 text-[#D4A853] font-bold text-[10px] px-3 py-1 rounded mt-2.5 tracking-tight transition cursor-pointer"
                        >
                          Pilih untuk Order
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 5: PANDA BLUETOOTH PRINTER MANAGEMENT */}
        {activeSection === "printer" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-6 shadow space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#D4A853]/10 pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-amber-100 uppercase tracking-tight">Katalog & Scanner Bluetooth Thermal</h3>
                  <p className="text-xs text-amber-100/40 mt-0.5">Sambungkan printer struk Panda 58mm/80mm atau printer bar barista.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleScanBTPrinters}
                    disabled={isScanning}
                    className="bg-[#D4A853] hover:bg-[#bd933f] text-black px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow"
                  >
                    <RefreshCw className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
                    {isScanning ? "Mencari Printer..." : "Scan Nearby Printer"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncDevices}
                    className="bg-[#D4A853]/10 hover:bg-[#D4A853]/20 border border-[#D4A853]/30 text-[#D4A853] px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    🔄 Sync Cloud
                  </button>
                </div>
              </div>

              {/* Grid of printers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {printers.map((p) => (
                  <div
                    key={p.id}
                    className={`bg-black/35 border p-5 rounded-2xl flex flex-col justify-between h-52 transition ${
                      p.connected
                        ? "border-[#D4A853] ring-1 ring-[#D4A853]/25 scale-[1.01]"
                        : "border-[#D4A853]/15 hover:border-[#D4A853]/35"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Printer className="h-5 w-5 text-[#D4A853]" />
                          <h4 className="font-semibold text-amber-50">{p.name}</h4>
                        </div>
                        <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
                          p.connected ? "bg-emerald-500/15 text-emerald-400" : "bg-neutral-800 text-neutral-400"
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 mt-4 text-xs font-mono text-amber-100/60 leading-relaxed">
                        <span>Tipe: {p.type.toUpperCase()}</span>
                        <span>Baterai: {p.battery}%</span>
                        <span>Lebar: {p.size}</span>
                        <span>Status: <span className="text-amber-400 font-bold">READY</span></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-white/5">
                      {p.connected ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRestartPrinter(p.id)}
                            className="text-[10px] bg-red-950/30 text-red-400 hover:bg-neutral-800 border border-red-500/15 font-bold px-2.5 py-1.5 rounded cursor-pointer uppercase font-mono"
                          >
                            Restart
                          </button>
                          <button
                            type="button"
                            onClick={handleTestPrintPage}
                            className="text-[10px] bg-[#D4A853]/10 text-[#D4A853] hover:bg-[#D4A853]/20 font-bold px-3 py-1.5 rounded cursor-pointer uppercase tracking-tight"
                          >
                            Test Page
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDisconnectPrinter(p.id)}
                            className="text-[10px] text-red-400 hover:underline font-bold font-mono cursor-pointer"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConnectPrinter(p.id)}
                          className="text-[10px] bg-[#D4A853] text-[#140700] hover:bg-[#bc943d] font-bold px-4 py-1.5 rounded cursor-pointer uppercase tracking-tight"
                        >
                          Connect Printer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Printing Queue Diagnostics */}
              <div className="bg-[#1a0f02]/30 p-4 rounded-xl border border-[#D4A853]/10 font-mono text-xs space-y-1">
                <div className="text-amber-300 font-bold flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  <span>Diagnostics Log Passthrough / Virtual Print Server</span>
                </div>
                <div className="text-amber-150/40">Antrean Cetak Jaringan Bluetooth: [Active / No Packet Loss]</div>
                <div className="text-amber-150/40">Output Cetak Terakhir: <span className="text-amber-100 font-bold">{lastPrintLog}</span></div>
              </div>
            </div>

            {/* ── POS DEVICE SYSTEMS REGISTER (CRUD PANEL) ── */}
            <div className="bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-6 shadow space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D4A853]/10 pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-amber-100 uppercase tracking-tight flex items-center gap-2">
                    <Tablet className="h-5 w-5 text-[#D4A853]" />
                    POS Station & Device Terminal Registry
                  </h3>
                  <p className="text-xs text-amber-100/40 mt-0.5">Edit, tambah, dan sinkronisasikan Android Handheld, iPad POS, maupun terminal kasir.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddDevice}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>✚</span> Tambah Device POS
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] text-[#D4A853] uppercase font-mono font-bold tracking-wider">
                      <th className="py-2.5">ID Device</th>
                      <th>Nama Perangkat</th>
                      <th>Station Lokasi</th>
                      <th>Operator</th>
                      <th>Baterai</th>
                      <th>Firmware</th>
                      <th>Status</th>
                      <th className="text-right">Aksi Manajemen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-amber-100/80">
                    {devices.map((dev) => (
                      <tr key={dev.id} className="hover:bg-white/5">
                        <td className="py-3 font-mono font-bold text-amber-50">{dev.id}</td>
                        <td className="font-semibold">{dev.name}</td>
                        <td>{dev.assignedStation}</td>
                        <td className="font-mono text-amber-150/60">{dev.assignedUser}</td>
                        <td className="font-mono">
                          <div className="flex items-center gap-1">
                            <span className={`inline-block h-2 w-4 rounded-sm border ${dev.battery > 50 ? "bg-emerald-500 border-emerald-400" : "bg-amber-500 border-amber-400"}`}></span>
                            <span>{dev.battery}%</span>
                          </div>
                        </td>
                        <td className="font-mono text-amber-300">{dev.firmware}</td>
                        <td>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${
                            dev.status === "Online" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20" : "bg-neutral-800 text-neutral-400"
                          }`}>
                            {dev.status}
                          </span>
                        </td>
                        <td className="text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleTriggerDeviceDiagnostics(dev.id)}
                            className="text-[10px] text-[#D4A853] hover:underline cursor-pointer"
                            title="Diagnosa Hardware"
                          >
                            Diagnose
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerFirmwareUpdate(dev.id)}
                            className="text-[10px] text-amber-300/80 hover:underline cursor-pointer font-bold"
                            title="Update OTA Firmware"
                          >
                            OTA Update
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditDevice(dev)}
                            className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDeviceSequence(dev)}
                            className="text-[10px] text-red-500 hover:underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── PRINTER CONNECTIVITY INCIDENT EVENT LOGS ── */}
            <div className="bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-6 shadow space-y-4">
              <div>
                <h3 className="font-serif text-base font-bold text-amber-100 flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#D4A853]" />
                  Printer Hardware Logs & Cloud Sync Trace
                </h3>
                <p className="text-xs text-amber-100/40 mt-0.5">Riwayat realtime pemicuan thermal printer, laci kas, serta log penyingkronan fisik.</p>
              </div>

              <div className="bg-black/55 rounded-xl border border-white/5 p-4 space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
                {printerLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-start hover:bg-neutral-905 p-1 rounded">
                    <div className="flex gap-2">
                      <span className="text-[#D4A853]">[{log.timestamp}]</span>
                      <span className="text-amber-100/40">[{log.printerId}]</span>
                      <span className="text-amber-50">{log.message}</span>
                    </div>
                    <span className={`font-bold uppercase text-[9px] px-1.5 py-0.2 rounded ${
                      log.status === "Success" ? "text-emerald-400 bg-emerald-950/20" : "text-red-400 bg-red-950/20"
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 6: SHIFT DRAWER RECONCILE */}
        {activeSection === "shift" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Shift Summary Data */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Panel - Active Cash Drawer Balance Form */}
              <div className="lg:col-span-4 bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-5 shadow h-fit space-y-4">
                <div className="flex items-center gap-2 border-b border-[#D4A853]/10 pb-2">
                  <Briefcase className="h-5 w-5 text-[#D4A853]" />
                  <h3 className="font-serif text-base font-bold text-amber-100">Laci Kas & Tutup Shift</h3>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-amber-100/60">
                    <span>Modal Awal Shift:</span>
                    <span className="font-mono font-bold text-amber-100">Rp {shiftState.cashOpening.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-100/60 mt-1">
                    <span>Penjualan Tunai (Cash):</span>
                    <span className="font-mono font-bold text-amber-100">Rp {shiftState.cashSales.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-100/60 mt-1">
                    <span>Penjualan Non-Tunai:</span>
                    <span className="font-mono font-bold text-amber-100">Rp {shiftState.nonCashSales.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-100/60 mt-1">
                    <span>Total Refund:</span>
                    <span className="font-mono font-bold text-red-400">Rp {shiftState.refundsAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-100/60 mt-1">
                    <span>Total Void:</span>
                    <span className="font-mono font-bold text-red-500">Rp {shiftState.voidAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-100 font-bold border-t border-[#D4A853]/10 pt-2 text-sm mt-2">
                    <span>SALDO CASH DIHARAPKAN:</span>
                    <span className="font-mono text-[#D4A853]">
                      Rp {(shiftState.cashOpening + shiftState.cashSales - shiftState.refundsAmount - shiftState.voidAmount).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {shiftState.isShiftActive ? (
                  <div className="pt-2 border-t border-[#D4A853]/10 space-y-3">
                    <div className="bg-[#170a00]/50 p-3 rounded-lg border border-[#D4A853]/10 space-y-2">
                      <label className="text-[10px] block opacity-50 uppercase font-mono">Uang Cash Riil di Laci (Actual Cash)</label>
                      <input
                        type="number"
                        placeholder="Masukkan nominal uang di laci"
                        value={shiftState.cashClosingActual || ""}
                        onChange={(e) => setShiftState({ ...shiftState, cashClosingActual: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black/60 border border-[#D4A853]/20 rounded p-2 text-xs font-mono text-amber-100"
                      />
                    </div>
                    <button
                      onClick={() => handleTriggerCloseShift(shiftState.cashClosingActual, "Penutupan Kasir Harian")}
                      className="w-full bg-[#D4A853] hover:bg-[#b58e3e] text-[#140700] py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow"
                    >
                      Audit & Tutup Shift Sekarang
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setOpeningModal(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Buka Shift Baru
                  </button>
                )}
              </div>

              {/* Right Panel - Shift audit logs and excel simulation */}
              <div className="lg:col-span-8 bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-5 shadow space-y-4">
                <div className="flex items-center justify-between border-b border-[#D4A853]/10 pb-2">
                  <h3 className="font-serif text-base font-bold text-amber-100">Riwayat Penutupan Shift Laci Kasir</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => inform("Excel report exported!")}
                      className="text-[10px] bg-[#D4A853]/10 text-[#D4A853] hover:bg-[#D4A853]/20 px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer font-bold font-mono"
                    >
                      <Download className="h-3 w-3" /> EXCEL
                    </button>
                    <button
                      onClick={() => inform("PDF Shift report downloaded!")}
                      className="text-[10px] bg-[#D4A853]/10 text-[#D4A853] hover:bg-[#D4A853]/20 px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer font-bold font-mono"
                    >
                      <Download className="h-3 w-3" /> PDF
                    </button>
                  </div>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[380px] custom-scrollbar">
                  {shiftState.history?.map((h, i) => (
                    <div
                      key={i}
                      className="bg-black/35 p-4 rounded-xl border border-[#D4A853]/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#D4A853]">{h.cashierName}</span>
                          <span className="text-[10px] text-amber-100/40">[{h.openedAt} sampai {h.closedAt}]</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1 gap-x-4 mt-2 font-mono text-[11px] text-amber-150/60 leading-relaxed">
                          <span>Modal: Rp {h.opening.toLocaleString("id-ID")}</span>
                          <span>Diharapkan: Rp {h.expected.toLocaleString("id-ID")}</span>
                          <span>Actual Cash: Rp {h.actual.toLocaleString("id-ID")}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] block text-amber-100/40 uppercase font-mono">Selisih Kas</span>
                        <span className={`text-sm font-mono font-bold ${h.difference >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {h.difference >= 0 ? "+" : ""}
                          Rp {h.difference.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] block opacity-50 font-mono mt-0.5">Audit Sukses</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 7: MANAGER ANALYTICS */}
        {activeSection === "analytics" && (actualRole === "Owner" || actualRole === "Manager") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Live Analytics Command Center (Visible to Manager/Owner only) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Peak hours & best sellers columns list (Left) */}
              <div className="lg:col-span-8 bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-5 shadow space-y-4">
                <div className="flex items-center justify-between border-b border-[#D4A853]/10 pb-2">
                  <h3 className="font-serif text-base font-bold text-amber-100">Live Sales Analytics</h3>
                  <span className="text-[10px] bg-[#D4A853]/15 text-[#D4A853] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold animate-pulse">
                    Live Channel OK
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#1a0f02]/30 p-4 rounded-xl border border-[#D4A853]/10">
                    <span className="text-[10px] opacity-40 uppercase font-mono">Peak hour (Jam Padat)</span>
                    <span className="text-lg font-bold text-amber-50 mt-1 block">15:00 - 18:00</span>
                    <span className="text-[10px] text-amber-300 block mt-1 font-mono">Volume Sore hari</span>
                  </div>
                  <div className="bg-[#1a0f02]/30 p-4 rounded-xl border border-[#D4A853]/10">
                    <span className="text-[10px] opacity-40 uppercase font-mono">Rata-rata Tiket (AOV)</span>
                    <span className="text-lg font-bold text-amber-50 mt-1 block">Rp 56.500</span>
                    <span className="text-[10px] text-emerald-400 block mt-1 font-mono">Upgrade add-on +12%</span>
                  </div>
                  <div className="bg-[#1a0f02]/30 p-4 rounded-xl border border-[#D4A853]/10">
                    <span className="text-[10px] opacity-40 uppercase font-mono">Pertumbuhan Harian</span>
                    <span className="text-lg font-bold text-emerald-400 mt-1 block">+8.4% MoM</span>
                    <span className="text-[10px] text-amber-100/40 block mt-1 font-mono">Lebih tinggi vs Mei</span>
                  </div>
                </div>

                {renderInteractiveSalesChart()}
              </div>

              {/* Best seller Menu items list (Right) */}
              <div className="lg:col-span-4 bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-5 shadow space-y-4">
                <h3 className="font-serif text-base font-bold text-amber-100">Top Best Selling Items</h3>
                <div className="space-y-3">
                  {[
                    { rank: 1, name: "Caffe Latte Full Cream", count: 420 },
                    { rank: 2, name: "Cappuccino Special", count: 310 },
                    { rank: 3, name: "Butter Croissant", count: 280 },
                    { rank: 4, name: "Kyoto Uji Matcha Latte", count: 195 },
                    { rank: 5, name: "Beef Carbonara Pasta", count: 112 }
                  ].map((it, idx) => (
                    <div key={idx} className="bg-black/25 p-3 rounded-lg flex items-center justify-between text-xs border border-[#D4A853]/5 font-mono">
                      <div className="flex items-center gap-2.5">
                        <span className="h-5 w-5 bg-[#D4A853]/10 border border-[#D4A853]/25 rounded flex items-center justify-center text-[10px] text-[#D4A853] font-bold">
                          #{it.rank}
                        </span>
                        <span className="text-amber-100 truncate max-w-40 font-semibold">{it.name}</span>
                      </div>
                      <span className="text-amber-300 font-bold">{it.count} Sold</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 8: KITCHEN DISPLAY SYSTEM (KDS) */}
        {activeSection === "kds" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-6 shadow space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#D4A853]/10 pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-amber-100 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A853] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4A853]"></span>
                    </span>
                    Kitchen Display System (KDS) Monitor
                  </h3>
                  <p className="text-xs text-amber-100/40 mt-0.5">Pantau dan kelola antrean antaran kopi (Barista) & makanan (Kitchen) secara realtime.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const mockOrderNo = `TX-${Math.floor(2053 + Math.random() * 100)}`;
                      const targetTable = `Meja ${Math.floor(1 + Math.random() * 8)}`;
                      const newKdsId = `q-${Date.now()}`;
                      const hasF = Math.random() > 0.5;
                      const hasB = Math.random() > 0.3;
                      const fItems = hasF ? [{ name: "Beef Carbonara Pasta", qty: 1 }] : [];
                      const bItems = hasB ? [{ name: "Caffe Latte Full Cream", qty: 1 }] : [];
                      const items = [...fItems, ...bItems];
                      if (items.length === 0) items.push({ name: "Americano Hot / Ice", qty: 1 });
                      const newKds = {
                        id: newKdsId,
                        orderNo: mockOrderNo,
                        table: targetTable,
                        items,
                        type: hasF && hasB ? "Barista & Kitchen" : hasF ? "Kitchen" : "Barista",
                        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                        status: "pending",
                        isNew: true
                      };
                      setKdsQueue([newKds, ...kdsQueue]);
                      if (pluginSettings.kitchenDisplay.soundNotification) {
                        inform("🔔 Suara Notifikasi Order Baru Berbunyi!");
                      }
                      inform(`✓ Order Baru ${mockOrderNo} masuk ke KDS!`);
                      writeAuditLog(`Simulated new incoming order registered in KDS queue`);
                    }}
                    className="bg-[#D4A853]/10 hover:bg-[#D4A853]/20 border border-[#D4A853]/40 text-[#D4A853] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    🚀 Terima Simulasi Customer Order Golem
                  </button>
                  <button
                    onClick={() => {
                      setKdsQueue(kdsQueue.map(q => ({ ...q, isNew: false })));
                      inform("Semua order ditandai dibaca.");
                    }}
                    className="text-[11px] bg-neutral-950 text-amber-100/65 font-bold border border-white/5 px-2.5 py-1.5 rounded-lg hover:text-amber-100 cursor-pointer"
                  >
                    Mark All Seen
                  </button>
                </div>
              </div>

              {/* KDS Columns based on status */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {["pending", "preparing", "completed", "served"].map((colStatus) => {
                  const filteredList = kdsQueue.filter(q => q.status === colStatus);
                  const colTitles: any = {
                    pending: { title: "Daftar Antrean Bar/Kitchen", color: "border-red-500/20 text-red-400 bg-red-950/10" },
                    preparing: { title: "Sedang Dikerjakan/Brewing", color: "border-amber-500/20 text-amber-400 bg-amber-950/10" },
                    completed: { title: "Selesai Siap Diantar", color: "border-emerald-500/20 text-emerald-400 bg-emerald-950/10" },
                    served: { title: "Telah Disajikan ke Meja", color: "border-neutral-800 text-neutral-400 bg-neutral-950/10" }
                  };
                  return (
                    <div key={colStatus} className="bg-black/40 border border-white/5 rounded-xl p-4 font-sans flex flex-col h-[520px]">
                      <div className={`p-2 rounded-lg border text-center font-bold text-xs ${colTitles[colStatus].color} mb-3 flex items-center justify-between`}>
                        <span>{colTitles[colStatus].title}</span>
                        <span className="font-mono text-[10px] bg-neutral-800 px-2 py-0.5 rounded-full text-white">{filteredList.length}</span>
                      </div>

                      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                        {filteredList.length === 0 ? (
                          <div className="text-center py-8 text-[11px] text-amber-100/10 font-medium">Empty Queue</div>
                        ) : (
                          filteredList.map((item) => (
                            <div
                              key={item.id}
                              className={`p-3 rounded-xl border relative transition ${
                                item.isNew
                                  ? "border-red-500 bg-red-950/15 animate-pulse"
                                  : item.status === "preparing"
                                  ? "border-[#D4A853]/40 bg-neutral-900/60"
                                  : item.status === "completed"
                                  ? "border-emerald-500/40 bg-emerald-950/5"
                                  : "border-white/5 bg-neutral-950/40 opacity-75"
                              }`}
                            >
                              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2">
                                <span className="font-mono text-xs font-bold text-amber-50">{item.orderNo}</span>
                                <span className="font-bold text-[10px] bg-[#D4A853]/15 text-[#D4A853] px-2 py-0.5 rounded-full">{item.table}</span>
                              </div>

                              <ul className="space-y-1.5 text-xs text-amber-100/75 font-sans mb-3">
                                {item.items.map((it: any, itIdx: number) => (
                                  <li key={itIdx} className="flex justify-between font-medium">
                                    <span>• {it.name}</span>
                                    <span className="font-mono text-[#D4A853] font-bold">x{it.qty}</span>
                                  </li>
                                ))}
                              </ul>

                              <div className="flex items-center justify-between text-[10px] text-amber-100/35 font-mono">
                                <span>{item.timestamp} wib</span>
                                <span className="uppercase text-[9px] font-bold text-white bg-neutral-800 px-1.5 rounded">{item.type}</span>
                              </div>

                              {/* Interactive Action Buttons */}
                              <div className="flex items-center justify-end gap-1 border-t border-white/5 pt-2.5 mt-2.5">
                                {item.status === "pending" && (
                                  <button
                                    onClick={() => {
                                      setKdsQueue(kdsQueue.map(q => q.id === item.id ? { ...q, status: "preparing", isNew: false } : q));
                                      inform(`✓ Order ${item.orderNo} mulai dikerjakan.`);
                                    }}
                                    className="bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-black py-1 px-2.5 rounded font-bold text-[9px] uppercase cursor-pointer"
                                  >
                                    Brew / Cook
                                  </button>
                                )}
                                {item.status === "preparing" && (
                                  <button
                                    onClick={() => {
                                      setKdsQueue(kdsQueue.map(q => q.id === item.id ? { ...q, status: "completed" } : q));
                                      inform(`✓ Order ${item.orderNo} siap diantar!`);
                                    }}
                                    className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black py-1 px-2.5 rounded font-bold text-[9px] uppercase cursor-pointer"
                                  >
                                    Done
                                  </button>
                                )}
                                {item.status === "completed" && (
                                  <button
                                    onClick={() => {
                                      setKdsQueue(kdsQueue.map(q => q.id === item.id ? { ...q, status: "served" } : q));
                                      inform(`✓ Order ${item.orderNo} selesai disajikan ke meja.`);
                                    }}
                                    className="bg-slate-500/10 text-slate-300 border border-slate-500/30 hover:bg-slate-500 hover:text-black py-1 px-2.5 rounded font-bold text-[9px] uppercase cursor-pointer"
                                  >
                                    Serve
                                  </button>
                                )}
                                {item.status === "served" && (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 font-mono">
                                    ✓ Served
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 9: ENTERPRISE ROADMAP PLUGINS */}
        {activeSection === "plugins" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-neutral-900 border border-[#D4A853]/15 rounded-xl p-6 shadow space-y-4">
              <div className="border-b border-[#D4A853]/10 pb-4">
                <h3 className="font-serif text-lg font-bold text-amber-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#D4A853]" />
                  Enterprise Plugins Integrator & Roadmap Settings
                </h3>
                <p className="text-xs text-amber-100/40 mt-0.5">Aktifkan dan edit variabel sistem pendukung masa depan Cafe CoffeeOps.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* PLUGIN A: WhatsApp Invoice */}
                <div className="bg-[#140700] rounded-xl p-5 border border-[#D4A853]/15 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💬</span>
                      <div>
                        <h4 className="font-semibold text-amber-50 text-sm">A. WhatsApp Digital Invoice</h4>
                        <p className="text-[10px] text-amber-100/50">Kirim struk digital otomatis ke HP pelanggan via WA Gateway.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pluginSettings.whatsappInvoice.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...pluginSettings,
                            whatsappInvoice: { ...pluginSettings.whatsappInvoice, enabled: e.target.checked }
                          };
                          setPluginSettings(updated);
                          parentSyncEnterprise(devices, receiptSettings, updated);
                          inform(`✓ WhatsApp Invoice: ${e.target.checked ? "ENABLED" : "DISABLED"}`);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4A853]"></div>
                    </label>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-black/35 p-3 rounded-lg border border-white/5 space-y-1">
                      <label className="text-[9px] text-[#D4A853] block uppercase font-mono font-bold">Template Pesan WhatsApp</label>
                      <textarea
                        rows={3}
                        value={pluginSettings.whatsappInvoice.messageTemplate}
                        onChange={(e) => {
                          const updated = {
                            ...pluginSettings,
                            whatsappInvoice: { ...pluginSettings.whatsappInvoice, messageTemplate: e.target.value }
                          };
                          setPluginSettings(updated);
                          parentSyncEnterprise(devices, receiptSettings, updated);
                        }}
                        className="w-full bg-transparent border-0 text-amber-100 focus:ring-0 focus:outline-none font-sans text-[11px]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: 08123456789"
                        id="demo-wa-phone"
                        className="flex-1 bg-black/40 border border-white/5 p-2 rounded text-xs text-amber-100 font-mono"
                      />
                      <button
                        onClick={() => {
                          const val = (document.getElementById("demo-wa-phone") as HTMLInputElement)?.value || "08123456789";
                          inform(`✓ WhatsApp demo Invoice terkirim ke: ${val}!`);
                          writeAuditLog(`Manually pushed simulated WhatsApp invoice SMS message check to: ${val}`);
                        }}
                        className="bg-[#D4A853]/15 border border-[#D4A853]/55 hover:bg-[#D4A853]/25 text-[#D4A853] font-bold py-2 px-3 rounded text-[11px] transition cursor-pointer"
                      >
                        Kirim Demo WA
                      </button>
                    </div>
                  </div>
                </div>

                {/* PLUGIN B: Midtrans Dynamic QRIS */}
                <div className="bg-[#140700] rounded-xl p-5 border border-[#D4A853]/15 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💳</span>
                      <div>
                        <h4 className="font-semibold text-amber-50 text-sm">B. Midtrans Dynamic QRIS</h4>
                        <p className="text-[10px] text-amber-100/50">Auto-generate QRIS dinamis per transaksi dengan deteksi paid instan.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pluginSettings.midtransQris.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...pluginSettings,
                            midtransQris: { ...pluginSettings.midtransQris, enabled: e.target.checked }
                          };
                          setPluginSettings(updated);
                          parentSyncEnterprise(devices, receiptSettings, updated);
                          inform(`✓ Midtrans Dynamic QRIS: ${e.target.checked ? "ENABLED" : "DISABLED"}`);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4A853]"></div>
                    </label>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/45 p-2.5 rounded border border-white/5">
                        <span className="text-[9px] text-[#D4A853] block uppercase font-mono font-bold">API Key (Midtrans)</span>
                        <input
                          type="password"
                          value={pluginSettings.midtransQris.apiKey}
                          onChange={(e) => {
                            const updated = {
                              ...pluginSettings,
                              midtransQris: { ...pluginSettings.midtransQris, apiKey: e.target.value }
                            };
                            setPluginSettings(updated);
                            parentSyncEnterprise(devices, receiptSettings, updated);
                          }}
                          className="bg-transparent border-0 text-amber-100 focus:outline-none focus:ring-0 text-xs w-full font-mono mt-1"
                        />
                      </div>
                      <div className="bg-black/45 p-2.5 rounded border border-white/5">
                        <span className="text-[9px] text-[#D4A853] block uppercase font-mono font-bold">Expired (Menit)</span>
                        <input
                          type="number"
                          value={pluginSettings.midtransQris.expiredMinutes}
                          onChange={(e) => {
                            const updated = {
                              ...pluginSettings,
                              midtransQris: { ...pluginSettings.midtransQris, expiredMinutes: parseInt(e.target.value) || 15 }
                            };
                            setPluginSettings(updated);
                            parentSyncEnterprise(devices, receiptSettings, updated);
                          }}
                          className="bg-transparent border-0 text-amber-100 focus:outline-none focus:ring-0 text-xs w-full font-mono mt-1"
                        />
                      </div>
                    </div>

                    <div className="bg-black/40 p-2.5 rounded border border-white/5 text-[10px] font-mono text-amber-100/50 space-y-1">
                      <div className="text-amber-200 font-bold uppercase tracking-wider text-[9px]">Log Webhook Callback Simulator</div>
                      <div>[2026-06-03 10:14:15] Webhook payment_type QRIS status: SETTLEMENT. Status disinkronkan.</div>
                    </div>
                  </div>
                </div>

                {/* PLUGIN C: Self-Order QR Menu */}
                <div className="bg-[#140700] rounded-xl p-5 border border-[#D4A853]/15 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📱</span>
                      <div>
                        <h4 className="font-semibold text-amber-50 text-sm">C. Self-Order QR Menu</h4>
                        <p className="text-[10px] text-amber-100/50">Pelanggan memindai QR meja untuk melihat menu, memesan & bayar langsung.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pluginSettings.selfOrder.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...pluginSettings,
                            selfOrder: { ...pluginSettings.selfOrder, enabled: e.target.checked }
                          };
                          setPluginSettings(updated);
                          parentSyncEnterprise(devices, receiptSettings, updated);
                          inform(`✓ Self-Order QR Menu: ${e.target.checked ? "ENABLED" : "DISABLED"}`);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4A853]"></div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] text-amber-300 font-mono font-bold block uppercase tracking-wider">Antrean Pesanan Masuk (QR Menu Tamu)</span>
                    
                    <div className="space-y-2">
                      {selfOrders.length === 0 ? (
                        <div className="text-center py-4 text-xs text-amber-100/10 font-bold border border-dashed border-white/5 rounded-lg">Tidak ada antrean order tamu masuk</div>
                      ) : (
                        selfOrders.map((so) => (
                          <div key={so.id} className="bg-black/50 border border-white/5 rounded-xl p-3 flex flex-col justify-between md:flex-row gap-2 leading-relaxed text-xs">
                            <div className="space-y-1 w-full md:w-auto">
                              <div className="flex items-center gap-1.5 font-bold text-amber-50">
                                <span className="bg-[#D4A853]/15 text-[#D4A853] px-2 py-0.5 rounded text-[10px] uppercase font-mono">{so.table}</span>
                                <span className="text-[10px] text-amber-100/40 font-mono">({so.time})</span>
                              </div>
                              <p className="text-[11px] text-amber-100/60 font-mono truncate max-w-xs">{so.items}</p>
                              <span className="block font-mono font-bold text-amber-400">Rp {so.subtotal.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleDeclineSelfOrder(so.id)}
                                className="text-[10px] text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded py-1 px-2 cursor-pointer font-bold transition font-mono uppercase"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleAcceptSelfOrder(so)}
                                className="text-[10px] bg-emerald-600 text-white hover:bg-emerald-700 rounded py-1 px-2 cursor-pointer font-bold transition font-mono uppercase"
                              >
                                Accept & Send
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* DB TOOLS: Backup, Restore & Multioutlet */}
                <div className="bg-[#140700] rounded-xl p-5 border border-[#D4A853]/15 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
                      <span className="text-xl">🗄️</span>
                      <div>
                        <h4 className="font-semibold text-amber-50 text-sm">Enterprise DB Backup & Sync</h4>
                        <p className="text-[10px] text-amber-100/50">Lakukan backup terenkripsi, restore snapshot, dan kelola sinkronisasi multi-toko.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleBackupDatabase}
                        disabled={isBackingUp}
                        className="bg-[#D4A853]/14 hover:bg-[#D4A853]/25 border border-[#D4A853]/55 text-[#D4A853] font-bold p-3 rounded-lg text-xs transition cursor-pointer flex flex-col items-center justify-center gap-1.5"
                      >
                        <span>💾</span>
                        <span>{isBackingUp ? "Backing up..." : "Backup Database Manual"}</span>
                      </button>
                      <button
                        onClick={handleRestoreBackup}
                        className="bg-black/40 hover:bg-black/60 border border-white/10 text-amber-100 font-bold p-3 rounded-lg text-xs transition cursor-pointer flex flex-col items-center justify-center gap-1.5"
                      >
                        <span>🔄</span>
                        <span>Restore Rollback Point</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#241a0e] border border-[#D4A853]/15 rounded-xl p-3.5 space-y-2">
                    <span className="text-[9px] text-[#D4A853] block uppercase font-mono font-bold">Outlet Identifier Target</span>
                    <div className="flex items-center justify-between text-xs text-amber-100 font-mono">
                      <span>Outlet ID: OUTLET-SUDIRMAN-01</span>
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">READY_SYNCED</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
        
        {/* ACCESS OVERLAY IF RESTRICTED IN EMULATION */}
        {!checkTabPermStatic(activeRole, activeSection) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-red-500/30 rounded-2xl p-12 text-center space-y-6 max-w-2xl mx-auto my-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-[#D4A853] to-red-600"></div>
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-950/40 border-2 border-[#D4A853]/50 text-[#D4A853] animate-bounce">
              <ShieldCheck className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold text-amber-50 tracking-tight">🔒 Akses Modul Terbatas</h3>
              <p className="text-sm text-[#D4A853] font-semibold font-mono tracking-wide">
                Role Emulasi: {activeRole.toUpperCase()} • Akses Ditolak
              </p>
              <p className="text-xs text-amber-100/40 max-w-sm mx-auto leading-relaxed">
                Modul <span className="font-bold text-amber-100">"{activeSection.toUpperCase()}"</span> memerlukan otorisasi tingkat tinggi (Owner / Manager). Silakan ubah switch "Role Emulasi" di atas untuk mensimulasikan otorisasi lain.
              </p>
            </div>

            <div className="bg-black/40 border border-[#D4A853]/15 rounded-xl p-4 text-left max-w-xs mx-auto space-y-3">
              <div className="text-[11px] font-mono font-bold text-amber-200 uppercase tracking-widest border-b border-[#D4A853]/10 pb-1.5 flex items-center justify-between">
                <span>Security Checker</span>
                <span className="text-[9px] bg-red-950 text-red-450 px-2 py-0.5 rounded">BLOCKED_STATE</span>
              </div>
              <ul className="text-[10px] space-y-1 text-amber-100/60 font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✖</span> Konfigurasi Outlet POS: <span className="text-red-400 font-bold">Blocked</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✖</span> Otorisasi Void / Refund: <span className="text-red-400 font-bold">Blocked</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✔</span> Pembacaan Queue KDS: <span className="text-emerald-400 font-bold">Allowed</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                setActiveRole("Owner");
                inform("👑 Emulasi Role dinaikkan ke tingkat Owner secara otomatis!");
                writeAuditLog(`Auto privilege bypass triggered: Switched role to Owner`);
              }}
              className="bg-[#D4A853] hover:bg-[#b08b3e] text-black font-bold px-6 py-2.5 rounded-xl text-xs transition duration-200 shadow-lg cursor-pointer transform hover:scale-[1.03]"
            >
              Ubah ke Emulator Owner 👑 (Full Access)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PLUGS FOR FUTURE INTEGRATION (BOTTOM DECORATIVE RAIL) ── */}
      <div className="bg-neutral-900 border border-[#D4A853]/10 rounded-xl p-5 mt-8 shadow-inner">
        <h4 className="font-serif text-sm font-bold text-amber-100 mb-3 flex items-center gap-1.5 leading-none">
          <Sparkles className="h-4 w-4 text-[#D4A853] shrink-0" />
          CoffeeOps POS Future Enterprise Plugs (Roadmap Integration)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          {[
            { label: "WhatsApp Invoice", desc: "Kirim PDF nota lewat WA API", checked: false },
            { label: "Midtrans Dynamic QRIS", desc: "Integrasi API QRIS otomatis", checked: false },
            { label: "Self-Order Menu (QR)", desc: "Metode pesan mandiri pelanggan", checked: false },
            { label: "Kitchen Display (KDS)", desc: "Modul monitor digital dapur/bar", checked: false }
          ].map((plug, i) => (
            <div key={i} className="bg-black/25 p-3 rounded-lg border border-[#D4A853]/5 relative overflow-hidden group">
              <span className="text-[10px] bg-red-400/10 text-red-500 rounded px-1.5 py-0.2 uppercase font-mono tracking-tight font-bold absolute top-2.5 right-2.5 scale-90">
                PLUG
              </span>
              <div className="text-xs font-bold text-[#D4A853] mt-2">{plug.label}</div>
              <div className="text-[10px] text-amber-100/40 mt-1 leading-snug">{plug.desc}</div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block"></span>
                <span className="text-[9px] text-amber-100/30 uppercase font-semibold font-mono">Tersedia di v3.0</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INTERACTIVE MODAL 1: OPENING SHIFT DRAWER ENTRY ── */}
      {openingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#140700] border border-[#D4A853]/35 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="text-center space-y-2">
              <span className="text-4xl">💰</span>
              <h3 className="font-serif text-lg font-bold text-amber-100">Buka Shift & Input Modal Awal</h3>
              <p className="text-xs text-amber-100/50">
                Input kas modal awal (&ldquo;floats&rdquo;) harian untuk pengembalian uang tunai di mesin kasir laci.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 p-3 rounded-xl border border-[#D4A853]/15 space-y-1">
                <label className="text-[9px] block text-[#D4A853] uppercase font-mono font-bold tracking-wider">Floating Float Cash (Rupiah)</label>
                <input
                  type="number"
                  value={modalOpeningVal}
                  onChange={(e) => setModalOpeningVal(e.target.value)}
                  className="w-full bg-transparent border-0 text-amber-100 focus:outline-none font-mono text-base font-bold"
                />
              </div>

              <button
                onClick={handleOpenShift}
                className="w-full bg-[#D4A853] hover:bg-[#b08b3e] text-black py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Play className="h-4 w-4" />
                Buka Shift Sekarang
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── INTERACTIVE MODAL 2: EDIT QUANTITY/NOTES/MODIFIERS FOR CART ── */}
      {activeModifyingItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-[#D4A853]/25 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-left"
          >
            <div className="flex items-center justify-between border-b border-[#D4A853]/10 pb-2">
              <h3 className="font-serif font-bold text-base text-amber-100">Atur Kustomisasi Menu</h3>
              <button onClick={() => setActiveModifyingItem(null)} className="text-amber-100/50 hover:text-amber-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#D4A853] font-semibold font-mono">
              Item: {activeModifyingItem.product.name}
            </p>

            <div className="space-y-3.5 text-xs text-amber-100/80">
              
              {/* Modifier select */}
              {activeModifyingItem.product.modifiers.length > 0 && (
                <div>
                  <label className="text-[10px] block opacity-40 uppercase font-mono mb-1">Modifier / Pilihan</label>
                  <select
                    value={tempModifier}
                    onChange={(e) => setTempModifier(e.target.value)}
                    className="w-full bg-[#1e1106] border border-[#D4A853]/15 rounded p-2 text-xs text-[#D4A853] font-bold"
                  >
                    {activeModifyingItem.product.modifiers.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Addons checkboxes */}
              {activeModifyingItem.product.addOns.length > 0 && (
                <div>
                  <label className="text-[10px] block opacity-40 uppercase font-mono mb-1.5">Tambahan / Add-ons</label>
                  <div className="space-y-1.5">
                    {activeModifyingItem.product.addOns.map(addon => {
                      const isChecked = tempAddOns.includes(addon.name);
                      return (
                        <label key={addon.name} className="flex items-center justify-between bg-black/25 p-2 rounded border border-[#D4A853]/5 select-none cursor-pointer">
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setTempAddOns(tempAddOns.filter(x => x !== addon.name));
                                } else {
                                  setTempAddOns([...tempAddOns, addon.name]);
                                }
                              }}
                              className="accent-[#D4A853]"
                            />
                            <span>{addon.name}</span>
                          </span>
                          <span className="text-amber-400/80 font-mono text-[10px]">+ Rp {addon.price.toLocaleString("id-ID")}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes text input */}
              <div>
                <label className="text-[10px] block opacity-40 uppercase font-mono mb-1">Catatan Khusus (Notes)</label>
                <input
                  type="text"
                  placeholder="Contoh: Less ice, extra hot..."
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  className="w-full bg-[#1e1106] border border-[#D4A853]/15 rounded p-2 text-xs text-amber-50"
                />
              </div>
            </div>

            <button
              onClick={handleSaveModifyItem}
              className="w-full bg-[#D4A853] hover:bg-[#b08b3e] text-black py-3 rounded-xl text-xs font-bold transition shadow mt-2 cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </motion.div>
        </div>
      )}

      {/* ── INTERACTIVE MODAL 3: CASHIER PAYMENT SYSTEM SELECTION ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-[#D4A853]/35 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl text-left"
          >
            <div className="flex items-center justify-between border-b border-[#D4A853]/15 pb-2">
              <h3 className="font-serif font-bold text-base text-amber-100">Sistem Pembayaran Kasir</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-amber-100/50 hover:text-amber-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {["Cash", "Debit Card", "Credit Card", "QRIS", "E-Wallet", "Bank Transfer", "Split Payment"].map((m) => {
                const isActive = paymentMethod === m;
                return (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m as any)}
                    className={`p-3 rounded-xl text-xs font-medium border text-left transition ${
                      isActive
                        ? "bg-[#D4A853]/15 border-[#D4A853] text-[#D4A853]"
                        : "bg-black/35 border-[#D4A853]/10 text-amber-100/50 hover:text-amber-100 hover:bg-black/45"
                    }`}
                  >
                    <span>{m === "Cash" ? "💵 Cash" : m === "QRIS" ? "📱 QRIS" : m === "Split Payment" ? "➗ Split Payment" : `💳 ${m}`}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-form based on payment mechanism selected */}
            {paymentMethod === "Cash" && (
              <div className="bg-black/45 p-4 rounded-xl border border-[#D4A853]/10 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="opacity-40 uppercase">Total Tagihan:</span>
                  <span className="text-amber-100 font-bold text-sm">Rp {calculatedTotal.toLocaleString("id-ID")}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] block opacity-45 uppercase font-mono">Masukkan Uang Bayar (Nominal)</label>
                  <input
                    type="number"
                    value={cashAmountPaid}
                    onChange={(e) => setCashAmountPaid(e.target.value)}
                    className="w-full bg-[#1e1106] border border-[#D4A853]/20 rounded p-2 text-xs font-mono text-[#D4A853] font-bold"
                  />
                </div>

                {parseFloat(cashAmountPaid) >= calculatedTotal && (
                  <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-[#D4A853]/5">
                    <span className="text-[#D4A853]">UANG KEMBALIAN:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      Rp {(parseFloat(cashAmountPaid) - calculatedTotal).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "Split Payment" && (
              <div className="bg-black/45 p-4 rounded-xl border border-[#D4A853]/10 space-y-3 text-xs">
                <div className="flex justify-between items-center font-mono">
                  <span className="opacity-40 uppercase">Total Tagihan:</span>
                  <span className="text-amber-100 font-bold">Rp {calculatedTotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] block opacity-50 uppercase font-mono mb-1">Porsi Cash</label>
                    <input
                      type="number"
                      value={splitPaymentAmounts.cash}
                      onChange={(e) => setSplitPaymentAmounts({ ...splitPaymentAmounts, cash: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#1e1106] border border-[#D4A853]/20 rounded p-2 font-mono text-amber-100"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] block opacity-50 uppercase font-mono mb-1">Porsi Non-Cash</label>
                    <input
                      type="number"
                      value={splitPaymentAmounts.nonCash}
                      onChange={(e) => setSplitPaymentAmounts({ ...splitPaymentAmounts, nonCash: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#1e1106] border border-[#D4A853]/20 rounded p-2 font-mono text-amber-100"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCompleteSuccessPayment}
              className="w-full bg-[#D4A853] hover:bg-[#b08b3e] text-black py-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow mt-2"
            >
              <CheckCircle className="h-4 w-4" />
              Selesaikan & Cetak Struk Otomatis
            </button>
          </motion.div>
        </div>
      )}

      {/* ── INTERACTIVE MODAL 4: AUTHENTIC THERMAL PRINT PREVIEW (AUTOMATED struk/ticket) ── */}
      {showReceiptModal && lastCompletedOrder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#140700] border border-[#D4A853]/35 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#D4A853]/10 pb-2">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Check className="h-3 w-3" /> STRUK BERHASIL DICETAK AUTO
              </span>
              <button onClick={() => setShowReceiptModal(false)} className="text-amber-100/50 hover:text-amber-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Traditional 58mm Thermal Receipt Box */}
            <div className="bg-white text-black p-5 font-mono text-[10px] leading-relaxed shadow-inner rounded-md space-y-4 select-none">
              
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="text-lg font-bold filter drop-shadow">🌟 LE PARLA CAFÉ</div>
                <div className="text-[8px] uppercase tracking-wider opacity-60">Pusat Pangkalpinang (HQ) • Bangka Belitung</div>
                <div className="text-[8px] opacity-60">ID ORDER: {lastCompletedOrder.id}</div>
                <div className="text-[8px] opacity-60">TGL: {nowStr()}</div>
                <div className="text-[8px] opacity-60">KASIR: {labelRole} • TBL: {lastCompletedOrder.tableId}</div>
                <div className="border-b border-black border-dashed py-1"></div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                {lastCompletedOrder.items.map((it, i) => (
                  <div key={i}>
                    <div className="flex justify-between font-bold">
                      <span>{it.qty}x {it.product.name}</span>
                      <span>Rp {(it.product.price * it.qty).toLocaleString("id-ID")}</span>
                    </div>
                    {it.selectedModifier && <div className="text-[9px] pl-3 opacity-60">• {it.selectedModifier}</div>}
                    {it.selectedAddOns && it.selectedAddOns.map((a, j) => (
                      <div key={j} className="text-[9px] pl-3 opacity-60">+ {a}</div>
                    ))}
                    {it.notes && <div className="text-[9px] pl-3 italic opacity-50">Ket: &ldquo;{it.notes}&rdquo;</div>}
                  </div>
                ))}
              </div>

              <div className="border-b border-black border-dashed"></div>

              {/* Totals */}
              <div className="space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {lastCompletedOrder.subtotal.toLocaleString("id-ID")}</span>
                </div>
                {lastCompletedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Diskon ({lastCompletedOrder.discountName})</span>
                    <span>-Rp {lastCompletedOrder.discountAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (PPN 10%)</span>
                  <span>Rp {lastCompletedOrder.tax.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-black border-dashed pt-1 mt-1">
                  <span>TOTAL AKHIR</span>
                  <span>Rp {lastCompletedOrder.total.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Footer barcode/sign */}
              <div className="text-center pt-4 space-y-1">
                <div className="border-t border-black border-dashed py-1"></div>
                <div className="text-[9px] font-bold">TERIMA KASIH • SELAMAT MENIKMATI KEMBALI</div>
                <div className="text-[8px] opacity-50 block font-mono">Panda Bluetooth SDK v2.85</div>
                <div className="text-[8px] tracking-widest font-bold font-mono">|||||| | || ||||| |</div>
              </div>
            </div>

            {/* Automated Barista/Kitchen Tickets Previews */}
            {(printedBaristaTicket || printedKitchenTicket) && (
              <div className="bg-[#170900]/50 p-3.5 rounded-xl border border-[#D4A853]/15 text-xs space-y-2 font-mono">
                <div className="text-[#D4A853] font-bold text-[10px] uppercase border-b border-[#D4A853]/10 pb-1">
                  Arah Cetak Tiket Kerja Khusus
                </div>
                
                {printedBaristaTicket && (
                  <div className="bg-black/45 p-2 rounded border border-[#D4A853]/5">
                    <div className="text-[9px] text-[#D4A853]">🖨️ PRINTER BARISTA (Beverages Ticket)</div>
                    <div className="text-[8px] opacity-50 mt-1">Order #{printedBaristaTicket.orderNo} • Tbl {printedBaristaTicket.table}</div>
                    {printedBaristaTicket.items.map((item: any, i: number) => (
                      <div key={i} className="text-[10px] pl-1.5 mt-0.5 font-bold text-amber-50">
                        {item.qty}x {item.product.name} {item.selectedModifier ? `(${item.selectedModifier})` : ""}
                      </div>
                    ))}
                  </div>
                )}

                {printedKitchenTicket && (
                  <div className="bg-black/45 p-2 rounded border border-[#D4A853]/5">
                    <div className="text-[9px] text-[#D4A853]">🖨️ PRINTER DAPUR/KITCHEN (Food Ticket)</div>
                    <div className="text-[8px] opacity-50 mt-1">Order #{printedKitchenTicket.orderNo} • Tbl {printedKitchenTicket.table}</div>
                    {printedKitchenTicket.items.map((item: any, i: number) => (
                      <div key={i} className="text-[10px] pl-1.5 mt-0.5 font-bold text-amber-50">
                        {item.qty}x {item.product.name} {item.selectedModifier ? `(${item.selectedModifier})` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowReceiptModal(false)}
              className="w-full bg-[#D4A853] hover:bg-[#b5903e] text-black py-3 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Tutup Slip Struk
            </button>
          </motion.div>
        </div>
      )}

      {/* ── ENTERPRISE MODAL 3: ADVANCED ENTERPRISE SETTINGS MODAL ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-[#D4A853]/35 rounded-2xl p-6 md:p-8 max-w-2xl w-full space-y-6 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-[#D4A853]/20 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#D4A853]" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-amber-100 uppercase font-serif tracking-tight">Enterprise Settings Panel</h3>
                  <p className="text-[10px] text-amber-100/40 mt-0.5">Edit Struk, Otorisasi, dan integrasi perangkat kasir pusat.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-amber-100/50 hover:text-amber-100 font-bold bg-white/5 h-8 w-8 rounded-full flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Receipt settings inputs */}
              <div className="space-y-4">
                <h4 className="text-xs text-[#D4A853] font-mono font-bold uppercase tracking-widest border-b border-white/5 pb-1">Receipt Customizer</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-1">
                    <label className="text-[9px] text-[#D4A853] block uppercase font-mono font-bold">Header Struk Teks</label>
                    <textarea
                      rows={2}
                      value={receiptSettings.headerText}
                      onChange={(e) => setReceiptSettings({ ...receiptSettings, headerText: e.target.value })}
                      className="w-full bg-transparent border-0 text-amber-100 focus:outline-none focus:ring-0 text-xs font-mono"
                    />
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-1">
                    <label className="text-[9px] text-[#D4A853] block uppercase font-mono font-bold">Footer Struk Teks</label>
                    <textarea
                      rows={2}
                      value={receiptSettings.footerText}
                      onChange={(e) => setReceiptSettings({ ...receiptSettings, footerText: e.target.value })}
                      className="w-full bg-transparent border-0 text-amber-100 focus:outline-none focus:ring-0 text-xs font-mono text-amber-150"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 text-center flex flex-col justify-between">
                    <span className="text-[8px] text-[#D4A853] block uppercase font-mono font-bold">Nama Kasir</span>
                    <button
                      type="button"
                      onClick={() => setReceiptSettings({ ...receiptSettings, showCashierName: !receiptSettings.showCashierName })}
                      className={`mt-2 font-mono text-[10px] font-bold py-1 px-2.5 rounded uppercase cursor-pointer ${receiptSettings.showCashierName ? "bg-emerald-900 border border-emerald-500/30 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}
                    >
                      {receiptSettings.showCashierName ? "Show ✓" : "Hide ✕"}
                    </button>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 text-center flex flex-col justify-between">
                    <span className="text-[8px] text-[#D4A853] block uppercase font-mono font-bold">Nomor Meja</span>
                    <button
                      type="button"
                      onClick={() => setReceiptSettings({ ...receiptSettings, showTableNumber: !receiptSettings.showTableNumber })}
                      className={`mt-2 font-mono text-[10px] font-bold py-1 px-2.5 rounded uppercase cursor-pointer ${receiptSettings.showTableNumber ? "bg-emerald-900 border border-emerald-500/30 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}
                    >
                      {receiptSettings.showTableNumber ? "Show ✓" : "Hide ✕"}
                    </button>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 text-center flex flex-col justify-between">
                    <span className="text-[8px] text-[#D4A853] block uppercase font-mono font-bold">Print Dapur</span>
                    <button
                      type="button"
                      onClick={() => setReceiptSettings({ ...receiptSettings, autoPrintKitchenCopy: !receiptSettings.autoPrintKitchenCopy })}
                      className={`mt-2 font-mono text-[10px] font-bold py-1 px-2.5 rounded uppercase cursor-pointer ${receiptSettings.autoPrintKitchenCopy ? "bg-emerald-900 border border-emerald-500/30 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}
                    >
                      {receiptSettings.autoPrintKitchenCopy ? "Show ✓" : "Hide ✕"}
                    </button>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 text-center flex flex-col justify-between">
                    <span className="text-[8px] text-[#D4A853] block uppercase font-mono font-bold">QR Payment</span>
                    <button
                      type="button"
                      onClick={() => setReceiptSettings({ ...receiptSettings, qrPaymentFooter: !receiptSettings.qrPaymentFooter })}
                      className={`mt-2 font-mono text-[10px] font-bold py-1 px-2.5 rounded uppercase cursor-pointer ${receiptSettings.qrPaymentFooter ? "bg-emerald-900 border border-emerald-500/30 text-emerald-300" : "bg-neutral-800 text-neutral-400"}`}
                    >
                      {receiptSettings.qrPaymentFooter ? "Show ✓" : "Hide ✕"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Permission list */}
              <div className="space-y-3">
                <h4 className="text-xs text-[#D4A853] font-mono font-bold uppercase tracking-widest border-b border-white/5 pb-1">Role Permission Authorization Management</h4>
                <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 max-h-36 overflow-y-auto space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[11px] font-mono text-amber-100/60 font-bold border-b border-white/5 pb-1">
                    <span>Fitur Operasi</span>
                    <span>Wajib Memiliki Role Otentikasi</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sunting & Tambah POS Hardware</span>
                    <span className="text-amber-300 font-bold">Owner, Manager</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Otorisasi Refund & Void (Hapus Order)</span>
                    <span className="text-amber-300 font-bold">Owner, Manager</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Buka/Tutup Kas & Atur Saldo Awal</span>
                    <span className="text-amber-300 font-bold">Owner, Manager, Cashier</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Akses Grafik Riwayat Sales & Analitik</span>
                    <span className="text-amber-300 font-bold">Owner, Manager</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#D4A853]/25 pt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 bg-black/60 border border-white/5 text-amber-100 py-3 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  parentSyncEnterprise(devices, receiptSettings, pluginSettings);
                  setShowSettingsModal(false);
                  inform("✓ Pengaturan Enterprise POS berhasil disimpan & disinkronisasikan!");
                  writeAuditLog("Manually updated the global POS Receipt Configurations inside settings panel");
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-[#D4A853] hover:from-amber-600 hover:to-amber-500 text-black py-3 rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                Simpan & Sinkronisasi
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── ENTERPRISE MODAL 4: ADD/EDIT DEVICE REGISTERED MODAL ── */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-[#D4A853]/35 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-[#D4A853]/20 pb-2.5">
              <h3 className="font-serif text-sm font-bold text-amber-100 uppercase tracking-tight">
                {editingDevice ? "Edit Profil Perangkat" : "Tambah Perangkat Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setShowDeviceModal(false)}
                className="text-amber-100/40 hover:text-amber-100 cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-black/45 p-2.5 rounded border border-white/5">
                <label className="text-[8px] text-[#D4A853] block uppercase font-mono font-bold mb-1">Perangkat ID</label>
                <input
                  type="text"
                  required
                  disabled={!!editingDevice}
                  value={deviceFormId}
                  onChange={(e) => setDeviceFormId(e.target.value)}
                  className="w-full bg-transparent border-0 text-amber-100 focus:outline-none focus:ring-0 text-xs font-mono"
                  placeholder="DEV-103"
                />
              </div>

              <div className="bg-black/45 p-2.5 rounded border border-white/5">
                <label className="text-[8px] text-[#D4A853] block uppercase font-mono font-bold mb-1">Nama Perangkat</label>
                <input
                  type="text"
                  required
                  value={deviceFormName}
                  onChange={(e) => setDeviceFormName(e.target.value)}
                  className="w-full bg-transparent border-0 text-amber-100 focus:outline-none focus:ring-0 text-xs font-mono"
                  placeholder="Panda Bluetooth 80mm Tablet"
                />
              </div>

              <div className="bg-black/45 p-2.5 rounded border border-white/5">
                <label className="text-[8px] text-[#D4A853] block uppercase font-mono font-bold mb-1">Station / Lokasi</label>
                <input
                  type="text"
                  required
                  value={deviceFormStation}
                  onChange={(e) => setDeviceFormStation(e.target.value)}
                  className="w-full bg-transparent border-0 text-amber-100 focus:outline-none focus:ring-0 text-xs font-mono"
                  placeholder="Meja Utama Kasir"
                />
              </div>

              <div className="bg-black/45 p-2.5 rounded border border-white/5">
                <label className="text-[8px] text-[#D4A853] block uppercase font-mono font-bold mb-1">User Aktif</label>
                <input
                  type="text"
                  required
                  value={deviceFormUser}
                  onChange={(e) => setDeviceFormUser(e.target.value)}
                  className="w-full bg-transparent border-0 text-amber-100 focus:outline-none focus:ring-0 text-xs font-mono"
                  placeholder="Kasir Staff Sudirman (Derry)"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/45 p-2.5 rounded border border-white/5">
                  <label className="text-[8px] text-[#D4A853] block uppercase font-mono font-bold mb-0.5">Firmware</label>
                  <input
                    type="text"
                    value={deviceFormFirmware}
                    onChange={(e) => setDeviceFormFirmware(e.target.value)}
                    className="w-full bg-transparent border-0 text-[#D4A853] focus:outline-none focus:ring-0 text-xs font-mono"
                  />
                </div>
                <div className="bg-black/45 p-2.5 rounded border border-white/5">
                  <label className="text-[8px] text-[#D4A853] block uppercase font-mono font-bold mb-0.5">Status Perangkat</label>
                  <select
                    value={deviceFormStatus}
                    onChange={(e) => setDeviceFormStatus(e.target.value as any)}
                    className="bg-transparent border-none text-amber-100 focus:outline-none focus:ring-0 text-xs w-full font-mono p-0"
                  >
                    <option value="Online" className="bg-neutral-900 text-amber-100">Online</option>
                    <option value="Offline" className="bg-neutral-900 text-amber-100">Offline</option>
                    <option value="Maintenance" className="bg-neutral-900 text-amber-100">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeviceModal(false)}
                  className="flex-1 bg-black/60 border border-white/5 py-2 rounded-lg font-bold hover:bg-neutral-800 text-amber-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveDevice(e as any)}
                  className="flex-1 bg-[#D4A853] text-black font-bold py-2 rounded-lg hover:bg-amber-500 transition"
                >
                  {editingDevice ? "Update" : "Daftarkan"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── ENTERPRISE MODAL 5: DELETE EXPLICIT CONFIRMATION MODAL ── */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-red-500/40 rounded-2xl p-6 text-center shadow-2xl max-w-sm w-full space-y-4"
          >
            <span className="text-4xl">⚠</span>
            <h3 className="font-serif text-lg font-bold text-amber-100">Konfirmasi Hapus Perangkat</h3>
            <p className="text-xs text-amber-100/55 leading-relaxed">
              Anda yakin ingin menghapus perangkat <span className="font-bold text-amber-50">"{deleteConfirmModal.name}"</span> ({deleteConfirmModal.id}) dari sistem CoffeeOps? Konfigurasi lokal pada station bersangkutan akan diputuskan secara permanen.
            </p>

            <div className="flex gap-2 text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ show: false, type: "device", id: "", name: "" })}
                className="flex-1 bg-black/50 hover:bg-black/60 border border-white/5 text-amber-100/60 py-2.5 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="flex-1 bg-red-650 hover:bg-red-750 text-white py-2.5 rounded-lg cursor-pointer transition shadow"
              >
                Hapus Permanen
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── SECURITY MANAGER/OWNER PIN APPROVAL POPUP ── */}
      {approvalModal.show && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-[#D4A853]/35 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-left"
          >
            <div className="text-center space-y-2">
              <span className="text-3xl text-red-400">🛡️</span>
              <h3 className="font-serif text-lg font-bold text-amber-100">Verifikasi PIN Manajer</h3>
              <p className="text-xs text-amber-100/40">
                Langkah perlindungan ini mewajibkan persetujuan PIN penanggung jawab (Manager PIN &ldquo;8888&rdquo; atau Owner PIN &ldquo;1234&rdquo;).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="PIN Manajer Terdaftar"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  className="w-full bg-black/60 border border-[#D4A853]/25 p-3 rounded-lg text-center font-mono text-lg font-bold tracking-widest text-[#D4A853]"
                  onKeyDown={(e) => { if (e.key === "Enter") handleVerifyManagerApproval(); }}
                />
                {approvalModal.errorMessage && (
                  <span className="text-[10px] text-red-400 block text-center mt-1.5 font-bold">{approvalModal.errorMessage}</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalModal({ show: false, purpose: 'discount' })}
                  className="flex-1 bg-black/50 hover:bg-black/60 text-amber-100/60 py-2.5 rounded-lg text-xs font-semibold border border-white/5 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleVerifyManagerApproval}
                  className="flex-1 bg-red-650 hover:bg-red-750 text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verifikasi PIN
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
