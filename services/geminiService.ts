import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WeightEntry } from "../types";

const geminiModelName = "gemini-3-flash-preview";

// ============================================================================
// 开发者配置区域
// ============================================================================
// DeepSeek Key (已保存您的 Key)
const DEVELOPER_DEEPSEEK_KEY = "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"; 

// Gemini Proxy (修正：之前您填入了 Key，这里必须是 URL。已清空以防报错)
// 如果您以后有 代理地址 (如 https://my-proxy.vercel.app)，请填在这里。
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
    // 强制逻辑：如果有 DeepSeek Key，优先使用 DeepSeek
    const defaultProvider = DEVELOPER_DEEPSEEK_KEY ? 'deepseek' : 'gemini';
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