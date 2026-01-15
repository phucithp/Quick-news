import React, { useState, useMemo, useEffect } from 'react';
import ApiKeyModal from './components/ApiKeyModal';
import SettingsButton from './components/SettingsButton';
import { ArticleTopic, ArticleLength, GeneratedArticle, ArticleConfig } from './types';
import { generateArticle, refineBrief, rewriteArticle } from './services/geminiService';
import { 
  Newspaper, Send, Loader2, Copy, Check, RefreshCcw, Layout, FileText, AlertCircle,
  Plus, Trash2, X, Sparkles, Settings2, Wand2, Edit3, History
} from 'lucide-react';

function App() {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');

  // Kiểm tra key ngay khi hành quân (vào app)
  useEffect(() => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
    }
  }, [apiKey]);

  // Các Logic State khác của thủ trưởng giữ nguyên...
  const [topic, setTopic] = useState<ArticleTopic>(ArticleTopic.INCIDENT);
  const [length, setLength] = useState<ArticleLength>(ArticleLength.MEDIUM);
  const [briefContent, setBriefContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);

  const handleGenerate = async () => {
    if (!briefContent.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateArticle(topic, length, briefContent, { abbreviateVictim: false, abbreviateSubject: false });
      setGeneratedArticle(result);
    } catch (error) {
      if (error instanceof Error && error.message === "API_KEY_MISSING") {
        setIsApiKeyModalOpen(true);
      } else {
        alert("Có lỗi xảy ra, thưa thủ trưởng!");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <ApiKeyModal 
        open={isApiKeyModalOpen} 
        onClose={() => {
          setIsApiKeyModalOpen(false);
          setApiKey(localStorage.getItem('GEMINI_API_KEY') || '');
        }} 
      />
      
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Newspaper className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">QUICK NEWS</span>
          </div>
          <SettingsButton onClick={() => setIsApiKeyModalOpen(true)} />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cột Trái: Nhập liệu */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <label className="block text-sm font-semibold mb-2">Dữ liệu thô</label>
              <textarea 
                className="w-100 w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Dán nội dung vào đây..."
                value={briefContent}
                onChange={(e) => setBriefContent(e.target.value)}
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                XỬ LÝ TIN NHANH
              </button>
            </div>
          </div>

          {/* Cột Phải: Kết quả */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
            {generatedArticle ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800">{generatedArticle.title}</h2>
                <div className="prose max-w-none text-slate-600 leading-relaxed">
                  {generatedArticle.content}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <FileText size={48} strokeWidth={1} />
                <p className="mt-2">Chưa có bản tin nào được tạo</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
