import React, { useState, useEffect } from "react";
import { 
  CoffeeOpsState, 
  User, 
  SmallwareItem, 
  SmallwareStockOpname, 
  SmallwareLossReport, 
  SmallwareBreakageReport, 
  SmallwareAuditLog 
} from "../types";
import { 
  Glasses, 
  Coffee, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ClipboardList, 
  FileSpreadsheet, 
  TrendingUp, 
  Eye, 
  AlertCircle, 
  Camera, 
  User as UserIcon,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Lock,
  ListFilter,
  CheckCircle,
  HelpCircle,
  Activity
} from "lucide-react";

interface SmallwaresManagementProps {
  state: CoffeeOpsState;
  currentUser: User | null;
  activeRole: string;
  onUpdateState: (nextState: CoffeeOpsState) => void;
  triggerToast: (msg: string) => void;
}

// Preset assets for demo
const INITIAL_DEMO_ITEMS: SmallwareItem[] = [
  // Glassware
  { id: "SW-01", name: "Espresso Cup (80ml)", category: "Glassware", storageLocation: "Bar Counter Shelf A", initialQty: 40, currentQty: 38, minStock: 25, unitPrice: 35000, supplier: "Kaca Masindo PT", purchaseDate: "2026-02-15", status: "Active" },
  { id: "SW-02", name: "Cappuccino Cup (180ml)", category: "Glassware", storageLocation: "Bar Counter Shelf A", initialQty: 50, currentQty: 48, minStock: 30, unitPrice: 42000, supplier: "Kaca Masindo PT", purchaseDate: "2026-02-15", status: "Active" },
  { id: "SW-03", name: "Latte Cup (240ml)", category: "Glassware", storageLocation: "Bar Counter Shelf B", initialQty: 40, currentQty: 34, minStock: 25, unitPrice: 48000, supplier: "Kaca Masindo PT", purchaseDate: "2026-02-15", status: "Active" },
  { id: "SW-04", name: "Ceramic Mug Classic", category: "Glassware", storageLocation: "Mug Rack Desk C", initialQty: 30, currentQty: 29, minStock: 15, unitPrice: 45000, supplier: "Seramik Indo Abadi", purchaseDate: "2026-03-01", status: "Active" },
  { id: "SW-05", name: "Tea Cup set", category: "Glassware", storageLocation: "Pantry Cabinet B", initialQty: 20, currentQty: 20, minStock: 10, unitPrice: 38000, supplier: "Seramik Indo Abadi", purchaseDate: "2026-03-01", status: "Active" },
  { id: "SW-06", name: "Water Glass Clear", category: "Glassware", storageLocation: "Bar Service Area", initialQty: 60, currentQty: 54, minStock: 35, unitPrice: 22000, supplier: "Cahaya Kaca Toko", purchaseDate: "2026-01-10", status: "Active" },
  { id: "SW-07", name: "Highball Glass", category: "Glassware", storageLocation: "Cocktail Bar Rack", initialQty: 30, currentQty: 28, minStock: 15, unitPrice: 28000, supplier: "Cahaya Kaca Toko", purchaseDate: "2026-01-10", status: "Active" },
  { id: "SW-08", name: "Cocktail Glass Coupe", category: "Glassware", storageLocation: "Cocktail Bar Rack", initialQty: 24, currentQty: 21, minStock: 12, unitPrice: 55000, supplier: "Global Glassware", purchaseDate: "2026-04-12", status: "Active" },
  { id: "SW-09", name: "Beer Glass Pint", category: "Glassware", storageLocation: "Bar Tap Cold Shelf", initialQty: 24, currentQty: 23, minStock: 10, unitPrice: 35000, supplier: "Global Glassware", purchaseDate: "2026-04-12", status: "Active" },
  { id: "SW-10", name: "Wine Glass Elegant", category: "Glassware", storageLocation: "Chill Glass Rack", initialQty: 24, currentQty: 22, minStock: 12, unitPrice: 65000, supplier: "Global Glassware", purchaseDate: "2026-04-12", status: "Active" },
  { id: "SW-11", name: "Dessert Glass Bowl", category: "Glassware", storageLocation: "Pantry Under Shelf", initialQty: 30, currentQty: 30, minStock: 15, unitPrice: 26000, supplier: "Cahaya Kaca Toko", purchaseDate: "2026-01-10", status: "Active" },

  // Bar Equipment
  { id: "SW-12", name: "Milk Pitcher 350ml", category: "Bar Equipment", storageLocation: "Expresso Machine Deck", initialQty: 8, currentQty: 7, minStock: 4, unitPrice: 125000, supplier: "Espresso Tech Corp", purchaseDate: "2025-11-20", status: "Active" },
  { id: "SW-13", name: "Stainless Steel Tamper 58mm", category: "Bar Equipment", storageLocation: "Bar Tamp Station", initialQty: 4, currentQty: 4, minStock: 2, unitPrice: 350000, supplier: "Barista Gears ID", purchaseDate: "2025-11-20", status: "Active" },
  { id: "SW-14", name: "Coffee Distributor tool", category: "Bar Equipment", storageLocation: "Bar Tamp Station", initialQty: 4, currentQty: 4, minStock: 2, unitPrice: 380000, supplier: "Barista Gears ID", purchaseDate: "2025-11-20", status: "Active" },
  { id: "SW-15", name: "Heavy Duty Knock Box", category: "Bar Equipment", storageLocation: "Expresso Machine Side", initialQty: 3, currentQty: 3, minStock: 2, unitPrice: 450000, supplier: "Espresso Tech Corp", purchaseDate: "2025-11-20", status: "Active" },
  { id: "SW-16", name: "Digital scale waterproof", category: "Bar Equipment", storageLocation: "Filter Bar Deck", initialQty: 6, currentQty: 5, minStock: 3, unitPrice: 650000, supplier: "Barista Gears ID", purchaseDate: "2026-02-10", status: "Active" },
  { id: "SW-17", name: "Digital Dual Timer", category: "Bar Equipment", storageLocation: "Bar Drip Counter", initialQty: 5, currentQty: 5, minStock: 2, unitPrice: 120000, supplier: "Barista Gears ID", purchaseDate: "2026-02-10", status: "Active" },
  { id: "SW-18", name: "V60 Resin Dripper 02", category: "Bar Equipment", storageLocation: "Filter Bar Overhead", initialQty: 10, currentQty: 8, minStock: 5, unitPrice: 110000, supplier: "Hario Distributor", purchaseDate: "2025-12-05", status: "Active" },
  { id: "SW-19", name: "Glass Range Server 600ml", category: "Bar Equipment", storageLocation: "Filter Bar Overhead", initialQty: 8, currentQty: 6, minStock: 4, unitPrice: 185000, supplier: "Hario Distributor", purchaseDate: "2025-12-05", status: "Active" },
  { id: "SW-20", name: "Barista Cupping Spoon", category: "Bar Equipment", storageLocation: "Bar Drawers A", initialQty: 12, currentQty: 12, minStock: 6, unitPrice: 75000, supplier: "Barista Gears ID", purchaseDate: "2025-11-20", status: "Active" },
  { id: "SW-21", name: "Milk Frothing Thermometer", category: "Bar Equipment", storageLocation: "Bar Drawers A", initialQty: 5, currentQty: 4, minStock: 2, unitPrice: 85000, supplier: "Barista Gears ID", purchaseDate: "2025-11-20", status: "Active" },

  // Kitchen Equipment
  { id: "SW-22", name: "Black Non-Slip Serving Tray", category: "Kitchen Equipment", storageLocation: "Kitchen Dispatch Back", initialQty: 15, currentQty: 14, minStock: 8, unitPrice: 95000, supplier: "Kitchen Set Pro", purchaseDate: "2026-01-20", status: "Active" },
  { id: "SW-23", name: "Stainless Mixing Bowl LG", category: "Kitchen Equipment", storageLocation: "Kitchen Prep Desk", initialQty: 8, currentQty: 8, minStock: 4, unitPrice: 70000, supplier: "Kitchen Set Pro", purchaseDate: "2026-01-20", status: "Active" },
  { id: "SW-24", name: "Chef Knife Professional", category: "Kitchen Equipment", storageLocation: "Kitchen Wall Magnet", initialQty: 4, currentQty: 4, minStock: 3, unitPrice: 420000, supplier: "SharpEdge PT", purchaseDate: "2025-12-10", status: "Active" },
  { id: "SW-25", name: "Wood Cutting Board XL", category: "Kitchen Equipment", storageLocation: "Prep Shelf Under", initialQty: 5, currentQty: 5, minStock: 2, unitPrice: 150000, supplier: "Kitchen Set Pro", purchaseDate: "2026-01-20", status: "Active" },
  { id: "SW-26", name: "Squeeze Sauce Bottle 500ml", category: "Kitchen Equipment", storageLocation: "Kitchen Cold Rack", initialQty: 30, currentQty: 27, minStock: 15, unitPrice: 15000, supplier: "Toko Plastik Jaya", purchaseDate: "2026-03-05", status: "Active" },
  { id: "SW-27", name: "Airtight Storage Container", category: "Kitchen Equipment", storageLocation: "Ingredient Dry Store", initialQty: 25, currentQty: 25, minStock: 10, unitPrice: 45000, supplier: "Toko Plastik Jaya", purchaseDate: "2026-03-05", status: "Active" },

  // Service Equipment
  { id: "SW-28", name: "A5 Acrylic Menu Board Holder", category: "Service Equipment", storageLocation: "Reception Gate Box", initialQty: 35, currentQty: 34, minStock: 20, unitPrice: 38000, supplier: "Acrylic & Glow Store", purchaseDate: "2026-02-10", status: "Active" },
  { id: "SW-29", name: "Wood Table Number Plates (1-30)", category: "Service Equipment", storageLocation: "Cashier Storage Hub", initialQty: 30, currentQty: 29, minStock: 25, unitPrice: 48000, supplier: "Kriya Kayu Craft", purchaseDate: "2026-01-18", status: "Active" },
  { id: "SW-30", name: "Classic Metal Tissue Holder", category: "Service Equipment", storageLocation: "Dining Tables Desk", initialQty: 30, currentQty: 28, minStock: 20, unitPrice: 34000, supplier: "Cahaya Logam", purchaseDate: "2026-02-22", status: "Active" },
  { id: "SW-31", name: "Glass Water Pitcher 1.5L", category: "Service Equipment", storageLocation: "Water Station Shelves", initialQty: 10, currentQty: 8, minStock: 5, unitPrice: 75000, supplier: "Global Glassware", purchaseDate: "2026-04-12", status: "Active" },
  { id: "SW-32", name: "Bar Condiment Spoon & Holder", category: "Service Equipment", storageLocation: "Condiment Station", initialQty: 4, currentQty: 4, minStock: 2, unitPrice: 120000, supplier: "Cahaya Logam", purchaseDate: "2026-02-22", status: "Active" }
];

