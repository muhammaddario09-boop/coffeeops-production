-- =========================================================
-- COFFEEOPS SaaS ENTERPRISE - SUPABASE DATABASE SCHEMAS
-- Execute this script directly in the Supabase SQL Editor
-- to instantly configure all schemas for your new host database.
-- =========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COFFEEOPS STATE (Global configuration state backing store)
CREATE TABLE IF NOT EXISTS coffeeops_state (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    state JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EMPLOYEES (FOH Staff roster & credentials lookup)
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'Barista',
    pin VARCHAR(6) DEFAULT '0000',
    email VARCHAR(150),
    phone VARCHAR(50),
    whatsapp_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    staff_code VARCHAR(50),
    employee_code VARCHAR(50),
    branch_id VARCHAR(150) DEFAULT 'Pusat Pangkalpinang (HQ)',
    password VARCHAR(255),
    profile_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ATTENDANCE LOGS (Absensi / Presensi Logs with Biometric Face & GPS distance Radius)
CREATE TABLE IF NOT EXISTS attendance_logs (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(150),
    role VARCHAR(50),
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    shift_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Hadir',
    lateness_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    break_start_time VARCHAR(20),
    break_end_time VARCHAR(20),
    total_break_minutes INT DEFAULT 0,
    qr_scanned BOOLEAN DEFAULT FALSE,
    face_photo TEXT,
    gps_latitude DOUBLE PRECISION,
    gps_longitude DOUBLE PRECISION,
    distance_radius_meters DOUBLE PRECISION
);

-- 4. INVENTORY ITEMS (Stock database containing central and bar layouts)
CREATE TABLE IF NOT EXISTS inventory_items (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) DEFAULT 'pcs',
    par_stock NUMERIC(10,2) DEFAULT 10.00,
    cost_per_unit NUMERIC(12,2) DEFAULT 0.00,
    qty_awal NUMERIC(12,3) DEFAULT 0.000,
    qty_masuk NUMERIC(12,3) DEFAULT 0.000,
    qty_keluar NUMERIC(12,3) DEFAULT 0.000,
    qty_waste NUMERIC(12,3) DEFAULT 0.000,
    qty_gudang NUMERIC(12,3) DEFAULT 0.000,
    qty_bar NUMERIC(12,3) DEFAULT 0.000,
    supplier VARCHAR(255),
    temp VARCHAR(50),
    shelf VARCHAR(50),
    loc VARCHAR(50)
);

-- 5. STOCK MOVEMENTS (Stock card audit movements)
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50),
    "itemCode" VARCHAR(50),
    qty NUMERIC(12,3) DEFAULT 0.000,
    quantity NUMERIC(12,3) DEFAULT 0.000,
    type VARCHAR(30), -- 'STOCK_IN', 'STOCK_OUT', 'RECIPE_DEDUCT', 'WASTE'
    note TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TRANSACTIONS (POS orders settlement logs)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(100) PRIMARY KEY,
    order_code VARCHAR(100),
    total_amount NUMERIC(14,2) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    status VARCHAR(50) DEFAULT 'Settlement',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SUPPLIERS (Raw material vendors roster)
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SYSTEM AUDIT LOGS (Continuous system SecOps trace list)
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    table_impacted VARCHAR(100) DEFAULT 'various',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INSTRUCTIONS:
-- 1. Create a Supabase project.
-- 2. Open the SQL Editor inside project studio.
-- 3. Click 'New query' and paste the complete contents above.
-- 4. Hit 'Run' (Ctrl + Enter) to construct tables.
-- 5. Open Project Settings -> API to copy your Project URL & Anon Key.
-- 6. Paste them inside Kustomisasi Brand -> Integrasi Cloud Database (Supabase) settings of your CoffeeOps app inside the browser.
-- 7. All your data will automatically sync and remain preserved forever!
