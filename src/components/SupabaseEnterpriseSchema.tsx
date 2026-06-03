import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Shield, 
  Database, 
  Play, 
  Award, 
  Terminal, 
  Sliders, 
  Coffee, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Users, 
  CheckSquare, 
  FileText, 
  LayoutDashboard, 
  DollarSign, 
  Table, 
  Activity, 
  Clock, 
  HelpCircle, 
  HardDrive, 
  ShoppingCart, 
  Check, 
  CreditCard, 
  Split, 
  AlertCircle, 
  Eye, 
  Settings, 
  Wifi, 
  Smartphone,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Percent,
  ListTodo
} from "lucide-react";

export default function SupabaseEnterpriseSchema() {
  const [activeSubTab, setActiveSubTab] = useState<"sql" | "rls" | "sync" | "whatsapp" | "playground">("playground");
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Simulated Database State for Playground
  const [simulatedRole, setSimulatedRole] = useState<"Owner" | "Manager" | "Cashier" | "Barista" | "Service" | "Admin">("Cashier");
  const [simulatedBranch, setSimulatedBranch] = useState<string>("Jakarta Central Plaza (HQ)");
  const [simulatedTenantId, setSimulatedTenantId] = useState<string>("tenant_coffee_franchise_jkt01");
  
  // Real-time Stock State
  const [liveStock, setLiveStock] = useState([
    { code: "RAW-BEANS-01", name: "House Blend Coffee Beans (Flores/Gayo)", qty: 4500, unit: "gram", minLevel: 1000 },
    { code: "RAW-MILK-02", name: "Premium Fresh Meadow Milk", qty: 24, unit: "liter", minLevel: 8 },
    { code: "RAW-CUP-03", name: "Hot Paper Cup 8oz (Double Wall)", qty: 120, unit: "pcs", minLevel: 50 },
    { code: "RAW-SYRUP-04", name: "Gourmet Vanilla Madagascar Extract", qty: 3200, unit: "ml", minLevel: 500 },
  ]);

  // POS State
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("Meja 05");
  const [targetMergeTable, setTargetMergeTable] = useState<string>("Meja 08");
  const [splitCount, setSplitCount] = useState<number>(2);
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "generating" | "paid">("unpaid");
  const [kitchenStatus, setKitchenStatus] = useState<"waiting" | "printed" | "processing" | "served">("waiting");
  
  // Playground Actions Logs & Feed
  const [sysLogs, setSysLogs] = useState<{ id: string; time: string; type: string; message: string }[]>([
    { id: "1", time: "12:44:02", type: "system", message: "Supabase RLS Listener Online: Aksi terisolasi pada branch_id." },
    { id: "2", time: "12:44:31", type: "pos", message: "Cashier Terminal #1 initialized on Port 3000." }
  ]);

  // Asset Logs
  const [assetLossLogs, setAssetLossLogs] = useState([
    { id: "AST-1", date: "2026-06-03", name: "Espresso Glass cup (Gelas Sloki)", type: "Broken", cause: "Terlepas jatuh dari tangan barista saat serving", reporter: "Barista Budi", cost: 35000, status: "Denda Diampuni" },
    { id: "AST-2", date: "2026-06-02", name: "Stainless Pitcher Milk 600ml", type: "Lost", cause: "Tertukar / hilang setelah cleaning sore", reporter: "Service Andi", cost: 185000, status: "Persetujuan Ganti" }
  ]);

  // Manager Schedule
  const [managerPrs, setManagerPrs] = useState([
    { id: "PR-602", date: "2026-06-03", supplier: "PT Multi Kopi Nusantara", total: 1450000, status: "Menunggu Approval Owner" }
  ]);

  // Form states for Playground inputs
  const [newPrItem, setNewPrItem] = useState("");
  const [newPrQty, setNewPrQty] = useState(1);
  const [newAssetReport, setNewAssetReport] = useState("Espresso Glass cup (Gelas Sloki)");
  const [newAssetType, setNewAssetType] = useState<"Broken" | "Lost">("Broken");
  const [newAssetCause, setNewAssetCause] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const addLog = (type: string, message: string) => {
    const time = new Date().toLocaleTimeString("id-ID", { hour12: false });
    setSysLogs(prev => [{ id: Math.random().toString(), time, type, message }, ...prev].slice(0, 20));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Recipe Stock Deduct Logic
  const handleSeduhCoffee = (beverageName: string) => {
    // Espresso needs: 15g beans, 1 cup
    // Caffè Latte needs: 15g beans, 200ml milk, 1 cup
    // Vanilla Latte needs: 15g beans, 180ml milk, 30ml syrup, 1 cup
    let beansDec = 15;
    let milkDec = 0;
    let cupDec = 1;
    let syrupDec = 0;

    if (beverageName === "Caffè Latte") {
      milkDec = 1; // 1 Liter Fresh Milk can make roughly 5 cups, so deduct 0.2 Liter
    } else if (beverageName === "Vanilla Latte") {
      milkDec = 1;
      syrupDec = 30; // 30 ml
    }

    let isOut = false;
    const nextStock = liveStock.map(item => {
      let deductQty = 0;
      if (item.code === "RAW-BEANS-01") deductQty = beansDec;
      if (item.code === "RAW-MILK-02") deductQty = milkDec ? 0.2 : 0;
      if (item.code === "RAW-CUP-03") deductQty = cupDec;
      if (item.code === "RAW-SYRUP-04") deductQty = syrupDec;

      if (item.qty - deductQty < 0) {
        isOut = true;
        return item;
      }
      return { ...item, qty: parseFloat((item.qty - deductQty).toFixed(2)) };
    });

    if (isOut) {
      triggerToast("❌ Gagal Menyeduh! Stok bahan baku di branch sudah kritis atau habis!");
      addLog("inventory", `⚠️ Gagal menyeduh ${beverageName}: Stok bahan kurang untuk mematuhi formula resep.`);
      return;
    }

    setLiveStock(nextStock);
    triggerToast(`☕ Berhasil Menyeduh ${beverageName}! Resep memotong stok otomatis.`);
    addLog("inventory", `✓ Seduh ${beverageName}: Stock otomatis terpangkas (Kopi: -15g, Susu: -0.2L, Cup: -1)`);
  };

  // Add Item to POS Cart
  const handleAddToCart = (item: { name: string; price: number }) => {
    setCart(prev => {
      const exist = prev.find(i => i.name === item.name);
      if (exist) {
        return prev.map(i => i.name === item.name ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, name: item.name, price: item.price, qty: 1 }];
    });
    addLog("pos", `Keranjang: Menambahkan item ${item.name} ke struk POS.`);
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Generate QRIS Webhook Simulation
  const handlePayQRIS = () => {
    if (cart.length === 0) {
      triggerToast("Harap masukkan menu makanan/minuman ke POS cart terlebih dahulu!");
      return;
    }
    setPaymentStatus("generating");
    addLog("pos", `Mengingatkan QRIS: Merequest QR String dari Sandboxed Midtrans Core API.`);
    
    setTimeout(() => {
      setPaymentStatus("paid");
      setKitchenStatus("printed");
      triggerToast("⚡ PEMBAYARAN QRIS SUKSES! Webhook Callback Midtrans /api/midtrans/webhook Berhasil Diverifikasi.");
      addLog("pos", `✓ Transaksi LUNAS via QRIS Midtrans. Webhook computed SHA-512 Signature cocok.`);
      addLog("printer", `🖨️ KITCHEN PRINTER: Tiket POS Order ${selectedTable} otomatis dicetak.`);
    }, 2000);
  };

  // Create Purchase Request
  const handleCreatePr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrItem.trim()) return;
    const priceEst = newPrQty * 125000;
    const newPr = {
      id: "PR-" + Math.floor(7000 + Math.random() * 9000),
      date: new Date().toISOString().slice(0, 10),
      supplier: newPrItem,
      total: priceEst,
      status: "Menunggu Approval Owner"
    };
    setManagerPrs([newPr, ...managerPrs]);
    setNewPrItem("");
    setNewPrQty(1);
    triggerToast("📝 Purchase Request berhasil disubmit ke Dashboard Owner untuk ditinjau RLS!");
    addLog("procurement", `[MANAGER REQ] Mengajukan PR Pengadaan senilai Rp ${priceEst.toLocaleString("id-ID")} untuk ditandatangani Owner.`);
  };

  // Create Asset Report
  const handleCreateAssetReport = (e: React.FormEvent) => {
    e.preventDefault();
    const costEst = newAssetType === "Broken" ? 45000 : 250000;
    const newReport = {
      id: "AST-" + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString().slice(0, 10),
      name: newAssetReport,
      type: newAssetType,
      cause: newAssetCause || "Kecelakaan kerja operasional harian",
      reporter: "Service Staff Andi",
      cost: costEst,
      status: "Pending Peninjauan"
    };

    setAssetLossLogs([newReport, ...assetLossLogs]);
    setNewAssetCause("");
    triggerToast("✓ Laporan Kerusakan & Kehilangan Aset tercatat di Audit Log!");
    addLog("asset", `⚠️ [SERVICE DEPT] Melaporkan Kehilangan/Kerusakan ${newAssetReport} (${newAssetType}). Estimasi kerugian: Rp ${costEst.toLocaleString()}`);
  };

  const sqlSchemaCode = `-- =========================================================
-- COFFEEOPS SaaS ENTERPRISE MULTI-BRANCH DATABASE SCHEMA
-- Rancang Bangun PostgreSQL + Supabase dengan 24 Tabel Terpadu
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BRANCHES (Cabang waralaba / outlet café)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USERS (Profil Master Pengguna / Staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    pin_access VARCHAR(6) NOT NULL, -- PIN numeric Login Kiosk 
    phone VARCHAR(35),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    default_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROLES (Definisi Peran Keamanan SaaS)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL, -- 'Owner', 'Manager', 'Cashier', 'Barista', 'Service', 'Admin'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PERMISSIONS (Hak Akses Fungsionalitas)
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_key VARCHAR(100) UNIQUE NOT NULL, -- 'pos:checkout', 'inventory:adjust', 'pr:approve', etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. USER_ROLES (Jembatan Profil Relasional User - Role)
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 6. INVENTORY_ITEMS (Master Bahan Baku Café)
CREATE TABLE inventory_items (
    code VARCHAR(30) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'gram', 'liter', 'pcs', 'ml'
    par_stock NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. STOCK_MOVEMENTS (Mutasi/Kalibrasi Fisik Kartu Stock)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_code VARCHAR(30) NOT NULL REFERENCES inventory_items(code) ON DELETE CASCADE,
    qty NUMERIC(12,3) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'STOCK_IN', 'STOCK_OUT', 'RECIPE_DEDUCT', 'WASTE'
    note TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SUPPLIERS (Mitra Pemasok Bahan Baku)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. PURCHASE_REQUESTs (Pengajuan Pembelian / PR dari Manager)
CREATE TABLE purchase_request (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    qty INT NOT NULL,
    estimated_cost NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. PURCHASE_ORDERS (PO Resmi Keluaran Pengadaan)
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_code VARCHAR(50) UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    total_amount NUMERIC(14,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. WASTE_REPORTS (Pencatatan Bahan Terbuang / Kadaluarsa)
CREATE TABLE waste_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_code VARCHAR(30) NOT NULL REFERENCES inventory_items(code) ON DELETE CASCADE,
    quantity NUMERIC(12,3) NOT NULL,
    cause VARCHAR(150) NOT NULL, -- 'Expired', 'Spilled', 'Spoiled'
    loss_amount NUMERIC(12,2) DEFAULT 0.00,
    reported_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. ASSET_ITEMS (Inventaris Alat Berat & Perkakas Café)
CREATE TABLE asset_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- 'Espresso Machine', 'Grinder Coffee', 'Stainless Pitcher'
    status VARCHAR(50) DEFAULT 'Good' CHECK (status IN ('Good', 'Damaged', 'Maintenance')),
    purchase_price NUMERIC(14,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. ASSET_LOSS_LOGS (Log Kerusakan & Kehilangan Smallwares/Glassware)
CREATE TABLE asset_loss_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    asset_name VARCHAR(150) NOT NULL,
    incident_type VARCHAR(30) NOT NULL CHECK (incident_type IN ('Broken', 'Lost')),
    cause TEXT,
    estimated_loss NUMERIC(12,2) DEFAULT 0.00,
    reported_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. TABLES (Master Meja Cabang)
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Cleaning')),
    capacity INT DEFAULT 4,
    UNIQUE (branch_id, table_number)
);

-- 15. TABLE_SESSIONS (Sesi Makan/Dine-In Pelanggan)
CREATE TABLE table_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'Active'
);

-- 16. TRANSACTIONS (Struk Order / POS Utama)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    order_code VARCHAR(40) UNIQUE NOT NULL,
    table_session_id UUID REFERENCES table_sessions(id) ON DELETE SET NULL,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(40), -- 'CASH', 'QRIS_MIDTRANS', 'DEBIT'
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Settlement', 'Expire')),
    cashier_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. TRANSACTION_ITEMS (Menu Masakan Terbeli di Setiap Struk)
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    price DEFAULT 0.00,
    qty INT NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL
);

-- 18. SHIFT_LOGS (Pembukaan dan Penutupan Laci Uang Cashier)
CREATE TABLE shift_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    opening_balance NUMERIC(12,2) NOT NULL,
    closing_cash_actual NUMERIC(12,2),
    status VARCHAR(20) DEFAULT 'Active'
);

-- 19. ATTENDANCE_LOGS (Log Presensi Swafoto & Radius Keamanan GPS)
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    gps_latitude DOUBLE PRECISION,
    gps_longitude DOUBLE PRECISION,
    distance_radius_meters REAL,
    status VARCHAR(25) NOT NULL -- 'Hadir', 'Terlambat', 'Overtime'
);

-- 20. PAYROLL (Sistem Gaji & Denda Kerusakan Barang Staff)
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period VARCHAR(30) NOT NULL, -- 'June 2026'
    basic_salary NUMERIC(14,2) NOT NULL,
    allowance NUMERIC(14,2) DEFAULT 0.00,
    deductions_loss NUMERIC(14,2) DEFAULT 0.00, -- Denda kerusakan piring / gelas
    net_paid NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. SCHEDULES (Kalendasi Shift Kerja Karyawan)
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    shift_type VARCHAR(30) NOT NULL, -- 'Morning', 'Middle', 'Night'
    created_by UUID REFERENCES users(id)
);

-- 22. KPI_LOGS (Evaluasi SOP & Service Quality Rating Bulanan)
CREATE TABLE kpi_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    eval_period VARCHAR(30) NOT NULL,
    sop_compliance_score NUMERIC(5,2),
    hygiene_score NUMERIC(5,2),
    avg_score NUMERIC(5,2),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. NOTIFICATIONS (Simulasi Push Alert Multi-Tenant)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    role_target VARCHAR(40),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. SYSTEM_AUDIT_LOGS (Traceability Keamanan SecOps)
CREATE TABLE system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    table_impacted VARCHAR(100) NOT NULL,
    old_state JSONB,
    new_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

  const rlsCode = `-- =========================================================
-- COFFEEOPS ROW LEVEL SECURITY (RLS) ENTERPRISE POLICIES
-- Multi-Tenant Segregation Based on JWT custom claims
-- =========================================================

-- Aturan Fundamental: Nyalakan RLS pada semua tabel vital
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_loss_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- 1. OWNER ROLE (Hak akses tak terbatas untuk semua data seluruh Cabang)
CREATE POLICY owner_all_access ON branches FOR ALL
    USING ( (auth.jwt() ->> 'role') = 'Owner' );

CREATE POLICY owner_all_users ON users FOR ALL
    USING ( (auth.jwt() ->> 'role') = 'Owner' );

CREATE POLICY owner_all_trx ON transactions FOR ALL
    USING ( (auth.jwt() ->> 'role') = 'Owner' );

-- 2. MANAGER POLICY (Aktivitas terisolasi harian hanya pada Branch terasosiasi)
CREATE POLICY manager_branch_isolation ON stock_movements FOR ALL
    USING ( branch_id = (auth.jwt() ->> 'branch_id')::UUID OR (auth.jwt() ->> 'role') = 'Owner' );

CREATE POLICY manager_pr_branch ON purchase_request FOR ALL
    USING ( branch_id = (auth.jwt() ->> 'branch_id')::UUID OR (auth.jwt() ->> 'role') = 'Owner' );

-- 3. CASHIER POLICY (Akses CRUD Menu & POS hanya milik Branch-nya sendiri)
CREATE POLICY cashier_own_pos ON transactions FOR ALL
    USING ( branch_id = (auth.jwt() ->> 'branch_id')::UUID )
    WITH CHECK ( branch_id = (auth.jwt() ->> 'branch_id')::UUID );

CREATE POLICY cashier_table_view ON tables FOR SELECT
    USING ( branch_id = (auth.jwt() ->> 'branch_id')::UUID );

-- 4. BARISTA POLICY (Hanya dapat membaca Master Resep & Input Mutasi Stok Cabang sendiri)
CREATE POLICY barista_read_resep ON inventory_items FOR SELECT
    USING ( true ); -- Menu global dibaca oleh seluruh barista

CREATE POLICY barista_stock_mutasi ON stock_movements FOR INSERT
    WITH CHECK ( 
        branch_id = (auth.jwt() ->> 'branch_id')::UUID 
        AND (auth.jwt() ->> 'role') IN ('Barista', 'Manager', 'Owner') 
    );

-- 5. SERVICE DEPT POLICY (Akses log Checklist sanitasi & pelaporan gelas rusak)
CREATE POLICY service_checklist_isolation ON asset_loss_logs FOR ALL
    USING ( branch_id = (auth.jwt() ->> 'branch_id')::UUID OR (auth.jwt() ->> 'role') = 'Owner' );
`;

  return (
    <div className="space-y-6 text-amber-50">
      
      {/* Toast Alert Simulation Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-600 to-[#1e0802] border border-amber-400 p-4 rounded-xl shadow-2xl z-[99999] text-xs font-bold text-amber-50 flex items-center gap-2 animate-bounce">
          <Activity className="h-4 w-4 text-amber-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar Area */}
      <div className="bg-gradient-to-r from-amber-500/15 via-[#1b0a02] to-[#0d0400] border border-amber-500/25 p-6 rounded-3xl flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-[10px] bg-emerald-550/10 text-emerald-400 font-mono font-bold tracking-widest px-2.5 py-0.5 rounded border border-emerald-500/20">
              SUPABASE PLATINUM PARTNER
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 font-mono font-bold tracking-widest px-2.5 py-0.5 rounded border border-amber-500/20">
              ENTERPRISE COFFEEOPS V2
            </span>
          </div>
          <h2 className="font-serif text-2xl font-black text-amber-100 flex items-center gap-1.5 mt-1.5">
            ☁️ Supabase Cloud Core &amp; SaaS Multi-Tenant Engine
          </h2>
          <p className="text-xs text-amber-200/50 leading-relaxed max-w-3xl">
            Sistem ERP Kafe Premium dengan Row Level Security (RLS) tangguh. Menghubungkan log kasir POS, audit kerusakan glassware, resep auto-pangkas persediaan, serta multi-kantor cabang secara real-time.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0 font-mono text-[11px]">
          <div className="bg-black/40 border border-amber-500/10 p-2.5 rounded-xl text-center">
            <span className="text-amber-100/30 block text-[9.5px]">SECURITY MODE:</span>
            <span className="text-emerald-400 font-extrabold flex items-center justify-center gap-1">
              <Shield className="h-3 w-3 fill-emerald-400/20" /> Active RLS
            </span>
          </div>
          <div className="bg-black/40 border border-amber-500/10 p-2.5 rounded-xl text-center">
            <span className="text-amber-100/30 block text-[9.5px]">TENANT TYPE:</span>
            <span className="text-amber-200 font-extrabold">Franchise Multi</span>
          </div>
          <div className="bg-black/40 border border-amber-500/10 p-2.5 rounded-xl text-center max-sm:col-span-2">
            <span className="text-amber-100/30 block text-[9.5px]">PERSISTENCY:</span>
            <span className="text-amber-300 font-extrabold">24 Tables Live</span>
          </div>
        </div>
      </div>

      {/* Main navigation for schema / playground tabs */}
      <div className="flex border-b border-amber-500/15 gap-1.5 overflow-x-auto pb-px">
        {[
          { id: "playground", label: "🧪 SaaS Interactive Sandbox", desc: "Test roles, POS checkout, stock & assets" },
          { id: "sql", label: "🗄️ Database PostgreSQL Schema", desc: "Enterprise definitions (24 tables)" },
          { id: "rls", label: "🛡️ Row Level Security (RLS)", desc: "Branch & role policy scripts" },
          { id: "sync", label: "📡 Offline Sync Recovery", desc: "Conflict resolution Client.ts" },
          { id: "whatsapp", label: "💬 Supplier Automated alerts", desc: "WhatsApp PO templates generator" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-5 py-4 text-xs text-left cursor-pointer transition focus:outline-none shrink-0 border-b-2 rounded-t-2xl ${
              activeSubTab === tab.id
                ? "border-amber-400 text-amber-300 bg-amber-500/10 font-black"
                : "border-transparent text-amber-100/50 hover:text-amber-100 hover:bg-amber-500/5"
            }`}
          >
            <div>{tab.label}</div>
            <div className="text-[9.5px] text-amber-200/30 font-mono font-medium tracking-wide mt-0.5">
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* ── CENTRAL PLAYGROUND SECTION ── */}
      {activeSubTab === "playground" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          
          {/* JWT & POLICY EVALUATOR (Cockpit Header) - Takes Span 4 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#120501] border border-[#D4A853]/20 rounded-3xl p-5 shadow-xl space-y-5">
              <h3 className="font-serif text-amber-100 text-sm font-bold flex items-center gap-2 border-b border-amber-500/15 pb-2.5">
                <Sliders className="h-4 w-4 text-amber-400" />
                SaaS Security Claims Simulator
              </h3>

              <div className="space-y-4">
                {/* Select Simulated Role */}
                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-300 block mb-1">1. Pilih Aktif Peran Kerja (Role Claims)</label>
                  <select
                    value={simulatedRole}
                    onChange={(e) => {
                      setSimulatedRole(e.target.value as any);
                      addLog("security", `Role switched to ${e.target.value}. JWT custom claims payload updated.`);
                    }}
                    className="w-full text-xs font-sans bg-black border border-amber-500/25 rounded-md p-2.5 text-amber-150 outline-none focus:border-amber-400"
                  >
                    <option value="Owner">👑 1. Owner Dashboard</option>
                    <option value="Manager">👔 2. Manager Dashboard</option>
                    <option value="Cashier">💵 3. Cashier POS System</option>
                    <option value="Barista">☕ 4. Barista Calibration</option>
                    <option value="Service">🧹 5. Service Department</option>
                    <option value="Admin">🛠️ 6. System Administrator</option>
                  </select>
                </div>

                {/* Select Simulated Branch */}
                <div>
                  <label className="text-[10px] uppercase font-mono text-amber-300 block mb-1">2. Pilih Lokasi Kantor Cabang (Branch Location)</label>
                  <select
                    value={simulatedBranch}
                    onChange={(e) => {
                      setSimulatedBranch(e.target.value);
                      const tId = e.target.value.includes("HQ") ? "tenant_hq_jkt_01" : e.target.value.includes("Bandung") ? "tenant_bdg_02" : "tenant_sby_03";
                      setSimulatedTenantId(tId);
                      addLog("security", `Branch switched to ${e.target.value}. branch_id query isolation updated.`);
                    }}
                    className="w-full text-xs font-sans bg-black border border-amber-500/25 rounded-md p-2.5 text-amber-150 outline-none focus:border-amber-400"
                  >
                    <option value="Jakarta Central Plaza (HQ)">🏢 Jakarta Central Plaza (HQ)</option>
                    <option value="Bandung Heritage Café">☕ Bandung Heritage Café</option>
                    <option value="Surabaya Resort Premium">🏝️ Surabaya Resort Premium</option>
                  </select>
                </div>

                {/* Simulated Supabase Auth Decoded Token Payload */}
                <div className="bg-black/60 border border-amber-500/10 p-3 rounded-2xl font-mono text-[10px] space-y-1.5 relative overflow-hidden">
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500/20 text-[#D4A853] text-[8px] font-bold rounded">
                    DEC. JWT
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-amber-500/40 font-bold block mb-1">SIMULATED TOKEN PAYLOAD</span>
                  <div className="text-emerald-400">{"{"}</div>
                  <div className="pl-4 text-amber-250">"sub": <span className="text-sky-300">"usr_auth_coffeeops_xxx"</span>,</div>
                  <div className="pl-4 text-amber-250">"role": <span className="text-amber-100 font-bold">"{simulatedRole}"</span>,</div>
                  <div className="pl-4 text-amber-250">"branch_id": <span className="text-sky-300">"{simulatedBranch.substring(0, 15)}..."</span>,</div>
                  <div className="pl-4 text-amber-250">"tenant_id": <span className="text-sky-300">"{simulatedTenantId}"</span>,</div>
                  <div className="pl-4 text-amber-250">"exp": <span className="text-amber-100/50">{Math.floor(Date.now() / 1000 + 3600)}</span></div>
                  <div className="text-emerald-400">{"}"}</div>
                </div>

                {/* Transposed PostgreSQL Query RLS Injector */}
                <div className="bg-[#1b0801]/60 border border-amber-550/15 p-3 rounded-2xl font-mono text-[10px] space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-red-400/60 font-bold block mb-1">
                    ACTIVE POSTGRESQL QUERY RLS CLAUSE
                  </span>
                  <span className="text-amber-300 font-bold">SELECT <span className="text-amber-100 font-normal">* FROM</span> transactions</span>
                  <div className="text-xs text-amber-400/50 leading-relaxed font-bold bg-black/40 p-2 rounded border border-white/5 mt-1 select-all">
                    WHERE branch_id = '<span className="text-emerald-400 font-black select-all">{simulatedBranch.replaceAll(" ", "_").substring(0, 10).toLowerCase()}</span>'
                    {simulatedRole !== "Owner" && simulatedRole !== "Admin" && (
                      <span className="text-amber-100 block mt-1">AND created_by = auth.uid()</span>
                    )}
                  </div>
                  <span className="text-[9px] text-[#D4A853] tracking-tight block pt-1 animate-pulse">
                    🛡️ Multi-Tenant filter is forced directly inside PostgreSQL.
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated Live System Audit Feed */}
            <div className="bg-[#120501] border border-[#D4A853]/20 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
                <h3 className="font-serif text-amber-100 text-sm font-bold flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  Live Auditing SecOps Log
                </h3>
                <button
                  onClick={() => {
                    setSysLogs([{ id: "1", time: "00:00:00", type: "system", message: "Log dinolkan oleh admin." }]);
                    triggerToast("Log dibersihkan.");
                  }}
                  className="text-[9px] font-mono text-amber-500 hover:underline"
                >
                  Clear Logs
                </button>
              </div>

              <div className="space-y-2 max-h-[195px] overflow-y-auto pr-1">
                {sysLogs.map(log => (
                  <div key={log.id} className="text-[10px] font-mono leading-relaxed bg-black/40 border border-amber-500/5 p-2 rounded-lg flex items-start gap-1.5">
                    <span className="text-amber-400/40 font-semibold shrinkage-0">[{log.time}]</span>
                    <div>
                      <span className="uppercase text-[9px] bg-amber-500/10 border border-amber-500/25 px-1 py-0.2 rounded mr-1.5 font-bold">
                        {log.type}
                      </span>
                      <span className="text-amber-100/80">{log.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMIC FUNCTIONAL WORKSPACE BASED ON ROLE CLAIMS - Span 8 */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* INVENTORY STATE STRIP (Deduction triggers beans, milk etc.) */}
            <div className="bg-gradient-to-r from-[#170a01] via-[#241306] to-[#120701] border border-amber-500/15 p-4.5 rounded-3xl grid grid-cols-2 md:grid-cols-4 gap-4">
              {liveStock.map(item => {
                const isCritical = item.qty <= item.minLevel;
                return (
                  <div key={item.code} className="bg-black/35 border border-white/5 p-3 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    {isCritical && (
                      <div className="absolute top-1 right-2 bg-red-950 border border-red-500/40 text-red-400 text-[8px] font-mono uppercase px-1.5 rounded-full select-none animate-pulse">
                        PAR ALERT
                      </div>
                    )}
                    <span className="text-[#D4A853] text-[9.5px] font-mono tracking-tight uppercase truncate">{item.name}</span>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className={`text-lg font-mono font-black ${isCritical ? "text-red-400 animate-pulse font-black" : "text-amber-100 font-extrabold"}`}>
                        {item.qty.toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] text-amber-100/40 font-mono">{item.unit}</span>
                    </div>
                    <div className="text-[9px] text-[#sops_compliance] font-mono text-amber-200/30 mt-1">
                      Min par level: {item.minLevel} {item.unit}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── CONDITIONAL RENDER PER ROLE MODULE ── */}

            {/* A. OWNER MODULE */}
            {simulatedRole === "Owner" && (
              <div className="bg-[#120501] border border-[#D4A853]/20 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
                <div className="border-b border-amber-500/15 pb-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-amber-100 text-base font-bold flex items-center gap-1.5">
                      <TrendingUp className="h-5 w-5 text-amber-400" />
                      Global SaaS Strategic Profit &amp; Loss Suite
                    </h4>
                    <p className="text-[11px] text-amber-200/50 mt-0.5">Semua data branch diconsolidasi karena wewenang Owner claim bypasses branch_id isolation.</p>
                  </div>
                  <span className="text-[10.5px] font-mono text-amber-300 tracking-wide font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    OWNER UNLIMITED CLAIMS
                  </span>
                </div>

                {/* Consolidated performance numbers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#1a0c02] border border-amber-500/10 p-4.5 rounded-2xl">
                    <span className="text-[11px] text-amber-100/40 font-mono">Consolidated Net Profit</span>
                    <h3 className="text-xl font-mono font-black text-[#D4A853] mt-1">Rp 148,420,000</h3>
                    <p className="text-[9.5px] text-emerald-400 flex items-center gap-1 mt-1">
                      ▲ +14.2% dari target regional.
                    </p>
                  </div>
                  <div className="bg-[#1a0c02] border border-amber-500/10 p-4.5 rounded-2xl">
                    <span className="text-[11px] text-amber-100/40 font-mono">Total PR Pending Approval</span>
                    <h3 className="text-xl font-mono font-black text-amber-300 mt-1">{managerPrs.filter(p => p.status.includes("Menunggu")).length} PRs</h3>
                    <p className="text-[9.5px] text-amber-200/40 mt-1">
                      Prerogatif Owner untuk meluluskan rilis dana.
                    </p>
                  </div>
                  <div className="bg-[#1a0c02] border border-amber-500/10 p-4.5 rounded-2xl">
                    <span className="text-[11px] text-amber-100/40 font-mono">KPI Rerata Presensi Crew</span>
                    <h3 className="text-xl font-serif text-emerald-400 mt-1">94.8% Pass</h3>
                    <p className="text-[9.5px] text-emerald-400 flex items-center gap-1 mt-1">
                      SOP compliance di 3 Cabang Utama prima.
                    </p>
                  </div>
                </div>

                {/* PR approval interactive box */}
                <div className="bg-black/35 border border-amber-500/10 p-4.5 rounded-2xl space-y-3">
                  <span className="text-xs font-mono font-bold text-amber-200 block">Daftar Pengajuan Purchase Request Waralaba:</span>
                  {managerPrs.map(pr => (
                    <div key={pr.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1e0e03] border border-amber-500/10 p-3.5 rounded-xl text-xs text-amber-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-amber-500/15 text-[#D4A853] px-1.5 py-0.2 rounded font-bold font-serif">{pr.id}</span>
                          <span className="text-[11px] text-amber-200/50">{pr.date}</span>
                        </div>
                        <p className="text-xs font-serif font-black text-amber-200 mt-1">Pemasok / Kebutuhan: {pr.supplier}</p>
                        <p className="font-mono text-[#D4A853] mt-0.5">Estimasi Budget: Rp {pr.total.toLocaleString("id-ID")}</p>
                      </div>
                      
                      {pr.status.includes("Menunggu") ? (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setManagerPrs(prev => prev.map(p => p.id === pr.id ? { ...p, status: "Telah Disetujui Owner" } : p));
                              triggerToast(`PR ${pr.id} berhasil diluluskan! Dana siap ditarik oleh manager.`);
                              addLog("procurement", `✓ [PR APPROVED] Owner meloloskan PR ${pr.id} senilai Rp ${pr.total.toLocaleString()}`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-black text-[10.5px] font-bold px-3 py-1.5 rounded-lg font-mono transition"
                          >
                            Approve PR
                          </button>
                          <button
                            onClick={() => {
                              setManagerPrs(prev => prev.map(p => p.id === pr.id ? { ...p, status: "Ditolak" } : p));
                              triggerToast(`PR ${pr.id} ditolak.`);
                              addLog("procurement", `❌ [PR REJECTED] Owner menolak PR ${pr.id}.`);
                            }}
                            className="bg-red-800 hover:bg-red-700 text-amber-100 text-[10.5px] font-bold px-3 py-1.5 rounded-lg font-mono transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded text-[11px] font-mono uppercase">
                          {pr.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* B. MANAGER MODULE */}
            {simulatedRole === "Manager" && (
              <div className="bg-[#120501] border border-[#D4A853]/20 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
                <div className="border-b border-amber-500/15 pb-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-amber-100 text-base font-bold flex items-center gap-1.5">
                      <LayoutDashboard className="h-5 w-5 text-amber-400" />
                      Branch Daily Command &amp; PR Center
                    </h4>
                    <p className="text-[11px] text-amber-200/50 mt-0.5">Operasional terisolasi otomatis ke branch: <span className="text-amber-300 font-bold">{simulatedBranch}</span></p>
                  </div>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
                    MANAGER CLAIM
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PR Form generator */}
                  <form onSubmit={handleCreatePr} className="space-y-4 bg-black/35 border border-amber-500/10 p-5 rounded-2xl">
                    <span className="text-xs font-mono font-bold text-[#D4A853] flex items-center gap-1.5 uppercase tracking-wider">
                      <Percent className="h-3.5 w-3.5" />
                      Ajukan Purchase Request Baru (PR)
                    </span>
                    
                    <div>
                      <label className="text-[10.5px] font-mono text-amber-200 block mb-1">Diskripsi Barang / Nama Supplier</label>
                      <input
                        type="text"
                        required
                        value={newPrItem}
                        onChange={(e) => setNewPrItem(e.target.value)}
                        placeholder="Contoh: Biji Kopi Flores Bajawa Raw Beans"
                        className="w-full text-xs bg-[#120601] border border-amber-500/20 rounded-lg p-2.5 outline-none focus:border-amber-400 text-amber-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10.5px] font-mono text-amber-200 block mb-1">Estimasi Qty (Sack/Ctn)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={newPrQty}
                          onChange={(e) => setNewPrQty(parseInt(e.target.value) || 1)}
                          className="w-full text-xs bg-[#120601] border border-amber-500/20 rounded-lg p-2.5 outline-none focus:border-amber-400 text-amber-100"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs rounded-lg transition"
                        >
                          Submit PR
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Staff Scheduling Status */}
                  <div className="bg-black/35 border border-amber-500/10 p-5 rounded-2xl space-y-3 text-xs text-amber-100">
                    <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                      <Clock className="h-4 w-4" /> Shift Kalender Staff Hari Ini
                    </span>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="bg-[#180801] p-2.5 rounded-lg border border-white/5 flex items-center justify-between">
                        <span>Pagi (08:00 - 16:00)</span>
                        <span className="text-[#D4A853] font-bold">Barista Budi, service Andi</span>
                      </div>
                      <div className="bg-[#180801] p-2.5 rounded-lg border border-white/5 flex items-center justify-between">
                        <span>Siang (16:00 - 24:00)</span>
                        <span className="text-amber-400 font-bold">Barista Deni, service Bayu</span>
                      </div>
                      <div className="bg-[#180801] p-2.5 rounded-lg border border-white/5 flex items-center justify-between">
                        <span>Malam (Full-Clean Closing)</span>
                        <span className="text-red-400 font-bold">Manager Sesi Terintegrasi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* C. CASHIER MODULE: POS CENTER */}
            {simulatedRole === "Cashier" && (
              <div className="bg-[#120501] border border-[#D4A853]/20 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
                
                {/* POS Title & Table selectors */}
                <div className="border-b border-amber-500/15 pb-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-serif text-amber-100 text-base font-bold flex items-center gap-1.5">
                      <ShoppingCart className="h-5 w-5 text-[#D4A853]" />
                      CoffeeOps POS Cashier Checkout Desk
                    </h4>
                    <p className="text-[11px] text-amber-200/50 mt-0.5">Penjualan Dine-In &amp; Takeaway Tergantung claims branch_id.</p>
                  </div>

                  <div className="flex gap-2.5">
                    {/* Selected Table */}
                    <select
                      value={selectedTable}
                      onChange={(e) => {
                        setSelectedTable(e.target.value);
                        addLog("pos", `Meja Aktif dialihkan ke: ${e.target.value}`);
                      }}
                      className="text-xs bg-black border border-amber-500/15 rounded p-1.5 text-amber-150 outline-none"
                    >
                      <option value="Meja 01">Meja 01</option>
                      <option value="Meja 02">Meja 02 (Dine In)</option>
                      <option value="Meja 05">Meja 05 (VIP)</option>
                      <option value="Meja 08">Meja 08</option>
                      <option value="Take Away VIP">Take Away VIP</option>
                    </select>

                    {/* Split count */}
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-[#1d0b01] px-2.5 rounded border border-amber-500/10">
                      <span>Split Bill:</span>
                      <input
                        type="number"
                        min="2"
                        max="5"
                        value={splitCount}
                        onChange={(e) => setSplitCount(parseInt(e.target.value) || 2)}
                        className="w-8 bg-black text-center text-amber-300 outline-none p-1 text-[11px] font-bold rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: POS menu picks - Span 6 */}
                  <div className="md:col-span-6 space-y-4">
                    <span className="text-[10.5px] font-mono text-amber-300 uppercase tracking-widest font-black block border-b border-white/5 pb-1">Select Menu Item:</span>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: "Espresso Short", price: 25000, color: "☕" },
                        { name: "Caffè Latte", price: 32000, color: "🥛" },
                        { name: "Vanilla Latte", price: 35000, color: "🍁" },
                        { name: "Matcha Espresso", price: 38000, color: "🍵" },
                        { name: "Butter Croissant", price: 28000, color: "🥐" },
                        { name: "Signature Cold Brew", price: 35000, color: "🧊" },
                      ].map(menu => (
                        <button
                          key={menu.name}
                          onClick={() => handleAddToCart(menu)}
                          className="bg-[#1c0c03] hover:bg-[#321708] border border-amber-500/10 hover:border-amber-400 p-3 rounded-2xl text-left transition relative group text-xs text-amber-100 flex flex-col justify-between min-h-[85px] outline-none cursor-pointer active:scale-95"
                        >
                          <span className="text-xl">{menu.color}</span>
                          <span className="font-serif font-bold text-amber-100 group-hover:text-amber-300 transition line-clamp-1 mt-1.5">{menu.name}</span>
                          <span className="font-mono text-amber-300 hover:text-amber-200">Rp {menu.price.toLocaleString("id-ID")}</span>
                        </button>
                      ))}
                    </div>

                    {/* Table Merging simulation */}
                    <div className="bg-[#170a02] border border-amber-500/15 p-4 rounded-2xl space-y-2">
                      <span className="text-xs font-serif font-black text-amber-150 block">🔗 Merge Tables (Gabung Tagihan Meja)</span>
                      <div className="flex gap-2 text-xs">
                        <select
                          value={targetMergeTable}
                          onChange={(e) => setTargetMergeTable(e.target.value)}
                          className="bg-black border border-amber-500/20 text-amber-100 p-2 rounded focus:outline-none flex-1 text-xs"
                        >
                          <option value="Meja 02">Meja 02</option>
                          <option value="Meja 08">Meja 08</option>
                          <option value="Meja 12">Meja 12</option>
                        </select>
                        <button
                          onClick={() => {
                            triggerToast(`✓ Tagihan ${selectedTable} berhasil dimasukkan / digabung dengan ${targetMergeTable}!`);
                            addLog("pos", `Merge: Tabel ${selectedTable} & ${targetMergeTable} disinkronkan ke struk tunggal.`);
                          }}
                          className="bg-amber-600 hover:bg-amber-500 text-black px-4.5 py-2 font-bold font-mono transition rounded text-xs shrink-0"
                        >
                          Merge Bills
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Cart, QRIS & Split calculations - Span 6 */}
                  <div className="md:col-span-6 bg-[#0f0400] border border-amber-500/10 rounded-2xl p-4 flex flex-col justify-between min-h-[350px]">
                    
                    <div className="space-y-4">
                      {/* Active Cart label */}
                      <div className="flex justify-between items-center text-xs font-mono font-bold text-[#D4A853] border-b border-amber-500/10 pb-2">
                        <span>Cart: {selectedTable}</span>
                        <button onClick={() => { setCart([]); addLog("pos", "Cart dikosongkan."); }} className="text-red-400 hover:underline">Clear</button>
                      </div>

                      {/* Scrollable list items */}
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-xs text-amber-100 font-mono bg-black/40 p-2 rounded">
                            <span className="font-serif font-bold text-[#D4A853] flex-1 truncate">{item.name}</span>
                            <div className="flex items-center gap-2 pr-3">
                              <span className="text-amber-100/40">x{item.qty}</span>
                              <span className="text-amber-200">Rp {(item.price * item.qty).toLocaleString()}</span>
                            </div>
                            <button
                              onClick={() => {
                                setCart(prev => prev.filter(i => i.id !== item.id));
                                triggerToast(`${item.name} dihapus dari POS cart`);
                              }}
                              className="text-[#D4A853] hover:text-red-400 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {cart.length === 0 && (
                          <div className="text-center py-6 text-[11px] font-mono text-amber-100/25">
                            Struk checkout kosong. Silakan tap menu di sebelah kiri.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-amber-500/10 pt-3 mt-3 space-y-3.5">
                      {/* Dynamic Split Billing Details */}
                      {cart.length > 0 && (
                        <div className="bg-black/60 p-2.5 rounded-xl border border-white/5 space-y-1 font-mono text-[10px] text-amber-100/60 leading-relaxed">
                          <span className="text-[9px] uppercase tracking-wider text-[#D4A853] font-bold block mb-1">
                            <Split className="h-3 w-3 inline mr-1" />
                            SIMULASI SPLIT BILLS
                          </span>
                          <div className="flex justify-between font-bold text-amber-100">
                            <span>Total Tagihan Bersih:</span>
                            <span>Rp {getCartTotal().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Dibagi {splitCount} Orang Pembayar:</span>
                            <span className="text-emerald-400 font-bold">Rp {(getCartTotal() / splitCount).toLocaleString()} / Orang</span>
                          </div>
                        </div>
                      )}

                      {/* Total and Actions */}
                      <div>
                        <div className="flex justify-between text-xs font-mono font-bold text-amber-100 mb-2.5">
                          <span>TOTAL REV:</span>
                          <span className="text-xl font-bold text-amber-300">Rp {getCartTotal().toLocaleString("id-ID")}</span>
                        </div>

                        {paymentStatus === "unpaid" ? (
                          <button
                            onClick={handlePayQRIS}
                            className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 font-serif font-black tracking-widest text-[11px] py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                          >
                            <CreditCard className="h-4 w-4" />
                            BAYAR SCAN QRIS FAST WEBHOOK
                          </button>
                        ) : paymentStatus === "generating" ? (
                          <div className="bg-amber-600/10 border border-amber-500/30 p-4 rounded-xl text-center space-y-1">
                            <RefreshCw className="h-4 w-4 animate-spin text-amber-300 mx-auto" />
                            <p className="text-[10px] text-amber-200">Menghubungi Webhook Simulator Midtrans Cloud...</p>
                          </div>
                        ) : (
                          <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-center space-y-1">
                            <span className="p-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">SUCCESSFUL Webhook callback</span>
                            <p className="text-[10px] text-emerald-300 font-mono font-bold mt-1">Lunas! RLS transaction status disinkronkan.</p>
                            <button
                              onClick={() => { setPaymentStatus("unpaid"); setCart([]); }}
                              className="text-[9.5px] text-[#D4A853] underline font-mono font-bold block mx-auto mt-2 cursor-pointer"
                            >
                              Buka transaksi baru
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* D. BARISTA MODULE */}
            {simulatedRole === "Barista" && (
              <div className="bg-[#120501] border border-[#D4A853]/20 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
                <div className="border-b border-amber-500/15 pb-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-amber-100 text-base font-bold flex items-center gap-1.5">
                      <Coffee className="h-5 w-5 text-amber-400" />
                      Recipe Library &amp; stock deduction calibration
                    </h4>
                    <p className="text-[11px] text-amber-200/50 mt-0.5">Seduh minuman memotong persediaan secara langsung di database PostgreSQL.</p>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-extrabold uppercase">
                    BARISTA CLAIM
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recipe seduh controls */}
                  <div className="bg-black/35 border border-amber-500/10 p-5 rounded-2xl space-y-4">
                    <span className="text-xs font-mono font-bold text-[#D4A853] uppercase tracking-wider block">🧪 SEDUH INTERACTIVE (RESEP FIFO ACT):</span>
                    <p className="text-[10.5px] text-amber-100/50">Klik seduh untuk memotong bar stock secara otomatis menggunakan COGS cost resep kafe:</p>
                    
                    <div className="space-y-2.5">
                      {[
                        { name: "Espresso Short", desc: "Formulasi: 15g beans, 1 cup", cost: "Rp 3.500" },
                        { name: "Caffè Latte", desc: "Formulasi: 15g beans, 0.2L Fresh Milk, 1 cup", cost: "Rp 8.100" },
                        { name: "Vanilla Latte", desc: "Formulasi: 15g beans, 0.2L Milk, 30ml Syrup, 1 cup", cost: "Rp 10.400" },
                      ].map(drink => (
                        <div key={drink.name} className="bg-[#190901] border border-[#D4A853]/10 p-3 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-serif font-black text-amber-150 block">{drink.name}</span>
                            <span className="text-[10px] text-amber-100/40 font-mono">{drink.desc}</span>
                          </div>
                          <button
                            onClick={() => handleSeduhCoffee(drink.name)}
                            className="bg-[#D4A853] hover:bg-[#c69b46] text-amber-950 font-bold px-3.5 py-1.5 rounded-lg text-[10.5px] font-mono transition"
                          >
                            Deduct &amp; Seduh
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calibration Guide */}
                  <div className="bg-black/35 border border-amber-500/10 p-5 rounded-2xl space-y-3.5 text-xs text-amber-150">
                    <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                      <Sliders className="h-4 w-4" /> Standard Espresso Calibration
                    </span>
                    <p className="text-[10.5px] text-amber-100/50 leading-relaxed">Kalibrasi espresso manual terekam ke Supabase <code className="text-amber-300">calibration_logs</code> harian untuk menjaga kualitas brand CoffeeOps:</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-center font-mono text-[10px]">
                      <div className="bg-[#1c0a02] p-2 rounded-xl border border-white/5">
                        <span className="text-amber-100/30 text-[9px] block">DOSE IN</span>
                        <span className="text-amber-250 font-black text-xs">18.5 Gram</span>
                      </div>
                      <div className="bg-[#1c0a02] p-2 rounded-xl border border-white/5">
                        <span className="text-amber-100/30 text-[9px] block">YIELD ESPRESSO</span>
                        <span className="text-amber-250 font-black text-xs">36.0 Gram</span>
                      </div>
                      <div className="bg-[#1c0a02] p-2 rounded-xl border border-white/5">
                        <span className="text-amber-100/30 text-[9px] block">EXT. TIME SEC</span>
                        <span className="text-amber-250 font-black text-xs">27 Detik</span>
                      </div>
                      <div className="bg-[#1c0a02] p-2 rounded-xl border border-white/5">
                        <span className="text-amber-100/30 text-[9px] block">PRESSURE</span>
                        <span className="text-emerald-400 font-black text-xs">9.0 BAR Pass</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* E. SERVICE MODULE */}
            {simulatedRole === "Service" && (
              <div className="bg-[#120501] border border-[#D4A853]/20 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
                <div className="border-b border-amber-500/15 pb-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-amber-100 text-base font-bold flex items-center gap-1.5">
                      <ListTodo className="h-5 w-5 text-amber-400" />
                      Clean Checklist &amp; Glassware Loss/Break Audits
                    </h4>
                    <p className="text-[11px] text-amber-200/50 mt-0.5">Laporkan glassware pecah atau tumpah untuk mencatat estimasi denda draf slip payroll.</p>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-[#D4A853] border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
                    SERVICE CLAIM
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Glassware break generator */}
                  <form onSubmit={handleCreateAssetReport} className="space-y-4 bg-black/35 border border-amber-500/10 p-5 rounded-2xl">
                    <span className="text-xs font-mono font-bold text-[#D4A853] uppercase block">⚠️ Laporkan Kerusakan / Kehilangan Barang (Asset Report)</span>
                    
                    <div>
                      <label className="text-[10px] font-mono text-amber-200 block mb-1">Pilih Item Alat Makan (Smallware/Glassware):</label>
                      <select
                        value={newAssetReport}
                        onChange={(e) => setNewAssetReport(e.target.value)}
                        className="w-full text-xs font-sans bg-black border border-[#D4A853]/25 p-2.5 rounded text-amber-150 outline-none"
                      >
                        <option value="Espresso Glass cup (Gelas Sloki)">Espresso Glass cup (Gelas Sloki)</option>
                        <option value="Cappuccino Ceramic Cup 220ml">Cappuccino Ceramic Cup 220ml</option>
                        <option value="Stainless Milk Jug Pitcher 600ml">Stainless Milk Jug Pitcher 600ml</option>
                        <option value="La Marzocco Portafilter Basket">La Marzocco Portafilter Basket</option>
                        <option value="Stainless Coctail shaker burr">Stainless Coctail shaker burr</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-amber-200 block mb-1">Aksi Insiden:</label>
                        <select
                          value={newAssetType}
                          onChange={(e) => setNewAssetType(e.target.value as any)}
                          className="w-full text-xs font-sans bg-black border border-[#D4A853]/25 p-2.5 rounded text-amber-150 outline-none"
                        >
                          <option value="Broken">Pecah / Rusak</option>
                          <option value="Lost">Kehilangan (Lost)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-amber-200 block mb-1">Sebab Kejadian:</label>
                        <input
                          type="text"
                          value={newAssetCause}
                          onChange={(e) => setNewAssetCause(e.target.value)}
                          placeholder="Sebab alat pecah/hilang..."
                          className="w-full text-xs bg-black border border-[#D4A853]/25 p-2.5 rounded text-amber-150 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-red-800 hover:bg-red-700 text-amber-100 font-bold py-2.5 rounded-lg text-xs transition font-serif block tracking-wider"
                    >
                      Kirim Laporan Kerugian
                    </button>
                  </form>

                  {/* Incident List */}
                  <div className="bg-black/35 border border-amber-500/10 p-5 rounded-2xl space-y-3.5">
                    <span className="text-xs font-mono font-bold text-amber-300 block uppercase">
                      🛡️ Glassware &amp; Smallwares Audit logs
                    </span>
                    <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1">
                      {assetLossLogs.map(log => (
                        <div key={log.id} className="bg-[#180a02] p-2.5 rounded-xl border border-white/5 text-[11px] font-mono space-y-1">
                          <div className="flex justify-between text-[#D4A853] font-bold">
                            <span>{log.name}</span>
                            <span className="text-[10px] bg-red-950 px-1 rounded text-red-400">{log.type}</span>
                          </div>
                          <p className="text-[10.5px] text-amber-100/50">Sebab: {log.cause}</p>
                          <div className="flex justify-between text-[10px] text-amber-100/30 pt-1 border-t border-white/5">
                            <span>Pelapor: {log.reporter}</span>
                            <span className="text-amber-250 font-bold">Kerugian: Rp {log.cost.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* F. ADMIN MODULE */}
            {simulatedRole === "Admin" && (
              <div className="bg-[#120501] border border-[#D4A853]/20 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
                <div className="border-b border-amber-500/15 pb-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-amber-100 text-base font-bold flex items-center gap-1.5">
                      <Settings className="h-5 w-5 text-amber-400" />
                      SaaS Active Devices &amp; Security Sessions controller
                    </h4>
                    <p className="text-[11px] text-amber-200/50 mt-0.5">Pantau status server Cloud Run, geofence radius GPS, dan sinkronisasi iPad kasir.</p>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
                    SYS ADMIN CLAIMS
                  </span>
                </div>

                {/* Simulated diagnostic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  <div className="bg-black/35 border border-amber-500/10 p-5 rounded-2xl space-y-4">
                    <span className="text-xs font-bold text-[#D4A853] uppercase block">
                      📟 Tablet kasir &amp; Printer POS Sync:
                    </span>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-[#170a02] p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-emerald-400" />
                          <div>
                            <span className="font-bold">iPad Casher Main #01</span>
                            <span className="text-[10px] text-amber-100/40 block">Lat: 16ms, Rad: 42m GPS (Match)</span>
                          </div>
                        </div>
                        <span className="text-[#sops_compliance] bg-emerald-900 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold text-[10px]">SYNCED</span>
                      </div>

                      <div className="flex justify-between items-center bg-[#170a02] p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-emerald-400 animate-pulse" />
                          <div>
                            <span className="font-bold">Android Bar Kiosk #02</span>
                            <span className="text-[10px] text-amber-100/40 block">Lat: 28ms, Rad: 55m GPS (Match)</span>
                          </div>
                        </div>
                        <span className="text-[#sops_compliance] bg-emerald-900 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold text-[10px]">SYNCED</span>
                      </div>
                    </div>
                  </div>

                  {/* System properties */}
                  <div className="bg-black/35 border border-amber-500/10 p-5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-amber-300 uppercase block">🛡️ Keamanan RLS &amp; Cloud Network status:</span>
                    <div className="space-y-2 text-[11px] text-amber-100/70">
                      <div className="flex justify-between">
                        <span>Database Engines:</span>
                        <span className="text-amber-250">Supabase PG + PostGIS</span>
                      </div>
                      <div className="flex justify-between">
                        <span>API Gateways ingress:</span>
                        <span className="text-[#D4A853] font-bold">Operational (Port 3000 Secured)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SSL Handshakes encryption:</span>
                        <span className="text-emerald-400 font-bold">SHA-256 Enabled</span>
                      </div>
                      <div className="flex justify-between text-yellow-400">
                        <span>Sandbox status check:</span>
                        <span>Development Mode OK</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ── SQL TAB ── */}
      {activeSubTab === "sql" && (
        <div className="bg-[#110600]/80 border border-[#D4A853]/15 rounded-2xl overflow-hidden relative animate-fadeIn">
          <div className="bg-black/55 px-5 py-3.5 border-b border-amber-500/10 flex items-center justify-between text-xs text-amber-100/60 font-mono">
            <span>supabase-schema.sql (PostgreSQL Enterprise DB Model)</span>
            <button
              onClick={() => handleCopy(sqlSchemaCode)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-md text-[10.5px] text-amber-300 transition"
            >
              {copied ? "✔️ COPIED" : "📋 COPY SCHEMA"}
            </button>
          </div>
          <pre className="p-5 overflow-auto max-h-[520px] text-[11.5px] leading-relaxed text-amber-100/80 font-mono select-text bg-[#0b0300]/95 custom-scrollbar">
            {sqlSchemaCode}
          </pre>
        </div>
      )}

      {/* ── RLS TAB ── */}
      {activeSubTab === "rls" && (
        <div className="bg-[#110600]/80 border border-[#D4A853]/15 rounded-2xl overflow-hidden relative animate-fadeIn">
          <div className="bg-black/55 px-5 py-3.5 border-b border-amber-500/10 flex items-center justify-between text-xs text-amber-100/60 font-mono">
            <span>row-level-security.rules (Supabase PostgreSQL Guard)</span>
            <button
              onClick={() => handleCopy(rlsCode)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-md text-[10.5px] text-amber-300 transition"
            >
              {copied ? "✔️ COPIED" : "📋 COPY RLS"}
            </button>
          </div>
          <pre className="p-5 overflow-auto max-h-[520px] text-[11.5px] leading-relaxed text-amber-100/80 font-mono select-text bg-[#0b0300]/95 custom-scrollbar">
            {rlsCode}
          </pre>
        </div>
      )}

      {/* ── SYNC TAB ── */}
      {activeSubTab === "sync" && (
        <div className="bg-[#110600]/80 border border-[#D4A853]/15 rounded-2xl overflow-hidden relative animate-fadeIn">
          <div className="p-5 bg-[#1b0801]/60 border-b border-amber-500/15 text-xs inline-flex w-full justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">CONFLICT RESOLUTION &amp; RECOVERY MODEL</span>
              <p className="text-amber-100/60 font-sans">Mengintegrasikan localStorage Queue dengan sinkronisasi ke Supabase saat koneksi kembali online.</p>
            </div>
          </div>
          <pre className="p-5 overflow-auto max-h-[520px] text-[11.5px] leading-relaxed text-amber-100/80 font-mono bg-[#0b0300]/95">
{`// =========================================================
// OFFLINE SYNC RECOVERY ENGINE & REALTIME LISTENER
// Robust local caching mechanism with Supabase fallback
// =========================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export class OfflineSyncEngine {
    private static QUEUE_KEY = "coffeeops_pending_writes";

    public static enqueueAction(table: string, action: "INSERT" | "UPDATE", data: any) {
        const queue = this.getQueue();
        queue.push({
            id: crypto.randomUUID(),
            table,
            action,
            data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
        window.dispatchEvent(new Event("coffeeops_offline_mutation"));
    }

    public static getQueue() {
        const saved = localStorage.getItem(this.QUEUE_KEY);
        return saved ? JSON.parse(saved) : [];
    }

    public static async flushToServer() {
        if (!navigator.onLine) return;
        const queue = this.getQueue();
        if (queue.length === 0) return;

        console.log(\`⚡ Found \${queue.length} pending offline transactions. Flushing to Supabase...\`);
        
        for (const trx of queue) {
            try {
                if (trx.action === "INSERT") {
                    const { error } = await supabase.from(trx.table).insert([trx.data]);
                    if (error) throw error;
                } else if (trx.action === "UPDATE") {
                    const { error } = await supabase.from(trx.table).update(trx.data).eq("id", trx.data.id);
                    if (error) throw error;
                }
            } catch (err) {
                console.error(\`Failed to sync offline trx \${trx.id} on table \${trx.table}:\`, err);
            }
        }
        localStorage.removeItem(this.QUEUE_KEY);
        console.log("🟢 All offline mutations synced with Supabase successfully!");
    }
}

if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
        OfflineSyncEngine.flushToServer();
    });
}`}
          </pre>
        </div>
      )}

      {/* ── WHATSAPP TAB ── */}
      {activeSubTab === "whatsapp" && (
        <div className="bg-[#110600]/80 border border-[#D4A853]/15 rounded-2xl overflow-hidden relative animate-fadeIn">
          <div className="bg-black/55 px-5 py-3.5 border-b border-amber-500/10 flex items-center justify-between text-xs text-amber-100/60 font-mono">
            <span>WhatsAppNotifier.ts</span>
          </div>
          <pre className="p-5 overflow-auto max-h-[520px] text-[11.5px] leading-relaxed text-amber-100/80 font-mono bg-[#0b0300]/95">
{`// =========================================================
// AUTOMATED ORDERING & WA TELEGRAM TEMPLATES
// Standard notification schema for suppliers & PO approvals
// =========================================================

export function generateWhatsAppOrderTemplate(
  supplierName: string,
  supplierPhone: string,
  poNumber: string,
  items: { name: string; qty: number; unit: string }[],
  branchName: string,
  senderName: string
): string {
  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let itemsBody = "";
  items.forEach((item, idx) => {
    itemsBody += \`\${idx + 1}. *\${item.name}* - Qty: \${item.qty} \${item.unit}\\n\`;
  });

  const rawMessage = \`Yth. *\${supplierName}*,

Berikut adalah Surat Pesanan Resmi (Purchase Order) untuk bahan baku cafe kami dari *COFFEEOPS ENTERPRISE*:

📋 *SPESIFIKASI PO*
==========================
*No PO:* \${poNumber}
*Tanggal:* \${dateStr}
*Tujuan Kirim:* \${branchName}
*Dibuat Oleh:* \${senderName}
==========================

*Rincian Barang:*
\${itemsBody}
Mohon segera diproses dan dikonfirmasikan total invoice besertakan detail pengirimannya.

Terima kasih.\`;

  const encodedMsg = encodeURIComponent(rawMessage);
  return \`https://api.whatsapp.com/send?phone=\${supplierPhone}&text=\${encodedMsg}\`;
}`}
          </pre>
        </div>
      )}

    </div>
  );
}
