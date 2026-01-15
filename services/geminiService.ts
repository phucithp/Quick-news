import { GoogleGenerativeAI } from "@google/generative-ai";
import { ArticleTopic, ArticleLength, GeneratedArticle, ArticleConfig } from '../types';

/**
 * TRẠM KIỂM SOÁT API KEY
 * Lấy đạn (Key) trực tiếp từ kho lưu trữ của trình duyệt
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
 * Đã điều chỉnh về model gemini-1.5-flash ổn định nhất
 */
const getModel = (instruction?: string) => {
  const genAI = new GoogleGenerativeAI(getApiKey());
  return genAI.getGenerativeModel({
    model: "gemini-3-flash-preview", 
    systemInstruction: instruction,
  });
};

/**
 * 1. CHIẾN DỊCH: TẠO BÀI BÁO MỚI
 * Đã thiết lập Prompt chuyên biệt cho Hội nghị và Vụ việc
 */
export const generateArticle = async (
  topic: ArticleTopic,
  length: ArticleLength,
  brief: string,
  config: ArticleConfig
): Promise<GeneratedArticle> => {
  
  const instruction = `Bạn là biên tập viên báo chí chuyên nghiệp của lực lượng Công an nhân dân. 
  NHIỆM VỤ NGHIÊM NGẶT:
  - KHÔNG có tên tác giả ở cuối bài.
  - KHÔNG viết đoạn Sa-pô (vào thẳng nội dung sau tiêu đề).
  - Tên nạn nhân/đối tượng: ${config.abbreviateVictim ? "PHẢI viết tắt tên nạn nhân." : ""} ${config.abbreviateSubject ? "PHẢI viết tắt tên đối tượng." : ""}
  
  CẤU TRÚC BẮT BUỘC THEO CHỦ ĐỀ:
  
  1. Nếu là chủ đề "Hội nghị" hoặc "Hoạt động":
     - Tiêu đề: Định dạng [Tên đơn vị] + [Tên hoạt động/Hội nghị].
     - Nội dung: Viết theo trình tự: Thời gian, địa điểm -> Thành phần tham dự -> Nội dung chi tiết -> Kết quả -> Ý kiến chỉ đạo của lãnh đạo (nếu có) -> Khen thưởng (nếu có).
  
  2. Nếu là chủ đề "Vụ việc":
     - Tiêu đề: Định dạng "Thông tin về vụ việc [Tên vụ việc]...".
     - Nội dung: Viết theo dòng thời gian (Timeline) từ lúc bắt đầu xảy ra đến khi kết thúc xử lý.

  Yêu cầu về độ dài: ${length}.
  Mẫu bổ sung: ${config.customTemplate || "Phong cách trang trọng, chính xác."}`;

  const model = getModel(instruction);
  const prompt = `Dựa trên dữ liệu thô sau, hãy viết tiêu đề và nội dung bài báo hoàn chỉnh: ${brief}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const lines = text.split('\n').filter(l => l.trim() !== '');
  // Dòng đầu tiên làm tiêu đề, các dòng còn lại là nội dung
  const title = lines[0].replace(/Title:|Tiêu đề:|\*/g, '').trim();
  const content = lines.slice(1).join('\n\n').trim();

  return {
    title,
    content,
    tags: [topic, "AnNinhTratTu", "CongAnNhanDan"]
  };
};

/**
 * 2. CHIẾN DỊCH: TINH CHỈNH DỮ LIỆU THÔ (REFINE)
 */
export const refineBrief = async (text: string): Promise<string> => {
  const instruction = `Bạn là chuyên gia soát lỗi văn bản nghiệp vụ. 
  - Chuẩn hóa thời gian: HHhMM' (VD: 07h30').
  - Chuẩn hóa ngày tháng: DD/MM/YYYY.
  - Sửa lỗi chính tả, giữ nguyên tình tiết vụ việc.`;

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
  
  const instruction = `Bạn là biên tập viên cao cấp. Hãy viết lại bài báo nhưng giữ đúng quy tắc: 
  KHÔNG sa-pô, KHÔNG tên tác giả, giữ đúng cấu trúc tiêu đề và nội dung theo dòng thời gian hoặc trình tự hội nghị.
  Độ dài mới: ${targetLength}. Bổ sung: ${customInstruction}`;

  const model = getModel(instruction);
  const prompt = `Tiêu đề cũ: ${article.title}\nNội dung cũ: ${article.content}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const lines = text.split('\n').filter(l => l.trim() !== '');
  return {
    ...article,
    title: lines[0].replace(/Title:|Tiêu đề:|\*/g, '').trim(),
    content: lines.slice(1).join('\n\n').trim()
  };
};
