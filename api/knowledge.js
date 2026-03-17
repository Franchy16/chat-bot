import { createKnowledgeEntry, loadKnowledgeBase, verifyJwt } from './_utils.js';

export default async function handler(req, res) {
  const user = verifyJwt(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const kb = await loadKnowledgeBase();
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
      const newEntry = await createKnowledgeEntry({ keyword, answer });
      res.json({ success: true, message: 'Đã thêm câu trả lời mới', data: newEntry });
    } catch (e) {
      console.error('Error creating knowledge:', e);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}


