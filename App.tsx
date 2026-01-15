
import React, { useState, useMemo, useEffect } from 'react';
import ApiKeyModal from './components/ApiKeyModal';
import SettingsButton from './components/SettingsButton';
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <header className="w-full max-w-4xl mb-6 text-center">
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
  <SettingsButton onClick={() => setShowSettings(true)} />
</div>
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
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Đang soạn thảo...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Tạo bài báo
                  </>
                )}
              </button>
            </div>
          </section>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-medium">{error.message}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-4">
          {article ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full min-h-[800px]">
              <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase">
                      Bản thảo: {topic}
                    </span>
                    <button onClick={reset} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-red-500" title="Làm mới hoàn toàn">
                      <RotateCw size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase mr-2">
                      <Edit3 size={12} /> Sửa trực tiếp bài báo
                    </div>
                    <button onClick={copyToClipboard} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs font-bold hover:border-indigo-300 hover:text-indigo-600">
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 mb-1">
                    <Wand2 size={16} className="text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">Công cụ tinh chỉnh AI</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 flex items-center gap-1">
                        <MessageSquarePlus size={10} /> Thêm yêu cầu riêng
                      </label>
                      <input 
                        type="text"
                        value={rewriteCustomInstruction}
                        onChange={(e) => setRewriteCustomInstruction(e.target.value)}
                        placeholder="Vd: Nhấn mạnh vào công tác khen thưởng..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      />
                    </div>
                    
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 flex items-center gap-1">
                        <Ruler size={10} /> Độ dài mong muốn
                      </label>
                      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {['shorter', 'equivalent', 'longer'].map((l) => (
                          <button 
                            key={l}
                            onClick={() => setRewriteTargetLength(l as any)}
                            className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${rewriteTargetLength === l ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}
                          >
                            {l === 'shorter' ? 'NGẮN HƠN' : l === 'longer' ? 'DÀI HƠN' : 'MẶC ĐỊNH'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <button 
                        onClick={handleRewriteAction}
                        disabled={isRewriting}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100"
                      >
                        {isRewriting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                        THỰC HIỆN
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col p-8 lg:p-12 relative">
                {isRewriting && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in duration-200 rounded-b-2xl">
                    <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
                    <p className="text-indigo-900 font-bold uppercase tracking-widest text-xs">Đang tinh chỉnh bài viết...</p>
                  </div>
                )}
                
                <textarea 
                  value={editableFullText}
                  onChange={(e) => setEditableFullText(e.target.value)}
                  className="w-full flex-1 bg-transparent focus:outline-none focus:ring-0 resize-none text-slate-800 text-lg leading-relaxed font-medium"
                  placeholder="Tiêu đề và Nội dung bài báo..."
                  spellCheck={false}
                />

                {article.tags && article.tags.length > 0 && (
                  <div className="pt-8 border-t border-slate-100 flex flex-wrap gap-2 mt-4">
                    {article.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                        #{tag.replace(/\s+/g, '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl text-slate-400 p-12 text-center shadow-sm">
              <div className="bg-indigo-50 p-8 rounded-full mb-6 text-indigo-200">
                <FileText size={64} />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-2">Chưa có bản thảo</h3>
              <p className="max-w-sm mx-auto text-slate-400 leading-relaxed font-medium">
                Sử dụng nút <span className="text-indigo-500 font-bold uppercase">Tinh chỉnh</span> dữ liệu thô, sau đó nhấn <span className="text-indigo-500 font-bold uppercase">Tạo bài báo</span> để bắt đầu.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* About App Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-sm">Thông tin chi tiết</h3>
                  <p className="text-[10px] text-slate-400 font-bold">PHIÊN BẢN 0.1.11 BETA - 11/01/2026</p>
                </div>
              </div>
              <button onClick={() => setIsAboutModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-indigo-600 border-b border-indigo-50 pb-2">
                  <ShieldCheck size={22} />
                  <h4 className="font-extrabold text-sm uppercase tracking-widest">Ban chỉ đạo thiết kế, xây dựng ứng dụng</h4>
                </div>
                <div className="pl-9 space-y-2">
                  <p className="text-slate-800 font-bold text-xl leading-none">Trung tá Nguyễn Minh Khoa</p>
                  <p className="text-slate-500 text-sm leading-relaxed italic">
                    Phó Trưởng phòng Tham mưu, Phó Trưởng ban thường trực Ban Biên tập Cổng thông tin điện tử Công an thành phố Hải Phòng.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-indigo-600 border-b border-indigo-50 pb-2">
                  <User size={22} />
                  <h4 className="font-extrabold text-sm uppercase tracking-widest">Tác giả & Chịu trách nhiệm kỹ thuật</h4>
                </div>
                <div className="pl-9 space-y-4">
                  <div className="space-y-2">
                    <p className="text-slate-800 font-bold text-xl leading-none">Đại úy Phạm Quang Phúc</p>
                    <p className="text-slate-500 text-sm leading-relaxed italic">
                      Cán bộ Trung tâm thông tin chỉ huy, Phòng Tham mưu Công an thành phố Hải Phòng.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-100 shadow-sm transition-all hover:bg-indigo-100">
                    <Phone size={16} /> 
                    <span>Sđt/Zalo: <span className="text-indigo-900 font-black">0943.080.938</span></span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-indigo-600 border-b border-indigo-50 pb-2">
                  <ListChecks size={22} />
                  <h4 className="font-extrabold text-sm uppercase tracking-widest">Các tính năng cốt lõi</h4>
                </div>
                <div className="pl-9 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Chuyển đổi dữ liệu thô thành bài báo chuyên nghiệp ngay lập tức.",
                    "Chuẩn hóa định dạng thời gian báo chí HHhMM' và DD/MM/YYYY.",
                    "Xử lý định dạng ngày tháng thông minh (Tháng 3-9 không có số 0).",
                    "Viết tắt tên nạn nhân/đối tượng theo quy định an ninh trật tự.",
                    "Giải mã từ điển viết tắt nghiệp vụ tự động thông qua nút Tinh chỉnh.",
                    "Trình soạn thảo trực tiếp cho phép sửa bài báo ngay trên giao diện.",
                    "Công cụ tinh chỉnh AI giúp viết lại bài báo dài hơn, ngắn hơn hoặc theo yêu cầu riêng.",
                    "Cấu trúc chuyên biệt cho chủ đề Hội nghị/Hoạt động và Vụ việc an ninh."
                  ].map((func, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
                      <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                      <span className="text-xs text-slate-600 font-semibold leading-relaxed">{func}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 border-l-4 border-l-amber-400 shadow-sm">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <Award size={18} />
                  <span className="font-bold text-sm uppercase">Góp ý & Phát triển</span>
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  Kính mời các đồng chí tích cực đóng góp ý kiến để hoàn thiện ứng dụng. Mọi phản hồi xin gửi về thông tin liên lạc ở trên. Danh sách các cá nhân đóng góp có giá trị sẽ được cập nhật vinh danh tại đây trong các phiên bản tới.
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsAboutModalOpen(false)} 
                className="px-12 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dictionary Modal */}
      {isDictModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-sm">
                <BookOpen size={18} className="text-indigo-600" /> Quản lý từ điển viết tắt
              </h3>
              <button onClick={() => setIsDictModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="VT (vd: Cax)" value={newShort} onChange={(e) => setNewShort(e.target.value)} className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                  <input placeholder="Thay bằng" value={newFull} onChange={(e) => setNewFull(e.target.value)} className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                </div>
                <button onClick={addDictItem} disabled={!newShort.trim() || !newFull.trim()} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:bg-indigo-200">
                  <Plus size={18} /> Thêm vào từ điển
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {dictionary.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex flex-col">
                      <span className="font-bold text-indigo-600 text-sm">{item.short}</span>
                      <span className="text-slate-500 text-xs">{item.full}</span>
                    </div>
                    <button onClick={() => deleteDictItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsDictModalOpen(false)} className="px-8 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900">Đóng</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        textarea:focus { outline: none; }
      `}</style>
<ApiKeyModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default App;
