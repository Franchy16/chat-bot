import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DB_FILE_PATH = path.join(__dirname, '../src/database/db.json');
export const SETTINGS_FILE_PATH = path.join(__dirname, '../src/database/settings.json');

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

export function loadKnowledgeBase() {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) return [];
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Error loading DB:', e);
    return [];
  }
}

export function saveKnowledgeBase(data) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving DB:', e);
  }
}

export function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      return DEFAULT_SETTINGS;
    }
    const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw || '{}');
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

export function saveSettings(next) {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(next, null, 2));
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


