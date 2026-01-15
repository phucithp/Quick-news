
import React, { useState, useMemo, useEffect } from 'react';
import { ArticleTopic, ArticleLength, GeneratedArticle, ArticleConfig } from './types';
import { generateArticle, refineBrief, rewriteArticle } from './services/geminiService';
import { 
  Newspaper, 
  Send, 
  Loader2, 
  Copy, 
  Check, 
  RefreshCcw,
  Layout,
  FileText,
  AlertCircle,
  Ruler,
  UserX,
  UserCheck,
  BookOpen,
  Plus,
  Trash2,
  X,
  Info,
  Sparkles,
  Eye,
  EyeOff,
  Settings2,
  Phone,
  ArrowRightLeft,
  ChevronUp,
  ChevronDown,
  RotateCw,
  Info as InfoIcon,
  ShieldCheck,
  User,
  Zap,
  ChevronRight,
  MessageSquarePlus,
  Wand2,
  Edit3,
  Award,
  ListChecks,
  History,
  Info as InfoLucide
} from 'lucide-react';

interface Abbreviation {
  id: string;
  short: string;
  full: string;
}

interface RefineChange {
  original: string;
  fixed: string;
}

const App: React.FC = () => {
  const [topic, setTopic] = useState<ArticleTopic>(ArticleTopic.INCIDENT);
  const [length, setLength] = useState<ArticleLength>(ArticleLength.SHORT);
  const [abbreviateVictim, setAbbreviateVictim] = useState<boolean>(false);
  const [abbreviateSubject, setAbbreviateSubject] = useState<boolean>(false);
  const [customTemplate, setCustomTemplate] = useState<string>('');
  const [brief, setBrief] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [rewriteCustomInstruction, setRewriteCustomInstruction] = useState<string>('');
  const [rewriteTargetLength, setRewriteTargetLength] = useState<'equivalent' | 'longer' | 'shorter'>('equivalent');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [article, setArticle] = useState<GeneratedArticle | null>(null);
  const [editableFullText, setEditableFullText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [refineChanges, setRefineChanges] = useState<RefineChange[]>([]);
  const [showRefineResults, setShowRefineResults] = useState<boolean>(false);
const [apiKey, setApiKey] = useState<string>(localStorage.getItem("USER_GEMINI_KEY") || '');
const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(!localStorage.getItem("USER_GEMINI_KEY"));
const [tempKey, setTempKey] = useState<string>('');
  const [dictionary, setDictionary] = useState<Abbreviation[]>([
    { id: '1', short: 'Cax', full: 'Công an xã' },
    { id: '2', short: 'Cap', full: 'Công an phường' },
    { id: '3', short: 'Antt', full: 'an ninh trật tự' },
    { id: '4', short: 'Ancs', full: 'tham gia bảo vệ an ninh trật tự tại cơ sở' },
    { id: '5', short: 'CSĐT', full: 'Cảnh sát điều tra' },
    { id: '6', short: 'Anđt', full: 'An ninh điều tra' },
    { id: '7', short: 'Gđ', full: 'Giám đốc' },
    { id: '8', short: 'Sn', full: 'sinh năm' },
    { id: '9', short: 'Hp', full: 'Hải Phòng' },
    { id: '10', short: 'Ptp', full: 'Phó Trưởng phòng' },
    { id: '11', short: 'Catp', full: 'Công an thành phố' },
    { id: '12', short: 'Pgđ', full: 'Phó Giám đốc' }
  ]);
  
  const [isDictModalOpen, setIsDictModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [newShort, setNewShort] = useState<string>('');
  const [newFull, setNewFull] = useState<string>('');

  useEffect(() => {
    if (article) {
      setEditableFullText(`${article.title}\n\n${article.content}`);
    } else {
      setEditableFullText('');
    }
  }, [article]);

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const config: ArticleConfig = { abbreviateVictim, abbreviateSubject, customTemplate };
      const result = await generateArticle(topic, length, brief, config);
      setArticle(result);
    } catch (err: any) {
      setError({ code: 'UNKNOWN', message: 'Đã xảy ra lỗi khi tạo bài viết.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewriteAction = async () => {
    if (!article) return;
    setIsRewriting(true);
    setError(null);
    try {
      const firstLineEnd = editableFullText.indexOf('\n');
      const title = firstLineEnd !== -1 ? editableFullText.substring(0, firstLineEnd).trim() : editableFullText;
      const content = firstLineEnd !== -1 ? editableFullText.substring(firstLineEnd).trim() : "";
      
      const result = await rewriteArticle({ ...article, title, content }, rewriteTargetLength, rewriteCustomInstruction);
      setArticle(result);
      setRewriteCustomInstruction('');
    } catch (err: any) {
      setError({ code: 'REWRITE_ERROR', message: 'Đã xảy ra lỗi khi viết lại bài báo.' });
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRefineAndAbbreviate = async () => {
    if (!brief.trim()) return;
    setIsRefining(true);
    setRefineChanges([]);
    setShowRefineResults(false);
    
    try {
      const originalBrief = brief;
      let tempText = brief;
      const localChanges: RefineChange[] = [];

      // 1. Dictionary replacement (Manual tracking)
      const sortedDict = [...dictionary].sort((a, b) => b.short.length - a.short.length);
      sortedDict.forEach(item => {
        const regex = new RegExp(`\\b${item.short}\\b`, 'gi');
        const matches = tempText.match(regex);
        if (matches) {
          matches.forEach(m => {
             if (!localChanges.some(c => c.original === m)) {
               localChanges.push({ original: m, fixed: item.full });
             }
          });
          tempText = tempText.replace(regex, item.full);
        }
      });

      // 2. AI Refinement for dates, times, and spelling
      const refinedResult = await refineBrief(tempText);
      
      // Comparison logic to find AI changes (simple word-based diff for the report)
      const oldWords = tempText.split(/\s+/);
      const newWords = refinedResult.split(/\s+/);
      
      // Basic detection of changed terms (dates/hours)
      const timeDateRegex = /(\d{2}h\d{2}'|\d{1,2}\/\d{1,2}\/\d{4})/g;
      const oldTimeMatches = tempText.match(timeDateRegex) || [];
      const newTimeMatches = refinedResult.match(timeDateRegex) || [];
      
      newTimeMatches.forEach((fixed, i) => {
        if (oldTimeMatches[i] !== fixed) {
          localChanges.push({ original: oldTimeMatches[i] || "Định dạng cũ", fixed });
        }
      });

      setBrief(refinedResult);
      setRefineChanges(localChanges);
      if (localChanges.length > 0) {
        setShowRefineResults(true);
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi xử lý văn bản.');
    } finally {
      setIsRefining(false);
    }
  };

  const addDictItem = () => {
    if (!newShort.trim() || !newFull.trim()) return;
    setDictionary([...dictionary, { id: Date.now().toString(), short: newShort.trim(), full: newFull.trim() }]);
    setNewShort('');
    setNewFull('');
  };

  const deleteDictItem = (id: string) => {
    setDictionary(dictionary.filter(item => item.id !== id));
  };

  const copyToClipboard = () => {
    if (!editableFullText) return;
    navigator.clipboard.writeText(editableFullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setArticle(null);
    setBrief('');
    setError(null);
    setRefineChanges([]);
    setShowRefineResults(false);
    setCustomTemplate('');
  };
  // --- HỆ THỐNG QUẢN LÝ KEY CỦA TRUNG SĨ GEMINI ---
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(!localStorage.getItem("USER_GEMINI_KEY"));
  const [tempKey, setTempKey] = useState<string>('');

  const handleSaveKey = () => {
    const trimmedKey = tempKey.trim();
    if (trimmedKey.startsWith("AIza")) {
      localStorage.setItem("USER_GEMINI_KEY", trimmedKey);
      setIsKeyModalOpen(false);
      // Tải lại trang để đảm bảo các Service nhận Key mới nhất
      window.location.reload(); 
    } else {
      alert("Báo cáo: Định dạng Key không chính xác. Phải bắt đầu bằng AIza!");
    }
  };

  const handleClearKey = () => {
    if(confirm("Thủ trưởng muốn xóa Key hiện tại và đăng xuất?")) {
      localStorage.removeItem("USER_GEMINI_KEY");
      window.location.reload();
    }
  };
  // --- KẾT THÚC PHẦN XỬ LÝ KEY —
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <header className="w-full max-w-4xl mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
            <Newspaper size={32} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Hỗ trợ viết <span className="text-indigo-600">tin nhanh</span>
          </h1>
        </div>
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-slate-500 text-lg font-medium">
            Công cụ chuyên dụng cho tin bài Hội nghị và Vụ việc an ninh trật tự.
          </p>
          <div className="pt-4 border-t border-slate-200 mt-4 flex flex-col items-center gap-1">
            <p className="text-indigo-700 font-bold text-sm">
              Một sản phẩm của Cổng TTĐT CATP Hải Phòng.
            </p>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
              LƯU Ý: KIỂM TRA KỸ CÀNG MỌI NỘI DUNG DO AI TẠO RA TRƯỚC KHI SỬ DỤNG
            </p>
          </div>
        </div>
      </header>

      <div className="w-full max-w-5xl mb-8 flex justify-center">
        <button 
          onClick={() => setIsAboutModalOpen(true)}
          className="group relative flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-500 p-1 pr-6 rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm text-white group-hover:rotate-12 transition-transform">
            <InfoIcon size={24} />
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-extrabold uppercase tracking-widest leading-none mb-1">Thông tin ứng dụng & liên hệ</p>
            <p className="text-indigo-100 text-[10px] font-medium flex items-center gap-1">
              Phiên bản 0.1.11 beta <ChevronRight size={10} />
            </p>
          </div>
        </button>
      </div>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-800">
              <Layout size={20} className="text-indigo-600" />
              Cấu hình bài viết
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chủ đề bài viết</label>
                <select 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as ArticleTopic)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm font-medium"
                >
                  {Object.values(ArticleTopic).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {topic === ArticleTopic.OTHER && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Settings2 size={14} className="text-indigo-600" /> Mẫu bài viết (tùy chọn)
                  </label>
                  <textarea 
                    value={customTemplate}
                    onChange={(e) => setCustomTemplate(e.target.value)}
                    placeholder="Nhập yêu cầu về cấu trúc..."
                    className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none text-xs leading-relaxed"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Ruler size={14} /> Độ dài ban đầu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(ArticleLength).map(l => (
                    <button
                      key={l}
                      onClick={() => setLength(l)}
                      className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                        length === l 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-sm font-medium text-slate-700">Định danh cá nhân</label>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                    <UserX size={14} className="text-slate-400" /> Viết tắt tên nạn nhân
                  </span>
                  <button 
                    onClick={() => setAbbreviateVictim(!abbreviateVictim)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${abbreviateVictim ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${abbreviateVictim ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                    <UserCheck size={14} className="text-slate-400" /> Viết tắt tên đối tượng
                  </span>
                  <button 
                    onClick={() => setAbbreviateSubject(!abbreviateSubject)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${abbreviateSubject ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${abbreviateSubject ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Dữ liệu thô</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleRefineAndAbbreviate}
                      disabled={isRefining || !brief.trim()}
                      className="text-[10px] flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-bold transition-all disabled:opacity-50 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100"
                    >
                      {isRefining ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      TINH CHỈNH
                    </button>
                    <button 
                      onClick={() => setIsDictModalOpen(true)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Quản lý từ điển"
                    >
                      <BookOpen size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="relative group">
                  <textarea 
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Nhập diễn biến sự việc hoặc nội dung hội nghị chi tiết tại đây..."
                    className="w-full h-96 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all resize-none text-base leading-relaxed font-medium text-slate-800 shadow-inner"
                  />
                </div>

                {showRefineResults && refineChanges.length > 0 && (
                  <div className="mt-3 animate-in slide-in-from-top-2 duration-300 bg-white border border-emerald-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between bg-emerald-50 px-4 py-2 border-b border-emerald-100">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <History size={14} className="text-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Danh sách từ đã sửa</span>
                      </div>
                      <button 
                        onClick={() => setShowRefineResults(false)}
                        className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="p-4 space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">
                        <span>Gốc</span>
                        <span>Đã sửa</span>
                      </div>
                      {refineChanges.map((change, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-4 items-center animate-in fade-in slide-in-from-left-2 duration-200">
                          <span className="text-[11px] text-red-400 line-through truncate font-medium bg-red-50/50 px-2 py-1 rounded-lg border border-red-50">{change.original}</span>
                          <span className="text-[11px] text-emerald-600 font-bold truncate bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-50 flex items-center gap-1.5">
                            <Check size={10} /> {change.fixed}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                       <InfoLucide size={10} className="text-slate-400" />
                       <span className="text-[9px] text-slate-500 font-medium italic">Đã đồng bộ chính tả, ngày tháng & từ điển.</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !brief.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 uppercase tracking-wide text-sm"
              >
                {isGeneratin
