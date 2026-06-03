import * as React from "react";
import { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleResetState = () => {
    try {
      localStorage.removeItem("coffeeops_db_state");
      localStorage.removeItem("coffeeops_currentUser");
      window.location.reload();
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleExportBackup = () => {
    try {
      const stateObj = localStorage.getItem("coffeeops_db_state");
      if (!stateObj) {
        alert("Tidak ada data state lokal yang tersimpan di browser saat ini.");
        return;
      }
      
      const blob = new Blob([stateObj], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `LeParla_State_Backup_Crash_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Gagal mengekspor state: " + e.message);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050200] text-amber-100 flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-2xl bg-[#120501] border-2 border-red-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl shadow-red-500/5 relative overflow-hidden">
            
            {/* Top red warning bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-4xl mb-2 relative">
                <span className="animate-pulse">🚨</span>
                <span className="absolute -bottom-1 -right-1 text-lg">⚠️</span>
              </div>
              
              <h1 className="font-serif text-3xl font-extrabold tracking-tight text-red-400">
                Sistem Terhenti (Application Crash)
              </h1>
              
              <p className="text-xs text-amber-100/60 max-w-md mx-auto leading-relaxed">
                Oops, sistem Le Parla Café mendeteksi adanya kegagalan komponen (runtime crash). Jangan panik, data transaksi Anda aman dan kami telah menyiapkan sistem mitigasi pemulihan di bawah ini.
              </p>
            </div>

            {/* Error Detail Console */}
            <div className="bg-black/60 border border-red-500/15 rounded-2xl p-4 space-y-2 text-left font-mono">
              <div className="flex justify-between items-center border-b border-red-500/5 pb-2 mb-2">
                <span className="text-[10px] text-red-400 font-bold tracking-wider">FATAL EXCEPTION TRACE:</span>
                <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Runtime Error
                </span>
              </div>
              
              <div className="overflow-y-auto max-h-[160px] text-[9.5px] text-[#FF9999] leading-relaxed whitespace-pre-wrap select-text select-all">
                <p className="font-bold text-xs text-red-300">
                  {this.state.error?.name || "Error"}: {this.state.error?.message || "Kesalahan tidak diketahui"}
                </p>
                {this.state.error?.stack && (
                  <pre className="mt-2 text-[9px] opacity-75 overflow-x-auto whitespace-pre selection:bg-red-500 selection:text-white">
                    {this.state.error.stack}
                  </pre>
                )}
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-[8.5px] opacity-60 text-orange-200 overflow-x-auto whitespace-pre border-t border-red-500/5 pt-2 select-all">
                    Component Stack:
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </div>

            {/* Recovery Recommendations & Dynamic Controls */}
            <div className="w-full bg-[#1a0501] border border-red-500/10 rounded-2xl p-4 text-left space-y-3">
              <span className="text-[10px] text-orange-300/60 uppercase tracking-widest font-bold block">💡 Rekomendasi Solusi &amp; Tindakan Penyelamatan:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-amber-100/75 leading-relaxed">
                <div className="space-y-1.5 border-r border-[#D4A853]/5 pr-2">
                  <p className="font-bold text-[#D4A853]">1. Muat Ulang Halaman (Reload)</p>
                  <p className="text-[10px] text-amber-100/55">Cobalah untuk memulai kembali aplikasi tanpa membuang data tersimpan di memori browser Anda.</p>
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold text-[#D4A853]">2. Reset State Sistem</p>
                  <p className="text-[10px] text-amber-100/55">Jika aplikasi masih crash, kemungkinan data terkorup. Silakan lakukan hard-reset ke setelan awal pabrik.</p>
                </div>
              </div>
            </div>

            {/* Trigger actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={this.handleReload}
                className="py-3 px-4 bg-gradient-to-r from-amber-500 to-[#D4A853] hover:brightness-110 text-amber-950 font-extrabold text-xs rounded-xl shadow-lg active:scale-95 duration-150 cursor-pointer flex items-center justify-center gap-1.5"
              >
                🔄 Segarkan Halaman
              </button>

              <button
                onClick={this.handleExportBackup}
                className="py-3 px-4 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-200 text-xs font-bold rounded-xl active:scale-95 duration-150 cursor-pointer flex items-center justify-center gap-1.5"
              >
                💾 Amankan Backup (JSON)
              </button>

              <button
                onClick={() => {
                  if (confirm("⚠️ Peringatan: Reset State akan menghapus semua data transaksi lokal, login kru, master bahan yang belum dicadangkan, dan mengembalikan sistem ke performa default asli. Apakah Anda yakin?")) {
                    this.handleResetState();
                  }
                }}
                className="py-3 px-4 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-extrabold text-xs rounded-xl active:scale-95 duration-150 cursor-pointer flex items-center justify-center gap-1.5"
              >
                🔥 Setel Ulang Pabrik
              </button>
            </div>
            
            <div className="text-center text-[9px] text-amber-100/25">
              ⚜️ Le Parla Café Smart Portal Recovery Engine • Security &amp; Integrity Verified ⚜️
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
