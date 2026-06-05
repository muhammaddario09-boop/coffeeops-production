-- ====================================================================
-- COFFEEOPS SaaS ENTERPRISE - SUPABASE RELATION-NORMALIZED SCHEMAS
-- Execute this script in your Supabase SQL Editor to establish connections
-- across SDM, Inventory, Procurement, Recipes, POS, and COGS modules.
-- ====================================================================

-- Enable UUID Extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. MODULE: EMPLOYEE (SDM & Absensi)
-- ==========================================

-- Table: employees (Master Roster)
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'Barista',
    pin VARCHAR(6) DEFAULT '0000',
    email VARCHAR(150),
    phone VARCHAR(50),
    whatsapp_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    is_active BOOLEAN DEFAULT TRUE,
    staff_code VARCHAR(50),
    employee_code VARCHAR(50),
    branch_id VARCHAR(150) DEFAULT 'Pusat Pangkalpinang (HQ)',
    password VARCHAR(255),
    profile_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: attendance (Absensi & GPS Audit Log)
-- Defensive strategy: Referencing employees with 'ON DELETE RESTRICT' ensuring employee records can not be hard deleted if they possess historical attendance tracking.
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(100) PRIMARY KEY,
    employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE RESTRICT,
    user_name VARCHAR(150),
    role VARCHAR(50),
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    shift_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Hadir', -- 'Hadir', 'Terlambat', 'Overtime', 'Izin', 'Alpa'
    lateness_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    break_start_time VARCHAR(20),
    break_end_time VARCHAR(20),
    total_break_minutes INT DEFAULT 0,
    qr_scanned BOOLEAN DEFAULT FALSE,
    face_photo TEXT,
    gps_latitude DOUBLE PRECISION,
    gps_longitude DOUBLE PRECISION,
    distance_radius_meters DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: shift_schedule (Histori Penjadwalan Kerja)
