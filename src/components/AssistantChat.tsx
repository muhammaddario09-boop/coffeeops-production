import React, { useState, useRef, useEffect } from "react";

interface Message {
  sender: "user" | "ai";
  text: string;
}

interface AssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
}

export default function AssistantChat({ isOpen, onClose, brandName }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: `Halo! Saya adalah **Asisten AI CoffeeOps** Anda. Saya dapat membantu menganalisis stok kritis harian, memberikan ide menekan waste (susu/kopi), membantu membuat purchase request, atau menganalisis laporan penjualan ${brandName}. Ada yang ingin Anda tanyakan seputar operasional hari ini?`
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const newUserMessage: Message = { sender: "user", text: trimmed };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          chatHistory: messages.slice(-10) // Send last 10 messages for context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Maaf, terjadi kendala saat menghubungi server AI. Pastikan server berjalan dan API key Anda valid." }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Maaf, koneksi ke server AI terganggu." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage(inputValue);
    }
  };

  const quickPrompts = [
    "Cek bahan kritis harian",
    "Analisa waste & kerugian",
    "Bagaimana mengurangi waste susu?",
    "Ide menu dari stok sisa"
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
      {/* Click outside to close wrapper */}
      <div className="flex-1" onClick={onClose} />
      
      {/* Drawer */}
      <div className="w-full max-w-md bg-[#1e0c02] border-l border-[#D4A853]/25 h-full flex flex-col justify-between shadow-2xl animate-slideLeft text-amber-50">
        
        {/* Header */}
        <div className="p-4 border-b border-[#D4A853]/15 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h4 className="font-serif font-bold text-sm text-purple-200">Asisten AI CoffeeOps</h4>
              <p className="text-[10px] text-amber-100/40 uppercase tracking-widest font-mono">Real-time Advisor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#FAF0E6]/5 hover:bg-[#FAF0E6]/10 text-amber-200 flex items-center justify-center cursor-pointer text-lg font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Message body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, index) => {
            const isUser = msg.sender === "user";
            return (
              <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                    isUser
                      ? "bg-amber-600/20 text-amber-100 rounded-tr-none border border-amber-500/10"
                      : "bg-[#2a1200] text-amber-100/90 rounded-tl-none border border-purple-500/10"
                  }`}
                >
                  {/* Simplistic markdown formatter */}
                  <div className="whitespace-pre-wrap">
                    {msg.text.split("**").map((part, pIdx) => {
                      return pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-amber-300">{part}</strong> : part;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#2a1200]/50 text-amber-200/50 rounded-2xl rounded-tl-none p-3 text-xs border border-purple-500/5 flex items-center gap-2 font-medium">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300" />
                <span>Memikirkan data operasional...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts & Form Footer */}
        <div className="p-4 border-t border-[#D4A853]/15 space-y-3 bg-black/10">
          {/* Quick suggestions if chat is empty or fresh */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            {quickPrompts.map((p, pIdx) => (
              <button
                key={pIdx}
                onClick={() => sendMessage(p)}
                className="text-[10px] bg-purple-950/20 hover:bg-purple-950/45 border border-purple-500/20 text-purple-200 py-1 px-3 rounded-full cursor-pointer transition"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tanya asisten operasional..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-[#FAF0E6]/5 border border-[#D4A853]/15 focus:border-[#D4A853]/40 rounded-xl px-4 py-2.5 text-xs text-amber-100 placeholder-amber-100/20 outline-none transition"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-600 font-bold px-4 rounded-xl text-xs text-amber-950 transition duration-200 flex items-center justify-center cursor-pointer disabled:opacity-40"
            >
              Kirim
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
