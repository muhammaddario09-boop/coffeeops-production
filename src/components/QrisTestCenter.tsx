import React, { useState, useEffect } from "react";
import { CoffeeOpsState, User, MidtransTransaction, MidtransLog } from "../types";
import { motion } from "motion/react";
import {
  QrCode,
  Smartphone,
  CheckCircle,
  Clock,
  XCircle,
  Volume2,
  Terminal,
  Activity,
  FileCode,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  UserCheck,
  Flame,
  Briefcase
} from "lucide-react";

interface QrisTestCenterProps {
  state: CoffeeOpsState;
  syncState: (updatedState: CoffeeOpsState) => Promise<void>;
  triggerToast: (message: string) => void;
  currentUser: User | null;
}

export default function QrisTestCenter({
  state,
  syncState,
  triggerToast,
  currentUser
}: QrisTestCenterProps) {
  // Main Selected Order Context
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<number>(45000);
  const [customCustomer, setCustomCustomer] = useState<string>("Budi Santoso");

  // Charge response and active QR
  const [charging, setCharging] = useState(false);
  const [activeQrString, setActiveQrString] = useState<string>("");
  const [activeQrUrl, setActiveQrUrl] = useState<string>("");
  const [activeSnapToken, setActiveSnapToken] = useState<string>("");
  const [activeTxData, setActiveTxData] = useState<MidtransTransaction | null>(null);

  // Status of simulator
  const [simulationStatus, setSimulationStatus] = useState<"idle" | "pending" | "scanning" | "paid" | "expired" | "failed">("idle");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [callbackResponse, setCallbackResponse] = useState<any>(null);

  const transactions = state.midtrans_transactions || [];
  const logs = state.midtrans_logs || [];
  const midtransSettings = state.midtrans_settings;

  // Track state of current selected order dynamically
  useEffect(() => {
    if (selectedOrderId) {
      const found = transactions.find(t => t.orderId === selectedOrderId);
      if (found) {
        setActiveTxData(found);
        if (found.status === "settlement") setSimulationStatus("paid");
        else if (found.status === "expire") setSimulationStatus("expired");
        else if (found.status === "deny" || found.status === "failure") setSimulationStatus("failed");
        else if (found.status === "pending") setSimulationStatus("pending");
      }
    }
  }, [selectedOrderId, transactions]);

  const addManualLogValue = async (message: string, type: "api" | "webhook" | "simulation" | "debug", status: "success" | "failed" | "info" | "warning", payload?: any, response?: any) => {
    const nextLogs: MidtransLog[] = [
      {
        id: "LOG-" + Date.now().toString(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        type,
        message,
        payload: payload ? JSON.stringify(payload, null, 2) : undefined,
        response: response ? JSON.stringify(response, null, 2) : undefined,
        status
      },
      ...logs
    ].slice(0, 50);

    await syncState({
      ...state,
      midtrans_logs: nextLogs
    });
  };

  const handleGenerateQris = async () => {
    setCharging(true);
    setApiResponse(null);
    setCallbackResponse(null);
    setSimulationStatus("idle");

    const orderId = selectedOrderId || "CO-QRIS-" + Math.floor(100000 + Math.random() * 900000);
    const billingAmount = selectedOrderId ? (transactions.find(t => t.orderId === selectedOrderId)?.amount || customAmount) : customAmount;
    const customer = selectedOrderId ? (transactions.find(t => t.orderId === selectedOrderId)?.customerName || customCustomer) : customCustomer;

    addManualLogValue(
      `Memulai inisiasi Dynamic QRIS Core API untuk Order ID: ${orderId} senilai Rp ${billingAmount.toLocaleString("id-ID")}`,
      "api",
      "info"
    );

    try {
      const response = await fetch("/api/midtrans/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: billingAmount,
          customerName: customer,
          serverKey: midtransSettings?.serverKey
        })
      });

      const data = await response.json();
      setApiResponse(data);

      if (response.ok && data.status === "success") {
        setActiveQrString(data.qrString || "gopay-qris-dummy-payload-verification-string");
        setActiveQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.qrString || "https://coffeeops.co")}`);
        setActiveSnapToken(data.snapToken || "");
        setSimulationStatus("pending");

        // Sync to state
        const exists = transactions.some(t => t.orderId === orderId);
        let nextTransactions = [...transactions];

        const newTx: MidtransTransaction = {
          orderId,
          amount: billingAmount,
          paymentType: "qris",
          status: "pending",
          qrString: data.qrString,
          qrUrl: data.qrUrl,
          snapToken: data.snapToken,
          createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
          updatedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
          customerName: customer
        };

        if (exists) {
          nextTransactions = nextTransactions.map(t => t.orderId === orderId ? newTx : t);
        } else {
          nextTransactions = [newTx, ...nextTransactions];
        }

        setSelectedOrderId(orderId);

        await syncState({
          ...state,
          midtrans_transactions: nextTransactions
        });

        triggerToast(`✓ QRIS Berhasil Digenerate untuk Order: ${orderId}`);
        addManualLogValue(
          `Sukses menggenerate QRIS. Menunggu Customer memindai kode QR.`,
          "api",
          "success",
          { orderId, gross_amount: billingAmount, payment_type: "qris" },
          data
        );
      } else {
        throw new Error(data.message || "Gagal inisiasi charge Core/Snap API");
      }
    } catch (err: any) {
      // offline simulator fallback:
      const mockQr = `00020101021226680011ID.CO.MIDTRANS.WWW01189360052001102987515204000053033605405450005802ID5913Le Parla Cafe6013Pangkalpinang61053311162070703A016304EE88`;
      const qrGenUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=1&data=${encodeURIComponent(mockQr)}`;
      
      setActiveQrString(mockQr);
      setActiveQrUrl(qrGenUrl);
      setSimulationStatus("pending");

      const exists = transactions.some(t => t.orderId === orderId);
      const mockTx: MidtransTransaction = {
        orderId,
        amount: billingAmount,
        paymentType: "qris",
        status: "pending",
        qrString: mockQr,
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
        customerName: customer
      };

      const updatedTxs = exists
        ? transactions.map(t => t.orderId === orderId ? mockTx : t)
        : [mockTx, ...transactions];

      setSelectedOrderId(orderId);

      await syncState({
        ...state,
        midtrans_transactions: updatedTxs
      });

      setApiResponse({
        status: "success",
        environment: "Simulator-Fallback",
        qrString: mockQr,
        message: "Offline Dynamic QRIS fallback generated successfully",
        actions: [
          { name: "generate-qr-code", method: "GET", url: qrGenUrl }
        ]
      });

      triggerToast("✓ QRIS Simulator Terpampang (Fallback Dev Mode)");
      addManualLogValue(
        `Dynamic QRIS (Simulator Fallback) berhasil digenerate untuk Order ${orderId}.`,
        "simulation",
        "success",
        { orderId, amount: billingAmount, customer }
      );
    } finally {
      setCharging(false);
    }
  };

  const handleSimulatePaymentState = async (nextStatus: "settlement" | "expire" | "deny") => {
    if (!selectedOrderId) {
      triggerToast("Generate QRIS terlebih dahulu untuk disimulasikan!");
      return;
    }

    setSimulationStatus("scanning");
    addManualLogValue(
      `Memulai penyiaran webhook simulasi untuk merubah status ke: ${nextStatus.toUpperCase()}`,
      "simulation",
      "info"
    );

    const billingAmount = transactions.find(t => t.orderId === selectedOrderId)?.amount || customAmount;
    const customer = transactions.find(t => t.orderId === selectedOrderId)?.customerName || customCustomer;

    const signatureKey = "VALIDATED_MOCK_SHA512_SIGNATURE_FOR_SIMULATION_KEY_MATCH";
    const payload = {
      transaction_time: new Date().toISOString().replace("T", " ").substring(0, 19),
      transaction_status: nextStatus,
      transaction_id: "mid-uuid-" + Math.floor(Math.random() * 900000),
      status_code: nextStatus === "settlement" ? "200" : "202",
      signature_key: signatureKey,
      payment_type: "qris",
      order_id: selectedOrderId,
      merchant_id: midtransSettings?.merchantId || "G110298751",
      gross_amount: billingAmount.toString(),
      fraud_status: "accept"
    };

    setTimeout(async () => {
      try {
        const response = await fetch("/api/midtrans/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        setCallbackResponse(data);

        // Update local status representation
        if (response.ok && data.status === "success") {
          setSimulationStatus(nextStatus === "settlement" ? "paid" : nextStatus === "expire" ? "expired" : "failed");
          triggerToast(`✓ Server memproses Callback Webhook: Order ${selectedOrderId} adalah ${nextStatus.toUpperCase()}`);
          addManualLogValue(
            `Kemitraan webhook callback Midtrans sukses diselesaikan. Status: ${nextStatus.toUpperCase()}`,
            "webhook",
            "success",
            payload,
            data
          );
        } else {
          throw new Error(data.message || "Validator Webhook ditolak");
        }
      } catch (err) {
        // client-side state update simulation
        const updated = transactions.map(t => {
          if (t.orderId === selectedOrderId) {
            return {
              ...t,
              status: nextStatus as any,
              updatedAt: new Date().toISOString().replace("T", " ").substring(0, 19)
            };
          }
          return t;
        });

        await syncState({
          ...state,
          midtrans_transactions: updated
        });

        setSimulationStatus(nextStatus === "settlement" ? "paid" : nextStatus === "expire" ? "expired" : "failed");
        setCallbackResponse({
          status: "success",
          message: "Internal simulated callback successfully dispatched and sync",
          orderId: selectedOrderId,
          nextStatus
        });

        triggerToast(`✓ Pembayaran order ${selectedOrderId} disimulasikan sebagai ${nextStatus.toUpperCase()}!`);
        addManualLogValue(
          `Offline status update simulator dispatched. New status: ${nextStatus.toUpperCase()}`,
          "webhook",
          "success",
          payload,
          { status: "success", info: "direct state mutation" }
        );
      }
    }, 1500); // 1.5 second scanning effect
  };

  const handleResetSession = () => {
    setSelectedOrderId("");
    setActiveQrString("");
    setActiveQrUrl("");
    setSimulationStatus("idle");
    setApiResponse(null);
    setCallbackResponse(null);
    setActiveTxData(null);
    triggerToast("Siri simulator direset.");
  };

  return (
    <div className="space-y-6" id="qris-test-center">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D4A853]/10 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-amber-100 flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 rounded-lg text-amber-400">⚡</span>
            QRIS Sandbox Test Center
          </h2>
          <p className="text-xs text-amber-200/50 mt-1 max-w-xl">
            Simulator pembayaran QRIS interaktif. Uji respon status lunas, expired, dan gagal secara instan di KDS kasir tanpa memakan biaya riil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {simulationStatus === "paid" && (
            <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-mono text-[10px] font-bold uppercase tracking-wider">
              Paid / Settlement
            </span>
          )}
          {simulationStatus === "pending" && (
            <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse">
              Waiting Scan
            </span>
          )}
          {simulationStatus === "expired" && (
            <span className="flex items-center gap-1 px-3 py-1 bg-zinc-500/10 text-zinc-400 border border-zinc-500/30 rounded font-mono text-[10px] font-bold uppercase tracking-wider">
              Expired
            </span>
          )}
          {simulationStatus === "failed" && (
            <span className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded font-mono text-[10px] font-bold uppercase tracking-wider">
              Failed payment
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT CARD: GENERATOR & SIMULATION BUTTONS */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#1c0d02]/80 backdrop-blur-md rounded-xl border border-[#D4A853]/20 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
              <h3 className="font-serif font-bold text-sm text-amber-100 uppercase tracking-wider flex items-center gap-2">
                <QrCode className="text-amber-400 h-4 w-4" />
                Dynamic QRIS Generator Panel
              </h3>
              <button
                type="button"
                onClick={handleResetSession}
                className="text-[10px] hover:underline font-mono text-[#D4A853] flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset Simulator
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* FORM FIELDS FOR PAYMENT */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] text-amber-200/60 font-mono uppercase mb-1 block">
                    Pilih Transaksi Aktif POS (Opsional)
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedOrderId(id);
                      const matchingTx = transactions.find(t => t.orderId === id);
                      if (matchingTx) {
                        setCustomAmount(matchingTx.amount);
                        setCustomCustomer(matchingTx.customerName || "Customer Link");
                      }
                    }}
                    className="w-full bg-[#100701] border border-white/10 rounded-lg px-3 py-2 text-stone-200 text-xs focus:ring-1 focus:ring-[#D4A853] focus:outline-none placeholder-amber-100/10"
                  >
                    <option value="">-- Buat Pembayaran Acak Baru --</option>
                    {transactions.filter(t => t.status === "pending").map((tx) => (
                      <option key={tx.orderId} value={tx.orderId}>
                        Order ({tx.orderId}) - Rp {tx.amount.toLocaleString("id-ID")} - {tx.customerName || "No Name"}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-amber-100/40 mt-1">
                    Jika tidak ada transaksi pending, Anda dapat membuat rincian manual di bawah ini.
                  </p>
                </div>

                {!selectedOrderId && (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] text-amber-200/60 font-mono uppercase mb-1 block">
                        Manual Amount (IDR)
                      </label>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#100701] border border-white/10 rounded-lg px-3 py-2 text-amber-100 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-200/60 font-mono uppercase mb-1 block">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={customCustomer}
                        onChange={(e) => setCustomCustomer(e.target.value)}
                        className="w-full bg-[#100701] border border-white/10 rounded-lg px-3 py-2 text-amber-100 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-white/5 space-y-2">
                  <button
                    type="button"
                    onClick={handleGenerateQris}
                    disabled={charging}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#D4A853] text-stone-950 font-bold text-xs hover:bg-amber-400 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <QrCode className="h-4 w-4" />
                    {charging ? "Mengenerate QRIS..." : "Generate Dynamic QRIS Sandbox"}
                  </button>
                </div>

                {simulationStatus !== "idle" && (
                  <div className="p-3 bg-black/45 rounded-lg border border-[#D4A853]/10 space-y-2 text-xs">
                    <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                      Kontrol Emulator Callback Client
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSimulatePaymentState("settlement")}
                        disabled={simulationStatus !== "pending"}
                        className="py-2 px-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] rounded hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-40"
                      >
                        SIMULATE PAID
                      </button>
                      <button
                        onClick={() => handleSimulatePaymentState("expire")}
                        disabled={simulationStatus !== "pending"}
                        className="py-2 px-1.5 bg-zinc-500/10 border border-zinc-500/30 text-zinc-400 font-extrabold text-[10px] rounded hover:bg-zinc-500/20 transition cursor-pointer disabled:opacity-40"
                      >
                        EXPIRED
                      </button>
                      <button
                        onClick={() => handleSimulatePaymentState("deny")}
                        disabled={simulationStatus !== "pending"}
                        className="py-2 px-1.5 bg-red-500/10 border border-red-500/30 text-red-400 font-extrabold text-[10px] rounded hover:bg-red-500/20 transition cursor-pointer disabled:opacity-40"
                      >
                        FAILED PAY
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* QRIS RENDERING FIELD */}
              <div className="flex flex-col items-center justify-center p-4 bg-black/45 rounded-xl border border-white/5 min-h-[250px] text-center">
                {simulationStatus === "idle" ? (
                  <div className="text-amber-100/25 space-y-2">
                    <QrCode className="h-14 w-14 mx-auto stroke-[1.25]" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A853]/40">Scan Code Idle</p>
                    <p className="text-[10px] max-w-[190px] mx-auto font-sans">Posisikan order lalu generate kode untuk menampilkan QRIS dinamis.</p>
                  </div>
                ) : simulationStatus === "scanning" ? (
                  <div className="space-y-4 animate-pulse">
                    <Smartphone className="h-12 w-12 text-amber-400 mx-auto animate-bounce" />
                    <p className="text-[11px] font-mono text-[#D4A853] uppercase tracking-widest">[ Customer Scanning Barcode ]</p>
                    <p className="text-[10px] text-amber-100/50 max-w-[190px] mx-auto font-sans">Simulasi proses baca payload string dan inisiasi callback webhook...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative p-2 bg-white rounded-lg inline-block w-48 h-48 border-4 border-stone-800 shadow">
                      {activeQrUrl ? (
                         <img src={activeQrUrl} alt="QRIS Code" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                         <div className="w-full h-full bg-stone-300 flex items-center justify-center text-stone-900 font-mono text-xs">QR GENERATOR</div>
                      )}
                      
                      {/* Success scan overlays */}
                      {simulationStatus === "paid" && (
                        <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center border border-emerald-500/40 rounded">
                          <CheckCircle className="h-10 w-10 text-emerald-400 animate-bounce" />
                          <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider mt-1">Paid / Settlement</span>
                        </div>
                      )}
                      {simulationStatus === "expired" && (
                        <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center border border-neutral-500/40 rounded">
                          <Clock className="h-10 w-10 text-stone-400" />
                          <span className="text-[11px] font-mono text-stone-400 font-bold uppercase tracking-wider mt-1">EXPIRED / TIMEOUT</span>
                        </div>
                      )}
                      {simulationStatus === "failed" && (
                        <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center border border-red-500/40 rounded">
                          <XCircle className="h-10 w-10 text-red-500 animate-pulse" />
                          <span className="text-[11px] font-mono text-red-400 font-bold uppercase tracking-wider mt-1">FAILED PAYMENT</span>
                        </div>
                      )}
                    </div>
                    {/* QR String info */}
                    <div className="max-w-[200px] truncate-2-lines bg-stone-900/40 border border-white/5 p-1.5 rounded text-[8.5px] font-mono text-amber-100/45 select-all">
                      {activeQrString}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* RESPONSE AND CALLBACK PAYLOAD VIEWER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* VIEW A: API RESPONSE VIEWER */}
            <div className="bg-[#1c0d02]/85 rounded-xl border border-[#D4A853]/15 p-4 flex flex-col h-[280px]">
              <span className="text-[9px] font-mono font-bold text-[#D4A853] uppercase tracking-wider block border-b border-white/5 pb-1.5 mb-2.5">
                API Response Viewer (POST /charge)
              </span>
              <div className="flex-1 bg-black/90 p-3 rounded border border-white/5 font-mono text-[9.5px] text-cyan-400 overflow-y-auto custom-scrollbar select-all">
                {apiResponse ? (
                  <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-amber-100/20 uppercase tracking-widest text-[9px] font-bold">
                    No API Calls Triggered
                  </div>
                )}
              </div>
            </div>

            {/* VIEW B: WEBHOOK PAYLOAD VIEWER */}
            <div className="bg-[#1c0d02]/85 rounded-xl border border-[#D4A853]/15 p-4 flex flex-col h-[280px]">
              <span className="text-[9px] font-mono font-bold text-[#D4A853] uppercase tracking-wider block border-b border-white/5 pb-1.5 mb-2.5">
                Incoming Callback Payload (Webhook Verification)
              </span>
              <div className="flex-1 bg-black/90 p-3 rounded border border-white/5 font-mono text-[9.5px] text-emerald-400 overflow-y-auto custom-scrollbar select-all">
                {callbackResponse ? (
                  <pre>{JSON.stringify(callbackResponse, null, 2)}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-amber-100/20 uppercase tracking-widest text-[9px] font-bold">
                    No Callback Dispatched
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT CARD: PHONES SCANNERS & LIVE LOGS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PHONE PREVIEW MOCKUP FOR CUSTOMER SCANNING */}
          <div className="bg-[#100701] rounded-2xl border border-[#D4A853]/25 p-5 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
            <span className="text-[8px] font-mono text-amber-400/30 uppercase tracking-widest block absolute top-3 left-4">
              Virtual Phone Mockup
            </span>
            <div className="w-52 h-[104px] border-l border-t border-white/5 rounded duration-300 transform scale-110 mb-6 bg-stone-900/40 p-4 border border-white/5 rounded-3xl relative flex flex-col justify-between">
              <div className="w-2.5 h-2.5 bg-stone-750 rounded-full mx-auto mb-1"></div>
              <div className="flex-1 flex flex-col items-center justify-center gap-1">
                {simulationStatus === "scanning" ? (
                  <>
                    <Smartphone className="h-6 w-6 text-amber-400 animate-spin" />
                    <span className="text-[8.5px] text-amber-300 font-mono">SCANNING VERIFICATION...</span>
                  </>
                ) : simulationStatus === "paid" ? (
                  <>
                    <CheckCircle className="h-7 w-7 text-emerald-500 animate-bounce" />
                    <span className="text-[8.5px] text-emerald-400 font-mono font-bold uppercase">PAYMENT SUCCESS!</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="h-6 w-6 text-stone-500" />
                    <span className="text-[8px] text-stone-400 font-sans">Ready to Scan QRIS...</span>
                  </>
                )}
              </div>
              <div className="w-16 h-1 bg-stone-750 pb-1 rounded-full mx-auto mt-1"></div>
            </div>
            
            <div className="space-y-1.5 max-w-[200px]">
              <h4 className="text-xs font-serif font-semibold text-amber-100">Customer Checkout Hub</h4>
              <p className="text-[10px] text-stone-400 leading-normal">
                Uji coba checkout KDS otomatis. Begitu tombol "PAID" di klik, webhook server akan divalidasi dan secara live merubah laci operasional kasir.
              </p>
            </div>
          </div>

          {/* REALTIME SYSTEM CALLBACK MONITOR */}
          <div className="bg-[#1c0d02]/85 rounded-xl border border-[#D4A853]/15 p-4 flex flex-col h-[280px]">
            <span className="text-[9px] font-mono font-bold text-[#D4A853] uppercase tracking-wider block border-b border-white/5 pb-1.5 mb-2">
              Callback Webhook Monitor
            </span>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {logs.filter(l => l.type === "webhook").length === 0 ? (
                <div className="h-full flex items-center justify-center text-amber-100/10 uppercase tracking-widest text-[9px] font-bold">
                  Monitor Idle
                </div>
              ) : (
                logs.filter(l => l.type === "webhook").map((log) => {
                  const stateClass = log.status === "success" ? "border-emerald-500/20 text-emerald-400" : "border-red-500/20 text-red-400";
                  return (
                    <div
                      key={log.id}
                      className={`p-2 bg-black/60 rounded border text-[9.5px] font-mono space-y-1 ${stateClass}`}
                    >
                      <div className="flex justify-between items-center text-[8px] font-bold">
                        <span>Incoming Webhook</span>
                        <span className="text-stone-500">{log.timestamp.substring(11, 19)}</span>
                      </div>
                      <p className="text-amber-100/80 leading-snug">{log.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
