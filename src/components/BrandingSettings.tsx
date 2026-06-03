import React, { useState } from "react";
import { CoffeeOpsState, BrandBranding, NavigationItemSetting } from "../types";

interface BrandingProps {
  state: CoffeeOpsState;
  onUpdateBranding: (branding: BrandBranding, navigationSettings?: NavigationItemSetting[]) => void;
  onImportBackup: (importedState: CoffeeOpsState) => void;
  onResetDB: () => void;
}

export default function BrandingSettings({ state, onUpdateBranding, onImportBackup, onResetDB }: BrandingProps) {
  const { branding } = state;
  const [name, setName] = useState(branding.name);
  const [tagline, setTagline] = useState(branding.tagline);
  const [logo, setLogo] = useState(branding.logo);
  const [storageGudangName, setStorageGudangName] = useState(branding.storageGudangName);
  const [storageBarName, setStorageBarName] = useState(branding.storageBarName);
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor || "#D4A853");
  const [shiftPagiStart, setShiftPagiStart] = useState(branding.shiftPagiStart || "06:00");
  const [shiftPagiEnd, setShiftPagiEnd] = useState(branding.shiftPagiEnd || "14:00");
  const [shiftSiangStart, setShiftSiangStart] = useState(branding.shiftSiangStart || "13:00");
  const [shiftSiangEnd, setShiftSiangEnd] = useState(branding.shiftSiangEnd || "21:00");
  const [shiftMalamStart, setShiftMalamStart] = useState(branding.shiftMalamStart || "20:00");
  const [shiftMalamEnd, setShiftMalamEnd] = useState(branding.shiftMalamEnd || "23:00");
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState(branding.lateThresholdMinutes || 15);
  const [gpsVerificationEnabled, setGpsVerificationEnabled] = useState(branding.gpsVerificationEnabled !== false);
  const [gpsVerificationRadius, setGpsVerificationRadius] = useState(branding.gpsVerificationRadius || 100);

  const defaultNavItems: NavigationItemSetting[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊", section: "Utama" },
    { id: "foh", label: "Front of House (FOH)", icon: "🍽️", section: "Utama" },
    { id: "shift_mgmt", label: "Jadwal Shift & Absen", icon: "📅", section: "Utama" },
    { id: "smallwares_mgmt", label: "Smallwares & Glassware", icon: "🥛", section: "Utama" },
    { id: "sop_mgmt", label: "SOP Panduan Kerja", icon: "📚", section: "Utama" },
    { id: "service_dept", label: "Service Department", icon: "🛠️", section: "Utama" },
    { id: "inventory", label: "Inventory Harian", icon: "📦", section: "Utama" },
    { id: "dailysop", label: "Daily SOP & Ops", icon: "✅", section: "Utama" },
    { id: "absensi", label: "Absensi Staff", icon: "📋", section: "Utama" },
    { id: "kpi", label: "KPI & Performa", icon: "🏆", section: "Utama" },
    { id: "fifo", label: "FIFO Tracker", icon: "🔄", section: "Utama" },
    { id: "storage", label: `${branding.storageGudangName || "Gudang Utama"} & ${branding.storageBarName || "Bar Chiller"}`, icon: "🏪", section: "Storage" },
    { id: "transfer", label: "Transfer Barang", icon: "↔️", section: "Storage" },
    { id: "equipment", label: "Equipment Asset Center", icon: "⚙️", section: "Storage" },
    { id: "procurement", label: "Procurement & Supplier", icon: "🤝", section: "Pengadaan" },
    { id: "receiving", label: "Barang Masuk (GRN)", icon: "📥", section: "Pengadaan" },
    { id: "issue", label: "Barang Keluar", icon: "📤", section: "Pengadaan" },
    { id: "waste", label: "Waste & Loss Log", icon: "🗑", section: "Monitoring" },
    { id: "cogs", label: "Resep & COGS (HPP)", icon: "☕", section: "Monitoring" },
    { id: "analytics", label: "Kecerdasan Bisnis (BI)", icon: "📈", section: "Monitoring" },
    { id: "report", label: "Laporan Bulanan", icon: "📅", section: "Monitoring" },
    { id: "master", label: "Master Bahan Baku", icon: "📋", section: "Monitoring" },
    { id: "users", label: "Akses Login & Kru", icon: "👥", section: "System" },
    { id: "branding", label: "Kustomisasi Brand", icon: "🎨", section: "System" },
    { id: "system_mgmt", label: "System Management", icon: "🛡️", section: "System" },
  ];

  const [navigationSettings, setNavigationSettings] = useState<NavigationItemSetting[]>(() => {
    const existing = state.navigationSettings || [];
    return defaultNavItems.map((def) => {
      const matched = existing.find((e) => e.id === def.id);
      return {
        id: def.id,
        label: matched?.label || def.label,
        icon: matched?.icon || def.icon,
        section: def.section,
        isDeleted: matched?.isDeleted || false,
      };
    });
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBranding({
      name,
      tagline,
      logo,
      storageGudangName,
      storageBarName,
      primaryColor,
      shiftPagiStart,
      shiftPagiEnd,
      shiftSiangStart,
      shiftSiangEnd,
      shiftMalamStart,
      shiftMalamEnd,
      lateThresholdMinutes: Number(lateThresholdMinutes),
      gpsVerificationEnabled,
      gpsVerificationRadius: Number(gpsVerificationRadius),
      cafeLat: branding.cafeLat,
      cafeLng: branding.cafeLng,
    }, navigationSettings);
  };

  // Download Backup JSON file
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `database_backup_${name.toLowerCase().replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Upload/Restore Backup JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (files && files.length > 0) {
      fileReader.readAsText(files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.branding && parsed.master) {
            onImportBackup(parsed as CoffeeOpsState);
          } else {
            alert("Error: Format file backup tidak valid.");
          }
        } catch (err) {
          alert("Error: Gagal mengurai file JSON backup.");
        }
      };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-amber-50 max-w-4xl">
      {/* Intro */}
      <div className="bg-[#1a0a00]/30 border border-amber-500/10 p-5 rounded-2xl">
        <h3 className="font-serif text-lg font-bold">🎨 Kustomisasi Brand &amp; Manajemen Database</h3>
        <p className="text-xs text-amber-100/40 mt-1">
          Ubah konfigurasi brand nama, logo, penamaan storage penyimpanan harian, ekspor cadangan database harian, ataupun pemulihan file backup.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Branding */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-6 space-y-4">
          <h4 className="font-serif font-bold text-sm text-amber-100 border-b border-amber-500/10 pb-2">Spesifikasi Label Cafe &amp; Color Theme</h4>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Nama Brand Cafe</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl px-4 py-2.5 text-xs text-amber-100 placeholder-amber-200/20 outline-none transition w-full"
                placeholder="Axes Coffee"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-1">
              <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Logo Emoji</label>
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl px-4 py-2.5 text-xs text-amber-100 placeholder-amber-200/20 outline-none text-center transition w-full"
                placeholder="☕"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Slogan / Tagline Cafe</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl px-4 py-2.5 text-xs text-amber-100 placeholder-amber-200/20 outline-none transition w-full"
              placeholder="Sistem Manajemen Operasional Cafe"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Label Gudang Bulk</label>
              <input
                type="text"
                value={storageGudangName}
                onChange={(e) => setStorageGudangName(e.target.value)}
                className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl px-4 py-2.5 text-xs text-amber-100 placeholder-amber-200/20 outline-none transition w-full"
                placeholder="Gudang Belakang"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Label Chiller Barista</label>
              <input
                type="text"
                value={storageBarName}
                onChange={(e) => setStorageBarName(e.target.value)}
                className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl px-4 py-2.5 text-xs text-amber-100 placeholder-amber-200/20 outline-none transition w-full"
                placeholder="Bar Chiller"
                required
              />
            </div>
          </div>

          {/* Color choice presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Pilih Warna Aksen Utama</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { hex: "#D4A853", name: "Latte Gold" },
                { hex: "#4CAF50", name: "Matcha Green" },
                { hex: "#2196F3", name: "Ocean Cold" },
                { hex: "#E65100", name: "Roast Amber" },
              ].map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setPrimaryColor(c.hex)}
                  className={`border rounded-xl p-2.5 text-[10px] font-semibold flex items-center justify-center gap-1.5 hover:bg-amber-500/5 transition cursor-pointer ${
                    primaryColor === c.hex ? "border-amber-400 text-amber-300" : "border-amber-500/10 text-amber-100/50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.hex }} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Operational Shift & Lateness Config */}
          <div className="border-t border-amber-500/10 pt-4 space-y-4">
            <h4 className="font-serif font-bold text-sm text-amber-200">⏰ Pengaturan Jam Operasional &amp; Shift</h4>
            <p className="text-[10px] text-amber-100/40 leading-normal">
              Atur toleransi keterlambatan kehadiran staf dan rincian durasi jam kerja untuk shift Pagi, Siang, dan Malam.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[10px] text-amber-100/45 uppercase tracking-wider font-semibold font-mono">Toleransi Keterlambatan</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={lateThresholdMinutes}
                    onChange={(e) => setLateThresholdMinutes(Math.max(0, Number(e.target.value)))}
                    className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl px-4 py-2 text-xs text-amber-100 placeholder-amber-200/20 outline-none transition w-32"
                    placeholder="15"
                    min="0"
                    required
                  />
                  <span className="text-xs text-amber-150/60">menit setelah jam masuk shift</span>
                </div>
              </div>

              {/* GPS Geofence Check config */}
              <div className="flex flex-col gap-1.5 col-span-2 border-t border-amber-500/10 pt-4 mt-2 font-sans">
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold font-mono flex items-center gap-1.5">
                  📍 Verifikasi Lokasi GPS (Geofencing Absensi)
                </span>
                <p className="text-[10px] text-amber-100/40 leading-normal">
                  Jika diaktifkan, kru wajib berada dalam radius tertentu dari koordinat cafe untuk absen. Nonaktifkan jika kru banyak bekerja remote atau sinyal GPS ponsel sering meleset.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-2 bg-black/20 p-3 rounded-xl border border-amber-500/5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={gpsVerificationEnabled}
                      onChange={(e) => setGpsVerificationEnabled(e.target.checked)}
                      className="rounded border-amber-500/20 text-amber-500 bg-black/40 focus:ring-amber-500 focus:ring-offset-black"
                    />
                    <span className="text-xs text-amber-100 font-medium">Batas Geofence Aktif</span>
                  </label>

                  {gpsVerificationEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-100/45 shrink-0">Radius Maks:</span>
                      <input
                        type="number"
                        value={gpsVerificationRadius}
                        onChange={(e) => setGpsVerificationRadius(Math.max(10, Number(e.target.value)))}
                        className="bg-black/25 border border-amber-500/20 focus:border-[#D4A853]/40 rounded-lg px-2.5 py-1 text-xs text-amber-150 font-mono w-24 outline-none font-bold"
                        title="Radius toleransi presisi GPS dalam satuan meter"
                      />
                      <span className="text-xs text-amber-150/60">meter</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagi */}
              <div className="flex flex-col gap-1.5 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold font-mono">🌅 Shift Pagi</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-amber-100/30">Mulai</span>
                    <input
                      type="text"
                      value={shiftPagiStart}
                      onChange={(e) => setShiftPagiStart(e.target.value)}
                      className="bg-black/25 border border-amber-500/20 rounded-lg p-1.5 text-center text-xs text-amber-150 font-mono focus:outline-none"
                      placeholder="06:00"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-amber-100/30">Selesai</span>
                    <input
                      type="text"
                      value={shiftPagiEnd}
                      onChange={(e) => setShiftPagiEnd(e.target.value)}
                      className="bg-black/25 border border-amber-500/20 rounded-lg p-1.5 text-center text-xs text-amber-150 font-mono focus:outline-none"
                      placeholder="14:00"
                    />
                  </div>
                </div>
              </div>

              {/* Siang */}
              <div className="flex flex-col gap-1.5 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold font-mono">☀️ Shift Siang</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-amber-100/30">Mulai</span>
                    <input
                      type="text"
                      value={shiftSiangStart}
                      onChange={(e) => setShiftSiangStart(e.target.value)}
                      className="bg-black/25 border border-amber-500/20 rounded-lg p-1.5 text-center text-xs text-amber-150 font-mono focus:outline-none"
                      placeholder="13:00"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-amber-100/30">Selesai</span>
                    <input
                      type="text"
                      value={shiftSiangEnd}
                      onChange={(e) => setShiftSiangEnd(e.target.value)}
                      className="bg-black/25 border border-amber-500/20 rounded-lg p-1.5 text-center text-xs text-amber-150 font-mono focus:outline-none"
                      placeholder="21:00"
                    />
                  </div>
                </div>
              </div>

              {/* Malam */}
              <div className="flex flex-col gap-1.5 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 col-span-2">
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold font-mono">🌙 Shift Malam</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-amber-100/30">Mulai</span>
                    <input
                      type="text"
                      value={shiftMalamStart}
                      onChange={(e) => setShiftMalamStart(e.target.value)}
                      className="bg-black/25 border border-amber-500/20 rounded-lg p-1.5 text-center text-xs text-amber-150 font-mono focus:outline-none"
                      placeholder="20:00"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-amber-100/30">Selesai</span>
                    <input
                      type="text"
                      value={shiftMalamEnd}
                      onChange={(e) => setShiftMalamEnd(e.target.value)}
                      className="bg-black/25 border border-amber-500/20 rounded-lg p-1.5 text-center text-xs text-amber-150 font-mono focus:outline-none"
                      placeholder="23:00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 shadow-md transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            Apply &amp; Simpan Perubahan Brand
          </button>
        </form>

        {/* Right Panel: Database management */}
        <div className="lg:col-span-5 bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-6 space-y-6">
          <div>
            <h4 className="font-serif font-bold text-sm text-amber-100 border-b border-amber-500/10 pb-2">💾 Manajemen Database &amp; Cadangan</h4>
            <p className="text-[11px] text-amber-200/40 mt-1 leading-relaxed">
              Semua transaksional harian terhubung online multi-device. Untuk keamanan ekstra, Anda dapat mengekspor atau memulihkan database lokal Anda kapan saja.
            </p>
          </div>

          {/* Export button */}
          <div className="bg-[#FAF0E6]/5 border border-amber-500/5 p-4 rounded-xl space-y-3">
            <h5 className="font-bold text-xs text-amber-100">Ekspor Backup Offline</h5>
            <p className="text-[10px] text-amber-100/40 leading-normal">
              Unduh semua data operasional (stok, FIFO, transaksi, branding) sebagai file JSON yang aman dan portabel.
            </p>
            <button
              onClick={handleExportBackup}
              className="w-full bg-[#FAF0E6]/10 hover:bg-[#FAF0E6]/15 border border-[#FAF0E6]/15 text-amber-100 hover:text-white rounded-lg py-2 text-xs font-semibold transition cursor-pointer"
            >
              📥 Download File Backup .json
            </button>
          </div>

          {/* Import file */}
          <div className="bg-[#FAF0E6]/5 border border-amber-500/5 p-4 rounded-xl space-y-3">
            <h5 className="font-bold text-xs text-amber-100">Impor &amp; Pulihkan Backup</h5>
            <p className="text-[10px] text-amber-100/40 leading-normal">
              Unggah file JSON backup yang diunduh sebelumnya untuk memulihkan seluruh data dan kustomasi brand Anda.
            </p>
            <label className="w-full flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-300 font-semibold rounded-lg py-2 text-xs cursor-pointer transition">
              <span>📤 Pilih File JSON Backup</span>
              <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* Danger zone reset */}
          <div className="border border-red-500/20 p-4 rounded-xl space-y-3 bg-red-950/10">
            <h5 className="font-bold text-xs text-red-400">🔥 Danger Zone (Reset Pabrik)</h5>
            <p className="text-[10px] text-red-200/45 leading-normal">
              Aksi ini akan membersihkan semua log harian, FIFO batch, logs, dan mengembalikan penamaan ke Axes Coffee.
            </p>
            <button
              onClick={onResetDB}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-lg py-2 text-xs transition cursor-pointer"
            >
              ⚠️ Atur Ulang Semua Database
            </button>
          </div>
        </div>
      </div>

      {/* 🗺️ MANAJEMEN MENU NAVIGASI (EDIT & HAPUS) */}
      <div className="bg-[#120501]/85 border border-[#D4A853]/15 rounded-3xl p-6 shadow-xl space-y-4 font-sans mt-8 text-amber-50">
        <div className="border-b border-[#D4A853]/15 pb-3">
          <h4 className="font-serif font-bold text-base text-amber-100 flex items-center gap-2">🗺️ Manajemen &amp; Struktur Menu Navigasi</h4>
          <p className="text-xs text-amber-200/50 mt-1">
            Kustomisasi nama label, modifikasi ikon emoji, atau sembunyikan (hapus) menu dari sidebar navigasi secara fleksibel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigationSettings.map((item) => {
            const isProtected = ["branding", "system_mgmt"].includes(item.id);
            return (
              <div 
                key={item.id} 
                className={`p-4 rounded-xl border transition ${
                  item.isDeleted 
                    ? "bg-red-950/10 border-red-500/20 opacity-60" 
                    : "bg-black/35 border-amber-500/10"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#D4A853] uppercase">{item.section} Section</span>
                  <span className="text-[10px] font-mono text-amber-100/30">ID: {item.id}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    {/* Icon edit */}
                    <div className="w-12 shrink-0">
                      <label className="text-[9px] text-amber-100/40 uppercase font-mono block mb-0.5">Ikon</label>
                      <input 
                        type="text" 
                        value={item.icon}
                        onChange={(e) => {
                          const updated = navigationSettings.map(n => n.id === item.id ? { ...n, icon: e.target.value } : n);
                          setNavigationSettings(updated);
                        }}
                        className="bg-black/40 border border-amber-500/15 rounded-lg p-1. w-full text-center text-xs text-amber-100 focus:outline-none focus:border-[#D4A853]/40 focus:ring-0"
                      />
                    </div>
                    {/* Label edit */}
                    <div className="flex-1">
                      <label className="text-[9px] text-amber-100/40 uppercase font-mono block mb-0.5">Nama Menu</label>
                      <input 
                        type="text" 
                        value={item.label}
                        onChange={(e) => {
                          const updated = navigationSettings.map(n => n.id === item.id ? { ...n, label: e.target.value } : n);
                          setNavigationSettings(updated);
                        }}
                        className="bg-black/40 border border-amber-500/15 rounded-lg p-1. w-full text-xs text-amber-100 focus:outline-none focus:border-[#D4A853]/40 focus:ring-0 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Actions (Delete/Restore) */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] text-amber-100/40 font-mono">
                      {item.isDeleted ? "⚠️ Tersembunyi (Dihapus)" : "✓ Aktif di Sidebar"}
                    </span>
                    {!isProtected ? (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = navigationSettings.map(n => n.id === item.id ? { ...n, isDeleted: !n.isDeleted } : n);
                          setNavigationSettings(updated);
                        }}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition border cursor-pointer ${
                          item.isDeleted 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25" 
                            : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/25"
                        }`}
                      >
                        {item.isDeleted ? "Pulihkan" : "Hapus"}
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono text-amber-400/50 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 uppercase font-bold">Terproteksi</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Save notice & Action button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 mt-2">
          <p className="text-[11px] text-amber-200/60 leading-normal max-w-xl font-medium">
            💡 Terapkan kustomisasi menu navigasi di atas ke sidebar dengan mengeklik tombol penyimpanan utama di sebelah kanan ini atau di sebelah kiri formulir brand.
          </p>
          <button
            type="button"
            onClick={handleSave}
            className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-5 py-2.5 rounded-xl text-xs transition duration-200 shadow-md transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: primaryColor }}
          >
            Apply &amp; Simpan Struktur Menu
          </button>
        </div>
      </div>
    </div>
  );
}
export {};
