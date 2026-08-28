sed -i '9i\
const searchCache = new Map<string, { places: any[]; source: string; timestamp: number }>();\
let geminiClient: GoogleGenAI | null = null;\
function getGeminiClient() {\
  if (!geminiClient && process.env.GEMINI_API_KEY) {\
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });\
  }\
  return geminiClient;\
}\
' server.ts
