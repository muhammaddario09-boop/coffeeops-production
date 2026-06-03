import React, { useState } from "react";
import { CoffeeOpsState, User, EquipmentAsset, EquipmentMaintenanceLog } from "../types";
import { 
  Wrench, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  QrCode, 
  Camera, 
  Trash2, 
  Settings,
  HelpCircle,
  TrendingDown,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface EquipmentCenterProps {
  state: CoffeeOpsState;
  syncState: (updatedState: CoffeeOpsState) => Promise<void>;
  currentUser: User | null;
  activeRole: string;
}

const DEPARTMENTS = [
  "Coffee Equipment",
  "Kitchen Equipment",
  "FOH Equipment",
  "Service Equipment",
  "Office Equipment"
] as const;

type EquipmentDepartment = typeof DEPARTMENTS[number];

const STATUSES = [
  "Aktif",
  "Damaged",
  "Maintenance Needed",
  "Under Repair"
] as const;

type EquipmentStatus = typeof STATUSES[number];

export default function EquipmentCenter({
  state,
  syncState,
  currentUser,
  activeRole
}: EquipmentCenterProps) {
  const assets = state.equipmentList || [];
  
  // Filtering & search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [scannedAssetCode, setScannedAssetCode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedAssetForQr, setSelectedAssetForQr] = useState<EquipmentAsset | null>(null);
  
  // Form states (Add/Edit Asset)
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EquipmentAsset | null>(null);
  
  // Individual fields
  const [formAssetId, setFormAssetId] = useState("");
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formPrice, setFormPrice] = useState(0);
  const [formSupplier, setFormSupplier] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDept, setFormDept] = useState<EquipmentDepartment>("Coffee Equipment");
  const [formStatus, setFormStatus] = useState<EquipmentStatus>("Aktif");
  const [formWarranty, setFormWarranty] = useState("");
  const [formEconomicLife, setFormEconomicLife] = useState(5);
  const [formPurchaseDate, setFormPurchaseDate] = useState("");
  const [formSchedule, setFormSchedule] = useState<"Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annual">("Monthly");
  const [formPhoto, setFormPhoto] = useState("");

  // Maintenance Logging
  const [isMaintFormOpen, setIsMaintFormOpen] = useState(false);
  const [maintAsset, setMaintAsset] = useState<EquipmentAsset | null>(null);
  const [maintTechnician, setMaintTechnician] = useState("");
  const [maintNotes, setMaintNotes] = useState("");
  const [maintCost, setMaintCost] = useState(0);
  const [maintPhotoBefore, setMaintPhotoBefore] = useState("");
  const [maintPhotoAfter, setMaintPhotoAfter] = useState("");

  const isAuthorized = activeRole === "Owner" || activeRole === "Manager";

  // Warranty Days Remaining & Alert computation
  const getWarrantyAlertInfo = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { msg: "Garansi telah berakhir", color: "text-red-400 bg-red-950/30 border-red-900/30", isAlert: true, days: daysDiff };
    } else if (daysDiff <= 7) {
      return { msg: `⚠️ Garansi Berakhir H-7! (${daysDiff} hari lagi)`, color: "text-red-400 bg-red-950/30 border-red-500/20 activePulse animate-pulse", isAlert: true, days: daysDiff };
    } else if (daysDiff <= 30) {
      return { msg: `⚠️ Garansi Berakhir H-30! (${daysDiff} hari lagi)`, color: "text-orange-400 bg-orange-950/30 border-orange-500/20", isAlert: true, days: daysDiff };
    } else if (daysDiff <= 90) {
      return { msg: `Garansi Berakhir H-90 (${daysDiff} hari lagi)`, color: "text-amber-300 bg-amber-950/20 border-amber-500/10", isAlert: true, days: daysDiff };
    }
    return { msg: `Garansi aktif (${daysDiff} hari lagi)`, color: "text-emerald-400 bg-emerald-950/20 border-emerald-500/10", isAlert: false, days: daysDiff };
  };

  // Straight line depreciation model
  // Monthly Depreciation = Purchase Price / (EconomicLifeYears * 12)
  // Elapsed months between Purchase Date and June 2026 (or current Date)
  const calculateDepreciation = (asset: EquipmentAsset) => {
    const purchase = new Date(asset.purchaseDate);
    const current = new Date("2026-06-02"); // Application Anchor Date
    
    // Calculate elapsed months
    let monthsElapsed = 0;
    if (current > purchase) {
      monthsElapsed = (current.getFullYear() - purchase.getFullYear()) * 12 + (current.getMonth() - purchase.getMonth());
    }
    
    const totalMonths = asset.economicLifeYears * 12;
    const monthlyDepreciation = asset.purchasePrice / totalMonths;
    const totalDepreciated = monthlyDepreciation * monthsElapsed;
    
    const bookValue = Math.max(0, asset.purchasePrice - totalDepreciated);
    const annualDepreciation = asset.purchasePrice / asset.economicLifeYears;

    return {
      monthly: Math.round(monthlyDepreciation),
      annual: Math.round(annualDepreciation),
      elapsedMonths: monthsElapsed,
      accumulated: Math.min(asset.purchasePrice, Math.round(totalDepreciated)),
      bookValue: Math.round(bookValue)
    };
  };

  // Filter Assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === "All" || asset.department === selectedDept;
    const matchesStatus = selectedStatus === "All" || asset.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Open asset management dialog
  const openCreateAssetModal = () => {
    setEditingAsset(null);
    setFormAssetId(`EQ-COF-${String(assets.length + 1).padStart(3, "0")}`);
    setFormName("");
    setFormBrand("");
    setFormModel("");
    setFormSerial("");
    setFormPrice(0);
    setFormSupplier("");
    setFormLocation("");
    setFormDept("Coffee Equipment");
    setFormStatus("Aktif");
    setFormWarranty(new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().substring(0, 10)); // +1 year
    setFormEconomicLife(5);
    setFormPurchaseDate(new Date().toISOString().substring(0, 10));
    setFormSchedule("Monthly");
    setFormPhoto("");
    setIsAssetFormOpen(true);
  };

  const openEditAssetModal = (asset: EquipmentAsset) => {
    setEditingAsset(asset);
    setFormAssetId(asset.assetId);
    setFormName(asset.name);
    setFormBrand(asset.brand);
    setFormModel(asset.model);
    setFormSerial(asset.serialNumber);
    setFormPrice(asset.purchasePrice);
    setFormSupplier(asset.supplier);
    setFormLocation(asset.location);
    setFormDept(asset.department);
    setFormStatus(asset.status);
    setFormWarranty(asset.warrantyExpiry);
    setFormEconomicLife(asset.economicLifeYears);
    setFormPurchaseDate(asset.purchaseDate);
    setFormSchedule(asset.maintenanceSchedule);
    setFormPhoto(asset.photoUrl || "");
    setIsAssetFormOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAssetId.trim()) {
      alert("Nama Alat dan No ID Aset wajib diisi!");
      return;
    }

    const nextAssets = [...assets];
    
    if (editingAsset) {
      const idx = nextAssets.findIndex(a => a.id === editingAsset.id);
      if (idx !== -1) {
        nextAssets[idx] = {
          ...editingAsset,
          assetId: formAssetId.trim().toUpperCase(),
          name: formName.trim(),
          brand: formBrand.trim(),
          model: formModel.trim(),
          serialNumber: formSerial.trim(),
          purchasePrice: Math.abs(formPrice),
          supplier: formSupplier.trim(),
          location: formLocation.trim(),
          department: formDept,
          status: formStatus,
          warrantyExpiry: formWarranty,
          economicLifeYears: Math.max(1, formEconomicLife),
          purchaseDate: formPurchaseDate,
          maintenanceSchedule: formSchedule,
          photoUrl: formPhoto.trim() || undefined
        };
      }
    } else {
      const newAsset: EquipmentAsset = {
        id: `eq-${Date.now()}`,
        assetId: formAssetId.trim().toUpperCase(),
        name: formName.trim(),
        brand: formBrand.trim(),
        model: formModel.trim(),
        serialNumber: formSerial.trim(),
        purchasePrice: Math.abs(formPrice),
        supplier: formSupplier.trim(),
        location: formLocation.trim(),
        department: formDept,
        status: formStatus,
        warrantyExpiry: formWarranty,
        economicLifeYears: Math.max(1, formEconomicLife),
        purchaseDate: formPurchaseDate,
        maintenanceSchedule: formSchedule,
        photoUrl: formPhoto.trim() || undefined,
        maintenanceHistory: []
      };
      nextAssets.push(newAsset);
    }

    await syncState({
      ...state,
      equipmentList: nextAssets
    });
    setIsAssetFormOpen(false);
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    if (!confirm(`Sistem akan menghapus data pendaftaran aset ${name} beserta riwayat pelayanannya secara permanen. Lanjutkan?`)) {
      return;
    }
    const nextAssets = assets.filter(a => a.id !== id);
    await syncState({
      ...state,
      equipmentList: nextAssets
    });
    if (activeAssetId === id) setActiveAssetId(null);
  };

  // Maintenance Record Handler
  const openMaintModal = (asset: EquipmentAsset) => {
    setMaintAsset(asset);
    setMaintTechnician("");
    setMaintNotes("");
    setMaintCost(0);
    setMaintPhotoBefore("");
    setMaintPhotoAfter("");
    setIsMaintFormOpen(true);
  };

  const handleSaveMaintLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintAsset) return;
    if (!maintTechnician.trim() || !maintNotes.trim()) {
      alert("Harap isi nama Teknisi dan Catatan hasil tindakan perawatan!");
      return;
    }

    const newLog: EquipmentMaintenanceLog = {
      id: `emh-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      technician: maintTechnician.trim(),
      notes: maintNotes.trim(),
      cost: Math.abs(maintCost),
      photoBefore: maintPhotoBefore.trim() || undefined,
      photoAfter: maintPhotoAfter.trim() || undefined
    };

    const nextAssets = assets.map(asset => {
      if (asset.id === maintAsset.id) {
        const history = asset.maintenanceHistory ? [...asset.maintenanceHistory] : [];
        history.unshift(newLog);
        return {
          ...asset,
          status: "Aktif" as EquipmentStatus, // set back to active after repair logging
          maintenanceHistory: history
        };
      }
      return asset;
    });

    await syncState({
      ...state,
      equipmentList: nextAssets
    });

    setIsMaintFormOpen(false);
  };

  // Simulators for URLs
  const simulatePhotoAsset = () => {
    const pics = [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=80"
    ];
    setFormPhoto(pics[Math.floor(Math.random() * pics.length)]);
  };

  const simulateBeforePhoto = () => {
    setMaintPhotoBefore("https://images.unsplash.com/photo-1541167760496-1628856ab772?w=450&auto=format&fit=crop&q=60");
  };

  const simulateAfterPhoto = () => {
    setMaintPhotoAfter("https://images.unsplash.com/photo-1498804103079-a6351b050096?w=450&auto=format&fit=crop&q=60");
  };

  // QR Scan emulation
  const handleVerifyScan = () => {
    if (!scannedAssetCode.trim()) return;
    const match = assets.find(a => a.assetId.toLowerCase() === scannedAssetCode.trim().toLowerCase());
    if (match) {
      setActiveAssetId(match.id);
      setIsScannerOpen(false);
      setScannedAssetCode("");
    } else {
      alert(`ID Aset "${scannedAssetCode}" tidak terdaftar dalam database CoffeeOps.`);
    }
  };

  return (
    <div className="space-y-6 text-amber-50 animate-fadeIn" id="equipment-center-container">
      
      {/* 1. Header Info & Stats */}
      <div className="bg-[#1a0a00]/30 p-5 border border-amber-500/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            ⚙️ Pusat Pengendalian Alat &amp; Aset Kafe
          </h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Manajemen inventarisasi mesin espresso, grinder, chiller, penentuan jadwal perawatan rutin harian, kalkulasi penyusutan, dan scan QR Aset.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* Scan QR */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 md:flex-initial bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono text-amber-300 border border-amber-500/20 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
          >
            <QrCode size={16} /> SCAN QR ASET
          </button>

          {isAuthorized && (
            <button
              onClick={openCreateAssetModal}
              className="flex-1 md:flex-initial bg-[#D4A853] hover:bg-[#c29643] px-4 py-2.5 rounded-xl text-amber-950 text-xs font-bold font-mono transition duration-200 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
              id="add-asset-btn"
            >
              <Plus size={16} /> REGISTRASI ASET
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Banner Alerts - Warranty warnings */}
      {assets.some(a => getWarrantyAlertInfo(a.warrantyExpiry).isAlert) && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-2 animate-pulse" id="warranty-alerts-banner">
          <div className="flex items-center gap-2 text-red-300 font-bold text-xs uppercase font-serif">
            <AlertTriangle size={15} /> Notifikasi Pemantau Masa Garansi Aset Aktif:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
            {assets.map(asset => {
              const alertInfo = getWarrantyAlertInfo(asset.warrantyExpiry);
              if (!alertInfo.isAlert) return null;
              return (
                <div key={asset.id} className="flex justify-between items-center bg-black/30 p-2.5 rounded-lg border border-red-500/10">
                  <span className="font-semibold text-amber-200 truncate pr-2">{asset.name} ({asset.assetId})</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase ${alertInfo.color}`}>
                    {alertInfo.msg}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Search & Quick Filters */}
      <div className="bg-[#241205]/40 border border-[#D4A853]/15 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-amber-500/50" size={16} />
            <input
              type="text"
              placeholder="Cari ID, nama aset, merk, serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/45 border border-amber-500/15 focus:border-amber-500/50 outline-none text-xs rounded-xl pl-10 pr-4 py-3 text-amber-50"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl px-3.5 py-2.5 text-xs text-amber-100 outline-none min-h-[44px]"
          >
            <option value="All" className="bg-amber-950">Semua Departemen ({assets.length})</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept} className="bg-amber-950">{dept} ({assets.filter(a => a.department === dept).length})</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl px-3.5 py-2.5 text-xs text-amber-100 outline-none min-h-[44px]"
          >
            <option value="All" className="bg-amber-950">Semua Status Operasional</option>
            {STATUSES.map(stat => (
              <option key={stat} value={stat} className="bg-amber-950">{stat} ({assets.filter(a => a.status === stat).length})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Display Assets Block */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 bg-black/20 border border-dashed border-amber-500/10 rounded-2xl flex flex-col items-center justify-center">
          <Wrench className="text-amber-500/20 mb-3" size={48} />
          <h4 className="font-serif text-sm font-semibold text-amber-200/70">Aset Tidak Terdaftar</h4>
          <p className="text-[11px] text-amber-100/30 max-w-sm mt-1">
            Belum ada mesin, chiller, oven atau AC terdaftar yang cocok dengan pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAssets.map(asset => {
            const isExpanded = activeAssetId === asset.id;
            const deprec = calculateDepreciation(asset);
            const warrantyAlert = getWarrantyAlertInfo(asset.warrantyExpiry);

            const statusColors: Record<string, string> = {
              "Aktif": "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
              "Damaged": "bg-red-500/10 text-red-400 border-red-500/15",
              "Maintenance Needed": "bg-amber-500/10 text-amber-400 border-amber-500/15",
              "Under Repair": "bg-blue-500/10 text-blue-400 border-blue-500/15"
            };

            return (
              <div
                key={asset.id}
                id={`asset-card-${asset.id}`}
                className={`bg-[#1c0e05]/50 border border-amber-500/10 hover:border-amber-400/20 rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? "shadow-[0_12px_24px_rgba(0,0,0,0.5)] border-[#D4A853]/25" : ""
                }`}
              >
                {/* Header overview - Responsive flexible layout */}
                <div
                  onClick={() => setActiveAssetId(isExpanded ? null : asset.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer hover:bg-amber-500/5 select-none text-xs sm:text-sm"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/5 border border-amber-500/15 flex flex-col items-center justify-center font-mono text-[10px] font-bold text-amber-400 shrink-0 shadow-sm">
                      📟
                      <span className="scale-75 uppercase block mt-0.5 tracking-tight">{asset.assetId.substring(3, 6)}</span>
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-amber-250 bg-amber-950/40 border border-amber-500/10 px-2 py-0.5 rounded-full">
                          {asset.department}
                        </span>
                        <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded border ${statusColors[asset.status]}`}>
                          ● {asset.status}
                        </span>
                      </div>

                      <h4 className="font-serif font-black text-amber-100 text-sm sm:text-base truncate">
                        {asset.name}
                      </h4>

                      <p className="text-[11px] text-amber-100/30">
                        {asset.brand} • {asset.model} • S/N: {asset.serialNumber} • Lokasi: {asset.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-none border-amber-500/5">
                    <div className="text-right sm:block flex justify-between items-center w-full sm:w-auto">
                      <span className="text-[10px] text-amber-100/30 font-mono block sm:inline">Nilai Buku:</span>
                      <strong className="text-emerald-300 font-mono font-black text-xs sm:text-sm block">
                        Rp {deprec.bookValue.toLocaleString("id-ID")}
                      </strong>
                    </div>

                    <span className="p-1 rounded bg-black/40 border border-amber-500/10 hidden sm:block">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </div>

                {/* Expanded asset sheet details */}
                {isExpanded && (
                  <div className="border-t border-amber-500/10 p-5 space-y-6 bg-black/20 animate-fadeIn text-xs sm:text-sm">
                    
                    {/* Bento layout for technical details */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      
                      {/* Left: General metadata block */}
                      <div className="md:col-span-5 space-y-4">
                        
                        {/* Image asset view */}
                        <div className="bg-[#1a0a01] border border-amber-500/10 p-3.5 rounded-xl text-center space-y-2">
                          {asset.photoUrl ? (
                            <img
                              src={asset.photoUrl}
                              alt={asset.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-32 object-cover rounded-lg border border-amber-500/10 shadow-sm"
                            />
                          ) : (
                            <div className="py-10 bg-black/25 font-mono text-[10.5px] text-amber-200/20 italic rounded-lg">
                              (Tidak ada foto standar aset)
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-1.5 pt-1">
                            <button
                              onClick={() => setSelectedAssetForQr(asset)}
                              className="text-[10px] bg-black/45 hover:bg-amber-500/10 text-[#D4A853] p-1.5 border border-amber-500/10 rounded-lg font-mono flex items-center justify-center gap-1 cursor-pointer w-full"
                            >
                              <QrCode size={12} /> TAMPILKAN QR TAG
                            </button>
                          </div>
                        </div>

                        {/* General details lists */}
                        <div className="bg-[#291708]/30 border border-amber-500/5 p-3 rounded-xl space-y-2">
                          <h5 className="text-[10.5px] font-mono tracking-wider text-amber-300 font-bold border-b border-amber-500/5 pb-1 uppercase">SPESIFIKASI ADMINISTRASI</h5>
                          <div className="space-y-1.5 text-[10.5px] font-mono">
                            <div className="flex justify-between"><span className="text-amber-100/40">ID Registrasi Aset:</span> <span className="font-bold text-amber-100">{asset.assetId}</span></div>
                            <div className="flex justify-between"><span className="text-amber-100/40">Supplier Agen:</span> <span className="font-bold text-amber-100 truncate max-w-[150px]">{asset.supplier}</span></div>
                            <div className="flex justify-between"><span className="text-amber-100/40">Tanggal Membeli:</span> <span className="font-bold text-amber-100">{asset.purchaseDate}</span></div>
                            <div className="flex justify-between"><span className="text-amber-100/40">Masa Garansi Selesai:</span> <span className="font-bold text-amber-100">{asset.warrantyExpiry}</span></div>
                            <div className="flex justify-between"><span className="text-amber-100/40">Siklus Pemeliharaan:</span> <span className="font-bold text-amber-300 uppercase">{asset.maintenanceSchedule}</span></div>
                          </div>
                        </div>

                        <div className={`p-3.5 border rounded-xl text-[10.5px] text-center font-semibold font-mono ${warrantyAlert.color}`}>
                          {warrantyAlert.msg}
                        </div>

                      </div>

                      {/* Right: Depreciation & Depreciation Graph block */}
                      <div className="md:col-span-7 space-y-4">
                        
                        {/* Depreciation card box */}
                        <div className="bg-black/25 border border-amber-500/10 p-4 rounded-xl space-y-3.5">
                          <h5 className="font-serif text-amber-200 font-bold flex items-center gap-1.5 border-b border-amber-500/5 pb-1.5">
                            <TrendingDown size={14} className="text-[#D4A853]" /> Perhitungan Penyusutan Aset (Metode Garis Lurus):
                          </h5>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-[#120a04]/40 p-2 rounded-xl text-center border border-amber-500/5">
                              <span className="text-[9.5px] text-amber-100/30 uppercase font-mono block">Harga Beli Awal</span>
                              <strong className="text-amber-100 font-mono text-xs sm:text-sm">Rp {asset.purchasePrice.toLocaleString("id-ID")}</strong>
                            </div>

                            <div className="bg-[#120a04]/40 p-2 rounded-xl text-center border border-amber-500/5">
                              <span className="text-[9.5px] text-amber-100/30 uppercase font-mono block">Umur Ekonomis</span>
                              <strong className="text-amber-100 font-mono text-xs sm:text-sm">{asset.economicLifeYears} Tahun</strong>
                            </div>

                            <div className="bg-[#120a04]/40 p-2 rounded-xl text-center border border-amber-500/5 col-span-2 sm:col-span-1">
                              <span className="text-[9.5px] text-amber-100/30 uppercase font-mono block">Bulan Berjalan</span>
                              <strong className="text-amber-300 font-mono text-xs sm:text-sm">{deprec.elapsedMonths} / {asset.economicLifeYears * 12} bulan</strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="bg-[#120a04]/40 p-2.5 rounded-xl border border-amber-500/5 flex justify-between items-center font-mono">
                              <span className="text-[10px] text-amber-100/40">Susut / Tahun:</span>
                              <strong className="text-amber-100 text-[11px]">Rp {deprec.annual.toLocaleString("id-ID")}</strong>
                            </div>

                            <div className="bg-[#120a04]/40 p-2.5 rounded-xl border border-amber-500/5 flex justify-between items-center font-mono">
                              <span className="text-[10px] text-amber-100/40">Susut / Bulan:</span>
                              <strong className="text-amber-100 text-[11px]">Rp {deprec.monthly.toLocaleString("id-ID")}</strong>
                            </div>

                            <div className="bg-red-500/5 p-2.5 rounded-xl border border-red-500/10 col-span-2 flex justify-between items-center font-mono">
                              <span className="text-[10px] text-red-300">Akumulasi Penyusutan:</span>
                              <strong className="text-red-400 text-xs">- Rp {deprec.accumulated.toLocaleString("id-ID")}</strong>
                            </div>
                          </div>

                          {/* Graphical Mini Progress Bar */}
                          <div className="space-y-1 font-mono text-[9px] pt-1">
                            <div className="flex justify-between text-amber-100/40">
                              <span>Nilai Sisa Buku: Rp {deprec.bookValue.toLocaleString("id-ID")}</span>
                              <span>{Math.round((deprec.bookValue / asset.purchasePrice) * 100)}% Nilai Tersisa</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-amber-500/5">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-300" 
                                style={{ width: `${(deprec.bookValue / asset.purchasePrice) * 100}%` }}
                              />
                            </div>
                          </div>

                        </div>

                        {/* Actions buttons */}
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            onClick={() => openMaintModal(asset)}
                            className="bg-amber-500 hover:bg-amber-600 px-3.5 py-2.5 text-amber-950 font-bold rounded-xl text-[11px] transition duration-200 cursor-pointer min-h-[44px] flex items-center gap-1 shadow"
                          >
                            <Plus size={13} /> LOG PELAYANAN / MAINTENANCE
                          </button>

                          {isAuthorized && (
                            <button
                              onClick={() => openEditAssetModal(asset)}
                              className="bg-black/35 hover:bg-amber-500/10 px-3.5 py-2.5 border border-amber-500/15 hover:border-amber-400 text-amber-200 rounded-xl text-[11px] font-bold cursor-pointer transition min-h-[44px]"
                            >
                              EDIT ASET
                            </button>
                          )}

                          {isAuthorized && (
                            <button
                              onClick={() => handleDeleteAsset(asset.id, asset.name)}
                              className="bg-red-500/10 hover:bg-red-500/20 px-3 py-2.5 border border-red-500/20 text-red-400 rounded-xl text-[11px] uppercase font-bold font-mono cursor-pointer transition active:scale-95 min-h-[44px]"
                            >
                              HAPUS ASET
                            </button>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Maintenance History section */}
                    <div className="space-y-2 p-4 bg-[#211101]/20 border border-amber-500/5 rounded-2xl">
                      <h5 className="font-serif text-[11px] text-amber-300 font-extrabold pb-1.5 border-b border-amber-500/5 flex items-center gap-2">
                        <Calendar size={13} /> Riwayat Tindakan Perawatan &amp; Service Terakhir
                      </h5>
                      {asset.maintenanceHistory && asset.maintenanceHistory.length > 0 ? (
                        <div className="divide-y divide-amber-500/5 max-h-52 overflow-y-auto custom-scrollbar">
                          {asset.maintenanceHistory.map((log) => (
                            <div key={log.id} className="py-3 flex flex-col sm:flex-row justify-between gap-3 text-[11px] hover:bg-amber-500/5 pr-2 rounded">
                              <div className="space-y-1 pl-1">
                                <p className="text-amber-100 font-semibold">{log.notes}</p>
                                <div className="text-[10px] text-amber-200/40 font-mono flex flex-wrap gap-x-3 gap-y-1">
                                  <span>📅 Tanggal: <strong className="text-amber-100">{log.date}</strong></span>
                                  <span>👤 Teknisi: <strong className="text-amber-100">{log.technician}</strong></span>
                                </div>
                              </div>
                              <div className="flex gap-2 sm:self-center shrink-0">
                                <span className="bg-amber-500/10 text-[#D4A853] font-mono font-bold px-2.5 py-1.5 rounded-lg border border-amber-500/10">
                                  Rp {log.cost.toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10.5px] font-mono italic text-amber-150/20 py-2">Belum ada riwayat perbaikan maupun pemeliharaan terjadwal.</p>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. ASSET REGISTER / EDIT DIALOG FORM */}
      {isAssetFormOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#140b04] border border-[#D4A853]/20 rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl text-amber-50 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-3">
              <h4 className="font-serif text-sm sm:text-base font-bold text-amber-200">
                {editingAsset ? `✏️ Edit Pendaftaran Aset: ${editingAsset.name}` : "➕ Pendaftaran & Registrasi Aset Baru"}
              </h4>
              <button
                type="button"
                onClick={() => setIsAssetFormOpen(false)}
                className="text-amber-100/50 hover:text-amber-100 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4">
              
              {/* AssetId & Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">No Registrasi (Asset ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="EQ-COF-001"
                    value={formAssetId}
                    onChange={(e) => setFormAssetId(e.target.value.toUpperCase())}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Nama Alat / Mesin</label>
                  <input
                    type="text"
                    required
                    placeholder="La Marzocco Linea PB 2-Group"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                  />
                </div>
              </div>

              {/* Brand, Model, Serial */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Merk / Pabrikan</label>
                  <input
                    type="text"
                    placeholder="Mahlkonig"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 ltr outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Model / Seri</label>
                  <input
                    type="text"
                    placeholder="Linea PB 2-Group"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Serial Number (S/N)</label>
                  <input
                    type="text"
                    placeholder="LM-99381-XX"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full"
                  />
                </div>
              </div>

              {/* Price, Supplier, Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Harga Beli Awal (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="150000000"
                    value={formPrice || ""}
                    onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Supplier Toko Agen</label>
                  <input
                    type="text"
                    placeholder="Toffin Indonesia"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Lokasi Penempatan</label>
                  <input
                    type="text"
                    placeholder="Main Coffee Bar"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                  />
                </div>
              </div>

              {/* Dept, Status, Maintenance Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Departemen Kategori</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value as EquipmentDepartment)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept} className="bg-amber-950">{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Status Awal</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as EquipmentStatus)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                  >
                    {STATUSES.map(stat => (
                      <option key={stat} value={stat} className="bg-amber-950">{stat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Siklus Pemeliharaan</label>
                  <select
                    value={formSchedule}
                    onChange={(e) => setFormSchedule(e.target.value as any)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                  >
                    <option value="Daily" className="bg-amber-950">Setiap Hari (Daily)</option>
                    <option value="Weekly" className="bg-amber-950">Setiap Minggu (Weekly)</option>
                    <option value="Monthly" className="bg-amber-950">Setiap Bulan (Monthly)</option>
                    <option value="Quarterly" className="bg-amber-950">Tiga Bulanan (Quarterly)</option>
                    <option value="Annual" className="bg-amber-950">Satu Tahunan (Annual)</option>
                  </select>
                </div>
              </div>

              {/* Purchase Date, Warranty, Economic Life */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Tanggal Pembelian</label>
                  <input
                    type="date"
                    required
                    value={formPurchaseDate}
                    onChange={(e) => setFormPurchaseDate(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2 text-xs text-amber-50 outline-none w-full text-center"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">Tanggal Garansi Habis</label>
                  <input
                    type="date"
                    required
                    value={formWarranty}
                    onChange={(e) => setFormWarranty(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2 text-xs text-amber-50 outline-none w-full text-center"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold font-serif">Masa Manfaat (Ekonomis - Thn)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    placeholder="5"
                    value={formEconomicLife}
                    onChange={(e) => setFormEconomicLife(parseInt(e.target.value) || 5)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full text-center"
                  />
                </div>
              </div>

              {/* Image url link */}
              <div className="flex flex-col gap-1.5 bg-black/15 p-3 rounded-2xl border border-amber-400/5">
                <div className="flex justify-between items-center">
                  <label className="text-[9.5px] text-amber-150/40 uppercase font-mono font-bold">URL Tautan Foto Aset</label>
                  <button type="button" onClick={simulatePhotoAsset} className="text-[8px] text-[#D4A853] hover:underline font-mono">⚡ Simulasikan Foto</button>
                </div>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formPhoto}
                  onChange={(e) => setFormPhoto(e.target.value)}
                  className="bg-black/30 border border-amber-500/15 focus:border-[#D4A853] rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full font-mono"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAssetFormOpen(false)}
                  className="bg-black/30 hover:bg-black/55 border border-amber-500/10 px-5 py-3 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  ✕ Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#D4A853] hover:bg-[#b88c3a] px-7 py-3 rounded-xl text-xs font-serif font-black text-amber-950 transition cursor-pointer min-h-[44px]"
                >
                  💾 {editingAsset ? "Simpan Perubahan Aset" : "Daftarkan Aset Kafe"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. LOG MAINTENANCE SERVICE ACTION FORM */}
      {isMaintFormOpen && maintAsset && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#140b04] border border-[#D4A853]/20 rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl text-amber-50 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-3">
              <h4 className="font-serif text-xs sm:text-sm font-bold text-amber-200">
                🛠️ Log Pelayanan / Maintenance: <span className="text-amber-400">{maintAsset.name}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsMaintFormOpen(false)}
                className="text-amber-100/50 hover:text-amber-100 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaintLog} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Nama Teknisi / PIC Pelaksana</label>
                  <input
                    type="text"
                    required
                    placeholder="Beni (Toffin Rep.) / Dario"
                    value={maintTechnician}
                    onChange={(e) => setMaintTechnician(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-400 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Biaya Tindakan (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="500000"
                    value={maintCost || ""}
                    onChange={(e) => setMaintCost(parseInt(e.target.value) || 0)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-400 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Catatan Detail Hasil Tindakan Perawatan</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Terangkan secara detail: Ganti parts karet shower screen, descaling, penggantian seal, atau kalibrasi uap stabilizer..."
                  value={maintNotes}
                  onChange={(e) => setMaintNotes(e.target.value)}
                  className="bg-black/30 border border-amber-500/15 focus:border-amber-400 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full resize-none leading-relaxed"
                />
              </div>

              {/* Photos Before / After simulation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-black/25 rounded-2xl border border-amber-500/5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-amber-100/50 uppercase font-mono">Foto Kondisi Sebelum (Before)</span>
                    <button type="button" onClick={simulateBeforePhoto} className="text-[#D4A853] hover:underline text-[9px] font-mono">⚡ Simulasikan</button>
                  </div>
                  <input
                    type="text"
                    placeholder="https://before_photo_url..."
                    value={maintPhotoBefore}
                    onChange={(e) => setMaintPhotoBefore(e.target.value)}
                    className="bg-black/35 border border-amber-500/10 rounded-lg p-2 text-[10px] text-amber-100 outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-amber-100/50 uppercase font-mono">Foto Kondisi Sesudah (After)</span>
                    <button type="button" onClick={simulateAfterPhoto} className="text-[#D4A853] hover:underline text-[9px] font-mono">⚡ Simulasikan</button>
                  </div>
                  <input
                    type="text"
                    placeholder="https://after_photo_url..."
                    value={maintPhotoAfter}
                    onChange={(e) => setMaintPhotoAfter(e.target.value)}
                    className="bg-black/35 border border-amber-500/10 rounded-lg p-2 text-[10px] text-amber-100 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsMaintFormOpen(false)}
                  className="bg-black/30 hover:bg-black/55 border border-amber-500/10 px-5 py-3 rounded-xl text-xs font-semibold"
                >
                  ✕ Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#D4A853] hover:bg-[#ba8d38] px-7 py-3 rounded-xl text-xs font-serif font-black text-amber-950 transition cursor-pointer"
                >
                  🏁 MASUKKAN LOG TINDAKAN
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 7. QR CODE DIALOG VIEWER CARD */}
      {selectedAssetForQr && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#160d06] border border-[#D4A853]/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <h4 className="font-serif text-sm font-bold text-amber-100">🏷️ Printable QR Audit Tag</h4>
            
            <div className="bg-white p-4 inline-block rounded-2xl border-4 border-[#D4A853]">
              {/* Custom SVG QR Code Simulator */}
              <div className="h-44 w-44 flex flex-col justify-between items-center">
                <QrCode size={120} className="text-amber-950" />
                <span className="text-[10px] font-mono text-amber-950 tracking-wider font-extrabold mt-1 uppercase">
                  {selectedAssetForQr.assetId}
                </span>
              </div>
            </div>

            <div className="text-amber-100/60 font-mono text-[10.5px]">
              <p className="font-bold text-amber-100 text-sm">{selectedAssetForQr.name}</p>
              <p className="text-[10px] mt-1 text-amber-300">Model: {selectedAssetForQr.model}</p>
              <p className="text-[9.5px]/relaxed text-[#D4A853]/40 mt-3 border-t border-amber-500/10 pt-2.5">
                Stiker QR dapat dicetak &amp; ditempel pada unit barang fisik agar tim audit outlet dapat langsung menscan alat menggunakan ponsel.
              </p>
            </div>

            <button
              onClick={() => setSelectedAssetForQr(null)}
              className="w-full bg-[#D4A853] hover:bg-[#bb8b36] text-amber-950 text-xs font-bold py-3 rounded-xl transition mt-4"
            >
              Tutup Kartu QR
            </button>
          </div>
        </div>
      )}

      {/* 8. QR SCAN OVERLAY EMULATOR */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#190d05] border border-[#D4A853]/30 rounded-3xl p-6 space-y-5 text-center text-amber-50">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-2">
              <h4 className="font-serif text-xs uppercase font-extrabold text-[#D4A853] tracking-widest flex items-center gap-1.5">
                <Camera size={14} /> Modul Scan QR Tag Kamera (Simulasi)
              </h4>
              <button onClick={() => setIsScannerOpen(false)} className="text-amber-100/40 hover:text-amber-100 font-bold">✕</button>
            </div>

            {/* Simulated camera screen */}
            <div className="relative aspect-square w-full rounded-2xl bg-black border-2 border-dashed border-[#D4A853]/40 overflow-hidden flex flex-col justify-center items-center p-4 space-y-3">
              <div className="absolute inset-x-0 top-1/2 h-1 bg-red-500/70 animate-bounce shadow-md"></div>
              
              <QrCode size={90} className="text-amber-100/10 animate-pulse" />
              
              <div className="text-center font-mono text-[11px] text-amber-250 font-black tracking-widest uppercase">
                Menghubung Kamera Scanner ...
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-amber-150/40 uppercase font-mono tracking-wider font-extrabold block text-left">
                Ketikkan ID Aset secara Manual untuk Meniru Pemindaian (Simulate Scan):
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Misal: EQ-COF-001 atau EQ-KIT-001"
                  value={scannedAssetCode}
                  onChange={(e) => setScannedAssetCode(e.target.value)}
                  className="bg-black/50 border border-amber-500/20 focus:border-amber-400 outline-none text-xs rounded-xl px-4 py-3 text-amber-100 font-mono flex-1 text-center font-bold"
                />
                
                <button
                  type="button"
                  onClick={handleVerifyScan}
                  className="bg-amber-500 hover:bg-amber-600 px-5 text-amber-950 font-bold text-xs rounded-xl min-h-[44px]"
                >
                  VERIFIKASI
                </button>
              </div>

              {/* Sample codes helper */}
              <div className="bg-black/30 p-2 rounded-xl text-left">
                <span className="text-[9px] text-[#D4A853] font-mono block uppercase mb-1">💡 Kode demo terdaftar:</span>
                <div className="flex flex-wrap gap-1">
                  {assets.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setScannedAssetCode(a.assetId)}
                      className="text-[8.5px] font-mono bg-[#28180d] hover:bg-amber-500/10 px-2 py-1 rounded text-amber-100 shrink-0 select-none border border-amber-500/5 cursor-pointer"
                    >
                      {a.assetId}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsScannerOpen(false)}
              className="w-full bg-[#1e0f05] hover:bg-amber-500/5 text-amber-200 border border-amber-500/15 py-3 rounded-xl text-xs font-semibold"
            >
              Batalkan Pemindaian
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
