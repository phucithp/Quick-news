import React, { useState, useEffect } from 'react';
import { 
  Newspaper, Send, Loader2, Copy, Check, RefreshCcw, FileText, 
  Sparkles, Settings2, Wand2, History 
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1. SETTINGS BUTTON COMPONENT (NHÚNG TRỰC TIẾP) ---
const SettingsButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'inline-flex', alignItems: 'center', color: '#374151' }}>
    <Settings2 size={24} />
  </button>
);

// --- 2. API KEY MODAL COMPONENT (NHÚNG TRỰC TIẾP) ---
const ApiKeyModal = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
  const [key, setKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
      <div style={{ width: 400, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: 8, fontWeight: 'bold' }}>Cài đặt API Key</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Lấy key tại Google AI Studio</p>
        <input 
          type="password" value={key} onChange={(e) => setKey(e.target.value)}
          placeholder="Dán AIza... vào đây"
          style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8, border: 'none' }}>Đóng</button>
          <button onClick={() => { localStorage.setItem('GEMINI_API_KEY', key); onClose(); }} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 8, border: 'none' }}>Lưu lại</button>
        </div>
      </div>
    </div>
  );
};

// --- 3. MAIN APP ---
export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(!localStorage.getItem('GEMINI_API_KEY'));
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAI = async () => {
    const key = localStorage.getItem('GEMINI_API_KEY');
    if (!key) return setIsModalOpen(true);
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Viết lại bản tin sau cho chuyên nghiệp, chuẩn hóa giờ HHhMM', ngày DD/MM/YYYY: ${input}`;
      const res = await model.generateContent(prompt);
      setResult(res.response.text());
    } catch (e) {
      alert("Lỗi AI hoặc Key không đúng, thưa thủ trưởng!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>
      <ApiKeyModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <nav style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold' }}>
          <Newspaper color="#2563eb" /> QUICK NEWS
        </div>
        <SettingsButton onClick={() => setIsModalOpen(true)} />
      </nav>
      <main style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <h4 style={{ marginBottom: 12 }}>Dữ liệu thô</h4>
          <textarea 
            style={{ width: '100%', height: 300, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', resize: 'none' }}
            value={input} onChange={(e) => setInput(e.target.value)}
          />
          <button 
            onClick={handleAI} disabled={loading}
            style={{ width: '100%', marginTop: 16, padding: 14, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? "ĐANG XỬ LÝ..." : "XỬ LÝ TIN NHANH"}
          </button>
        </div>
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <h4 style={{ marginBottom: 12 }}>Kết quả</h4>
          <div style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{result || "Đợi lệnh từ thủ trưởng..."}</div>
        </div>
      </main>
    </div>
  );
}
