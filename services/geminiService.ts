import { GoogleGenerativeAI } from "@google/generative-ai";
import { ArticleTopic, ArticleLength, GeneratedArticle, ArticleConfig } from '../types';

/**
 * TRẠM KIỂM SOÁT API KEY
 * Lấy đạn (Key) trực tiếp từ kho lưu trữ của trình duyệt người dùng
 */
const getApiKey = (): string => {
  const key = localStorage.getItem("USER_GEMINI_KEY");
  if (!key) {
    throw new Error("API_KEY_MISSING: Vui lòng nhập Key tại giao diện.");
  }
  return key;
};

/**
 * HÀM KHỞI TẠO INSTANCE AI
 */
const getModel = (instruction?: string) => {
  const genAI = new GoogleGenerativeAI(getApiKey());
  return genAI.getGenerativeModel({
    model: "gemini-3.0-flash",
    systemInstruction: instruction,
  });
};

/**
 * 1. CHIẾN DỊCH: TẠO BÀI BÁO MỚI
 */
export const generateArticle = async (
  topic: ArticleTopic,
  length: ArticleLength,
  brief: string,
  config: ArticleConfig
): Promise<GeneratedArticle> => {
  
  const instruction = `Bạn là một biên tập viên báo chí chuyên nghiệp của Công an nhân dân. 
  Hãy viết bài báo về chủ đề: ${topic}. 
  Độ dài yêu cầu: ${length}.
  Yêu cầu đặc biệt: ${config.abbreviateVictim ? "Viết tắt tên nạn nhân." : ""} ${config.abbreviateSubject ? "Viết tắt tên đối tượng." : ""}
  Mẫu cấu trúc: ${config.customTemplate || "Theo chuẩn tin tức báo chí hiện đại."}`;

  const model = getModel(instruction);
  const prompt = `Dựa trên dữ liệu thô sau, hãy viết tiêu đề và nội dung bài báo: ${brief}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Tách tiêu đề và nội dung (Giả định dòng đầu là tiêu đề)
  const lines = text.split('\n').filter(l => l.trim() !== '');
  return {
    title: lines[0].replace(/Title:|Tiêu đề:/g, '').trim(),
    content: lines.slice(1).join('\n\n').trim(),
    tags: [topic, "AnNinhTratTu", "HaiPhong"]
  };
};

/**
 * 2. CHIẾN DỊCH: TINH CHỈNH DỮ LIỆU THÔ (REFINE)
 * Chuẩn hóa ngày tháng, giờ giấc và lỗi chính tả
 */
export const refineBrief = async (text: string): Promise<string> => {
  const instruction = `Bạn là chuyên gia soát lỗi văn bản. 
  Hãy chuẩn hóa định dạng thời gian thành: HHhMM' (ví dụ 08h30') và ngày tháng thành: DD/MM/YYYY. 
  Sửa lỗi chính tả nhưng GIỮ NGUYÊN nội dung gốc.`;

  const model = getModel(instruction);
  const result = await model.generateContent(text);
  const response = await result.response;
  return response.text().trim();
};

/**
 * 3. CHIẾN DỊCH: VIẾT LẠI BÀI BÁO (REWRITE)
 */
export const rewriteArticle = async (
  article: GeneratedArticle,
  targetLength: 'equivalent' | 'longer' | 'shorter',
  customInstruction: string
): Promise<GeneratedArticle> => {
  
  const instruction = `Bạn là biên tập viên cao cấp. Hãy viết lại bài báo sau.
  Yêu cầu độ dài: ${targetLength}. 
  Yêu cầu bổ sung: ${customInstruction || "Giữ nguyên ý chính, diễn đạt mượt mà hơn."}`;

  const model = getModel(instruction);
  const prompt = `Tiêu đề cũ: ${article.title}\nNội dung cũ: ${article.content}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const lines = text.split('\n').filter(l => l.trim() !== '');
  return {
    ...article,
    title: lines[0].replace(/Title:|Tiêu đề:/g, '').trim(),
    content: lines.slice(1).join('\n\n').trim()
  };
};
