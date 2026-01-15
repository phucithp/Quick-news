import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ArticleTopic, ArticleLength, ArticleConfig, GeneratedArticle } from "../types";

const getAPIKey = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('GEMINI_API_KEY');
      if (stored && stored.trim() !== '') return stored.trim();
    }
  } catch (e) {
    return null;
  }
  return null;
};

const getModel = (modelName: string, schema?: any) => {
  const apiKey = getAPIKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: schema ? {
      responseMimeType: "application/json",
      responseSchema: schema,
    } : undefined,
  });
};

export const refineBrief = async (content: string): Promise<string> => {
  try {
    const model = getModel("gemini-3.0-flash");
    const prompt = `Nhiệm vụ: Chuẩn hóa dữ liệu thô báo chí. KHÔNG THÊM THÔNG TIN. 
    Định dạng Giờ: HHhMM'. Ngày: DD/MM/YYYY (tháng 3-9 không số 0 trước).
    Văn bản: "${content}"`;
    
    const result = await model.generateContent(prompt);
    return result.response.text() || content;
  } catch (error) {
    return content;
  }
};

const articleSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    content: { type: SchemaType.STRING },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
  },
  required: ["title", "content", "tags"]
};

export const generateArticle = async (
  topic: ArticleTopic,
  length: ArticleLength,
  briefContent: string,
  configOptions: ArticleConfig
): Promise<GeneratedArticle> => {
  const model = getModel("gemini-3.0-flash", articleSchema);
  const prompt = `Viết bài báo chủ đề ${topic}, độ dài ${length}. Dữ liệu: ${briefContent}. 
  KHÔNG SA-PÔ. Giờ HHhMM', Ngày DD/MM/YYYY (tháng 3-9 không số 0 trước).`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};

export const rewriteArticle = async (
  currentArticle: GeneratedArticle,
  targetLength: 'equivalent' | 'longer' | 'shorter',
  customInstruction?: string
): Promise<GeneratedArticle> => {
  const model = getModel("gemini-3.0-flash", articleSchema);
  const prompt = `Viết lại bài báo: ${currentArticle.title}. Yêu cầu: ${targetLength}. ${customInstruction || ""}`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};
