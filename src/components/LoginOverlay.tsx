import React, { useState, useEffect } from "react";
import { CoffeeOpsState, User } from "../types";

interface LoginOverlayProps {
  state: CoffeeOpsState;
  onLoginSuccess: (user: User) => void;
}

export default function LoginOverlay({ state, onLoginSuccess }: LoginOverlayProps) {
  const users = state.users || [];
  const branding = state.branding;

  // Active Login Mode: "staff" (Tap Profile / Enter PIN) or "pimpinan" (Email + Password)
  const [loginMode, setLoginMode] = useState<"staff" | "pimpinan">("staff");

  // Under staff login, we can look up by selecting profile or typing manual code
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  // === STAFF CODE + PIN LOGIN STATES ===
  const [enteredCode, setEnteredCode] = useState("");
  const [enteredPin, setEnteredPin] = useState("");
  const [activeInputFocus, setActiveInputFocus] = useState<"code" | "pin">("pin");
  const [staffError, setStaffError] = useState("");

  // === PIMPINAN EMAIL + PASSWORD STATES ===
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [pimpinanError, setPimpinanError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Search filter for staff list (very handy if team grows, great touch of polish)
  const [searchQuery, setSearchQuery] = useState("");

  const playLoginTone = (type: "success" | "fail") => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Audio error", e);
    }
  };

  const handleKeyPress = (char: string) => {
    setStaffError("");
    if (isManualMode && activeInputFocus === "code") {
      if (enteredCode.length < 10) {
        setEnteredCode((p) => p + char.toUpperCase());
      }
    } else {
      if (enteredPin.length < 6) {
        const nextPin = enteredPin + char;
        setEnteredPin(nextPin);
        
        // Auto submit if PIN is 4 digits for standard users who tap
        if (selectedUser && nextPin.length === selectedUser.pin.length) {
          setTimeout(() => {
            handleStaffVerify(selectedUser, nextPin);
          }, 150);
        }
      }
    }
  };

  const handleBackspace = () => {
    setStaffError("");
    if (isManualMode && activeInputFocus === "code") {
      setEnteredCode((p) => p.slice(0, -1));
    } else {
      setEnteredPin((p) => p.slice(0, -1));
    }
  };

  const handleClear = () => {
    setStaffError("");
    if (isManualMode && activeInputFocus === "code") {
      setEnteredCode("");
    } else {
      setEnteredPin("");
    }
  };

  // Profile-based login action
  const handleSelectUser = (user: User) => {
    setStaffError("");
    setSelectedUser(user);
    setEnteredPin("");
    setIsManualMode(false);
    setActiveInputFocus("pin");
  };

  // Verification helper
  const handleStaffVerify = (targetUser: User, pinValue: string) => {
    setStaffError("");
    if (targetUser.pin === pinValue.trim()) {
      if (targetUser.isActive === false) {
        setStaffError("❌ Akun dinonaktifkan oleh manajemen!");
        playLoginTone("fail");
        setEnteredPin("");
        return;
      }
      playLoginTone("success");
      localStorage.setItem("coffeeops_rememberMe", rememberMe ? "true" : "false");
      if (rememberMe) {
        localStorage.setItem("coffeeops_loginExpiry", (Date.now() + 7 * 24 * 3600 * 1000).toString());
      } else {
        localStorage.removeItem("coffeeops_loginExpiry");
      }
      onLoginSuccess(targetUser);
    } else {
      setStaffError("❌ Kode PIN salah! Silakan ulangi.");
      playLoginTone("fail");
      setEnteredPin("");
    }
  };

  // Staff Login Submit (Manual Code + PIN Mode)
  const handleStaffLoginSubmit = () => {
    setStaffError("");
    if (isManualMode) {
      if (!enteredCode.trim() || !enteredPin.trim()) {
        setStaffError("❌ Isi Kode Staf dan PIN!");
        playLoginTone("fail");
        return;
      }

      const matchedUser = users.find((u) => {
        const uCode = u.staffCode || `STF${String(u.id).substring(1).padStart(3, "0")}`;
        return (
          uCode.toLowerCase() === enteredCode.trim().toLowerCase() &&
          u.pin === enteredPin.trim()
        );
      });

      if (matchedUser) {
        handleStaffVerify(matchedUser, enteredPin);
      } else {
        setStaffError("❌ Kode Staf atau PIN salah!");
        playLoginTone("fail");
        setEnteredPin("");
      }
    } else if (selectedUser) {
      handleStaffVerify(selectedUser, enteredPin);
    } else {
      setStaffError("❌ Pilih profil staf Anda terlebih dahulu!");
    }
  };

  // Owner/Manager Email + Password login submit
  const handlePimpinanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPimpinanError("");

    if (!enteredEmail.trim() || !enteredPassword.trim()) {
      setPimpinanError("❌ Isi Email dan Password Backoffice!");
      playLoginTone("fail");
      return;
    }

    const matchedUser = users.find(
      (u) =>
        (u.email || "").toLowerCase() === enteredEmail.trim().toLowerCase() &&
        u.password === enteredPassword.trim() &&
        (u.role === "Owner" || u.role === "Manager")
    );

    if (matchedUser) {
      playLoginTone("success");
      localStorage.setItem("coffeeops_rememberMe", rememberMe ? "true" : "false");
      if (rememberMe) {
        localStorage.setItem("coffeeops_loginExpiry", (Date.now() + 7 * 24 * 3600 * 1000).toString());
      } else {
        localStorage.removeItem("coffeeops_loginExpiry");
      }
      onLoginSuccess(matchedUser);
    } else {
      setPimpinanError("❌ Kredensial tidak valid atau Anda tidak memiliki akses pimpinan!");
      playLoginTone("fail");
    }
  };

  // Support physical typing
  useEffect(() => {
    if (loginMode !== "staff") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key >= "0" && e.key <= "9") {
        handleKeyPress(e.key);
      } else if (isManualMode && ((e.key >= "a" && e.key <= "z") || (e.key >= "A" && e.key <= "Z"))) {
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        if (selectedUser) {
          setSelectedUser(null);
        } else {
          handleClear();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isManualMode && activeInputFocus === "code" && enteredCode.length > 0) {
          setActiveInputFocus("pin");
        } else if (enteredPin.length > 0) {
          handleStaffLoginSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loginMode, enteredCode, enteredPin, activeInputFocus, selectedUser, isManualMode]);

  // Filter staff list
  const activeStaffs = users.filter((u) => u.isActive !== false);
  const filteredStaffs = activeStaffs.filter((u) => {
    const q = searchQuery.toLowerCase();
    const resolvedCode = u.staffCode || `STF${String(u.id).substring(1).padStart(3, "0")}`;
    return (
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      resolvedCode.toLowerCase().includes(q)
    );
  });

  // Role details mapping helper
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Owner":
        return { emoji: "👑", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Owner" };
      case "Manager":
        return { emoji: "👔", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Manager" };
      case "Supervisor":
        return { emoji: "🌟", color: "bg-[#D4A853]/15 text-[#D4A853] border-[#D4A853]/35", label: "Supervisor" };
      case "Head Barista":
        return { emoji: "🏆☕", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Head Barista" };
      case "Barista":
        return { emoji: "☕", color: "bg-amber-500/5 text-amber-300/80 border-amber-500/10", label: "Barista" };
      case "Bartender":
        return { emoji: "🍹", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "Bartender" };
      case "Cashier":
        return { emoji: "💵", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Cashier" };
      case "Head Waiter":
        return { emoji: "🥇📋", color: "bg-teal-500/15 text-teal-350 border-teal-500/25", label: "Head Waiter" };
      case "Waiter":
        return { emoji: "📋", color: "bg-zinc-500/10 text-amber-200/80 border-amber-500/10", label: "Waiter" };
      case "Service Staff":
        return { emoji: "🛎️", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", label: "Service Staff" };
      case "Front of House":
        return { emoji: "🤵", color: "bg-teal-500/10 text-teal-350 border-teal-500/20", label: "Front of House" };
      case "Cleaning Service":
        return { emoji: "🧹", color: "bg-sky-500/10 text-sky-400 border-sky-500/20", label: "Cleaning Service" };
      case "Security":
        return { emoji: "🚨", color: "bg-red-500/10 text-red-450 border-red-500/20", label: "Security" };
      default:
        return { emoji: "👤", color: "bg-amber-500/5 text-amber-200 border-amber-500/10", label: role };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto w-full h-full">
      {/* Background Coffee Ring Aesthetics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[20%] w-[40rem] h-[40rem] rounded-full border border-amber-500/5 animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute bottom-[5%] right-[10%] w-[30rem] h-[30rem] rounded-full border border-amber-500/5 animate-pulse" style={{ animationDuration: "8s" }} />
      </div>

      <div className="relative w-full max-w-4xl bg-[#120701] border border-[#D4A853]/25 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-4 sm:p-7 text-amber-50 flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
        
        {/* LEFT COLUMN: BRANDING & ROLE PANEL */}
        <div className="md:w-5/12 flex flex-col justify-between p-4 bg-black/35 rounded-2xl border border-amber-500/5 space-y-6">
          <div className="space-y-4">
            {/* Header Branding */}
            <div className="flex items-center gap-3.5">
              <span className="text-4.5xl filter drop-shadow-[0_4px_10px_rgba(212,168,83,0.4)] block shrink-0">
                {branding.logo || "☕"}
              </span>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-black tracking-tight text-amber-100">
                  {branding.name || "CoffeeOps Enterprise"}
                </h1>
                <p className="text-[9.5px] uppercase font-mono tracking-widest text-[#D4A853] font-semibold mt-0.5">
                  {branding.tagline || "Secured Terminal & Kiosk Portal"}
                </p>
              </div>
            </div>

            <div className="h-px bg-amber-500/10" />

            {/* Instruction panel for POS devices */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-widest block">💡 PANDUAN MASUK CEPAT:</span>
              <ul className="space-y-1.5 text-[11px] text-amber-200/70 list-disc list-inside">
                <li>Ketuk profil foto/nama Anda di daftar kru</li>
                <li>Masukkan kode PIN pengaman Anda</li>
                <li>Aplikasi akan memuat akses sesuai wewenang role</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            {/* Mode Switching Tabs */}
            <div className="grid grid-cols-2 bg-black/40 p-1 rounded-xl border border-amber-500/10 text-xs">
              <button
                id="mode-staff-btn"
                type="button"
                onClick={() => {
                  setLoginMode("staff");
                  setSelectedUser(null);
                  setIsManualMode(false);
                  setStaffError("");
                  setPimpinanError("");
                }}
                className={`py-2 rounded-lg font-bold transition duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  loginMode === "staff"
                    ? "bg-amber-500 text-amber-950 shadow-md"
                    : "text-amber-100/60 hover:text-amber-100"
                }`}
              >
                👤 Kru &amp; Staf
              </button>
              <button
                id="mode-pimpinan-btn"
                type="button"
                onClick={() => {
                  setLoginMode("pimpinan");
                  setStaffError("");
                  setPimpinanError("");
                }}
                className={`py-2 rounded-lg font-bold transition duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  loginMode === "pimpinan"
                    ? "bg-amber-500 text-amber-950 shadow-md"
                    : "text-amber-100/60 hover:text-amber-100"
                }`}
              >
                👑 Owner Lane
              </button>
            </div>

            {/* Quick security foot */}
            <div className="text-[9px] font-mono text-center md:text-left text-amber-100/20 leading-relaxed">
              Sistem Otorisasi CoffeeOps v2026. Seluruh pergantian shift dan aktivitas absensi terekam ke database cloud.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LOGIN INTERFACE */}
        <div className="flex-1 flex flex-col justify-center min-h-[380px]">
          
          {/* STAFF LOGIN INTERFACE */}
          {loginMode === "staff" && (
            <div className="space-y-4 flex flex-col justify-between h-full">
              
              {/* STAGE A: PROFILE CHOOSER GRID */}
              {!selectedUser && !isManualMode && (
                <div className="space-y-4 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                      <h3 className="font-serif text-sm font-bold text-amber-200 flex items-center gap-2">
                        <span>👥 PILIH PROFIL ANDA (TAP UNTUK LOGIN):</span>
                      </h3>
                      {/* Search box for filter */}
                      <input
                        type="text"
                        placeholder="Cari nama / jabatan staf..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-black/45 border border-amber-500/10 focus:border-amber-500/40 px-2 py-1 text-[11px] rounded text-amber-100 outline-none w-full sm:w-48 placeholder-amber-500/35"
                      />
                    </div>

                    {/* Highly polished Scrollable user grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {filteredStaffs.map((u) => {
                        const style = getRoleBadge(u.role);
                        const displayCode = u.staffCode || `STF${String(u.id).substring(1).padStart(3, "0")}`;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectUser(u)}
                            className="bg-[#1c0c03]/60 hover:bg-[#2e1507] border border-amber-500/15 hover:border-amber-400 p-3 rounded-2xl flex flex-col items-center justify-center text-center transition duration-200 group active:scale-95 shadow-lg select-none outline-none cursor-pointer min-h-[95px]"
                          >
                            <span className="text-2xl mb-1.5 filter drop-shadow group-hover:scale-110 transition duration-250 flex items-center justify-center">
                              {u.profilePhoto && u.profilePhoto.length > 5 ? (
                                <img src={u.profilePhoto} alt={u.name} referrerPolicy="no-referrer" className="h-10.5 w-10.5 object-cover rounded-full border border-amber-500/20" />
                              ) : (
                                u.profilePhoto || style.emoji
                              )}
                            </span>
                            <span className="text-xs font-bold text-amber-100 leading-tight group-hover:text-amber-300 transition truncate max-w-full">
                              {u.name}
                            </span>
                            <span className={`text-[8.5px] font-mono px-2 py-0.5 mt-1.5 rounded-full border ${style.color} tracking-wider font-extrabold`}>
                              {style.label} ({displayCode})
                            </span>
                          </button>
                        );
                      })}

                      {filteredStaffs.length === 0 && (
                        <div className="col-span-3 text-center py-8 text-amber-100/40 text-xs font-mono">
                          Tidak menemukan kru "{searchQuery}". Cek ejaan komputer atau klik masuk manual.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alternate input mode link */}
                  <div className="flex justify-between items-center pt-3 border-t border-amber-500/5 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsManualMode(true)}
                      className="text-[10px] font-mono text-amber-300 hover:text-amber-400 hover:underline transition cursor-pointer"
                    >
                      ⌨️ Gunakan Input Manual (Tulis Staff Code)
                    </button>
                    <div className="text-[10px] font-mono text-amber-100/30">
                      Total: {activeStaffs.length} Kru Aktif
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE B: PIN PAD ENTER AREA FOR CHOSEN USER */}
              {(selectedUser || isManualMode) && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Selected Person Display */}
                  <div className="bg-[#1c0c03] border border-amber-500/15 p-3.5 rounded-2xl flex items-center justify-between">
                    {selectedUser ? (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl bg-black/40 p-1.5 rounded-xl border border-amber-500/5 flex items-center justify-center h-12 w-12 shrink-0">
                          {selectedUser.profilePhoto && selectedUser.profilePhoto.length > 5 ? (
                            <img src={selectedUser.profilePhoto} alt={selectedUser.name} referrerPolicy="no-referrer" className="h-9 w-9 object-cover rounded-lg" />
                          ) : (
                            selectedUser.profilePhoto || getRoleBadge(selectedUser.role).emoji
                          )}
                        </span>
                        <div>
                          <p className="text-[10px] text-amber-400/60 font-mono font-black uppercase tracking-wider">
                            STAF TERPILIH:
                          </p>
                          <h4 className="font-serif text-sm font-black text-amber-100 leading-tight">
                            {selectedUser.name}
                          </h4>
                          <span className="text-[9px] font-mono text-amber-300 uppercase underline decoration-amber-500/30">
                            {selectedUser.role} ({selectedUser.staffCode || "Code Aktif"})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl bg-black/40 p-2 rounded-xl">⌨️</span>
                        <div>
                          <p className="text-[10px] text-amber-400/60 font-mono font-black uppercase tracking-wider">
                            LOGIN MANUAL:
                          </p>
                          <h4 className="font-mono text-xs font-bold text-amber-300">
                            Masukan ID Kode &amp; PIN
                          </h4>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setIsManualMode(false);
                        setEnteredPin("");
                        setEnteredCode("");
                        setStaffError("");
                      }}
                      className="text-[10.5px] font-mono font-bold bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/10 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-xl transition cursor-pointer"
                    >
                      ⬅️ Ganti Staf
                    </button>
                  </div>

                  {/* Dual custom text inputs for tablet/phone sizing */}
                  <div className="grid grid-cols-2 gap-3">
                    {isManualMode ? (
                      <button
                        id="focus-staff-code-btn"
                        type="button"
                        onClick={() => setActiveInputFocus("code")}
                        className={`flex flex-col p-2.5 rounded-xl border transition-all duration-150 text-left ${
                          activeInputFocus === "code"
                            ? "bg-amber-500/10 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                            : "bg-black/30 border-amber-500/5"
                        }`}
                      >
                        <span className="text-[8.5px] font-mono uppercase text-amber-100/40 tracking-widest font-extrabold mb-0.5">
                          1. KODE STAFF (CODE)
                        </span>
                        <span className={`text-sm font-mono font-black tracking-wider ${enteredCode ? "text-amber-50" : "text-amber-100/15"}`}>
                          {enteredCode || "Ketik Code..."}
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-col p-2.5 bg-black/20 border border-amber-500/5 rounded-xl text-left">
                        <span className="text-[8.5px] font-mono uppercase text-amber-100/40 tracking-widest font-extrabold mb-0.5">
                          KODE STAFF (OTOMATIS)
                        </span>
                        <span className="text-sm font-mono font-black text-amber-100/50">
                          {selectedUser ? (selectedUser.staffCode || "Active") : "None"}
                        </span>
                      </div>
                    )}

                    <button
                      id="focus-staff-pin-btn"
                      type="button"
                      onClick={() => setActiveInputFocus("pin")}
                      className={`flex flex-col p-2.5 rounded-xl border transition-all duration-150 text-left ${
                        activeInputFocus === "pin" || !isManualMode
                          ? "bg-amber-500/10 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                          : "bg-black/30 border-amber-500/5"
                      }`}
                    >
                      <span className="text-[8.5px] font-mono uppercase text-amber-100/40 tracking-widest font-extrabold mb-0.5">
                        {isManualMode ? "2. PIN OPERASIONAL" : "PIN OPERASIONAL"}
                      </span>
                      <span className="text-sm font-mono font-black tracking-widest text-amber-350">
                        {enteredPin ? "•".repeat(enteredPin.length) : "••••"}
                      </span>
                    </button>
                  </div>

                  {/* Virtual On-screen Keypad Panel */}
                  <div className="space-y-2">
                    
                    {/* Error Box */}
                    {staffError && (
                      <div className="text-center text-[10.5px] text-red-300 bg-red-950/40 border border-red-500/15 p-2 rounded-xl animate-shake font-mono">
                        {staffError}
                      </div>
                    )}

                    {/* Numeric PIN grid pad */}
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/25 rounded-2xl border border-amber-500/5">
                      {/* Row 1 */}
                      <button type="button" onClick={() => handleKeyPress("7")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 text-amber-100 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer text-sm">7</button>
                      <button type="button" onClick={() => handleKeyPress("8")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 text-amber-100 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer text-sm">8</button>
                      <button type="button" onClick={() => handleKeyPress("9")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 text-amber-100 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer text-sm">9</button>
                      <span className="h-11 flex items-center justify-center font-mono text-[9px] text-amber-500/20 font-bold max-sm:hidden">AXES</span>
                      <button type="button" onClick={() => handleKeyPress("HWT")} className="h-11 bg-teal-500/5 hover:bg-teal-500/15 border border-teal-500/10 hover:border-teal-500/20 text-teal-300 font-mono text-[10px] rounded-xl transition active:scale-95 cursor-pointer font-bold sm:hidden">HWT</button>

                      {/* Row 2 */}
                      <button type="button" onClick={() => handleKeyPress("4")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 text-amber-100 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer text-sm">4</button>
                      <button type="button" onClick={() => handleKeyPress("5")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 text-amber-100 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer text-sm">5</button>
                      <button type="button" onClick={() => handleKeyPress("6")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 text-amber-100 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer text-sm">6</button>
                      <span className="h-11 flex items-center justify-center font-mono text-[9px] text-amber-500/20 font-bold max-sm:hidden">COFFEE</span>
                      <button type="button" onClick={() => handleKeyPress("BAR")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/20 text-amber-300 font-mono text-[10px] rounded-xl transition active:scale-95 cursor-pointer font-bold sm:hidden">BAR</button>

                      {/* Row 3 */}
                      <button type="button" onClick={() => handleKeyPress("1")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 text-amber-100 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer text-sm">1</button>
                      <button type="button" onClick={() => handleKeyPress("2")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 text-amber-100 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer text-sm">2</button>
                      <button type="button" onClick={() => handleKeyPress("3")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 text-amber-100 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer text-sm">3</button>
                      <span className="h-11 flex items-center justify-center font-mono text-[9px] text-amber-500/20 font-bold max-sm:hidden">SYSTEM</span>
                      <button type="button" onClick={() => handleKeyPress("WTR")} className="h-11 bg-zinc-500/5 hover:bg-zinc-500/15 border border-zinc-500/10 hover:border-zinc-500/20 text-amber-100/60 font-mono text-[10px] rounded-xl transition active:scale-95 cursor-pointer font-bold sm:hidden font-mono">WTR</button>

                      {/* Row 4 */}
                      <button type="button" onClick={handleClear} className="h-11 bg-red-950/25 hover:bg-red-900/35 border border-red-500/15 text-red-300 font-mono text-[9px] font-extrabold rounded-xl transition active:scale-95 cursor-pointer">CLEAR</button>
                      <button type="button" onClick={() => handleKeyPress("0")} className="h-11 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/25 text-amber-100 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer text-sm">0</button>
                      <button type="button" onClick={handleBackspace} className="h-11 bg-amber-500/5 hover:bg-amber-500/25 border border-amber-500/15 text-amber-300 font-mono font-extrabold rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center text-sm">⌫</button>
                      <button type="button" onClick={handleStaffLoginSubmit} className="h-11 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black rounded-xl transition active:scale-95 cursor-pointer text-[10.5px]">ENTER</button>
                    </div>
                  </div>

                  {/* Remember Me Toggle */}
                  <div className="flex items-center gap-2 py-0.5 select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      readOnly
                      className="h-4 w-4 rounded bg-black/40 border-amber-500/25 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-[10.5px] font-mono text-amber-200/80">
                      Ingat Saya Selama 7 Hari (Remember Me)
                    </span>
                  </div>

                  {/* Submit Switch Button */}
                  <button
                    id="staff-login-submit"
                    type="button"
                    onClick={handleStaffLoginSubmit}
                    className="w-full bg-[#D4A853] hover:bg-[#c39745] active:scale-[0.99] text-amber-950 font-serif font-black tracking-wider text-xs py-3.5 rounded-xl shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    🏁 MASUK OPERASIONAL CAFE ({selectedUser ? selectedUser.name.split(" ")[0].toUpperCase() : "STAFF"})
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PIMPINAN EMAIL + PASSWORD */}
          {loginMode === "pimpinan" && (
            <form onSubmit={handlePimpinanSubmit} className="space-y-4 animate-fadeIn" id="pimpinan-login-form">
              <div className="space-y-1">
                <h3 className="font-serif text-sm font-bold text-amber-200">
                  🛡️ OTENTIKASI PEMILIK (OWNER &amp; MANAGER):
                </h3>
                <p className="text-[11px] text-amber-100/50">
                  Gunakan email dan password terdaftar untuk melihat backoffice penuh.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 font-semibold uppercase tracking-wider font-mono">
                  Email Backoffice Pimpinan
                </label>
                <input
                  id="pimpinan-email-input"
                  type="email"
                  required
                  placeholder="Contoh: muhammaddario09@gmail.com"
                  className="bg-black/45 border border-amber-500/10 focus:border-amber-500/55 rounded-xl p-3 text-xs text-amber-50 outline-none w-full"
                  value={enteredEmail}
                  onChange={(e) => setEnteredEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-100/40 font-semibold uppercase tracking-wider font-mono">
                  Password Rahasia
                </label>
                <input
                  id="pimpinan-password-input"
                  type="password"
                  required
                  placeholder="Masukan password pimpinan Anda"
                  className="bg-black/45 border border-amber-500/10 focus:border-amber-500/55 rounded-xl p-3 text-xs text-amber-50 outline-none w-full"
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                />
              </div>

              {pimpinanError && (
                <div className="text-center text-[10.5px] text-red-300 bg-red-950/40 border border-red-500/15 p-2 rounded-xl">
                  {pimpinanError}
                </div>
              )}

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 py-0.5 select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  readOnly
                  className="h-4 w-4 rounded bg-black/40 border-[#D4A853]/25 accent-amber-500 cursor-pointer"
                />
                <span className="text-[10.5px] font-mono text-amber-200">
                  Ingat Saya Selama 7 Hari (Remember Me)
                </span>
              </div>

              <button
                id="pimpinan-login-submit"
                type="submit"
                className="w-full bg-[#D4A853] hover:bg-[#c39745] active:scale-[0.99] text-amber-950 font-serif font-black tracking-wider text-xs py-3.5 rounded-xl shadow-xl transition-all duration-200 cursor-pointer text-center"
              >
                🔒 OTENTIKASI INTEGRASI PIMPINAN
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
