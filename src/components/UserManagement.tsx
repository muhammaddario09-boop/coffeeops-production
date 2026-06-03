import React, { useState, useEffect } from "react";
import { CoffeeOpsState, User } from "../types";

interface UserManagementProps {
  state: CoffeeOpsState;
  currentUser: User | null;
  onAddUser: (user: Omit<User, "id">) => void;
  onUpdateUserPin: (id: string, newPin: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (user: User) => void;
  syncState?: (state: CoffeeOpsState) => void;
}

export default function UserManagement({
  state,
  currentUser,
  onAddUser,
  onUpdateUserPin,
  onDeleteUser,
  onUpdateUser,
  syncState,
}: UserManagementProps) {
  const users = state.users || [];

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<User["role"]>("Barista");
  const [newPin, setNewPin] = useState("");
  const [newGmail, setNewGmail] = useState("");
  const [newWhatsApp, setNewWhatsApp] = useState("");
  const [newStaffCode, setNewStaffCode] = useState("");
  const [newBranch, setNewBranch] = useState("Pusat Pangkalpinang (HQ)");
  const [newPassword, setNewPassword] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPinValue, setEditingPinValue] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Helper to auto-generate a recommended staff code based on selected role
  useEffect(() => {
    if (editingUser) return;
    const rolePrefix: { [key: string]: string } = {
      Owner: "OWN",
      Manager: "MGR",
      Supervisor: "SPV",
      "Head Barista": "HBR",
      Barista: "BAR",
      Bartender: "BRT",
      Cashier: "CSH",
      Kitchen: "KTN",
      "Service Staff": "SVC",
      "Front of House": "FOH",
      Waiter: "WTR",
      "Head Waiter": "HWT",
      "Cleaning Service": "CLS",
      Security: "SEC"
    };
    const prefix = rolePrefix[newRole] || "STF";
    const count = users.filter(u => u.role === newRole).length + 1;
    setNewStaffCode(`${prefix}${String(count).padStart(3, "0")}`);
  }, [newRole, users.length, editingUser]);

  const handleStartEdit = (u: User) => {
    setEditingUser(u);
    setNewName(u.name);
    setNewRole(u.role as any);
    setNewPin(u.pin);
    setNewGmail(u.email || "");
    setNewWhatsApp(u.whatsappNumber || "");
    setNewStaffCode(u.staffCode || "");
    setNewBranch(u.branchId || "Pusat Pangkalpinang (HQ)");
    setNewPassword(u.password || "");
    setNewPhoto(u.profilePhoto || "");
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewName("");
    setNewRole("Barista");
    setNewPin("");
    setNewGmail("");
    setNewWhatsApp("");
    setNewStaffCode("");
    setNewBranch("Pusat Pangkalpinang (HQ)");
    setNewPassword("");
    setNewPhoto("");
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert("Silakan isi nama lengkap karyawan!");
      return;
    }
    if (!newStaffCode.trim()) {
      alert("Silakan isi Kode Staf unik!");
      return;
    }
    if (newPin.length < 4) {
      alert("PIN harus terdiri dari minimal 4 angka!");
      return;
    }

