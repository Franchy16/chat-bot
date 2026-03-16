import { loadKnowledgeBase, saveKnowledgeBase, verifyJwt } from '../_utils.js';

export default async function handler(req, res) {
  const user = verifyJwt(req, res);
  if (!user) return;

  const {
    query: { id }
  } = req;

  const kb = loadKnowledgeBase();
  const index = kb.findIndex((item) => item.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Không tìm thấy entry' });
    return;
  }

  if (req.method === 'PUT') {
    try {
      const { keyword, answer } = req.body || {};
      if (!keyword || !answer) {
        res.status(400).json({ success: false, error: 'Thiếu keyword hoặc answer' });
        return;
      }
      kb[index] = {
        ...kb[index],
        keyword: keyword.trim(),
        answer: answer.trim(),
        updatedAt: new Date().toISOString()
      };
      saveKnowledgeBase(kb);
      res.json({ success: true, message: 'Đã cập nhật câu trả lời', data: kb[index] });
    } catch (e) {
      console.error('Error updating knowledge:', e);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = kb.splice(index, 1)[0];
      saveKnowledgeBase(kb);
      res.json({ success: true, message: 'Đã xóa câu trả lời', data: deleted });
    } catch (e) {
      console.error('Error deleting knowledge:', e);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}


