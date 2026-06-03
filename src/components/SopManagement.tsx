import React, { useState } from "react";
import { CoffeeOpsState, User, SopItem, SopAttachment, SopChangeHistory } from "../types";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Copy, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  Archive, 
  Trash2, 
  History, 
  Search, 
  Download, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Lock, 
  ExternalLink,
  Eye,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface SopManagementProps {
  state: CoffeeOpsState;
  syncState: (updatedState: CoffeeOpsState) => Promise<void>;
  currentUser: User | null;
  activeRole: string;
}

const CATEGORIES = [
  "Bar SOP",
  "Brewing SOP",
  "Service SOP",
  "Kitchen SOP",
  "Cleaning SOP",
  "Maintenance SOP",
  "Inventory SOP"
] as const;

type SopCategory = typeof CATEGORIES[number];

export default function SopManagement({
  state,
  syncState,
  currentUser,
  activeRole
}: SopManagementProps) {
  const sops = state.sopsList || [];
  
  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [viewArchived, setViewArchived] = useState(false);
  const [expandedSopId, setExpandedSopId] = useState<string | null>(null);
  
  // Form states (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSop, setEditingSop] = useState<SopItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<SopCategory>("Bar SOP");
  const [formSteps, setFormSteps] = useState<string[]>([""]);
  const [formVersion, setFormVersion] = useState("V1.0");
  
  // Attachments in form
  const [referencePhoto, setReferencePhoto] = useState("");
  const [videoTutorial, setVideoTutorial] = useState("");
  const [supportingDoc, setSupportingDoc] = useState("");
  
  // History tracking on edits
  const [changeNotes, setChangeNotes] = useState("");

  const isManagerOrOwner = activeRole === "Owner" || activeRole === "Manager";

  // Role based category restrictions
  const getAllowedCategoriesForRole = (role: string): string[] => {
    if (role === "Owner" || role === "Manager") {
      return [...CATEGORIES];
    }
    switch (role) {
      case "Barista":
      case "Head Barista":
        return ["Bar SOP", "Brewing SOP", "Cleaning SOP"];
      case "Kitchen":
        return ["Kitchen SOP", "Cleaning SOP", "Inventory SOP"];
      case "Waiter":
      case "Head Waiter":
        return ["Service SOP", "Cleaning SOP"];
      case "Service Staff":
        return ["Service SOP", "Cleaning SOP", "Maintenance SOP"];
      case "Cashier":
        return ["Service SOP", "Inventory SOP"];
      default:
        return ["Service SOP", "Cleaning SOP"]; // Fallback safe
    }
  };

  const allowedCategories = getAllowedCategoriesForRole(activeRole);

  // Filter SOPs based on search, category and permissions
  const filteredSops = sops.filter(sop => {
    // 1. Filter by role access permissions
    if (!allowedCategories.includes(sop.category)) return false;
    
    // 2. Filter by category selector
    if (selectedCategory !== "All" && sop.category !== selectedCategory) return false;
    
    // 3. Filter by search query
    const matchesSearch = 
      sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sop.steps.some(step => step.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    // 4. Archive toggle match
    const isSopArchived = !!sop.isArchived;
    return viewArchived ? isSopArchived : !isSopArchived;
  });

  const toggleExpand = (id: string) => {
    setExpandedSopId(expandedSopId === id ? null : id);
  };

  const handleStepChange = (index: number, val: string) => {
    const next = [...formSteps];
    next[index] = val;
    setFormSteps(next);
  };

  const addStepField = () => {
    setFormSteps([...formSteps, ""]);
  };

  const removeStepField = (index: number) => {
    if (formSteps.length <= 1) return;
    setFormSteps(formSteps.filter((_, i) => i !== index));
  };

  const openCreateModal = () => {
    setEditingSop(null);
    setFormTitle("");
    setFormCategory("Bar SOP");
    setFormSteps([""]);
    setFormVersion("V1.0");
    setReferencePhoto("");
    setVideoTutorial("");
    setSupportingDoc("");
    setChangeNotes("");
    setIsFormOpen(true);
  };

  const openEditModal = (sop: SopItem) => {
    setEditingSop(sop);
    setFormTitle(sop.title);
    setFormCategory(sop.category);
    setFormSteps(sop.steps.length ? [...sop.steps] : [""]);
    setFormVersion(sop.version);
    setReferencePhoto(sop.photoUrl || "");
    setVideoTutorial(sop.videoUrl || "");
    setSupportingDoc(sop.docUrl || "");
    
    // Auto increment version prompt
    const currentNum = parseFloat(sop.version.replace(/[^\d.]/g, "")) || 1.0;
    const nextVer = `V${(currentNum + 0.1).toFixed(1)}`;
    setFormVersion(nextVer);
    setChangeNotes("");
    setIsFormOpen(true);
  };

  const handleSaveSop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Judul SOP harus diisi!");
      return;
    }
    const cleanSteps = formSteps.map(s => s.trim()).filter(s => s !== "");
    if (cleanSteps.length === 0) {
      alert("Harap tambahkan minimal 1 langkah instruksi kerja!");
      return;
    }

    const nextSops = [...sops];
    const authorName = currentUser?.name || activeRole;

    if (editingSop) {
      // Edit mode
      const index = nextSops.findIndex(s => s.id === editingSop.id);
      if (index !== -1) {
        const previousVer = editingSop.version;
        const newHistoryLog: SopChangeHistory = {
          id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          version: previousVer,
          date: new Date().toISOString().substring(0, 10),
          editor: authorName,
          notes: changeNotes.trim() || `Pembaruan draf ke versi ${formVersion}`
        };

        const updatedHistory = editingSop.history ? [newHistoryLog, ...editingSop.history] : [newHistoryLog];

        nextSops[index] = {
          ...editingSop,
          title: formTitle.trim(),
          category: formCategory,
          steps: cleanSteps,
          version: formVersion,
          photoUrl: referencePhoto.trim() || undefined,
          videoUrl: videoTutorial.trim() || undefined,
          docUrl: supportingDoc.trim() || undefined,
          history: updatedHistory,
          lastReviewDate: new Date().toISOString().substring(0, 10)
        };
      }
    } else {
      // Create mode
      const newSop: SopItem = {
        id: `sop-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        steps: cleanSteps,
        version: formVersion,
        photoUrl: referencePhoto.trim() || undefined,
        videoUrl: videoTutorial.trim() || undefined,
        docUrl: supportingDoc.trim() || undefined,
        lastReviewDate: new Date().toISOString().substring(0, 10),
        history: [
          {
            id: `h-init-${Date.now()}`,
            version: formVersion,
            date: new Date().toISOString().substring(0, 10),
            editor: authorName,
            notes: "Registrasi inisial publikasi SOP pertama."
          }
        ]
      };
      nextSops.unshift(newSop);
    }

    const nextState = {
      ...state,
      sopsList: nextSops
    };

    await syncState(nextState);
    setIsFormOpen(false);
    setExpandedSopId(editingSop ? editingSop.id : nextSops[0].id);
  };

  const handleDuplicateSop = async (source: SopItem) => {
    const authorName = currentUser?.name || activeRole;
    const duplicated: SopItem = {
      ...source,
      id: `sop-${Date.now()}`,
      title: `Copy of - ${source.title}`,
      version: "V1.0",
      isArchived: false,
      lastReviewDate: new Date().toISOString().substring(0, 10),
      history: [
        {
          id: `h-dup-${Date.now()}`,
          version: "V1.0",
          date: new Date().toISOString().substring(0, 10),
          editor: authorName,
          notes: `Diduplikasi dari SOP referensi asli: ${source.title} (ID: ${source.id})`
        }
      ]
    };

    const nextState = {
      ...state,
      sopsList: [duplicated, ...sops]
    };

    await syncState(nextState);
    setExpandedSopId(duplicated.id);
  };

  const handleArchiveToggle = async (sop: SopItem) => {
    const nextSops = sops.map(s => {
      if (s.id === sop.id) {
        return { ...s, isArchived: !s.isArchived };
      }
      return s;
    });

    await syncState({ ...state, sopsList: nextSops });
  };

  const handleDeleteSop = async (id: string) => {
    if (!confirm("SOP ini akan dihapus secara permanen dari basis data backoffice CoffeeOps. Anda yakin?")) {
      return;
    }
    const nextSops = sops.filter(s => s.id !== id);
    await syncState({ ...state, sopsList: nextSops });
    if (expandedSopId === id) setExpandedSopId(null);
  };

  // Preset file upload simulators
  const simulatePhotoUpload = () => {
    const dummyPics = [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&auto=format&fit=crop&q=80"
    ];
    const rand = dummyPics[Math.floor(Math.random() * dummyPics.length)];
    setReferencePhoto(rand);
  };

  const simulateVideoLink = () => {
    setVideoTutorial("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  };

  const simulateDocLink = () => {
    setSupportingDoc("https://example.com/downloads/SOP_Operations_Booklet.docx");
  };

  return (
    <div className="space-y-6 text-amber-50 animate-fadeIn" id="sop-management-container">
      
      {/* 1. Header Banner */}
      <div className="bg-[#1a0a00]/30 p-5 border border-amber-500/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            📚 Pusat Panduan Kerja &amp; SOP Standardisasi
          </h3>
          <p className="text-xs text-amber-100/40 mt-1">
            Standardisasi tata kelola penyajian bar, dapur, penerimaan, kebersihan serta perawatan aset multi-cabang.
          </p>
        </div>
        
        {isManagerOrOwner && (
          <button
            onClick={openCreateModal}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-xl text-amber-950 text-xs font-bold font-mono transition duration-250 cursor-pointer flex items-center justify-center gap-2 shadow md:text-[11.5px] min-h-[44px]"
            id="create-sop-trigger-btn"
          >
            <Plus size={16} /> TAMBAH SOP BARU
          </button>
        )}
      </div>

      {/* 2. Search & Categories Navigation Bar */}
      <div className="bg-[#241205]/40 border border-[#D4A853]/15 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-amber-500/50" size={16} />
            <input
              type="text"
              placeholder="Cari kata kunci atau langkah SOP harian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/45 border border-amber-500/15 focus:border-amber-500/50 outline-none text-xs rounded-xl pl-10 pr-4 py-3 text-amber-50"
            />
          </div>

          {/* Action Fillters */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setViewArchived(!viewArchived)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer min-h-[44px] flex items-center gap-1.5 ${
                viewArchived 
                  ? "bg-amber-500/15 text-amber-300 border-amber-400" 
                  : "bg-black/20 text-amber-200/50 border-amber-500/10 hover:text-amber-50"
              }`}
            >
              <Archive size={14} /> {viewArchived ? "Melihat Arsip" : "Tampilkan Arsip"}
            </button>
            
            {selectedCategory !== "All" && (
              <button
                onClick={() => setSelectedCategory("All")}
                className="bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-2 rounded-xl text-xs font-mono"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Scroll Mode Categories */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-amber-200/30 font-semibold font-mono uppercase tracking-widest flex items-center gap-1">
            <Filter size={10} /> PILIH KATEGORI OPERASIONAL
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                selectedCategory === "All"
                  ? "bg-amber-500 text-amber-950 font-bold"
                  : "bg-black/20 text-amber-100/50 border border-amber-500/5 hover:bg-amber-500/5 hover:text-amber-100"
              }`}
            >
              Semua SOP ({sops.filter(s => allowedCategories.includes(s.category)).length})
            </button>

            {CATEGORIES.map(cat => {
              const count = sops.filter(s => s.category === cat && (viewArchived ? !!s.isArchived : !s.isArchived)).length;
              const hasAccess = allowedCategories.includes(cat);

              return (
                <button
                  key={cat}
                  disabled={!hasAccess}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? "bg-[#D4A853] text-amber-950 font-bold"
                      : "bg-black/20 text-amber-100/50 border border-amber-500/5 hover:bg-amber-500/5 hover:text-amber-100"
                  } ${!hasAccess ? "opacity-35 cursor-not-allowed" : ""}`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] bg-black/30 text-amber-200 px-1 py-0.2 rounded-full">
                    {hasAccess ? count : "🔐"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Restricted Notification for Kru */}
      {!isManagerOrOwner && (
        <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl text-[11px] text-amber-200/80 flex items-start gap-2">
          <span>ℹ️</span>
          <div>
            <strong>Mode Lihat Saja (Read-Only)</strong>: Sebagai level kru <strong>({activeRole})</strong>, Anda berwenang melihat SOP dalam bidang <strong>{allowedCategories.join(", ")}</strong> untuk menyelaraskan kualitas operasional.
          </div>
        </div>
      )}

      {/* 4. Display Filtered SOP Grid / Cards */}
      {filteredSops.length === 0 ? (
        <div className="text-center py-12 bg-black/20 border border-dashed border-amber-500/10 rounded-2xl flex flex-col items-center justify-center">
          <BookOpen className="text-amber-500/20 mb-3" size={48} />
          <h4 className="font-serif text-sm font-semibold text-amber-200/70">SOP Tidak Ditemukan</h4>
          <p className="text-[11px] text-amber-100/30 max-w-sm mt-1">
            {viewArchived 
              ? "Tidak ada item SOP tersimpan di dalam folder arsip kategori saat ini."
              : "Tidak ada dokumen SOP yang cocok dengan filter atau kata pencarian Anda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSops.map(sop => {
            const isExpanded = expandedSopId === sop.id;
            
            // Generate category colors
            const badgeThemes: Record<string, string> = {
              "Bar SOP": "bg-amber-500/10 text-amber-300 border-amber-500/15",
              "Brewing SOP": "bg-amber-600/10 text-amber-250 border-amber-600/15",
              "Service SOP": "bg-blue-500/10 text-blue-300 border-blue-500/15",
              "Kitchen SOP": "bg-purple-500/10 text-purple-300 border-purple-500/15",
              "Cleaning SOP": "bg-emerald-500/10 text-emerald-300 border-emerald-500/15",
              "Maintenance SOP": "bg-pink-500/10 text-pink-300 border-pink-500/15",
              "Inventory SOP": "bg-cyan-500/10 text-cyan-200 border-cyan-500/15"
            };

            return (
              <div
                key={sop.id}
                id={`sop-card-${sop.id}`}
                className={`bg-[#1c0e05]/50 border border-amber-500/10 hover:border-amber-400/25 rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? "shadow-[0_12px_24px_rgba(0,0,0,0.4)] border-amber-500/25" : ""
                }`}
              >
                {/* Header Summary */}
                <div
                  onClick={() => toggleExpand(sop.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none active:bg-amber-500/5 transition text-xs sm:text-sm"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full border uppercase ${badgeThemes[sop.category] || "bg-amber-500/5 text-amber-200 border-amber-500/10"}`}>
                        {sop.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/15 px-1.5 py-0.5 rounded">
                        {sop.version}
                      </span>
                      {sop.isArchived && (
                        <span className="text-[9.5px] font-mono uppercase bg-red-500/10 text-red-300 px-2 py-0.5 rounded font-black border border-red-500/15">
                          ARCHIVED / ARSIP
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-serif font-black text-amber-100 group-hover:text-amber-50 text-sm sm:text-base">
                      {sop.title}
                    </h4>
                    
                    <p className="text-[11px] text-amber-100/30">
                      Diulas: {sop.lastReviewDate} • {sop.steps.length} Langkah Kerja
                    </p>
                  </div>
                  
                  <div className="shrink-0 text-amber-300 flex items-center gap-3">
                    <span className="p-1 rounded bg-black/40 border border-amber-500/10 hidden sm:block">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-amber-500/10 p-5 space-y-5 bg-black/20 animate-fadeIn text-xs sm:text-sm">
                    
                    {/* Steps list */}
                    <div className="space-y-3">
                      <h5 className="font-serif text-amber-200 font-extrabold border-b border-amber-500/5 pb-1 flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-[#D4A853]" /> Prosedur &amp; Langkah Kerja Terstandardisasi:
                      </h5>
                      <div className="space-y-2.5">
                        {sop.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-3 items-start bg-black/10 p-2.5 rounded-xl border border-amber-500/5">
                            <span className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-300 font-mono font-bold border border-amber-500/15 flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-[12px] leading-relaxed text-amber-100 pt-0.5">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SOP ATTACHMENT Loader section */}
                    <div className="space-y-3">
                      <h5 className="font-serif text-amber-200 font-extrabold border-b border-amber-500/5 pb-1 flex items-center gap-1.5">
                        📎 berkas Lampiran &amp; Media SOP:
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Reference Photo */}
                        <div className="bg-[#1c0d03]/40 border border-[#D4A853]/15 rounded-xl p-3 text-center space-y-2 flex flex-col justify-between">
                          <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold">
                            <ImageIcon size={14} /> Foto Referensi standardisasi
                          </div>
                          {sop.photoUrl ? (
                            <div className="space-y-2">
                              <img
                                src={sop.photoUrl}
                                alt="Standard"
                                referrerPolicy="no-referrer"
                                className="w-full h-24 object-cover rounded-lg border border-amber-500/20"
                              />
                              <a
                                href={sop.photoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#D4A853] hover:underline flex items-center justify-center gap-1"
                              >
                                <ExternalLink size={10} /> Lihat Ukuran Penuh
                              </a>
                            </div>
                          ) : (
                            <div className="py-6 font-mono text-[10px] text-amber-100/20 italic bg-black/10 rounded-lg">
                              (Tidak ada foto standar)
                            </div>
                          )}
                        </div>

                        {/* Video Tutorial */}
                        <div className="bg-[#1c0d03]/40 border border-[#D4A853]/15 rounded-xl p-3 text-center space-y-2 flex flex-col justify-between">
                          <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold">
                            <Video size={14} /> Video Tutorial Kerja
                          </div>
                          {sop.videoUrl ? (
                            <div className="space-y-1 bg-black/10 p-2 rounded-lg text-center flex-1 flex flex-col justify-center">
                              <p className="text-[10.5px] font-mono text-amber-100/50 truncate max-w-[180px] mx-auto">{sop.videoUrl}</p>
                              <a
                                href={sop.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-[#2a1a0b] hover:bg-amber-500/10 p-2.5 outline outline-amber-500/10 text-amber-200 rounded-lg text-[10.5px] transition flex items-center justify-center gap-1 mt-2 font-mono font-medium"
                              >
                                <Video size={12} className="text-[#D4A853]" /> Putar Video Tutorial ↗
                              </a>
                            </div>
                          ) : (
                            <div className="py-6 font-mono text-[10px] text-amber-100/20 italic bg-black/10 rounded-lg flex-1 flex items-center justify-center">
                              (Belum diunggah video tutorial)
                            </div>
                          )}
                        </div>

                        {/* Supporting Document */}
                        <div className="bg-[#1c0d03]/40 border border-[#D4A853]/15 rounded-xl p-3 text-center space-y-2 flex flex-col justify-between">
                          <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold">
                            <FileText size={14} /> Dokumen Pendukung (PDF/DOCX)
                          </div>
                          {sop.docUrl ? (
                            <div className="space-y-1 bg-black/10 p-2 rounded-lg text-center flex-1 flex flex-col justify-center">
                              <p className="text-[10.5px] font-mono text-amber-100/50 truncate max-w-[180px] mx-auto">{sop.docUrl}</p>
                              <a
                                href={sop.docUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-amber-500 hover:bg-amber-600 p-2.5 text-amber-950 font-bold rounded-lg text-[10.5px] transition flex items-center justify-center gap-1 mt-2"
                              >
                                <Download size={12} /> Unduh Berkas Panduan
                              </a>
                            </div>
                          ) : (
                            <div className="py-6 font-mono text-[10px] text-amber-150/20 italic bg-black/10 rounded-lg flex-1 flex items-center justify-center">
                              (Tidak ada lampiran dokumen)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Version Control Tracker */}
                    <div className="space-y-2 bg-[#2d1201]/30 p-3.5 border border-amber-500/5 rounded-2xl">
                      <h5 className="font-serif text-[11px] text-amber-300/80 uppercase font-bold tracking-wider flex items-center gap-1.5 border-b border-amber-500/5 pb-1">
                        <History size={13} /> Riwayat Perubahan &amp; Versi Control (History Logs)
                      </h5>
                      <div className="divide-y divide-amber-500/5 max-h-48 overflow-y-auto custom-scrollbar">
                        {sop.history && sop.history.length > 0 ? (
                          sop.history.map((hist) => (
                            <div key={hist.id} className="py-2.5 flex items-start gap-2 text-[10.5px]">
                              <span className="bg-amber-500/10 text-amber-400 font-mono text-[9px] px-1.5 py-0.2 rounded font-bold border border-amber-500/10 mt-0.5">
                                {hist.version}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-amber-100 italic leading-snug">"{hist.notes}"</p>
                                <div className="text-[9px] text-[#D4A853]/60 font-mono mt-0.5 flex gap-2">
                                  <span>Editor: <strong>{hist.editor}</strong></span>
                                  <span>•</span>
                                  <span>Tanggal: <strong>{hist.date}</strong></span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] font-mono italic text-amber-100/20 py-2">Tidak ada ulasan log perubahan. Edisi inisial.</p>
                        )}
                      </div>
                    </div>

                    {/* Management Action Rows */}
                    {isManagerOrOwner && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-amber-500/5 justify-end">
                        <button
                          onClick={() => openEditModal(sop)}
                          className="bg-amber-400/10 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-400 text-amber-300 hover:text-amber-100 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1 min-h-[44px]"
                        >
                          <Edit size={12} /> Edit Versi SOP
                        </button>

                        <button
                          onClick={() => handleDuplicateSop(sop)}
                          className="bg-[#291708] hover:bg-amber-500/10 border border-amber-500/10 text-amber-200 hover:text-amber-50 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1 min-h-[44px]"
                        >
                          <Copy size={12} /> Duplikasi SOP
                        </button>

                        <button
                          onClick={() => handleArchiveToggle(sop)}
                          className="bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 text-amber-100 px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition active:scale-95 flex items-center gap-1 min-h-[44px]"
                        >
                          <Archive size={12} className="text-amber-400" /> 
                          {sop.isArchived ? "Kembalikan ke Aktif" : "Simpan ke Arsip"}
                        </button>

                        <button
                          onClick={() => handleDeleteSop(sop.id)}
                          className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono font-bold cursor-pointer transition active:scale-95 ml-auto min-h-[44px] flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Hapus Permanen
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. FORM MODAL (Edit or Create SOP) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#140b04] border border-[#D4A853]/20 rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl text-amber-50 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-3">
              <h4 className="font-serif text-sm sm:text-base font-bold text-amber-200">
                {editingSop ? `✏️Edit SOP Versi: ${editingSop.title}` : "➕ Terbitkan Standarisasi Kerja Baru"}
              </h4>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-amber-100/50 hover:text-amber-100 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSop} className="space-y-4">
              
              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Judul Panduan SOP</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pembuatan Kyoto Matcha Latte Premium"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Kategori Bidang Tugas</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SopCategory)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-amber-950">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Version & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5 md:col-span-1">
                  <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Penerbitan Versi</label>
                  <input
                    type="text"
                    required
                    placeholder="V1.0"
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    className="bg-black/30 border border-amber-500/15 focus:border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-50 font-mono outline-none w-full text-center"
                  />
                </div>

                {editingSop && (
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] text-amber-300 font-mono font-bold">Catatan Perubahan Versi (Amandemen)</label>
                    <input
                      type="text"
                      required={!!editingSop}
                      placeholder="Contoh: Mengubah gilingan espresso, penyesuaian rasio V60"
                      value={changeNotes}
                      onChange={(e) => setChangeNotes(e.target.value)}
                      className="bg-black/30 border border-amber-500/15 focus:border-amber-400 rounded-xl p-2.5 text-xs text-amber-50 outline-none w-full"
                    />
                  </div>
                )}
              </div>

              {/* Steps (Dynamic Input fields) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-amber-150/40 uppercase font-mono font-bold">Langkah-langkah Prosedur Kerja ({formSteps.length})</label>
                  <button
                    type="button"
                    onClick={addStepField}
                    className="text-[10.5px] font-mono text-amber-300 hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Tambah Langkah
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {formSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="w-6 shrink-0 text-center font-mono text-xs text-amber-500/60 font-bold">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder="Misal: Siapkan gelas saji, bilas kopi..."
                        value={step}
                        onChange={(e) => handleStepChange(idx, e.target.value)}
                        className="bg-black/25 border border-amber-500/10 focus:border-[#D4A853] rounded-xl p-2 text-xs text-amber-50 outline-none flex-1"
                      />
                      {formSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStepField(idx)}
                          className="text-red-400 hover:text-red-300 px-1 text-xs"
                          title="Hapus langkah"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-3 p-3.5 bg-black/30 rounded-2xl border border-amber-500/5">
                <label className="text-[10px] text-amber-150/45 uppercase font-mono tracking-wider font-extrabold block">📌 media &amp; Berkas Lampiran Pendukung (Minimal 1 Disukai):</label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Photo attachment link */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] font-mono text-amber-200">Foto Referensi</span>
                      <button type="button" onClick={simulatePhotoUpload} className="text-[8px] text-[#D4A853]/70 hover:underline font-mono">⚡ Contoh Unggah</button>
                    </div>
                    <input
                      type="text"
                      placeholder="https://link_atau_dataURL..."
                      value={referencePhoto}
                      onChange={(e) => setReferencePhoto(e.target.value)}
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-[10px] text-amber-100 outline-none font-mono"
                    />
                  </div>

                  {/* Video attachment link */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] font-mono text-amber-200">Video Tutorial</span>
                      <button type="button" onClick={simulateVideoLink} className="text-[8px] text-[#D4A853]/70 hover:underline font-mono">⚡ Contoh Unggah</button>
                    </div>
                    <input
                      type="text"
                      placeholder="https://youtube_atau_MP4..."
                      value={videoTutorial}
                      onChange={(e) => setVideoTutorial(e.target.value)}
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-[10px] text-amber-100 outline-none font-mono"
                    />
                  </div>

                  {/* Document attachment link */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] font-mono text-amber-200">Dokumen Pendukung</span>
                      <button type="button" onClick={simulateDocLink} className="text-[8px] text-[#D4A853]/70 hover:underline font-mono">⚡ Contoh Unggah</button>
                    </div>
                    <input
                      type="text"
                      placeholder="https://cloud_sheet_atau_PDF..."
                      value={supportingDoc}
                      onChange={(e) => setSupportingDoc(e.target.value)}
                      className="bg-black/40 border border-amber-500/10 rounded-lg p-2 text-[10px] text-amber-100 outline-none font-mono"
                    />
                  </div>

                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-black/20 hover:bg-black/40 border border-amber-500/10 px-5 py-3 rounded-xl text-xs font-semibold cursor-pointer text-amber-100 min-h-[44px]"
                >
                  ✕ Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#D4A853] hover:bg-[#bfa03e] px-7 py-3 rounded-xl text-xs font-serif font-black text-amber-950 transition cursor-pointer min-h-[44px]"
                >
                  💾 {editingSop ? "Save & Terbitkan Versi Baru" : "Terbitkan Standardisasi SOP"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
