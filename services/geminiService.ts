import { GoogleGenAI, Type } from "@google/genai";
import { ArticleTopic, ArticleLength, ArticleConfig, GeneratedArticle } from "../types";

const getAPIKey = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('GEMINI_API_KEY');
      if (stored && stored.trim() !== '') return stored.trim();
    }
  } catch (e) {
    // ignore localStorage errors
  }

  // fallback to env injected at build time (if any)
  // keep supporting process.env.API_KEY for backwards compatibility
  // @ts-ignore
  return (process && (process.env?.API_KEY || process.env?.GEMINI_API_KEY)) || null;
};

const getAIInstance = () => {
  const apiKey = getAPIKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

export const refineBrief = async (content: string): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `
    Nhiệm vụ: Chuẩn hóa dữ liệu thô báo chí.
    YÊU CẦU NGHIÊM NGẶT: 
    - KHÔNG TỰ Ý THÊM THÔNG TIN MỚI.
    - KHÔNG VIẾT THÀNH BÀI BÁO HOÀN CHỈNH.
    - CHỈ CHỈNH SỬA: Chính tả, viết hoa tên riêng/địa danh, và định dạng thời gian.
    - TRÌNH BÀY LẠI: Cho rõ ràng, mạch lạc, dễ đọc nhưng vẫn giữ nguyên tính chất "dữ liệu thô".

    Quy tắc định dạng thời gian:
    1. Giờ: Định dạng HHhMM' (Ví dụ: 08h30', 23h05', 00h01').
    2. Ngày tháng: 
       - Định dạng chung: DD/MM/YYYY.
       - RIÊNG các tháng từ tháng 3 đến tháng 9: KHÔNG được có số 0 ở trước (Ví dụ: 20/3/2026, 15/9/2026).
       - Các tháng 1, 2, 10, 11, 12 giữ nguyên số 0 nếu cần (Ví dụ: 05/01/2026, 31/12/2025).
      
    Văn bản cần xử lý: "${content}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || content;
  } catch (error) {
    return content;
  }
};

export const rewriteArticle = async (
  currentArticle: GeneratedArticle,
  targetLength: 'equivalent' | 'longer' | 'shorter',
  customInstruction?: string
): Promise<GeneratedArticle> => {
  const ai = getAIInstance();
  const lengthPrompt = {
    equivalent: "giữ nguyên độ dài tương đương nhưng diễn đạt khác đi, trôi chảy hơn",
    longer: "viết dài hơn, chi tiết hơn, mở rộng các tình tiết và bối cảnh (nếu phù hợp)",
    shorter: "viết ngắn gọn lại, súc tích hơn, chỉ giữ lại các thông tin cốt lõi nhất"
  };

  const userRequest = customInstruction?.trim() 
    ? `YÊU CẦU BỔ SUNG TỪ NGƯỜI DÙNG: "${customInstruction}". Hãy ưu tiên thực hiện yêu cầu này trong khi vẫn đảm bảo cấu trúc bài báo.` 
    : "";

  const prompt = `
    Bạn là biên tập viên báo chí cao cấp. Hãy viết lại bài báo sau đây.
    YÊU CẦU VỀ ĐỘ DÀI: ${lengthPrompt[targetLength]}.
    ${userRequest}
    
    LƯU Ý QUAN TRỌNG: Chỉ bao gồm Tiêu đề và Nội dung, KHÔNG viết phần Sa-pô (tóm tắt).
    
    Nội dung hiện tại:
    Tiêu đề: ${currentArticle.title}
    Nội dung: ${currentArticle.content}

    QUY TẮC BẮT BUỘC:
    - Giờ: Định dạng HHhMM' (Ví dụ: 08h30').
    - Ngày: Định dạng DD/MM/YYYY (Tháng 3-9 không có số 0 ở trước).
    - Giữ nguyên các thông tin thực tế, tên riêng và địa danh.

    Định dạng trả về JSON:
    {
      "title": "Tiêu đề mới",
      "content": "Nội dung mới",
      "tags": ["tag1", "tag2"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "content", "tags"]
        }
      }
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    return JSON.parse(response.text) as GeneratedArticle;
  } catch (error) {
    throw new Error("REWRITE_FAILED");
  }
};