CREATE TABLE IF NOT EXISTS shift_schedule (
    id VARCHAR(100) PRIMARY KEY,
    employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE RESTRICT,
    shift_date DATE NOT NULL,
    shift_name VARCHAR(50) NOT NULL, -- 'Morning', 'Middle', 'Night'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: kpi_performance (Evaluasi Nilai Karyawan Bulanan)
CREATE TABLE IF NOT EXISTS kpi_performance (
    id VARCHAR(100) PRIMARY KEY,
    employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE RESTRICT,
    period VARCHAR(30) NOT NULL, -- 'June 2026'
    sop_score NUMERIC(5,2) DEFAULT 0.00,
    hygiene_score NUMERIC(5,2) DEFAULT 0.00,
    discipline_score NUMERIC(5,2) DEFAULT 0.00,
    average_score NUMERIC(5,2) GENERATED ALWAYS AS ((sop_score + hygiene_score + discipline_score) / 3.0) STORED,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- 2. MODULE: INVENTORY (Inventaris & Multi-Location Gudang)
-- ==========================================

-- Table: warehouse (Lokasi Penempatan Produk / Bahan Baku)
CREATE TABLE IF NOT EXISTS warehouse (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- 'Gudang Utama Bulk', 'Bar Chiller', 'Bar Counter'
    location VARCHAR(150),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: inventory_items (Master Bahan Baku & SKU Supplier)
CREATE TABLE IF NOT EXISTS inventory_items (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) DEFAULT 'pcs',
    par_stock NUMERIC(10,2) DEFAULT 10.00,
    cost_per_unit NUMERIC(12,2) DEFAULT 0.00,
    qty_awal NUMERIC(12,3) DEFAULT 0.000,
    qty_gudang NUMERIC(12,3) DEFAULT 0.000,
    qty_bar NUMERIC(12,3) DEFAULT 0.000,
    supplier VARCHAR(255),
    temp VARCHAR(50),
    shelf VARCHAR(50),
    loc VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: stock_movements (Audit Trail Kartu Stok)
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) REFERENCES inventory_items(code) ON DELETE RESTRICT,
    warehouse_id VARCHAR(100) REFERENCES warehouse(id) ON DELETE RESTRICT,
    qty NUMERIC(12,3) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'STOCK_IN', 'STOCK_OUT', 'RECIPE_DEDUCT', 'WASTE_LOSS', 'TRANSFER'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: transfer_barang (Mutasi Mutu Bahan Antar Gudang & Bar)
CREATE TABLE IF NOT EXISTS transfer_barang (
    id VARCHAR(100) PRIMARY KEY,
    item_code VARCHAR(50) REFERENCES inventory_items(code) ON DELETE RESTRICT,
    source_warehouse_id VARCHAR(100) REFERENCES warehouse(id) ON DELETE RESTRICT,
    destination_warehouse_id VARCHAR(100) REFERENCES warehouse(id) ON DELETE RESTRICT,
    qty NUMERIC(12,3) NOT NULL,
    status VARCHAR(30) DEFAULT 'Completed', -- 'Pending', 'In_Transit', 'Completed'
    requested_by VARCHAR(100) REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: waste_loss (Bahan Rusak, Expired, atau Kehilangan Piring/Glassware)
CREATE TABLE IF NOT EXISTS waste_loss (
    id VARCHAR(100) PRIMARY KEY,
    item_code VARCHAR(50) REFERENCES inventory_items(code) ON DELETE RESTRICT,
    warehouse_id VARCHAR(100) REFERENCES warehouse(id) ON DELETE RESTRICT,
    qty NUMERIC(12,3) NOT NULL,
    cause VARCHAR(150) NOT NULL, -- 'Expired', 'Spilled', 'Spoiled'
    loss_amount NUMERIC(12,2) DEFAULT 0.00,
    reported_by VARCHAR(100) REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- 3. MODULE: PROCUREMENT (Pembelian Supplier & GRN)
-- ==========================================

-- Table: suppliers (Master Vendor)
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: purchase_order (Rencana Pembelian Bahan)
CREATE TABLE IF NOT EXISTS purchase_order (
    id VARCHAR(100) PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id VARCHAR(100) REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    total_amount NUMERIC(14,2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Draft', -- 'Draft', 'Ordered', 'Completed', 'Cancelled'
    created_by VARCHAR(100) REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: goods_received_notes (Surat Penerimaan Barang / GRN Gudang)
CREATE TABLE IF NOT EXISTS goods_received_notes (
    id VARCHAR(100) PRIMARY KEY,
    grn_number VARCHAR(100) UNIQUE NOT NULL,
    purchase_order_id VARCHAR(100) REFERENCES purchase_order(id) ON DELETE RESTRICT,
    received_date DATE NOT NULL,
    received_by VARCHAR(100) REFERENCES employees(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: purchase_order_items (Detail Pengadaan Bahan Masuk)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id VARCHAR(100) PRIMARY KEY,
    purchase_order_id VARCHAR(100) REFERENCES purchase_order(id) ON DELETE CASCADE,
    item_code VARCHAR(50) REFERENCES inventory_items(code) ON DELETE RESTRICT,
    qty_ordered NUMERIC(12,3) NOT NULL,
    qty_received NUMERIC(12,3) DEFAULT 0.000,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(14,2) GENERATED ALWAYS AS (qty_ordered * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- 4. MODULE: MENU & HPP (Formulasi & Resep)
-- ==========================================

-- Table: products (Daftar Menu Kasir POS)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50), -- 'Kopi', 'Non-Kopi', 'Makanan', 'Cemilan'
    selling_price NUMERIC(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: recipes (SOP Pembuatan)
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: recipe_items (Komposisi Takaran per Porsi Bahan Baku)
CREATE TABLE IF NOT EXISTS recipe_items (
    id VARCHAR(100) PRIMARY KEY,
    recipe_id VARCHAR(100) REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_code VARCHAR(50) REFERENCES inventory_items(code) ON DELETE RESTRICT,
    qty_needed NUMERIC(12,3) NOT NULL, -- Contoh: 0.015 (15 Gram Biji Kopi / Espresso)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: ingredient_cost (Pelacakan Akurasi HPP & Gross Margin Teraktual)
CREATE TABLE IF NOT EXISTS ingredient_cost (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
    total_hpp NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    margin_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00, -- (Selling_Price - HPP) / Selling_Price * 100
    last_recalculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- 5. MODULE: POS (Order Main Settlement)
-- ==========================================

-- Table: sales (Penjualan / Struk Transaksi Kasir)
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(100) PRIMARY KEY,
    order_code VARCHAR(100) UNIQUE NOT NULL,
    cashier_id VARCHAR(100) REFERENCES employees(id) ON DELETE RESTRICT,
    total_amount NUMERIC(14,2) DEFAULT 0.00,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    net_amount NUMERIC(14,2) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'CASH', -- 'CASH', 'QRIS', 'DEBIT'
    status VARCHAR(50) DEFAULT 'Settlement', -- 'Pending', 'Settlement', 'Refunded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: sale_items (Item Pembelian POS)
CREATE TABLE IF NOT EXISTS sale_items (
    id VARCHAR(100) PRIMARY KEY,
    sale_id VARCHAR(100) REFERENCES sales(id) ON DELETE CASCADE,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE RESTRICT,
    price NUMERIC(12,2) NOT NULL,
    qty INT NOT NULL,
    subtotal NUMERIC(14,2) GENERATED ALWAYS AS (price * qty) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: inventory_deduction (Log Pengurangan Stok Otomatis saat Menu Terjual)
CREATE TABLE IF NOT EXISTS inventory_deduction (
    id VARCHAR(100) PRIMARY KEY,
    sale_item_id VARCHAR(100) REFERENCES sale_items(id) ON DELETE CASCADE,
    ingredient_code VARCHAR(50) REFERENCES inventory_items(code) ON DELETE RESTRICT,
    qty_deducted NUMERIC(12,3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: COGS_calculation (History HPP Terjual per Struk Penjualan)
CREATE TABLE IF NOT EXISTS cogs_calculation (
    id VARCHAR(100) PRIMARY KEY,
    sale_id VARCHAR(100) REFERENCES sales(id) ON DELETE CASCADE,
    total_sale_amount NUMERIC(14,2) NOT NULL,
    total_cogs_amount NUMERIC(14,2) NOT NULL, -- Total HPP Akumulatif menu terjual
    gross_profit NUMERIC(14,2) GENERATED ALWAYS AS (total_sale_amount - total_cogs_amount) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- GLOBAL STATE COFFEEOPS (Unified Backing Store for client syncing)
-- ====================================================================
CREATE TABLE IF NOT EXISTS coffeeops_state (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    state JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
