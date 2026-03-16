import { loadKnowledgeBase, saveKnowledgeBase, verifyJwt, DB_FILE_PATH } from './_utils.js';

export default async function handler(req, res) {
  const user = verifyJwt(req, res);
  if (!user) return;

  const kb = loadKnowledgeBase();

  if (req.method === 'GET') {
    res.json({ success: true, data: kb, total: kb.length });
    return;
  }

  if (req.method === 'POST') {
    try {
      const { keyword, answer } = req.body || {};
      if (!keyword || !answer) {
        res.status(400).json({ success: false, error: 'Thiếu keyword hoặc answer' });
        return;
      }
      const newEntry = {
        id: Date.now().toString(),
        keyword: keyword.trim(),
        answer: answer.trim(),
        createdAt: new Date().toISOString()
      };
      kb.push(newEntry);
      saveKnowledgeBase(kb);
      res.json({ success: true, message: 'Đã thêm câu trả lời mới', data: newEntry });
    } catch (e) {
      console.error('Error creating knowledge:', e);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}