    if (editingUser) {
      // Check staff code uniqueness if changed
      if (newStaffCode.trim().toLowerCase() !== editingUser.staffCode?.toLowerCase()) {
        const codeTaken = users.some(u => u.id !== editingUser.id && u.staffCode?.toLowerCase() === newStaffCode.trim().toLowerCase());
        if (codeTaken) {
          alert("Kode Staf ini sudah digunakan oleh karyawan lain. Masukkan kode unik!");
          return;
        }
      }

      onUpdateUser({
        ...editingUser,
        name: newName.trim(),
        role: newRole,
        pin: newPin,
        staffCode: newStaffCode.trim().toUpperCase(),
        email: newGmail.trim() || `${newStaffCode.toLowerCase()}@coffeeops-cafe.com`,
        whatsappNumber: newWhatsApp.trim() || "0",
        branchId: newBranch,
        password: (newRole === "Owner" || newRole === "Manager") ? (newPassword || "coffeeops123") : undefined,
        profilePhoto: newPhoto || undefined,
      });

      handleCancelEdit();
    } else {
      // Check staff code uniqueness
      const codeTaken = users.some(u => u.staffCode?.toLowerCase() === newStaffCode.trim().toLowerCase());
      if (codeTaken) {
        alert("Kode Staf ini sudah digunakan oleh karyawan lain. Masukkan kode unik!");
        return;
      }

      onAddUser({
        name: newName.trim(),
        role: newRole,
        pin: newPin,
        staffCode: newStaffCode.trim().toUpperCase(),
        email: newGmail.trim() || `${newStaffCode.toLowerCase()}@coffeeops-cafe.com`,
        whatsappNumber: newWhatsApp.trim() || "0",
        branchId: newBranch,
        password: (newRole === "Owner" || newRole === "Manager") ? (newPassword || "coffeeops123") : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        profilePhoto: newPhoto || undefined,
      } as any);

      // Reset Form
      handleCancelEdit();
    }
  };

  const handleSavePinEdit = (userId: string) => {
    if (editingPinValue.length < 4) {
      alert("PIN Baru minimal memiliki 4 karakter angka!");
      return;
    }
    onUpdateUserPin(userId, editingPinValue);
    setEditingUserId(null);
    setEditingPinValue("");
  };

  const isAuthorized = currentUser?.role === "Owner" || currentUser?.role === "Manager";

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50" id="user-management-panel">
      {/* Header Info */}
      <div className="bg-[#1a0a00]/30 p-5 border border-amber-500/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold">👥 Manajemen Otorisasi Enterprise CoffeeOps</h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Konfigurasi kru multi-cabang, Kode Staf &amp; PIN harian untuk operasional cepat, akun email/WhatsApp untuk notifikasi instan.
          </p>
        </div>
        <div className="shrink-0 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-mono text-[10.5px] text-amber-300">
          🔑 Akses Aktif: {currentUser?.role || "Staf"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Add new or Edit Employee */}
        {isAuthorized ? (
          <div className="lg:col-span-5 bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4">
            <h4 className="font-serif text-sm font-bold text-amber-200 border-b border-amber-500/10 pb-2">
              {editingUser ? `✏️ Edit Akun Karyawan: ${editingUser.name}` : "➕ Daftarkan Akun Kru Kemitraan Baru"}
            </h4>

            <form onSubmit={handleCreateUser} className="space-y-4" id="add-user-form">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[10px] text-amber-100/45 font-semibold uppercase tracking-wider font-mono">
                    Nama Lengkap
                  </label>
                  <input
                    id="user-full-name-input"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-100/45 font-semibold uppercase tracking-wider font-mono">
                    Kode Staff (Staff Code)
                  </label>
                  <input
                    id="user-staff-code-input"
                    type="text"
                    value={newStaffCode}
                    onChange={(e) => setNewStaffCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    placeholder="BAR001"
                    className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 font-mono outline-none w-full font-bold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-100/45 font-semibold uppercase tracking-wider font-mono">
                    PIN Operasional (Minimal 4 Angka)
                  </label>
                  <input
                    id="user-pin-input"
                    type="text"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="1234"
                    className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full font-mono text-center tracking-widest font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-100/45 font-semibold uppercase tracking-wider font-mono">
                    Gmail Karyawan
                  </label>
                  <input
                    id="user-email-input"
                    type="email"
                    value={newGmail}
                    onChange={(e) => setNewGmail(e.target.value)}
                    placeholder="budi@gmail.com"
                    className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-100/45 font-semibold uppercase tracking-wider font-mono">
                    WhatsApp (WA)
                  </label>
                  <input
                    id="user-wa-input"
                    type="tel"
                    value={newWhatsApp}
                    onChange={(e) => setNewWhatsApp(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="628123456789"
                    className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 font-mono outline-none w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-100/45 font-semibold uppercase tracking-wider font-mono">
                    Jabatan (Role)
                  </label>
                  <select
                    id="user-role-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  >
                    <option value="Barista" className="bg-amber-950">Barista (Kru)</option>
                    <option value="Bartender" className="bg-amber-950">Bartender (Kru)</option>
                    <option value="Cashier" className="bg-amber-950">Cashier (Kru)</option>
                    <option value="Kitchen" className="bg-amber-950">Kitchen (Kru)</option>
                    <option value="Service Staff" className="bg-amber-950">Service Staff (Kru)</option>
                    <option value="Front of House" className="bg-amber-950">Front of House (Kru)</option>
                    <option value="Waiter" className="bg-amber-950">Waiter (Kru)</option>
                    <option value="Cleaning Service" className="bg-amber-950">Cleaning Service (Kru)</option>
                    <option value="Security" className="bg-amber-[#241002]">Security (Kru)</option>
                    <option value="Head Waiter" className="bg-amber-950">Head Waiter</option>
                    <option value="Head Barista" className="bg-amber-950">Head Barista</option>
                    <option value="Supervisor" className="bg-amber-950">Supervisor</option>
                    <option value="Manager" className="bg-amber-950">Manager</option>
                    <option value="Owner" className="bg-amber-950">Owner</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-100/45 font-semibold uppercase tracking-wider font-mono">
                    Cabang Tugas (Outlet)
                  </label>
                  <select
                    id="user-branch-select"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="bg-[#FAF0E6]/5 border border-amber-500/10 focus:border-[#D4A853]/40 rounded-xl p-2.5 text-xs text-amber-100 outline-none w-full"
                  >
                    <option value="Pusat Pangkalpinang (HQ)" className="bg-amber-950">Pusat Pangkalpinang (HQ)</option>
                    <option value="Cabang Pangkalpinang Timur" className="bg-amber-950">Cabang Pangkalpinang Timur</option>
                    <option value="Cabang Pangkalpinang Barat" className="bg-amber-950">Cabang Pangkalpinang Barat</option>
                  </select>
                </div>
              </div>

              {/* Foto Pribadi Upload with Drag-and-Drop + Click Preview */}
              <div className="flex flex-col gap-1.5" id="staff-photo-upload-container">
                <label className="text-[10px] text-amber-100/45 font-semibold uppercase tracking-wider font-mono">
                  Foto Pribadi Karyawan
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (file.size > 1.5 * 1024 * 1024) {
                        alert("Format ukuran file foto terlalu besar! Maksimum ukuran adalah 1.5 MB.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setNewPhoto(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                    isDragOver
                      ? "border-amber-400 bg-amber-500/10"
                      : "border-amber-500/20 bg-[#FAF0E6]/5 hover:border-amber-500/40"
                  }`}
                  onClick={() => document.getElementById("staff-photo-file-input")?.click()}
                  id="drag-drop-staff-photo"
                >
                  <input
                    type="file"
                    id="staff-photo-file-input"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 1.5 * 1024 * 1024) {
                          alert("Format ukuran file foto terlalu besar! Maksimum ukuran adalah 1.5 MB.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setNewPhoto(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />

                  {newPhoto ? (
                    <div className="flex flex-col items-center gap-2" id="preview-photo-wrap">
                      <div className="h-20 w-20 rounded-full border-2 border-[#D4A853]/40 overflow-hidden shadow-md">
                        <img src={newPhoto} alt="Ulasan Foto" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      </div>
                      <span className="text-[10px] text-amber-300 font-medium">Foto Pribadi Terunggah ✓</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewPhoto("");
                        }}
                        className="text-[9px] text-[#D4A853] hover:text-amber-200 underline mt-1 cursor-pointer"
                        id="staff-photo-remove-btn"
                      >
                        Hapus &amp; Ganti Foto
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-1 text-amber-100/50" id="photo-upload-placeholder">
                      <span className="text-2xl block">📸</span>
                      <span className="text-[11px] font-sans block">Tarik &amp; lepas foto Anda di sini, atau <strong className="text-[#D4A853]">klik untuk memilih</strong></span>
                      <span className="text-[9px] font-mono block opacity-60">Mendukung format PNG/JPEG up to 1.5MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner and Manager detailed login configurations */}
              {(newRole === "Owner" || newRole === "Manager") && (
                <div className="bg-[#FAF0E6]/5 border border-amber-500/10 p-3.5 rounded-2xl space-y-2 animate-fadeIn">
                  <p className="text-[10px] text-[#D4A853]/90 italic font-medium leading-normal">
                    📌 Khusus level <strong>Owner &amp; Manager</strong>, tatanan sistem mewajibkan pengisian password tambahan agar pimpinan dapat login menggunakan Email + Password.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-[#D4A853] font-semibold uppercase tracking-wider font-mono">
                      Password Backoffice Email
                    </label>
                    <input
                      id="user-password-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="bg-[#FAF0E6]/5 border border-amber-500/15 focus:border-[#D4A853]/40 rounded-xl p-2 text-xs text-amber-100 outline-none w-full"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  id="user-submit-btn"
                  type="submit"
                  className="w-full bg-[#D4A853] hover:bg-[#c39745] text-amber-950 text-xs font-bold py-3 rounded-xl transition duration-200 cursor-pointer shadow active:scale-[0.98] text-center mt-2 flex items-center justify-center gap-2"
                  style={{ backgroundColor: state.branding.primaryColor }}
                >
                  {editingUser ? "💾 Simpan Perubahan Profil" : "💾 Daftarkan Karyawan & Auto-create Akun"}
                </button>

                {editingUser && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-100 text-xs py-2.5 rounded-xl transition duration-200 cursor-pointer text-center"
                  >
                    ✕ Batalkan Pengeditan
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 text-xs text-amber-200/70">
            🔒 <strong>Akses Terbatas:</strong> Hanya Owner atau Manager yang memiliki izin mendaftarkan karyawan serta mengkonfigurasi akun barista. Silakan hubungi admin Anda.
          </div>
        )}

        {/* Right column: Employees list & actions */}
        <div className="lg:col-span-7 bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-amber-500/10 bg-black/10 flex justify-between items-center">
            <h4 className="font-serif text-sm font-bold text-amber-100">
              👥 Kru dan Otorisasi Terdaftar
            </h4>
            <span className="text-[10px] font-mono text-amber-100/30">Total: {users.length} Akun</span>
          </div>

          <div className="divide-y divide-amber-500/5 max-h-[580px] overflow-y-auto custom-scrollbar">
            {users.map((u) => {
              const uCode = u.staffCode || `STF${String(u.id).substring(1).padStart(3, "0")}`;
              const isSelf = u.id === currentUser?.id;
              const isEditing = editingUserId === u.id;

              return (
                <div
                  key={u.id}
                  id={`user-row-${u.id}`}
                  className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-amber-500/5 transition text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-500/10 border border-[#D4A853]/20 flex flex-col items-center justify-center text-base shrink-0 select-none shadow-sm relative font-serif font-black overflow-hidden text-amber-200">
                      {u.profilePhoto && u.profilePhoto.length > 5 ? (
                        <img src={u.profilePhoto} alt={u.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        <>
                          {uCode.substring(0, 3)}
                          <span className="text-[7px] font-mono font-bold tracking-wider absolute bottom-1 block scale-90 opacity-60">
                            HQ
                          </span>
                        </>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="font-semibold text-amber-50">
                          {u.name}
                        </h5>
                        {isSelf && (
                          <span className="text-[8px] text-emerald-400 font-mono font-black uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 animate-pulse">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span
                          className={`text-[9.5px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                            u.role === "Owner"
                              ? "bg-purple-500/10 text-purple-300 border border-purple-500/15"
                              : u.role === "Manager"
                              ? "bg-blue-500/10 text-blue-300 border border-blue-500/15"
                              : u.role === "Head Barista"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/15"
                              : u.role === "Service Staff"
                              ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/15"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                          }`}
                        >
                          {u.role}
                        </span>

                        <span className="text-[10px] font-mono bg-black/40 text-amber-300 px-2 py-0.5 rounded border border-amber-500/5">
                          Code: <strong className="text-amber-100">{uCode}</strong>
                        </span>

                        <span className="text-[10px] font-mono bg-black/40 text-amber-100/50 px-2 py-0.5 rounded border border-amber-500/5">
                          PIN: <strong className="text-amber-100">{u.pin}</strong>
                        </span>
                      </div>

                      {/* Expanded Enterprise metadata for audit and notices */}
                      <div className="mt-2 text-[10px] text-amber-100/40 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span>📧</span>
                          <span className="truncate max-w-[200px] transition-colors hover:text-amber-200">
                            {u.email || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>💬</span>
                          <span>
                            {u.whatsappNumber || "Tidak ada nomor WhatsApp"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>📍</span>
                          <span>
                            {u.branchId || "Pusat Pangkalpinang (HQ)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-start">
                    {/* PIN Editing section */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="PIN"
                          className="bg-black/40 border border-amber-500/20 rounded px-2 py-1 font-mono text-[11px] text-center w-16 outline-none"
                          value={editingPinValue}
                          onChange={(e) => setEditingPinValue(e.target.value.replace(/\D/g, ""))}
                        />
                        <button
                          onClick={() => handleSavePinEdit(u.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-amber-950 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          ✔
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 px-2 py-1 rounded text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        {isAuthorized && (
                          <button
                            id={`user-edit-${u.id}`}
                            onClick={() => handleStartEdit(u)}
                            className="bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 text-amber-300 px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer transition active:scale-95 flex items-center gap-1"
                          >
                            ✏️ Edit Akun
                          </button>
                        )}

                        {isAuthorized && (
                          <button
                            id={`user-pin-edit-${u.id}`}
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditingPinValue("");
                            }}
                            className="bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 text-amber-300 px-2 py-1.5 rounded-lg text-[10px] font-mono cursor-pointer transition active:scale-95 flex items-center gap-1"
                          >
                            🔒 Ubah PIN
                          </button>
                        )}

                        {isAuthorized && !isSelf && u.role !== "Owner" && (
                          <button
                            id={`user-delete-${u.id}`}
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus sistem akses untuk ${u.name}?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold cursor-pointer transition active:scale-95"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Device Session Management (Khusus Owner & Manager) */}
      {(currentUser?.role === "Owner" || currentUser?.role === "Manager") && (
        <div className="mt-8 bg-[#1e0d02]/80 border border-[#D4A853]/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 text-7xl translate-y-[-10px] translate-x-[10px] select-none text-amber-500/5 leading-none font-black font-mono">
            SECURE
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4A853]/15 pb-4 mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-amber-100 flex items-center gap-2">
                🛡️ Manajer Sesi Perangkat Aktif
              </h3>
              <p className="text-xs text-amber-200/60 mt-0.5">
                Awasi dan putuskan koneksi terminal operasional CoffeeOps yang sedang berjalan secara remote.
              </p>
            </div>
            {state.deviceSessions && state.deviceSessions.length > 0 && (
              <button
                onClick={() => {
                  if (!syncState) return;
                  const currentSessionId = localStorage.getItem("coffeeops_sessionId");
                  const nextSessions = (state.deviceSessions || []).filter(s => s.id === currentSessionId);
                  syncState({
                    ...state,
                    deviceSessions: nextSessions
                  });
                  alert("Semua sesi perangkat operasional lainnya berhasil diputuskan.");
                }}
                className="bg-red-500 hover:bg-red-600 text-amber-950 font-mono text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
              >
                ⚠️ Keluarkan Semua Perangkat Lain
              </button>
            )}
          </div>

          {!state.deviceSessions || state.deviceSessions.length === 0 ? (
            <div className="text-center py-6 text-amber-100/40 text-xs font-mono">
              Tidak ada sesi perangkat eksternal aktif yang terdata di sistem.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(state.deviceSessions || []).map((session) => {
                const isCurrent = session.id === localStorage.getItem("coffeeops_sessionId");
                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-2xl border transition duration-200 flex flex-col justify-between ${
                      isCurrent
                        ? "bg-amber-500/5 border-amber-500/30"
                        : "bg-black/25 border-amber-500/10 hover:border-amber-500/25"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-amber-200 font-bold uppercase truncate max-w-[150px]">
                          {session.userName} ({session.role})
                        </span>
                        {isCurrent ? (
                          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full font-serif uppercase tracking-wider animate-pulse">
                            Perangkat Ini
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-[#D4A853] font-bold px-2 py-0.5 rounded-full font-serif uppercase tracking-wider">
                            Aktif Remote
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-amber-100/50 font-mono text-[11px]">
                          <span>Perangkat:</span>
                          <span className="text-amber-100 font-sans font-medium">
                            {session.device === "Mobile" ? "📱 Mobile" : session.device === "Tablet" ? "📟 Tablet" : "💻 Desktop"}
                          </span>
                        </div>
                        <div className="flex justify-between text-amber-100/50 font-mono text-[11px]">
                          <span>Browser:</span>
                          <span className="text-amber-100 font-sans font-medium">{session.browser}</span>
                        </div>
                        <div className="flex justify-between text-amber-100/50 font-mono text-[11px]">
                          <span>Alamat IP:</span>
                          <span className="text-[#D4A853] font-mono">{session.ip}</span>
                        </div>
                        <div className="flex justify-between text-amber-100/50 font-mono text-[11px]">
                          <span>Waktu Login:</span>
                          <span className="text-amber-100 font-sans font-medium">{session.loginTime}</span>
                        </div>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => {
                          if (!syncState) return;
                          const nextSessions = (state.deviceSessions || []).filter(s => s.id !== session.id);
                          syncState({
                            ...state,
                            deviceSessions: nextSessions
                          });
                          alert("Sesi perangkat tersebut berhasil diputuskan secara paksa.");
                        }}
                        className="mt-4 w-full bg-red-950/45 hover:bg-red-900/30 border border-red-500/20 hover:border-red-500/40 text-red-300 font-mono text-[11px] py-1.5 rounded-xl transition cursor-pointer"
                      >
                        🚫 Cabut Sesi &amp; Force Logout
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
