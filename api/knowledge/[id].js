import { deleteKnowledgeEntryById, updateKnowledgeEntryById, verifyJwt } from '../_utils.js';

export default async function handler(req, res) {
  const user = verifyJwt(req, res);
  if (!user) return;

  const {
    query: { id }
  } = req;

  if (req.method === 'PUT') {
    try {
      const { keyword, answer } = req.body || {};
      if (!keyword || !answer) {
        res.status(400).json({ success: false, error: 'Thiếu keyword hoặc answer' });
        return;
      }
      const updated = await updateKnowledgeEntryById(id, { keyword, answer });
      if (!updated) {
        res.status(404).json({ success: false, error: 'Không tìm thấy entry' });
        return;
      }
      res.json({ success: true, message: 'Đã cập nhật câu trả lời', data: updated });
    } catch (e) {
      console.error('Error updating knowledge:', e);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteKnowledgeEntryById(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Không tìm thấy entry' });
        return;
      }
      res.json({ success: true, message: 'Đã xóa câu trả lời', data: deleted });
    } catch (e) {
      console.error('Error deleting knowledge:', e);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}


