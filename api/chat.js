import { GoogleGenerativeAI } from '@google/generative-ai';
import Fuse from 'fuse.js';
import { loadKnowledgeBase, loadSettings } from './_utils.js';

// Gemini model (simple config for serverless, dùng settings nếu có)
const settings = loadSettings();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: settings.ai.model,
  systemInstruction: settings.ai.systemInstruction
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Thiếu message' });
      return;
    }

    // 1. Thử tìm trong DB local (read-only trên serverless)
    const knowledgeBase = loadKnowledgeBase();
    const fuse = new Fuse(knowledgeBase, fuseOptions);
    const searchResult = fuse.search(message);

    if (searchResult.length > 0) {
      const bestMatch = searchResult[0].item;
      res.status(200).json({ reply: bestMatch.answer, source: 'database' });
      return;
    }

    // 2. Nếu không có trong DB → gọi Gemini
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(message);
    const text = result.response.text();

    // Lưu ý: trên Vercel không nên ghi file, nên bỏ phần ghi DB
    res.status(200).json({ reply: text, source: 'Google Gemini AI' });
  } catch (error) {
    console.error('Lỗi /api/chat:', error);
    res.status(500).json({ error: 'Lỗi khi gọi Google AI' });
  }
}


