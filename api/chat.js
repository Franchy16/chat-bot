import { GoogleGenerativeAI } from '@google/generative-ai';
import Fuse from 'fuse.js';
import { loadKnowledgeBase, loadSettings, createKnowledgeEntry } from './_utils.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

    const settings = await loadSettings();
    const model = genAI.getGenerativeModel({
      model: settings.ai.model,
      systemInstruction: settings.ai.systemInstruction
    });
    const fuseOptions = {
      keys: ['keyword'],
      threshold: settings.fuzzy?.threshold ?? 0.4
    };

    // 1. Thử tìm trong MongoDB knowledge base
    const knowledgeBase = await loadKnowledgeBase();
    const fuse = new Fuse(knowledgeBase, fuseOptions);
    const searchResult = fuse.search(message);

    if (searchResult.length > 0) {
      const bestMatch = searchResult[0].item;
      res.status(200).json({ reply: bestMatch.answer, source: 'database' });
      return;
    }

    // 2. Nếu không có trong DB → gọi Gemini
    if (!settings.ai?.enabled) {
      res.status(200).json({
        reply:
          'Mình chưa có câu trả lời phù hợp trong cơ sở dữ liệu. Bạn vui lòng liên hệ phòng đào tạo hoặc đặt câu hỏi cụ thể hơn để mình bổ sung nhé.',
        source: 'default'
      });
      return;
    }

    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(message);
    const text = result.response.text();

    await createKnowledgeEntry({ keyword: message, answer: text });

    res.status(200).json({ reply: text, source: 'Google Gemini AI' });
  } catch (error) {
    console.error('Lỗi /api/chat:', error);
    res.status(500).json({ error: 'Lỗi khi gọi Google AI' });
  }
}