export const generateArticle = async (
  topic: ArticleTopic,
  length: ArticleLength,
  briefContent: string,
  configOptions: ArticleConfig
): Promise<GeneratedArticle> => {
  const ai = getAIInstance();
  
  try {
    const lengthInstructions = {
      [ArticleLength.SHORT]: "ngắn gọn, tập trung thông tin (khoảng 200 từ)",
      [ArticleLength.MEDIUM]: "đầy đủ, mạch lạc (khoảng 400-500 từ)",
      [ArticleLength.LONG]: "chi tiết, phân tích kỹ (khoảng 800 từ)"
    };

    const timeFormattingRules = `
      QUY TẮC VIẾT THỜI GIAN (BẮT BUỘC):
      - Giờ: Định dạng HHhMM' (Ví dụ: 07h15', 19h00', 00h01').
      - Ngày: Định dạng DD/MM/YYYY. 
      - LƯU Ý: Các tháng từ 3 đến 9 KHÔNG viết số 0 ở trước (Ví dụ: 12/3/2026, 05/9/2026). Các tháng còn lại (1, 2, 10, 11, 12) viết bình thường.
    `;

    const incidentStructure = `
        CẤU TRÚC VỤ VIỆC (QUY TẮC NGHIÊM NGẶT):
        1. KHÔNG VIẾT SA-PÔ: Chỉ tạo tiêu đề và đi thẳng vào nội dung chi tiết.
        2. KHÔNG SUY DIỄN: Tuyệt đối không tự ý thêm các chi tiết không có trong dữ liệu gốc.
        3. DÒNG THỜI GIAN: Trình bày theo trình tự (Thời điểm -> Diễn biến -> Tiếp nhận tin báo -> Điều tra -> Kết quả).
        PHONG CÁCH: Tin an ninh trật tự, khách quan.
    `;

    let specificStructure = "";
    
    if (topic === ArticleTopic.CONFERENCE) {
      specificStructure = `
        CẤU TRÚC HỘI NGHỊ/HOẠT ĐỘNG:
        1. KHÔNG VIẾT SA-PÔ: Chỉ tạo tiêu đề và đi thẳng vào nội dung.
        2. Tiêu đề: [Đơn vị] + [Hội nghị/Hoạt động].
        3. Mở đầu: Thời gian, địa điểm, thành phần đại biểu.
        4. Nội dung: Các báo cáo, con số, tình hình công tác.
        5. Kết luận & Khen thưởng: Ý kiến chỉ đạo và danh sách khen thưởng.
      `;
    } else if (topic === ArticleTopic.INCIDENT) {
      specificStructure = incidentStructure;
    } else if (topic === ArticleTopic.OTHER) {
      if (configOptions.customTemplate?.trim()) {
        specificStructure = `DỰA TRÊN MẪU YÊU CẦU: ${configOptions.customTemplate}. KHÔNG VIẾT SA-PÔ.`;
      } else {
        specificStructure = `SỬ DỤNG CẤU TRÚC VỤ VIỆC (KHÔNG SA-PÔ): ${incidentStructure}`;
      }
    }

    let abbreviationRules = "";
    if (configOptions.abbreviateVictim) {
      abbreviationRules += "- Viết tắt tên NẠN NHÂN (vd: 'Phạm Văn D' -> 'P.V.D').\n";
    }
    if (configOptions.abbreviateSubject) {
      abbreviationRules += "- Viết tắt tên ĐỐI TƯỢNG (vd: 'Nguyễn Thế Anh' -> 'N.T.A').\n";
    }

    const prompt = `
      Bạn là biên tập viên báo chí chuyên nghiệp. Viết bài báo dựa trên dữ liệu sau:
      Chủ đề: ${topic}
      Độ dài: ${lengthInstructions[length]}
      Dữ liệu: ${briefContent}

      QUY TẮC CHUNG:
      - KHÔNG ĐƯỢC CÓ PHẦN SA-PÔ (TÓM TẮT). Chỉ tạo Tiêu đề và Nội dung bài viết.
      ${timeFormattingRules}
      ${abbreviationRules || "- Giữ nguyên tên đầy đủ các cá nhân."}
      ${specificStructure}

      Định dạng trả về JSON:
      {
        "title": "Tiêu đề",
        "content": "Nội dung bài viết",
        "tags": ["tag1", "tag2"]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "content", "tags"]
        }
      }
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    return JSON.parse(response.text) as GeneratedArticle;
  } catch (error: any) {
    throw new Error("UNKNOWN_ERROR");
  }
};
