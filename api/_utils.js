import jwt from 'jsonwebtoken';
import { getKnowledgeCollection, getSettingsCollection } from '../src/lib/mongo.js';

export const DEFAULT_SETTINGS = {
  ai: {
    model: 'gemini-3-pro-preview',
    systemInstruction:
      'Bạn là chatbot tư vấn học tập cho trường đại học. Hãy trả lời ngắn gọn, thân thiện và chính xác.',
    enabled: true
  },
  fuzzy: {
    threshold: 0.4
  },
  importExport: {
    maxFileSizeMB: 5,
    skipDuplicates: true
  }
};

export async function loadKnowledgeBase() {
  try {
    const col = await getKnowledgeCollection();
    return await col
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1, id: -1 })
      .toArray();
  } catch (e) {
    console.error('Error loading knowledge (mongodb):', e);
    return [];
  }
}

function normalizeKeyword(k) {
  return String(k || '').trim().toLowerCase();
}

export async function createKnowledgeEntry({ keyword, answer }) {
  const kw = String(keyword || '').trim();
  const ans = String(answer || '').trim();
  const doc = {
    id: Date.now().toString(),
    keyword: kw,
    keywordLower: normalizeKeyword(kw),
    answer: ans,
    createdAt: new Date().toISOString()
  };
  const col = await getKnowledgeCollection();
  await col.insertOne(doc);
  return doc;
}

export async function updateKnowledgeEntryById(id, { keyword, answer }) {
  const kw = String(keyword || '').trim();
  const ans = String(answer || '').trim();
  const col = await getKnowledgeCollection();
  const res = await col.findOneAndUpdate(
    { id: String(id) },
    {
      $set: {
        keyword: kw,
        keywordLower: normalizeKeyword(kw),
        answer: ans,
        updatedAt: new Date().toISOString()
      }
    },
    { returnDocument: 'after', projection: { _id: 0 } }
  );
  return res.value;
}

export async function deleteKnowledgeEntryById(id) {
  const col = await getKnowledgeCollection();
  const res = await col.findOneAndDelete({ id: String(id) }, { projection: { _id: 0 } });
  return res.value;
}

export async function loadSettings() {
  try {
    const col = await getSettingsCollection();
    const doc = await col.findOne({ _id: 'app' }, { projection: { _id: 0 } });
    const parsed = doc || {};
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      ai: { ...DEFAULT_SETTINGS.ai, ...(parsed.ai || {}) },
      fuzzy: { ...DEFAULT_SETTINGS.fuzzy, ...(parsed.fuzzy || {}) },
      importExport: { ...DEFAULT_SETTINGS.importExport, ...(parsed.importExport || {}) }
    };
  } catch (e) {
    console.error('Error loading settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(next) {
  try {
    const col = await getSettingsCollection();
    await col.updateOne(
      { _id: 'app' },
      { $set: { ...next, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function getAuthToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return null;
  const parts = String(authHeader).split(' ');
  if (parts[0] !== 'Bearer' || !parts[1]) return null;
  return parts[1];
}

export function verifyJwt(req, res) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      res.status(401).json({ success: false, error: 'Không có token. Vui lòng đăng nhập.' });
      return null;
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, error: 'JWT_SECRET chưa được cấu hình.' });
      return null;
    }
    const user = jwt.verify(token, secret);
    return user;
  } catch (e) {
    console.error('JWT verify error:', e);
    res.status(403).json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn.' });
    return null;
  }
}