export default function SmallwaresManagement({
  state,
  currentUser,
  activeRole,
  onUpdateState,
  triggerToast
}: SmallwaresManagementProps) {
  // Navigation tabs
  type SubTab = "dashboard" | "inventory" | "loss" | "breakage" | "kpi" | "audit";
  const [subTab, setSubTab] = useState<SubTab>("dashboard");

  // Determine RBAC permissions
  const isOwner = activeRole === "Owner";
  const isManager = activeRole === "Manager";
  const isSupervisor = activeRole === "Supervisor";
  const isManagement = ["Owner", "Manager"].includes(activeRole);
  const isAuditor = ["Owner", "Manager", "Supervisor"].includes(activeRole);

  // States
  const [inventory, setInventory] = useState<SmallwareItem[]>(() => {
    return (state.smallwaresInventory && state.smallwaresInventory.length > 0) 
      ? state.smallwaresInventory 
      : INITIAL_DEMO_ITEMS;
  });

  const [stockOpnames, setStockOpnames] = useState<SmallwareStockOpname[]>(() => {
    if (state.smallwareStockOpnames && state.smallwareStockOpnames.length > 0) {
      return state.smallwareStockOpnames;
    }
    // Seed some demo audit logs
    const today = new Date().toISOString().split("T")[0];
    return [
      { id: "SO-101", date: today, type: "Daily", itemId: "SW-01", itemName: "Espresso Cup (80ml)", category: "Glassware", expectedQty: 40, actualQty: 38, difference: -2, status: "Approved", auditedBy: "Andi Barista", auditedByRole: "Barista", notes: "2 Pecah saat rush hour", createdAt: today },
      { id: "SO-102", date: today, type: "Daily", itemId: "SW-02", itemName: "Cappuccino Cup (180ml)", category: "Glassware", expectedQty: 50, actualQty: 48, difference: -2, status: "Approved", auditedBy: "Rian Cashier", auditedByRole: "Cashier", notes: "Ditemukan retak parah", createdAt: today },
      { id: "SO-103", date: today, type: "Daily", itemId: "SW-03", itemName: "Latte Cup (240ml)", category: "Glassware", expectedQty: 40, actualQty: 34, difference: -6, status: "Approved", auditedBy: "Novi Head Barista", auditedByRole: "Head Barista", notes: "Pecah & sebagian cacat retak", createdAt: today }
    ];
  });

  const [lossReports, setLossReports] = useState<SmallwareLossReport[]>(() => {
    if (state.smallwareLossReports && state.smallwareLossReports.length > 0) {
      return state.smallwareLossReports;
    }
    // Seed demo
    const today = new Date().toISOString().split("T")[0];
    return [
      { id: "LR-001", date: today, itemId: "SW-16", itemName: "Digital scale waterproof", category: "Bar Equipment", qtyLost: 1, lossValue: 650000, cause: "Unknown", staffInCharge: "Rian Cashier", reportedBy: "Supervisor Susi", timestamp: `${today} 15:42:00`, outletLocation: "Le Parla Central", isSoftDeleted: false },
      { id: "LR-002", date: today, itemId: "SW-29", itemName: "Wood Table Number Plates (1-30)", category: "Service Equipment", qtyLost: 1, lossValue: 48000, cause: "Missing", staffInCharge: "Joko Server", reportedBy: "Novi Head Barista", timestamp: `${today} 11:15:00`, outletLocation: "Le Parla Central", isSoftDeleted: false }
    ];
  });

  const [breakageReports, setBreakageReports] = useState<SmallwareBreakageReport[]>(() => {
    if (state.smallwareBreakageReports && state.smallwareBreakageReports.length > 0) {
      return state.smallwareBreakageReports;
    }
    // Seed demo
    const today = new Date().toISOString().split("T")[0];
    return [
      { id: "BR-001", date: today, itemId: "SW-01", itemName: "Espresso Cup (80ml)", category: "Glassware", qtyBroken: 2, lossValue: 70000, cause: "Operational Error", staffReporter: "Andi Barista", imageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809", timestamp: `${today} 08:30:00`, outletLocation: "Le Parla Central", isSoftDeleted: false },
      { id: "BR-002", date: today, itemId: "SW-02", itemName: "Cappuccino Cup (180ml)", category: "Glassware", qtyBroken: 2, lossValue: 84000, cause: "Customer Accident", staffReporter: "Andi Barista", imageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809", timestamp: `${today} 09:47:00`, outletLocation: "Le Parla Central", isSoftDeleted: false },
      { id: "BR-003", date: today, itemId: "SW-03", itemName: "Latte Cup (240ml)", category: "Glassware", qtyBroken: 6, lossValue: 288000, cause: "Accident", staffReporter: "Novi Head Barista", imageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809", timestamp: `${today} 14:10:00`, outletLocation: "Le Parla Central", isSoftDeleted: false }
    ];
  });

  const [auditLogs, setAuditLogs] = useState<SmallwareAuditLog[]>(() => {
    if (state.smallwareAuditLogs && state.smallwareAuditLogs.length > 0) {
      return state.smallwareAuditLogs;
    }
    const today = new Date().toISOString().split("T")[0];
    return [
      { id: "AL-1", timestamp: `${today} 08:00:00`, userId: "1", userName: "Admin", action: "Sistem", details: "Inisialisasi database master inventory smallwares & glassware" }
    ];
  });

  // Filter search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Stock Opname Editing Modes
  const [auditType, setAuditType] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [countingQtys, setCountingQtys] = useState<{ [id: string]: number }>({});
  const [countingNotes, setCountingNotes] = useState<{ [id: string]: string }>({});

  // Loss Form States
  const [selectedLossItem, setSelectedLossItem] = useState("");
  const [lossQty, setLossQty] = useState(1);
  const [lossCause, setLossCause] = useState<"Missing" | "Misplaced" | "Theft" | "Operational Loss" | "Unknown">("Missing");
  const [lossStaffInCharge, setLossStaffInCharge] = useState("");
  const [lossPhotoEvidence, setLossPhotoEvidence] = useState<string>("");

  // Breakages Form States
  const [selectedBreakageItem, setSelectedBreakageItem] = useState("");
  const [breakageQty, setBreakageQty] = useState(1);
  const [breakageCause, setBreakageCause] = useState<"Accident" | "Customer Accident" | "Operational Error" | "Wear and Tear" | "Manufacturing Defect">("Accident");
  const [breakageStaff, setBreakageStaff] = useState("");
  const [breakagePhotoEvidence, setBreakagePhotoEvidence] = useState<string>("");

  // Item form for Manager (Create / Edit)
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<SmallwareItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<"Glassware" | "Bar Equipment" | "Kitchen Equipment" | "Service Equipment">("Glassware");
  const [formLocation, setFormLocation] = useState("");
  const [formInitial, setFormInitial] = useState(10);
  const [formCurrent, setFormCurrent] = useState(10);
  const [formMin, setFormMin] = useState(5);
  const [formPrice, setFormPrice] = useState(15000);
  const [formSupplier, setFormSupplier] = useState("");

  // State Synchronization Method
  const syncAndSave = (
    nextInv: SmallwareItem[],
    nextSO: SmallwareStockOpname[],
    nextLoss: SmallwareLossReport[],
    nextBreakage: SmallwareBreakageReport[],
    nextAudit: SmallwareAuditLog[]
  ) => {
    setInventory(nextInv);
    setStockOpnames(nextSO);
    setLossReports(nextLoss);
    setBreakageReports(nextBreakage);
    setAuditLogs(nextAudit);

    const updatedState: CoffeeOpsState = {
      ...state,
      smallwaresInventory: nextInv,
      smallwareStockOpnames: nextSO,
      smallwareLossReports: nextLoss,
      smallwareBreakageReports: nextBreakage,
      smallwareAuditLogs: nextAudit
    };
    onUpdateState(updatedState);
  };

  // Log audit helper
  const addAuditActivity = (action: string, details: string) => {
    const newLog: SmallwareAuditLog = {
      id: `AL-${Date.now()}`,
      timestamp: new Date().toLocaleString("id-ID"),
      userId: currentUser?.id || "unkn",
      userName: currentUser?.name || activeRole,
      action,
      details
    };
    return [newLog, ...auditLogs];
  };

  // Initialize countingQtys when swapping to count opname
  useEffect(() => {
    const initial: { [id: string]: number } = {};
    const notesInit: { [id: string]: string } = {};
    inventory.forEach(item => {
      if (!item.isSoftDeleted) {
        initial[item.id] = item.currentQty;
        notesInit[item.id] = "";
      }
    });
    setCountingQtys(initial);
    setCountingNotes(notesInit);
  }, [inventory]);

  // Handle count quantity changes
  const handleQtyCountChange = (itemId: string, val: number) => {
    setCountingQtys(prev => ({
      ...prev,
      [itemId]: Math.max(0, val)
    }));
  };

  // Handle count notes change
  const handleNotesCountChange = (itemId: string, note: string) => {
    setCountingNotes(prev => ({
      ...prev,
      [itemId]: note
    }));
  };

  // Submit Stock Count (Daily Count / Weekly Audit / Monthly Finalization)
  const handleSubmitStockOpname = () => {
    const today = new Date().toISOString().split("T")[0];
    const newAuditRecords: SmallwareStockOpname[] = [];
    const updatedInventory = [...inventory];

    let hasDifferences = false;
    let countsCompleted = 0;

    // Check permissions
    if (auditType === "Weekly" && !isAuditor) {
      triggerToast("⛔ Anda tidak memiliki akses Supervisor ke atas untuk melakukan Weekly Audit.");
      return;
    }
    if (auditType === "Monthly" && !isManagement) {
      triggerToast("⛔ Anda tidak memiliki akses Manager/Owner untuk melakukan Monthly Audit Finalization.");
      return;
    }

    // Process each item that is not soft deleted
    inventory.forEach(item => {
      if (item.isSoftDeleted) return;

      const inputVal = countingQtys[item.id];
      if (inputVal === undefined) return;

      const diff = inputVal - item.currentQty;
      const expected = item.currentQty;
      const actual = inputVal;

      if (diff !== 0) {
        hasDifferences = true;
      }

      // Add Stock Opname Log
      newAuditRecords.push({
        id: `SO-${Date.now()}-${item.id}`,
        date: today,
        type: auditType,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        expectedQty: expected,
        actualQty: actual,
        difference: diff,
        status: (auditType === "Daily" ? "Pending Approval" : "Approved") as "Pending Approval" | "Approved",
        auditedBy: currentUser?.name || "Staff",
        auditedByRole: activeRole,
        notes: countingNotes[item.id] || "Stock opname rutin",
        createdAt: new Date().toISOString()
      });

      // Update current stock if Monthly or Weekly Audit (Managers/Supervisors override stock instantly)
      if (auditType === "Weekly" || auditType === "Monthly" || auditType === "Daily") {
        const itemIdx = updatedInventory.findIndex(i => i.id === item.id);
        if (itemIdx >= 0) {
          updatedInventory[itemIdx] = {
            ...updatedInventory[itemIdx],
            currentQty: actual,
            status: actual === 0 ? "Retired" : updatedInventory[itemIdx].status
          };
        }
      }
      countsCompleted++;
    });

    if (countsCompleted === 0) {
      triggerToast("⚠️ Tidak ada item untuk diperiksa.");
      return;
    }

    const logs = addAuditActivity(
      `${auditType} Stock Count`, 
      `Melakukan stock count tipe ${auditType}. Menghitung ${countsCompleted} item. Ada koreksi selisih: ${hasDifferences ? 'Ya' : 'Tidak'}`
    );

    const nextSO = [...newAuditRecords, ...stockOpnames];
    syncAndSave(updatedInventory, nextSO, lossReports, breakageReports, logs);

    triggerToast(`✓ Berhasil menyimpan ${auditType} Stock Count! ${hasDifferences ? "Tercatat terdapat penyesuaian selisih." : "Stok akurat, tidak ada selisih!"}`);
    
    // Check if some items reached minimum stock to trigger alerts!
    updatedInventory.forEach(item => {
      if (item.currentQty <= item.minStock && !item.isSoftDeleted) {
        triggerToast(`📢 ALERT: ${item.name} mencapai/melebihi batas stok minimum! (Sisa: ${item.currentQty})`);
      }
    });
  };

  // Report Loss Handler
  const handleReportLoss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLossItem || lossQty <= 0) {
      triggerToast("⚠️ Mohon pilih barang dan tentukan jumlah kehilangan yang valid.");
      return;
    }

    const item = inventory.find(i => i.id === selectedLossItem);
    if (!item) return;

    if (item.currentQty < lossQty) {
      triggerToast(`⚠️ Jumlah hilang (${lossQty}) melebihi stok yang ada (${item.currentQty}).`);
      return;
    }

    const totalValue = lossQty * item.unitPrice;
    const today = new Date().toISOString().split("T")[0];

    const newReport: SmallwareLossReport = {
      id: `LR-${Date.now()}`,
      date: today,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      qtyLost: lossQty,
      lossValue: totalValue,
      cause: lossCause,
      staffInCharge: lossStaffInCharge || "None",
      reportedBy: currentUser?.name || activeRole,
      imageUrl: lossPhotoEvidence || "https://images.unsplash.com/photo-1541167760496-1628856ab772",
      timestamp: new Date().toLocaleString("id-ID"),
      outletLocation: state.branding.name || "Le Parla Café Central"
    };

    // Auto deduct from current stock
    const updatedInv = inventory.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          currentQty: i.currentQty - lossQty,
          status: (i.currentQty - lossQty <= 0) ? ("Lost" as const) : i.status
        };
      }
      return i;
    });

    const nextLoss = [newReport, ...lossReports];
    const logs = addAuditActivity("Report Loss", `Melaporkan kehilangan ${lossQty} pcs ${item.name} senilai Rp${totalValue.toLocaleString()}. Alasan: ${lossCause}`);

    syncAndSave(updatedInv, stockOpnames, nextLoss, breakageReports, logs);
    triggerToast(`✓ Berhasil mencatat laporan kehilangan ${item.name}! Stok langsung diperbarui.`);
    
    // Clear forms
    setSelectedLossItem("");
    setLossQty(1);
    setLossStaffInCharge("");
    setLossPhotoEvidence("");

    // Alert system checks
    if (lossQty > 3) {
      triggerToast(`📢 ALERT MANAGER: Kehilangan item luar biasa terdeteksi pada item ${item.name} (> 3 pcs)!`);
    }
    if (totalValue > 500000) {
      triggerToast(`📢 ALERT OWNER: Nilai kerugian terdeteksi melebihi batas batas aman (> Rp500.000)!`);
    }
  };

  // Report Breakage Handler
  const handleReportBreakage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBreakageItem || breakageQty <= 0) {
      triggerToast("⚠️ Mohon pilih barang dan tentukan jumlah pecahan yang valid.");
      return;
    }

    const item = inventory.find(i => i.id === selectedBreakageItem);
    if (!item) return;

    if (item.currentQty < breakageQty) {
      triggerToast(`⚠️ Jumlah pecah (${breakageQty}) melebihi stok yang ada (${item.currentQty}).`);
      return;
    }

    const totalValue = breakageQty * item.unitPrice;
    const today = new Date().toISOString().split("T")[0];

    const newReport: SmallwareBreakageReport = {
      id: `BR-${Date.now()}`,
      date: today,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      qtyBroken: breakageQty,
      lossValue: totalValue,
      cause: breakageCause,
      staffReporter: breakageStaff || currentUser?.name || activeRole,
      imageUrl: breakagePhotoEvidence || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809",
      timestamp: new Date().toLocaleString("id-ID"),
      outletLocation: state.branding.name || "Le Parla Café Central"
    };

    // Auto deduct from current stock
    const updatedInv = inventory.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          currentQty: i.currentQty - breakageQty,
          status: (i.currentQty - breakageQty <= 0) ? ("Broken" as const) : i.status
        };
      }
      return i;
    });

    const nextBreakage = [newReport, ...breakageReports];
    const logs = addAuditActivity("Report Breakage", `Melaporkan kerusakan pecah ${breakageQty} pcs ${item.name} senilai Rp${totalValue.toLocaleString()}. Alasan: ${breakageCause}`);

    syncAndSave(updatedInv, stockOpnames, lossReports, nextBreakage, logs);
    triggerToast(`✓ Berhasil mencatat laporan pecahan ${item.name}! Stok otomatis terpotong.`);

    // Clear forms
    setSelectedBreakageItem("");
    setBreakageQty(1);
    setBreakageStaff("");
    setBreakagePhotoEvidence("");

    // Alert systems checks
    if (breakageQty > 5 && item.category === "Glassware") {
      triggerToast("📢 ALERT MANAGER: Kuota gelas pecah kritis melampaui batas harian (> 5 pcs)!");
    }
    if (totalValue > 500000) {
      triggerToast("📢 ALERT OWNER: Nilai kerugian pecah alat baru saja melampaui Rp500.000!");
    }
  };

  // Soft Delete Handler for Manager
  const handleSoftDeleteItem = (itemId: string) => {
    if (!isManagement) {
      triggerToast("⛔ Akses ditolak. Hanya Manager atau Owner yang dapat menonaktifkan item.");
      return;
    }

    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const nextInv = inventory.map(i => {
      if (i.id === itemId) {
        return { ...i, isSoftDeleted: true };
      }
      return i;
    });

    const logs = addAuditActivity("Soft Delete Item", `Menghapus item ${item.name} (${item.id}) dengan penanda soft delete`);
    syncAndSave(nextInv, stockOpnames, lossReports, breakageReports, logs);
    triggerToast(`✓ Barang ${item.name} berhasil dihapus sementara.`);
  };

  // Add or Edit Item Form Submit Handler (Manager Only)
  const handleSaveItemForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManagement) {
      triggerToast("⛔ Hanya level Management yang dapat mengelola master barang.");
      return;
    }

    if (!formName || !formLocation || formPrice <= 0) {
      triggerToast("⚠️ Mohon lengkapi info nama, lokasi penyimpanan, dan estimasi harga.");
      return;
    }

    let updatedInv = [...inventory];
    let actionType = "Add";

    if (editingItem) {
      // Modify existing
      updatedInv = updatedInv.map(i => {
        if (i.id === editingItem.id) {
          return {
            ...i,
            name: formName,
            category: formCategory,
            storageLocation: formLocation,
            initialQty: formInitial,
            currentQty: formCurrent,
            minStock: formMin,
            unitPrice: formPrice,
            supplier: formSupplier || "Toko Umum / Grosir"
          };
        }
        return i;
      });
      actionType = "Edit";
    } else {
      // Create new
      const nextId = `SW-${inventory.length + 1}`;
      const newItem: SmallwareItem = {
        id: nextId,
        name: formName,
        category: formCategory,
        storageLocation: formLocation,
        initialQty: formInitial,
        currentQty: formInitial,
        minStock: formMin,
        unitPrice: formPrice,
        supplier: formSupplier || "Toko Umum / Grosir",
        purchaseDate: new Date().toISOString().split("T")[0],
        status: "Active"
      };
      updatedInv.push(newItem);
    }

    const logs = addAuditActivity(`${actionType} Master Item`, `Menyimpan master barang '${formName}' dengan harga satuan Rp${formPrice.toLocaleString()}`);
    syncAndSave(updatedInv, stockOpnames, lossReports, breakageReports, logs);
    
    // Clear & close
    setShowItemForm(false);
    setEditingItem(null);
    setFormName("");
    setFormLocation("");
    setFormInitial(10);
    setFormCurrent(10);
    setFormMin(5);
    setFormPrice(15000);
    setFormSupplier("");

    triggerToast(`✓ Berhasil menyimpan data barang master ${formName}`);
  };

  // Trigger editing item fields fill
  const handleStartEdit = (item: SmallwareItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormLocation(item.storageLocation);
    setFormInitial(item.initialQty);
    setFormCurrent(item.currentQty);
    setFormMin(item.minStock);
    setFormPrice(item.unitPrice);
    setFormSupplier(item.supplier);
    setShowItemForm(true);
  };

  // CSV Exporter
  const handleExportCSV = (reportType: "inventory" | "loss" | "breakage" | "kpi") => {
    let title = "";
    let csvContent = "";

    if (reportType === "inventory") {
      title = "REKAP_AUDIT_SMALLWARES_MASTER.csv";
      csvContent = "Item ID,Nama Item,Kategori,Lokasi,Stok Awal,Stok Saat Ini,Stok Min,Harga Satuan,Total Nilai,Supplier,Status\n";
      inventory.forEach(i => {
        if (!i.isSoftDeleted) {
          csvContent += `"${i.id}","${i.name}","${i.category}","${i.storageLocation}","${i.initialQty}","${i.currentQty}","${i.minStock}","${i.unitPrice}","${i.currentQty * i.unitPrice}","${i.supplier}","${i.status}"\n`;
        }
      });
    } else if (reportType === "loss") {
      title = "LAPORAN_KERUSAKAN_KEHILANGAN_LOSS.csv";
      csvContent = "Tanggal,Nama Item,Kategori,Qty Lost,Nilai Kerugian,Penyebab,Penanggungjawab,Pelapor,Timestamp\n";
      lossReports.forEach(l => {
        csvContent += `"${l.date}","${l.itemName}","${l.category}","${l.qtyLost}","${l.lossValue}","${l.cause}","${l.staffInCharge}","${l.reportedBy}","${l.timestamp}"\n`;
      });
    } else if (reportType === "breakage") {
      title = "LAPORAN_PECAHAN_BREAKAGE.csv";
      csvContent = "Tanggal,Nama Item,Kategori,Qty Pecah,Nilai Kerugian,Penyebab,Pelapor,Timestamp\n";
      breakageReports.forEach(b => {
        csvContent += `"${b.date}","${b.itemName}","${b.category}","${b.qtyBroken}","${b.lossValue}","${b.cause}","${b.staffReporter}","${b.timestamp}"\n`;
      });
    } else {
      title = "KPI_STAFF_AMORTISASI_SMALLWARES.csv";
      csvContent = "Nama Staff,Role,Akurasi Jurnal Count (%),Total Hilang Diawasi,Total Pecah Dilaporkan,Kepatuhan Jadwal Audit,Skor KPI Staff Akhir\n";
      // Calc simple KPI per user
      const usersList = state.users || [];
      usersList.forEach(u => {
        const myLosses = lossReports.filter(l => l.staffInCharge === u.name).length;
        const myBreakages = breakageReports.filter(b => b.staffReporter === u.name).length;
        const compliance = 100 - (myLosses * 15 + myBreakages * 10);
        const kpiValue = Math.max(40, Math.min(100, compliance));
        csvContent += `"${u.name}","${u.role}","98.5%","${myLosses} kali","${myBreakages} kali","100%","${kpiValue} / 100"\n`;
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
    triggerToast(`✓ Dokumen berekstensi CSV berhasil dibuat: ${title}`);
  };

  // ----------------------------------------------------
  // LOSS & BREAKAGE CALCULATORS
  // ----------------------------------------------------
  const getTotalLossCost = () => {
    return lossReports.reduce((sum, item) => sum + item.lossValue, 0);
  };

  const getTotalBreakageCost = () => {
    return breakageReports.reduce((sum, item) => sum + item.lossValue, 0);
  };

  const getTodayLossCost = () => {
    const today = new Date().toISOString().split("T")[0];
    const lossToday = lossReports.filter(l => l.date === today).reduce((sum, i) => sum + i.lossValue, 0);
    const breakageToday = breakageReports.filter(b => b.date === today).reduce((sum, i) => sum + i.lossValue, 0);
    return {
      loss: lossToday,
      breakage: breakageToday,
      total: lossToday + breakageToday
    };
  };

  const todayStats = getTodayLossCost();
  const totalCostOverall = getTotalLossCost() + getTotalBreakageCost();

  // Search filter implementation
  const filteredItems = inventory.filter(item => {
    if (item.isSoftDeleted) return false;
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchStatus = selectedStatus === "All" || item.status === selectedStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6 text-amber-50 animate-fadeIn font-sans">
      
      {/* 🔴 Top Alert Panel for Critical Levels */}
      {inventory.some(i => i.currentQty <= i.minStock && !i.isSoftDeleted) && (
        <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-red-400 h-5 w-5 animate-bounce shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-red-100">Batas Stok Kritis Terlampaui:</span> Beberapa item operasional gelas/alat barista berada di bawah kuota minimum. Pemesanan ulang dianjurkan.
          </div>
          <button 
            onClick={() => { setSubTab("inventory"); setSelectedStatus("All"); setSearchTerm(""); }}
            className="text-[10px] text-red-300 underline font-black uppercase hover:text-red-100 cursor-pointer"
          >
            Lihat Stok
          </button>
        </div>
      )}

      {/* 🔮 Dashboard Core Metrics & Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setSubTab("dashboard")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
            subTab === "dashboard" ? "bg-[#D4A853] text-[#1a0a00] border-amber-300" : "bg-black/35 border-amber-500/10 hover:bg-amber-500/10 text-amber-100"
          }`}
        >
          📈 Dashboard Monitoring
        </button>
        <button
          onClick={() => setSubTab("inventory")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
            subTab === "inventory" ? "bg-[#D4A853] text-[#1a0a00] border-amber-300" : "bg-black/35 border-amber-500/10 hover:bg-amber-500/10 text-amber-100"
          }`}
        >
          🥛 Master Data &amp; Opname
        </button>
        <button
          onClick={() => setSubTab("loss")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
            subTab === "loss" ? "bg-[#D4A853] text-[#1a0a00] border-amber-300" : "bg-black/35 border-amber-500/10 hover:bg-amber-500/10 text-amber-100"
          }`}
        >
          🛍️ Laporan Kehilangan (Loss)
        </button>
        <button
          onClick={() => setSubTab("breakage")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
            subTab === "breakage" ? "bg-[#D4A853] text-[#1a0a00] border-amber-300" : "bg-black/35 border-amber-500/10 hover:bg-amber-500/10 text-amber-100"
          }`}
        >
          💔 Laporan Kerusakan (Pecah)
        </button>
        <button
          onClick={() => setSubTab("kpi")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
            subTab === "kpi" ? "bg-[#D4A853] text-[#1a0a00] border-amber-300" : "bg-black/35 border-amber-500/10 hover:bg-amber-500/10 text-amber-100"
          }`}
        >
          🏆 KPI &amp; Dampak Staff
        </button>
        <button
          onClick={() => setSubTab("audit")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
            subTab === "audit" ? "bg-[#D4A853] text-[#1a0a00] border-amber-300" : "bg-black/35 border-amber-500/10 hover:bg-amber-500/10 text-amber-100"
          }`}
        >
          📜 Audit Trails Log
        </button>
      </div>

      {/* -------------------- SUB TAB: DASHBOARD -------------------- */}
      {subTab === "dashboard" && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-gradient-to-br from-[#1b0b02] to-[#251001] border border-[#D4A853]/25 rounded-3xl relative overflow-hidden">
              <div className="absolute top-2 right-2 text-3xl opacity-10 font-bold">TODAY</div>
              <span className="text-[10px] text-amber-200/50 uppercase font-mono tracking-widest block mb-1">Hari Ini (Loss &amp; Pecah)</span>
              <p className="text-2xl font-serif text-[#D4A853] font-bold">
                Rp{(todayStats.total).toLocaleString()}
              </p>
              <div className="mt-2.5 text-[11px] text-amber-100/60 leading-normal flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500"></span> Hilang: Rp{todayStats.loss.toLocaleString()} | Pecah: Rp{todayStats.breakage.toLocaleString()}
              </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-[#110501] to-[#1a0a00] border border-amber-500/10 rounded-3xl relative overflow-hidden">
              <div className="absolute top-2 right-2 text-3xl opacity-10 font-bold">TOTAL LOSS</div>
              <span className="text-[10px] text-amber-200/50 uppercase font-mono tracking-widest block mb-1">Kumulatif Kehilangan (Loss)</span>
              <p className="text-2xl font-serif text-amber-50 font-bold">
                Rp{getTotalLossCost().toLocaleString()}
              </p>
              <div className="mt-2.5 text-[11px] text-[#D4A853] flex items-center gap-1">
                Tercatat {lossReports.reduce((sum, item) => sum + item.qtyLost, 0)} item hilang dilingkungan outlet.
              </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-[#110501] to-[#1a0a00] border border-amber-500/10 rounded-3xl relative overflow-hidden">
              <div className="absolute top-2 right-2 text-3xl opacity-10 font-bold">TOTAL BREAKAGE</div>
              <span className="text-[10px] text-amber-200/50 uppercase font-mono tracking-widest block mb-1">Kumulatif Pecah (Breakage)</span>
              <p className="text-2xl font-serif text-amber-50 font-bold">
                Rp{getTotalBreakageCost().toLocaleString()}
              </p>
              <div className="mt-2.5 text-[11px] text-[#D4A853] flex items-center gap-1">
                Tercatat {breakageReports.reduce((sum, item) => sum + item.qtyBroken, 0)} unit glassware/piring pecah.
              </div>
            </div>
          </div>

          {/* Core bento rows */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left bento: loss trend & top breakdowns */}
            <div className="lg:col-span-8 bg-[#120501]/90 border border-white/5 rounded-3xl p-6 space-y-6">
              
              <div>
                <h4 className="font-serif text-base font-bold text-[#D4A853]">🥛 Tren Akumulasi Kerugian Berdasarkan Kategori Alat</h4>
                <p className="text-[11px] text-amber-100/50">Representasi visual kerugian finansial per kategori aset operasional kedai.</p>
              </div>

              {/* Custom CSS charts representation */}
              <div className="space-y-4">
                {["Glassware", "Bar Equipment", "Kitchen Equipment", "Service Equipment"].map(category => {
                  const lossSum = lossReports.filter(l => l.category === category).reduce((sum, i) => sum + i.lossValue, 0);
                  const breakageSum = breakageReports.filter(b => b.category === category).reduce((sum, i) => sum + i.lossValue, 0);
                  const totalCategoryLoss = lossSum + breakageSum;
                  
                  // Compute ratio relative to maximum possible or total cost overall
                  const pct = totalCostOverall > 0 ? (totalCategoryLoss / totalCostOverall) * 100 : 0;

                  return (
                    <div key={category} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-amber-100">{category}</span>
                        <span className="text-[11px] font-mono text-amber-300">Rp{totalCategoryLoss.toLocaleString()} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                          style={{ width: `${Math.max(3, pct)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Alerts inside dashboard */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-red-300">SIRENE PERINGATAN OUTLET</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                    <span className="text-[9px] text-[#D4A853] font-mono block">AMORTISASI GELAS BULANAN</span>
                    <p className="text-xs text-amber-100 mt-1 font-semibold leading-relaxed">
                      Barista melaporkan total {breakageReports.filter(b => b.category === "Glassware").reduce((sum, i) => sum + i.qtyBroken, 0)} gelas pecah bulan ini. Target toleransi: &lt; 15 unit.
                    </p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                    <span className="text-[9px] text-[#D4A853] font-mono block">KOMITMEN ALAT KITCHEN</span>
                    <p className="text-xs text-amber-100 mt-1 font-semibold leading-relaxed">
                      Zero-theft policy berjalan prima. Semua pisau dapur profesional dan tray dipastikan 100% terekam posisinya malam ini.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right bento: Top 10 items lost / broken */}
            <div className="lg:col-span-4 bg-[#120501]/90 border border-white/5 rounded-3xl p-6 space-y-5">
              <div>
                <h4 className="font-serif text-base font-bold text-amber-100">🚫 Top Item Rusak &amp; Pecah</h4>
                <p className="text-[11px] text-amber-100/50">Daftar item dengan frekuensi kerusakan teratas.</p>
              </div>

              <div className="space-y-3">
                {inventory.slice(0, 6).map(item => {
                  const lostTotal = lossReports.filter(l => l.itemId === item.id).reduce((sum, i) => sum + i.qtyLost, 0);
                  const brokenTotal = breakageReports.filter(b => b.itemId === item.id).reduce((sum, i) => sum + i.qtyBroken, 0);
                  const totalIncident = lostTotal + brokenTotal;

                  if (totalIncident === 0) return null;

                  return (
                    <div key={item.id} className="p-2.5 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="block font-semibold text-amber-200">{item.name}</span>
                        <span className="text-[10px] text-amber-100/40 font-mono italic">{item.category}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-300 rounded font-mono font-bold">
                        {totalIncident} Cacat
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gradient-to-r from-amber-500/5 to-transparent border-l-2 border-[#D4A853] p-3 text-xs leading-relaxed text-amber-200/70">
                ⭐ <strong className="text-amber-100">Tips Operasional:</strong> Gunakan alas karet (matras bar) khusus di sekeliling knockbox barista guna menyerap getaran benturan, menurunkan insiden gelas retak hingga 45%!
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------- SUB TAB: MASTER DATA & OPNAME -------------------- */}
      {subTab === "inventory" && (
        <div className="space-y-6">
          <div className="bg-[#120501]/90 border border-[#D4A853]/15 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h4 className="font-serif text-base font-bold text-[#D4A853] flex items-center gap-2">🥛 Master Data Aset Operasional &amp; Stock Opname</h4>
                <p className="text-[11px] text-amber-100/50">Pilih rentang tingkat audit (Daily, Weekly, Monthly) dan catat jumlah aktual alat kerja fisik kedai.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isManagement && (
                  <button
                    onClick={() => { setEditingItem(null); setFormName(""); setFormLocation(""); setShowItemForm(true); }}
                    className="bg-amber-500 text-amber-950 font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition hover:bg-amber-400"
                  >
                    <Plus size={14} /> Tambah Item Master
                  </button>
                )}
                <button
                  onClick={() => handleExportCSV("inventory")}
                  className="bg-amber-500/10 border border-amber-500/20 text-amber-100 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer hover:bg-amber-500/15"
                >
                  <FileSpreadsheet size={14} /> Ekspor Master csv
                </button>
              </div>
            </div>

            {/* Audit Level Toggle */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-amber-300 font-mono uppercase block">SISTEM AUDIT STOCK OPNAME</span>
                <p className="text-xs text-amber-100">Modus penghitungan: <strong className="text-amber-50">{auditType} Count</strong></p>
              </div>
              <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5 shrink-0">
                <button 
                  onClick={() => setAuditType("Daily")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${auditType === "Daily" ? "bg-amber-500 text-amber-950" : "text-amber-200 hover:bg-white/5"}`}
                >
                  Hari H (Daily Count)
                </button>
                <button 
                  onClick={() => setAuditType("Weekly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${auditType === "Weekly" ? "bg-amber-500 text-amber-950" : "text-amber-200 hover:bg-white/5"}`}
                >
                  Pekan (Weekly Audit)
                </button>
                <button 
                  onClick={() => setAuditType("Monthly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${auditType === "Monthly" ? "bg-amber-500 text-amber-950" : "text-amber-200 hover:bg-white/5"}`}
                >
                  Bulan (Monthly Audit)
                </button>
              </div>
            </div>

            {/* Filters panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-amber-100/35 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari ID, nama item, atau supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/40 border border-white/5 focus:border-amber-500/25 rounded-xl pl-9 pr-3 py-2 text-xs text-amber-100 outline-none w-full"
                />
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none w-full font-semibold"
                >
                  <option value="All">Semua Kategori</option>
                  <option value="Glassware">Glassware (Gelas/Cangkir)</option>
                  <option value="Bar Equipment">Bar Equipment (Alat Barista)</option>
                  <option value="Kitchen Equipment">Kitchen Equipment (Alat Kitchen)</option>
                  <option value="Service Equipment">Service Equipment (Alat Service)</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-amber-100 outline-none w-full font-semibold"
                >
                  <option value="All">Semua Status Fisik</option>
                  <option value="Active">Active</option>
                  <option value="Broken">Broken</option>
                  <option value="Lost">Lost</option>
                  <option value="Repair">Repair</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            {/* Dynamic Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-amber-300 font-mono text-[10px] uppercase">
                    <th className="py-2.5">ID / Nama Item</th>
                    <th className="py-2.5">Kategori</th>
                    <th className="py-2.5">Lokasi Simpan</th>
                    <th className="py-2.5 text-center">Stok Awal</th>
                    <th className="py-2.5 text-center">Batas Min</th>
                    <th className="py-2.5 text-center">Stok Saat Ini (Koreksi)</th>
                    <th className="py-2.5 text-center">Selisih</th>
                    <th className="py-2.5">Harga</th>
                    <th className="py-2.5 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const workingQty = countingQtys[item.id] !== undefined ? countingQtys[item.id] : item.currentQty;
                    const diff = workingQty - item.currentQty;

                    return (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                        <td className="py-3">
                          <div className="font-semibold text-amber-100">{item.name}</div>
                          <div className="font-mono text-[9px] text-amber-100/35">{item.id} | Supplier: {item.supplier}</div>
                        </td>
                        <td className="py-3">
                          <span className="text-[10px] bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 font-bold">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 text-[11px] text-amber-100/60 font-mono">{item.storageLocation}</td>
                        <td className="py-3 text-center font-bold font-mono text-amber-100/70">{item.initialQty}</td>
                        <td className="py-3 text-center font-mono text-red-300">{item.minStock}</td>
                        
                        {/* Interactive stock input for audit */}
                        <td className="py-2 text-center w-[160px]">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleQtyCountChange(item.id, workingQty - 1)}
                              className="w-6 h-6 rounded bg-black/60 border border-white/5 flex items-center justify-center font-bold hover:bg-white/5 cursor-pointer text-amber-300"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={workingQty}
                              onChange={(e) => handleQtyCountChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-12 bg-black border border-white/10 text-center rounded text-xs p-1 text-amber-50 font-bold outline-none"
                            />
                            <button
                              onClick={() => handleQtyCountChange(item.id, workingQty + 1)}
                              className="w-6 h-6 rounded bg-black/60 border border-white/5 flex items-center justify-center font-bold hover:bg-white/5 cursor-pointer text-amber-300"
                            >
                              +
                            </button>
                          </div>
                          {workingQty !== item.currentQty && (
                            <input 
                              type="text"
                              placeholder="Tambah catatan koreksi..."
                              value={countingNotes[item.id] || ""}
                              onChange={(e) => handleNotesCountChange(item.id, e.target.value)}
                              className="mt-1 bg-black border border-amber-500/20 text-[9px] rounded p-1 text-amber-100 w-full outline-none"
                            />
                          )}
                        </td>

                        <td className="py-3 text-center">
                          {diff === 0 ? (
                            <span className="text-amber-100/40 font-mono font-bold">-</span>
                          ) : diff > 0 ? (
                            <span className="text-emerald-400 font-mono font-bold">+{diff}</span>
                          ) : (
                            <span className="text-red-400 font-mono font-bold">{diff}</span>
                          )}
                        </td>

                        <td className="py-3 text-amber-100 font-mono font-bold">
                          Rp{item.unitPrice.toLocaleString()}
                        </td>

                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isManagement ? (
                              <>
                                <button
                                  onClick={() => handleStartEdit(item)}
                                  className="p-1.5 hover:bg-white/5 rounded text-amber-300 hover:text-amber-100 transition cursor-pointer"
                                  title="Edit Master Barang"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleSoftDeleteItem(item.id)}
                                  className="p-1.5 hover:bg-red-500/10 rounded text-red-400 hover:text-red-300 transition cursor-pointer"
                                  title="Hapus Sementara (Soft Delete)"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            ) : (
                              <span className="text-[9px] text-[#D4A853] font-mono italic">Protected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions for stock checking */}
            <div className="pt-4 flex items-center justify-end">
              <button
                onClick={handleSubmitStockOpname}
                className="bg-[#D4A853] hover:bg-[#c39843] text-black font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle size={15} /> Finalisasi &amp; Simpan Audit Selisih
              </button>
            </div>

          </div>

          {/* MANAGER'S ADD / EDIT MODAL ACCORDION */}
          {showItemForm && (
            <div className="bg-[#120501]/95 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="font-serif text-base font-bold text-[#D4A853]">
                  {editingItem ? `✏️ Edit Master Barang: ${editingItem.name}` : "🥛 Tambah Master Item Baru"}
                </h4>
                <button onClick={() => setShowItemForm(false)} className="text-amber-100 hover:text-amber-300 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveItemForm} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-amber-100">Nama Barang</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Espresso Cup (80ml)"
                    className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-amber-100">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full font-semibold"
                  >
                    <option value="Glassware">Glassware (Gelas/Cangkir)</option>
                    <option value="Bar Equipment">Bar Equipment (Alat Barista)</option>
                    <option value="Kitchen Equipment">Kitchen Equipment (Alat Kitchen)</option>
                    <option value="Service Equipment">Service Equipment (Alat Service)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-amber-100">Lokasi Penyimpanan</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Contoh: Bar Counter Shelf A"
                    className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-amber-100">Supplier Korespondensi</label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="Contoh: Kaca Masindo PT"
                    className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-amber-100">Jumlah Awal (Initial Qty)</label>
                  <input
                    type="number"
                    value={formInitial}
                    onChange={(e) => { setFormInitial(parseInt(e.target.value) || 0); setFormCurrent(parseInt(e.target.value) || 0); }}
                    className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-amber-100">Peringatan Batas Stok Sisa Minimum (Min Stock)</label>
                  <input
                    type="number"
                    value={formMin}
                    onChange={(e) => setFormMin(parseInt(e.target.value) || 0)}
                    className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-amber-100">Estimasi Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
                    className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-[#D4A853] outline-none w-full font-mono font-bold"
                  />
                </div>

                <div className="md:col-span-2 pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowItemForm(false)}
                    className="px-4 py-2 bg-black hover:bg-white/5 text-amber-100 border border-white/10 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 text-amber-950 font-black rounded-xl"
                  >
                    Simpan Master Item
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* -------------------- SUB TAB: LOSS REPORT -------------------- */}
      {subTab === "loss" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          
          {/* Left panel loss registration form */}
          <div className="lg:col-span-4 bg-[#120501]/95 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-white/5 pb-2">
              <h4 className="font-serif text-base font-bold text-amber-100">🛍️ Formulir Laporan Barang Hilang</h4>
              <p className="text-[11px] text-amber-100/40">Kehilangan dicatatkan otomatis dikurangi dari saldo stok.</p>
            </div>

            <form onSubmit={handleReportLoss} className="space-y-4">
              <div className="space-y-1">
                <label className="text-amber-100">Pilih Barang Hilang</label>
                <select
                  value={selectedLossItem}
                  onChange={(e) => setSelectedLossItem(e.target.value)}
                  className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full font-semibold"
                >
                  <option value="">-- Silakan Pilih Item --</option>
                  {inventory.filter(i => !i.isSoftDeleted).map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} [Stok: {i.currentQty}] [Rp{i.unitPrice.toLocaleString()}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-amber-100">Jumlah Hilang (Qty)</label>
                <input
                  type="number"
                  min="1"
                  value={lossQty}
                  onChange={(e) => setLossQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-amber-100">Penyebab Kehilangan</label>
                <select
                  value={lossCause}
                  onChange={(e) => setLossCause(e.target.value as any)}
                  className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full font-semibold"
                >
                  <option value="Missing">Hilang Misterius (Missing)</option>
                  <option value="Misplaced">Salah Letak (Misplaced)</option>
                  <option value="Theft">Pencurian (Theft)</option>
                  <option value="Operational Loss">Keteledoran Operasional (Operational Loss)</option>
                  <option value="Unknown">Tidak Diketahui (Unknown)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-amber-100">Penanggung Jawab / Saksi Terakhir</label>
                <input
                  type="text"
                  placeholder="Nama staff pelaksana shift..."
                  value={lossStaffInCharge}
                  onChange={(e) => setLossStaffInCharge(e.target.value)}
                  className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                />
              </div>

              {/* Simulated Camera Evidence */}
              <div className="space-y-1">
                <label className="text-amber-100">Lampiran Foto Bukti Kerusakan / Area</label>
                <div className="border border-dashed border-white/10 rounded-2xl p-4 bg-black/40 text-center space-y-2">
                  <Camera className="mx-auto h-7 w-7 text-amber-100/40" />
                  <div className="text-[10px] text-amber-100/60 leading-normal">
                    Klik untuk simulasi unggah foto dari kamera HP / Tablet outlet
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLossPhotoEvidence("https://images.unsplash.com/photo-1541167760496-1628856ab772");
                      triggerToast("📸 Foto bukti berhasil disimulasikan & ditautkan.");
                    }}
                    className="px-2.5 py-1 bg-amber-500 text-amber-950 rounded text-[9px] font-bold"
                  >
                    Unggah simulasi_evidence.jpg
                  </button>
                  {lossPhotoEvidence && <div className="text-[9px] text-[#D4A853] font-bold">✓ Terlampaui di CDN database system</div>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#D4A853] hover:bg-[#c39843] text-black font-black py-2.5 rounded-xl transition cursor-pointer"
              >
                Kirim Laporan Kehilangan
              </button>
            </form>

          </div>

          {/* Right panel list of reported losses */}
          <div className="lg:col-span-8 bg-[#120501]/95 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <h4 className="font-serif text-base font-bold text-amber-100">📜 Histori Jurnal Kehilangan (Soft-delete Protected)</h4>
                <p className="text-[11px] text-amber-100/40">Log audit real-time barang hilang outlet tahun 2026.</p>
              </div>
              <button 
                onClick={() => handleExportCSV("loss")}
                className="px-3 py-1 bg-black text-amber-100 border border-white/10 rounded text-[10px] font-bold cursor-pointer"
              >
                Ekspor csv
              </button>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {lossReports.filter(l => !l.isSoftDeleted).map(report => (
                <div key={report.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-amber-100 text-xs">{report.itemName}</span>
                      <span className="text-[9px] bg-red-500/10 text-red-300 font-mono font-bold uppercase border border-red-500/20 px-1.5 py-0.5 rounded">
                        Loss: {report.qtyLost} Pcs
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-amber-100/50 mt-1.5 font-mono">
                      <div>Status Hilang: <strong className="text-amber-100">{report.cause}</strong></div>
                      <div>Penanggungjawab: <strong className="text-amber-100">{report.staffInCharge}</strong></div>
                      <div>Nilai Amortisasi: <strong className="text-[#D4A853]">Rp{report.lossValue.toLocaleString()}</strong></div>
                      <div>Dilaporkan oleh: <strong className="text-amber-100">{report.reportedBy}</strong></div>
                    </div>

                    <span className="text-[9px] text-amber-100/20 block font-mono">Timestamp: {report.timestamp} | Lokasi: {report.outletLocation}</span>
                  </div>

                  {report.imageUrl && (
                    <img 
                      src={report.imageUrl} 
                      alt="Loss Evidence" 
                      className="h-14 w-14 object-cover rounded-xl border border-white/10 shrink-0 shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* -------------------- SUB TAB: BREAKAGE REPORT -------------------- */}
      {subTab === "breakage" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          
          {/* Left breakage reporting form */}
          <div className="lg:col-span-4 bg-[#120501]/95 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-white/5 pb-2">
              <h4 className="font-serif text-base font-bold text-amber-100">💔 Formulir Laporan Gelas/Alat Pecah</h4>
              <p className="text-[11px] text-amber-100/40">Laporkan glassware yang retak/pecah akibat kecelakaan.</p>
            </div>

            <form onSubmit={handleReportBreakage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-amber-100">Nama Barang Pecah</label>
                <select
                  value={selectedBreakageItem}
                  onChange={(e) => setSelectedBreakageItem(e.target.value)}
                  className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full font-semibold"
                >
                  <option value="">-- Silakan Pilih Item --</option>
                  {inventory.filter(i => !i.isSoftDeleted).map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} [Stok: {i.currentQty}] [Rp{i.unitPrice.toLocaleString()}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-amber-100">Jumlah Pecah / Retak (Qty)</label>
                <input
                  type="number"
                  min="1"
                  value={breakageQty}
                  onChange={(e) => setBreakageQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-amber-100">Kategori Penyebab Pecah</label>
                <select
                  value={breakageCause}
                  onChange={(e) => setBreakageCause(e.target.value as any)}
                  className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full font-semibold"
                >
                  <option value="Accident">Accident (Kecelakaan Tidak Sengaja)</option>
                  <option value="Customer Accident">Customer Accident (Tamu Menyenggol Gelas)</option>
                  <option value="Operational Error">Operational Error (Kelalaian Cuci/Barista)</option>
                  <option value="Wear and Tear">Faktor Usia (Wear and Tear)</option>
                  <option value="Manufacturing Defect">Cacat Produksi / Retak Rambut (Manufacturing Defect)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-amber-100">Pelapor / Saksi Kejadian</label>
                <input
                  type="text"
                  placeholder="Nama lengkap pahlawan pelapor..."
                  value={breakageStaff}
                  onChange={(e) => setBreakageStaff(e.target.value)}
                  className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                />
              </div>

              {/* Simulated photo upload */}
              <div className="space-y-1">
                <label className="text-amber-100">Lampiran Foto Pecahan (Evidence)</label>
                <div className="border border-dashed border-white/10 rounded-2xl p-4 bg-black/40 text-center space-y-2">
                  <Camera className="mx-auto h-7 w-7 text-amber-100/40" />
                  <div className="text-[10px] text-amber-100/60 leading-normal">
                    Pilih file pecahan guna mengunggah bukti ke sistem cloud.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBreakagePhotoEvidence("https://images.unsplash.com/photo-1579546929518-9e396f3cc809");
                      triggerToast("📸 Foto pecahan berhasil diproses & ditautkan.");
                    }}
                    className="px-2.5 py-1 bg-amber-500 text-amber-950 rounded text-[9px] font-bold"
                  >
                    Simulasikan pecah_glass.jpg
                  </button>
                  {breakagePhotoEvidence && <div className="text-[9px] text-emerald-400 font-bold">✓ Terekam dalam server operasional</div>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#D4A853] hover:bg-[#c39843] text-black font-black py-2.5 rounded-xl transition cursor-pointer"
              >
                Kirim Laporan Kerusakan
              </button>
            </form>
          </div>

          {/* List breakages */}
          <div className="lg:col-span-8 bg-[#120501]/95 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <h4 className="font-serif text-base font-bold text-amber-100">📜 Log Kasus Glassware Pecah (Amortisasi Kasus)</h4>
                <p className="text-[11px] text-amber-100/40">Log kecelakaan operasional harian teridentifikasi.</p>
              </div>
              <button 
                onClick={() => handleExportCSV("breakage")}
                className="px-3 py-1 bg-black text-amber-100 border border-white/10 rounded text-[10px] font-bold cursor-pointer"
              >
                Ekspor csv
              </button>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {breakageReports.filter(b => !b.isSoftDeleted).map(report => (
                <div key={report.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-amber-100 text-xs">{report.itemName}</span>
                      <span className="text-[9px] bg-amber-500/10 text-amber-300 font-mono font-bold uppercase border border-amber-500/20 px-1.5 py-0.5 rounded">
                        Pecah: {report.qtyBroken} Unit
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-amber-100/50 mt-1.5 font-mono">
                      <div>Klasifikasi Retak: <strong className="text-amber-100">{report.cause}</strong></div>
                      <div>Saksi Pelapor: <strong className="text-amber-100">{report.staffReporter}</strong></div>
                      <div>Nilai Amortisasi: <strong className="text-[#D4A853]">Rp{report.lossValue.toLocaleString()}</strong></div>
                      <div>Perekaman Kejadian: <strong className="text-amber-100">{report.date}</strong></div>
                    </div>

                    <span className="text-[9px] text-amber-100/20 block font-mono">Timestamp: {report.timestamp} | Outlet: {report.outletLocation}</span>
                  </div>

                  {report.imageUrl && (
                    <img 
                      src={report.imageUrl} 
                      alt="Breakage Evidence" 
                      className="h-14 w-14 object-cover rounded-xl border border-white/10 shrink-0 shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* -------------------- SUB TAB: KPI STAFF INTEGRATION -------------------- */}
      {subTab === "kpi" && (
        <div className="bg-[#120501]/95 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h4 className="font-serif text-base font-bold text-[#D4A853] flex items-center gap-2">🏆 Integrasi KPI Staff &amp; Amortisasi Nilai Inventaris</h4>
            <p className="text-[11px] text-amber-100/50">Kehilangan (Loss) dan Gelas Pecah (Breakage) yang berlebih secara berkala menurunkan nilai compliance staff.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3 leading-relaxed">
              <span className="text-[10px] text-[#D4A853] font-mono block">BOBOT PENILAIAN KPI AMORTISASI INDIVIDU</span>
              <p className="text-[11px] text-amber-100/70">
                Guna memitigasi keteledoran kerja, sistem mengukur skor kepatuhan staff harian:
              </p>
              <ul className="list-disc pl-4 space-y-2 text-amber-105/60 text-[11px]">
                <li><strong className="text-amber-100">Akurasi Roster Count (+40%):</strong> Kehadiran tepat waktu dalam audit opname mingguan.</li>
                <li><strong className="text-red-400">Total Alat Hilang (-15% per kasus):</strong> Kasus hilangnya scale, tamper, atau piring di bawah sanksi shift.</li>
                <li><strong className="text-yellow-400">Gelas Pecah berlebih (-10% per kasus):</strong> Gelas pecah melampaui ambang batas aman.</li>
              </ul>
              <div className="pt-2">
                <button
                  onClick={() => handleExportCSV("kpi")}
                  className="bg-amber-500/10 text-amber-100 hover:bg-amber-500/15 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Download Rekap KPI csv
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] text-[#D4A853] font-mono block">SKOR KPI STAFF AKTIF - KEBIJAKAN INVENTARIS</span>
              
              <div className="space-y-3">
                {(state.users || []).slice(0, 5).map(u => {
                  const myLosses = lossReports.filter(l => l.staffInCharge === u.name).length;
                  const myBreakages = breakageReports.filter(b => b.staffReporter === u.name).length;
                  const compliance = 100 - (myLosses * 15 + myBreakages * 10);
                  const kpiValue = Math.max(40, Math.min(100, compliance));

                  return (
                    <div key={u.id} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <strong className="text-amber-100 text-xs">{u.name}</strong>
                          <span className="mx-2 text-[10px] text-amber-105/40">({u.role})</span>
                        </div>
                        <span className={`font-mono font-bold ${kpiValue >= 90 ? "text-emerald-400" : kpiValue >= 75 ? "text-[#D4A853]" : "text-red-400"}`}>
                          Skor: {kpiValue} / 100
                        </span>
                      </div>
                      <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${kpiValue >= 90 ? "bg-emerald-500" : kpiValue >= 75 ? "bg-amber-400" : "bg-red-500"}`}
                          style={{ width: `${kpiValue}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-amber-100/50 flex justify-between">
                        <span>Total Kehilangan di Shift: {myLosses} kali</span>
                        <span>Kasus Piring/Gelas Pecah: {myBreakages} kali</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* -------------------- SUB TAB: AUDIT PROTOCOL -------------------- */}
      {subTab === "audit" && (
        <div className="bg-[#120501]/95 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
          <div className="border-b border-white/5 pb-2">
            <h4 className="font-serif text-base font-bold text-[#D4A853]">📜 Log Aktivitas &amp; Backup Cloud Harian (Audit Trails)</h4>
            <p className="text-[11px] text-amber-100/40">Semua riwayat mutasi sediaan gelas, loss, dan breakage terekam permanen.</p>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-amber-100/40">
                  <span>Waktu: {log.timestamp}</span>
                  <span className="text-[#D4A853]">Aktor: {log.userName}</span>
                </div>
                <div>
                  <span className="text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 rounded px-1 text-[10px] whitespace-nowrap">{log.action}</span>
                  <p className="text-amber-200 mt-1 leading-relaxed">{log.details}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-4 bg-gradient-to-r from-amber-500/5 to-transparent p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-amber-50">🛡️ Kebijakan Soft Delete Keamanan Data:</span>
              <p className="text-amber-100/60 leading-normal mt-0.5">Sesuai SOP, perubahan inventori tidak dapat dihapus secara permanen di tingkat staff, guna mencegah reka ulang data historis tanpa seizin Owner.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded shrink-0 uppercase">☁️ Backup Cloud Terhubung</span>
          </div>
        </div>
      )}

    </div>
  );
}
