import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WeightEntry } from "../types";

const geminiModelName = "gemini-3-flash-preview";

// ============================================================================
// 开发者配置区域
// ============================================================================
// [修改说明]
// 使用 import.meta.env.VITE_DEEPSEEK_API_KEY 读取环境变量。
// 这样 Key 不会出现在代码仓库中，而是由部署平台（Zeabur/Vercel）注入。
const DEVELOPER_DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ""; 

// Gemini Proxy
const DEVELOPER_GEMINI_PROXY = ""; 

// --- DeepSeek Helper ---
const callDeepSeek = async (apiKey: string, prompt: string, jsonMode: boolean = true) => {
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful nutrition and fitness assistant. Always return JSON if requested." },
          { role: "user", content: prompt }
        ],
        stream: false,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" }
      })
    });

    if (!response.ok) {
       const err = await response.text();
       throw new Error(`DeepSeek API Error: ${err}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return jsonMode ? JSON.parse(content) : content;
  } catch (e) {
    console.error("DeepSeek Call Error", e);
    throw e;
  }
};

// --- Gemini Helper ---
const getGeminiAI = (baseUrl?: string) => {
  const options: any = { 
    apiKey: process.env.API_KEY
  };
  if (baseUrl) {
    options.baseUrl = baseUrl;
  }
  return new GoogleGenAI(options);
};

// --- Helper to get effective config ---
const getEffectiveConfig = (user: UserProfile) => {
    // 强制逻辑：如果有 DeepSeek Key (无论来自环境变量还是用户设置)，优先使用 DeepSeek
    // 因为这对于国内用户最稳定
    const hasDeepSeek = !!(user.deepSeekApiKey || DEVELOPER_DEEPSEEK_KEY);
    
    // 默认 provider: 如果有 DeepSeek key，就用 deepseek，否则 gemini
    let defaultProvider: 'gemini' | 'deepseek' = hasDeepSeek ? 'deepseek' : 'gemini';

    // 如果用户显式选择了 provider，则尊重用户选择 (除非选了 deepseek 但没 key)
    const provider = user.aiProvider || defaultProvider; 
    
    const deepSeekKey = user.deepSeekApiKey || DEVELOPER_DEEPSEEK_KEY;
    const geminiUrl = user.apiBaseUrl || DEVELOPER_GEMINI_PROXY;
    
    return { provider, deepSeekKey, geminiUrl };
};

// --- Main Services ---

export const estimateFoodNutrition = async (foodDescription: string, user: UserProfile) => {
  const { provider, deepSeekKey, geminiUrl } = getEffectiveConfig(user);

  // DeepSeek Mode
  if (provider === 'deepseek' && deepSeekKey) {
     const prompt = `Estimate the nutrition for: "${foodDescription}". Return a single JSON object with these exact keys: "name" (short string), "calories" (number), "protein" (number), "carbs" (number), "fat" (number). Do not wrap in markdown code blocks.`;
     return await callDeepSeek(deepSeekKey, prompt, true);
  }

  // Gemini Mode
  try {
    const ai = getGeminiAI(geminiUrl);
    const response = await ai.models.generateContent({
      model: geminiModelName,
      contents: `Estimate the nutrition for: "${foodDescription}". Return a single JSON object with estimated calories, protein(g), carbs(g), fat(g), and a short standard name.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A concise name for the food" },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
          },
          required: ["name", "calories", "protein", "carbs", "fat"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Food Error:", error);
    if (!deepSeekKey && provider === 'deepseek') {
        throw new Error("API Key 未配置。请联系管理员或在设置中添加。");
    }
    throw new Error("AI Service Failed");
  }
};

export const estimateExerciseBurn = async (exerciseDescription: string, user: UserProfile) => {
  const { provider, deepSeekKey, geminiUrl } = getEffectiveConfig(user);

  // DeepSeek Mode
  if (provider === 'deepseek' && deepSeekKey) {
     const prompt = `Estimate calories burned for a person weighing ${user.currentWeightKg}kg doing: "${exerciseDescription}". Return a JSON object with keys: "name" (string), "caloriesBurned" (number), "durationMinutes" (number, infer 30 if not stated).`;
     return await callDeepSeek(deepSeekKey, prompt, true);
  }

  try {
    const ai = getGeminiAI(geminiUrl);
    const response = await ai.models.generateContent({
      model: geminiModelName,
      contents: `Estimate calories burned for a person weighing ${user.currentWeightKg}kg doing: "${exerciseDescription}". Return a JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Standardized exercise name" },
            caloriesBurned: { type: Type.NUMBER },
            durationMinutes: { type: Type.NUMBER, description: "Duration inferred from text, default to 30 if not specified" },
          },
          required: ["name", "caloriesBurned", "durationMinutes"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Exercise Error:", error);
    throw new Error("AI Service Failed");
  }
};

export const getDailyMotivation = async (profile: UserProfile, weightHistory: WeightEntry[], baseUrl?: string) => {
  const { provider, deepSeekKey, geminiUrl } = getEffectiveConfig(profile);

  // Sort history
  const history = [...weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startWeight = history.length > 0 ? history[0].weight : profile.currentWeightKg;
  const currentWeight = profile.currentWeightKg;
  const diff = currentWeight - startWeight;

  let trend = "maintaining";
  if (diff < -0.5) trend = "losing";
  if (diff > 0.5) trend = "gaining";

  const goalDesc = profile.targetWeightKg 
    ? `Target: ${profile.targetWeightKg}kg` 
    : "Maintain healthy weight";

  const prompt = `
    User Profile: ${profile.age}yo ${profile.gender}, Goal: ${goalDesc}.
    Current trend: ${trend} (${Math.abs(diff).toFixed(1)}kg difference).
    Give a short, punchy, 1-sentence motivational quote or advice specific to their situation in Chinese (Simplified).
    Don't be generic. Be like a supportive but firm coach.
  `;

  // DeepSeek Mode
  if (provider === 'deepseek' && deepSeekKey) {
      try {
          const res = await callDeepSeek(deepSeekKey, prompt, false);
          return typeof res === 'string' ? res.replace(/^"|"$/g, '') : "坚持就是胜利。";
      } catch (e) {
          return "坚持就是胜利，每一天都算数。";
      }
  }

  // Gemini Mode
  try {
    const ai = getGeminiAI(geminiUrl);
    const response = await ai.models.generateContent({
      model: geminiModelName,
      contents: prompt,
      config: {
        maxOutputTokens: 60,
      }
    });
    return response.text;
  } catch (error) {
    return "坚持就是胜利，每一天都算数。";
  }
};