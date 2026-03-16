import { loadSettings, saveSettings, DEFAULT_SETTINGS, verifyJwt } from './_utils.js';

export default async function handler(req, res) {
  const user = verifyJwt(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const s = loadSettings();
      res.json({ success: true, data: s });
    } catch (e) {
      console.error('Settings load error (serverless):', e);
      res.status(500).json({ success: false, error: 'Lỗi khi lấy settings' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body || {};
      const current = loadSettings();

      const next = {
        ...DEFAULT_SETTINGS,
        ...current,
        ai: { ...DEFAULT_SETTINGS.ai, ...current.ai, ...(body.ai || {}) },
        fuzzy: { ...DEFAULT_SETTINGS.fuzzy, ...current.fuzzy, ...(body.fuzzy || {}) },
        importExport: {
          ...DEFAULT_SETTINGS.importExport,
          ...current.importExport,
          ...(body.importExport || {})
        }
      };

      if (typeof next.ai.enabled !== 'boolean') next.ai.enabled = true;
      if (typeof next.ai.model !== 'string' || !next.ai.model.trim()) {
        res.status(400).json({ success: false, error: 'ai.model không hợp lệ' });
        return;
      }
      next.ai.model = next.ai.model.trim();

      if (typeof next.ai.systemInstruction !== 'string') {
        res.status(400).json({ success: false, error: 'ai.systemInstruction không hợp lệ' });
        return;
      }
      next.ai.systemInstruction = next.ai.systemInstruction.trim();

      const thr = Number(next.fuzzy.threshold);
      if (!Number.isFinite(thr) || thr < 0 || thr > 1) {
        res.status(400).json({ success: false, error: 'fuzzy.threshold phải trong khoảng 0..1' });
        return;
      }
      next.fuzzy.threshold = thr;

      const maxMB = Number(next.importExport.maxFileSizeMB);
      if (!Number.isFinite(maxMB) || maxMB < 1 || maxMB > 20) {
        res.status(400).json({
          success: false,
          error: 'importExport.maxFileSizeMB phải trong khoảng 1..20'
        });
        return;
      }
      next.importExport.maxFileSizeMB = Math.round(maxMB);
      next.importExport.skipDuplicates = Boolean(next.importExport.skipDuplicates);

      saveSettings(next);
      res.json({ success: true, message: 'Đã lưu cài đặt', data: next });
    } catch (e) {
      console.error('Settings save error (serverless):', e);
      res.status(500).json({ success: false, error: 'Lỗi khi lưu settings' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}


