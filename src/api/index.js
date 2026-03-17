import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import Fuse from "fuse.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import xlsx from 'xlsx';
import multer from 'multer';
import { getKnowledgeCollection } from "../lib/mongo.js";
import { getSettingsCollection } from "../lib/mongo.js";
import { getAdminsCollection } from "../lib/mongo.js";
import swaggerUi from "swagger-ui-express";
import { buildOpenApiSpec } from "./openapi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const app = express();
app.use(express.json());
app.use(cors()); // Cho phép frontend kết nối

// Serve static files (frontend)
app.use(express.static('public'));

// ========== SWAGGER / OPENAPI ==========
const openapiSpec = buildOpenApiSpec({ title: "Chatbot API", version: "1.0.0" });
app.get("/api/openapi.json", (req, res) => res.json(openapiSpec));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }));

// ========== SETTINGS STORAGE ==========
const DEFAULT_SETTINGS = {
    ai: {
        model: "gemini-3-pro-preview",
        systemInstruction: "Bạn là chatbot tư vấn học tập cho trường đại học. Hãy trả lời ngắn gọn, thân thiện và chính xác.",
        enabled: true
    },
    fuzzy: {
        threshold: 0.4
    },
    importExport: {
        // enforce in code; multer hard limit is higher
        maxFileSizeMB: 5,
        skipDuplicates: true
    }
};

// Cấu hình Key từ .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let appSettings = DEFAULT_SETTINGS;

let settingsCol = null;

async function loadSettings() {
    try {
        if (!settingsCol) settingsCol = await getSettingsCollection();
        const doc = await settingsCol.findOne({ _id: "app" }, { projection: { _id: 0 } });
        const parsed = doc || {};
        appSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            ai: { ...DEFAULT_SETTINGS.ai, ...(parsed.ai || {}) },
            fuzzy: { ...DEFAULT_SETTINGS.fuzzy, ...(parsed.fuzzy || {}) },
            importExport: { ...DEFAULT_SETTINGS.importExport, ...(parsed.importExport || {}) }
        };
    } catch (e) {
        console.error("Lỗi khi load settings (mongodb):", e);
        appSettings = DEFAULT_SETTINGS;
    }
}

async function saveSettings(nextSettings) {
    try {
        if (!settingsCol) settingsCol = await getSettingsCollection();
        appSettings = nextSettings;
        await settingsCol.updateOne(
            { _id: "app" },
            { $set: { ...appSettings, updatedAt: new Date().toISOString() } },
            { upsert: true }
        );
    } catch (e) {
        console.error("Lỗi khi save settings (mongodb):", e);
    }
}

function getFuseOptions() {
    return {
        keys: ["keyword"],
        threshold: appSettings.fuzzy.threshold
    };
}

// AI model (cấu hình qua settings.json)
let model = genAI.getGenerativeModel({
    model: appSettings.ai.model,
    systemInstruction: appSettings.ai.systemInstruction
});

function rebuildModel() {
    model = genAI.getGenerativeModel({
        model: appSettings.ai.model,
        systemInstruction: appSettings.ai.systemInstruction
    });
}

await loadSettings();
rebuildModel();

let adminsCol = null;
async function ensureDefaultAdmin() {
    if (!adminsCol) adminsCol = await getAdminsCollection();
    await adminsCol.createIndex({ usernameLower: 1 }, { unique: true });

    const count = await adminsCol.countDocuments();
    if (count > 0) return;

    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const passwordHash = await bcrypt.hash(password, 10);

    await adminsCol.insertOne({
        id: Date.now().toString(),
        username,
        usernameLower: String(username).trim().toLowerCase(),
        passwordHash,
        role: "admin",
        createdAt: new Date().toISOString()
    });
    console.log("✅ Seeded default admin from .env");
}
await ensureDefaultAdmin();

let knowledgeCol = null;
let knowledgeBase = [];
knowledgeCol = await getKnowledgeCollection();
await reloadKnowledgeBase();

function normalizeText(text) {
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
        .trim();
}

function normalizeKeyword(text) {
    return String(text || "").trim().toLowerCase();
}

// Helper function để reload knowledge base từ MongoDB
async function reloadKnowledgeBase() {
    if (!knowledgeCol) knowledgeCol = await getKnowledgeCollection();
    knowledgeBase = await knowledgeCol
        .find({}, { projection: { _id: 0 } })
        .sort({ createdAt: -1, id: -1 })
        .toArray();
}

// ========== AUTHENTICATION ==========

// Middleware để verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: "Không có token. Vui lòng đăng nhập." 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                error: "Token không hợp lệ hoặc đã hết hạn." 
            });
        }
        req.user = user;
        next();
    });
};

// POST: Login endpoint
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: "Thiếu username hoặc password" 
            });
        }

        if (!adminsCol) adminsCol = await getAdminsCollection();
        const admin = await adminsCol.findOne(
            { usernameLower: String(username).trim().toLowerCase() },
            { projection: { _id: 0 } }
        );
        if (!admin) {
            return res.status(401).json({ success: false, error: "Tên đăng nhập hoặc mật khẩu không đúng" });
        }
        const ok = await bcrypt.compare(String(password), admin.passwordHash || "");
        if (!ok) {
            return res.status(401).json({ success: false, error: "Tên đăng nhập hoặc mật khẩu không đúng" });
        }

        // Tạo JWT token (hết hạn sau 24 giờ)
        const token = jwt.sign(
            { adminId: admin.id, username: admin.username, role: admin.role || 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true, 
            message: "Đăng nhập thành công",
            token: token,
            user: {
                id: admin.id,
                username: admin.username,
                role: admin.role || 'admin'
            }
        });
    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

// POST: Verify token endpoint
app.post("/api/verify", authenticateToken, (req, res) => {
    res.json({ 
        success: true, 
        message: "Token hợp lệ",
        user: req.user
    });
});

// ========== ADMIN MANAGEMENT (Protected) ==========
app.get("/api/admins", authenticateToken, async (req, res) => {
    try {
        if (!adminsCol) adminsCol = await getAdminsCollection();
        const admins = await adminsCol
            .find({}, { projection: { _id: 0, passwordHash: 0 } })
            .sort({ createdAt: -1 })
            .toArray();
        res.json({ success: true, data: admins, total: admins.length });
    } catch (e) {
        console.error("Lỗi khi lấy danh sách admin:", e);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

app.post("/api/admins", authenticateToken, async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ success: false, error: "Thiếu username hoặc password" });
        }
        const uname = String(username).trim();
        if (uname.length < 3) {
            return res.status(400).json({ success: false, error: "username phải >= 3 ký tự" });
        }
        if (String(password).length < 6) {
            return res.status(400).json({ success: false, error: "password phải >= 6 ký tự" });
        }
        if (!adminsCol) adminsCol = await getAdminsCollection();
        const doc = {
            id: Date.now().toString(),
            username: uname,
            usernameLower: uname.toLowerCase(),
            passwordHash: await bcrypt.hash(String(password), 10),
            role: "admin",
            createdAt: new Date().toISOString()
        };
        await adminsCol.insertOne(doc);
        const { passwordHash, ...safe } = doc;
        res.json({ success: true, message: "Đã tạo admin", data: safe });
    } catch (e) {
        const msg = String(e?.message || "");
        if (msg.includes("E11000")) {
            return res.status(400).json({ success: false, error: "username đã tồn tại" });
        }
        console.error("Lỗi khi tạo admin:", e);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

app.put("/api/admins/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password } = req.body || {};
        const update = { updatedAt: new Date().toISOString() };

        if (username != null) {
            const uname = String(username).trim();
            if (uname.length < 3) return res.status(400).json({ success: false, error: "username phải >= 3 ký tự" });
            update.username = uname;
            update.usernameLower = uname.toLowerCase();
        }
        if (password != null && String(password).length > 0) {
            if (String(password).length < 6) return res.status(400).json({ success: false, error: "password phải >= 6 ký tự" });
            update.passwordHash = await bcrypt.hash(String(password), 10);
        }

        if (!adminsCol) adminsCol = await getAdminsCollection();
        const result = await adminsCol.findOneAndUpdate(
            { id: String(id) },
            { $set: update },
            { returnDocument: "after", projection: { _id: 0, passwordHash: 0 } }
        );
        if (!result.value) return res.status(404).json({ success: false, error: "Không tìm thấy admin" });
        res.json({ success: true, message: "Đã cập nhật admin", data: result.value });
    } catch (e) {
        const msg = String(e?.message || "");
        if (msg.includes("E11000")) {
            return res.status(400).json({ success: false, error: "username đã tồn tại" });
        }
        console.error("Lỗi khi cập nhật admin:", e);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

app.delete("/api/admins/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!adminsCol) adminsCol = await getAdminsCollection();

        const count = await adminsCol.countDocuments();
        if (count <= 1) {
            return res.status(400).json({ success: false, error: "Không thể xoá admin cuối cùng" });
        }
        if (String(req.user?.adminId) === String(id)) {
            return res.status(400).json({ success: false, error: "Không thể tự xoá tài khoản đang đăng nhập" });
        }

        const deleted = await adminsCol.findOneAndDelete(
            { id: String(id) },
            { projection: { _id: 0, passwordHash: 0 } }
        );
        if (!deleted.value) return res.status(404).json({ success: false, error: "Không tìm thấy admin" });
        res.json({ success: true, message: "Đã xoá admin", data: deleted.value });
    } catch (e) {
        console.error("Lỗi khi xoá admin:", e);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

// ========== SETTINGS API (Protected) ==========
app.get("/api/settings", authenticateToken, async (req, res) => {
    try {
        await loadSettings();
        res.json({ success: true, data: appSettings });
    } catch (e) {
        console.error("Lỗi khi lấy settings:", e);
        res.status(500).json({ success: false, error: "Lỗi khi lấy settings" });
    }
});

app.put("/api/settings", authenticateToken, async (req, res) => {
    try {
        const body = req.body || {};

        const next = {
            ...DEFAULT_SETTINGS,
            ...appSettings,
            ai: { ...DEFAULT_SETTINGS.ai, ...appSettings.ai, ...(body.ai || {}) },
            fuzzy: { ...DEFAULT_SETTINGS.fuzzy, ...appSettings.fuzzy, ...(body.fuzzy || {}) },
            importExport: { ...DEFAULT_SETTINGS.importExport, ...appSettings.importExport, ...(body.importExport || {}) }
        };

        // Validate
        if (typeof next.ai.enabled !== "boolean") next.ai.enabled = true;

        if (typeof next.ai.model !== "string" || !next.ai.model.trim()) {
            return res.status(400).json({ success: false, error: "ai.model không hợp lệ" });
        }
        next.ai.model = next.ai.model.trim();

        if (typeof next.ai.systemInstruction !== "string") {
            return res.status(400).json({ success: false, error: "ai.systemInstruction không hợp lệ" });
        }
        next.ai.systemInstruction = next.ai.systemInstruction.trim();

        const thr = Number(next.fuzzy.threshold);
        if (!Number.isFinite(thr) || thr < 0 || thr > 1) {
            return res.status(400).json({ success: false, error: "fuzzy.threshold phải trong khoảng 0..1" });
        }
        next.fuzzy.threshold = thr;

        const maxMB = Number(next.importExport.maxFileSizeMB);
        if (!Number.isFinite(maxMB) || maxMB < 1 || maxMB > 20) {
            return res.status(400).json({ success: false, error: "importExport.maxFileSizeMB phải trong khoảng 1..20" });
        }
        next.importExport.maxFileSizeMB = Math.round(maxMB);
        next.importExport.skipDuplicates = Boolean(next.importExport.skipDuplicates);

        await saveSettings(next);
        rebuildModel();

        res.json({ success: true, message: "Đã lưu cài đặt", data: appSettings });
    } catch (e) {
        console.error("Lỗi khi lưu settings:", e);
        res.status(500).json({ success: false, error: "Lỗi khi lưu settings" });
    }
});

// ========== MULTER CONFIG FOR FILE UPLOAD ==========

// Configure multer for memory storage (temporary)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    // Hard limit: 20MB. Actual max file size is enforced via settings.
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // Accept only xlsx and xls files
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
        }
    }
});

// ========== IMPORT/EXPORT API ENDPOINTS (Protected) ==========

// ========== STATS API (Protected) ==========
function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function formatDayKey(d) {
    const x = startOfDay(d);
    const yyyy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

app.get("/api/stats", authenticateToken, async (req, res) => {
    try {
        await reloadKnowledgeBase();

        const total = knowledgeBase.length;
        const withCreatedAt = knowledgeBase.filter(x => x.createdAt).length;
        const withUpdatedAt = knowledgeBase.filter(x => x.updatedAt).length;

        // Time buckets: last 14 days
        const days = 14;
        const now = new Date();
        const dayKeys = [];
        for (let i = days - 1; i >= 0; i--) {
            const dt = new Date(now);
            dt.setDate(dt.getDate() - i);
            dayKeys.push(formatDayKey(dt));
        }

        const createdByDay = Object.fromEntries(dayKeys.map(k => [k, 0]));
        const updatedByDay = Object.fromEntries(dayKeys.map(k => [k, 0]));

        for (const item of knowledgeBase) {
            if (item.createdAt) {
                const k = formatDayKey(item.createdAt);
                if (k in createdByDay) createdByDay[k] += 1;
            }
            if (item.updatedAt) {
                const k = formatDayKey(item.updatedAt);
                if (k in updatedByDay) updatedByDay[k] += 1;
            }
        }

        // Latest entries
        const latest = [...knowledgeBase]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 10)
            .map(x => ({
                id: x.id,
                keyword: x.keyword,
                createdAt: x.createdAt || null,
                updatedAt: x.updatedAt || null
            }));

        // Longest answers / keywords (simple quality signals)
        const topLongestAnswers = [...knowledgeBase]
            .map(x => ({ id: x.id, keyword: x.keyword, len: (x.answer || "").length }))
            .sort((a, b) => b.len - a.len)
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                totals: { total, withCreatedAt, withUpdatedAt },
                chart: {
                    days: dayKeys,
                    created: dayKeys.map(k => createdByDay[k]),
                    updated: dayKeys.map(k => updatedByDay[k])
                },
                latest,
                topLongestAnswers
            }
        });
    } catch (e) {
        console.error("Lỗi khi lấy stats:", e);
        res.status(500).json({ success: false, error: "Lỗi khi lấy thống kê" });
    }
});

// GET: Export knowledge base to Excel
app.get("/api/knowledge/export", authenticateToken, async (req, res) => {
    try {
        await reloadKnowledgeBase();

        // Prepare data for Excel
        const excelData = knowledgeBase.map((item, index) => ({
            'STT': index + 1,
            'ID': item.id || '',
            'Câu hỏi': item.keyword || '',
            'Câu trả lời': item.answer || '',
            'Ngày tạo': item.createdAt || '',
            'Ngày cập nhật': item.updatedAt || ''
        }));

        // Create workbook and worksheet
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(excelData);

        // Set column widths
        ws['!cols'] = [
            { wch: 5 },   // STT
            { wch: 15 },  // ID
            { wch: 40 },  // Câu hỏi
            { wch: 60 },  // Câu trả lời
            { wch: 20 },  // Ngày tạo
            { wch: 20 }   // Ngày cập nhật
        ];

        // Add worksheet to workbook
        xlsx.utils.book_append_sheet(wb, ws, 'Knowledge Base');

        // Generate buffer
        const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for download
        const filename = `knowledge-base-${Date.now()}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        res.send(excelBuffer);
    } catch (error) {
        console.error("Lỗi khi export Excel:", error);
        res.status(500).json({ success: false, error: "Lỗi khi export Excel" });
    }
});

// POST: Import knowledge base from Excel
app.post("/api/knowledge/import", authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: "Không có file được upload" 
            });
        }

        // Enforce max file size from settings
        const maxBytes = (appSettings.importExport.maxFileSizeMB || 5) * 1024 * 1024;
        if (req.file.size > maxBytes) {
            return res.status(400).json({
                success: false,
                error: `File quá lớn. Tối đa ${appSettings.importExport.maxFileSizeMB || 5}MB`
            });
        }

        // Read Excel file from buffer
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        
        // Get first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: "File Excel rỗng hoặc không đúng format" 
            });
        }

        await reloadKnowledgeBase();

        // Validate and process data
        const imported = [];
        const errors = [];

        data.forEach((row, index) => {
            const rowNum = index + 2; // Excel row (header is row 1)
            
            // Get keyword and answer (support multiple column name formats)
            const keyword = row['Câu hỏi'] || row['Cau hoi'] || row['Question'] || row['keyword'];
            const answer = row['Câu trả lời'] || row['Cau tra loi'] || row['Answer'] || row['answer'];

            if (!keyword || !answer) {
                errors.push(`Dòng ${rowNum}: Thiếu câu hỏi hoặc câu trả lời`);
                return;
            }

            // Check if keyword already exists
            const existing = knowledgeBase.find(item => 
                item.keyword.toLowerCase().trim() === keyword.toLowerCase().trim()
            );

            if (existing && appSettings.importExport.skipDuplicates) {
                errors.push(`Dòng ${rowNum}: Câu hỏi "${keyword}" đã tồn tại`);
                return;
            }

            // Create new entry
            const newEntry = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                keyword: keyword.trim(),
                answer: answer.trim(),
                createdAt: new Date().toISOString()
            };

            if (existing && !appSettings.importExport.skipDuplicates) {
                // Upsert
                existing.keyword = newEntry.keyword;
                existing.keywordLower = normalizeKeyword(newEntry.keyword);
                existing.answer = newEntry.answer;
                existing.updatedAt = new Date().toISOString();
                imported.push(existing);
                return;
            }

            knowledgeBase.push(newEntry);
            imported.push(newEntry);
        });

        // Save to MongoDB
        if (imported.length > 0) {
            if (!knowledgeCol) knowledgeCol = await getKnowledgeCollection();
            const ops = imported.map((doc) => ({
                updateOne: {
                    filter: { id: doc.id },
                    update: {
                        $set: {
                            ...doc,
                            keywordLower: normalizeKeyword(doc.keyword)
                        }
                    },
                    upsert: true
                }
            }));
            await knowledgeCol.bulkWrite(ops, { ordered: false });
            await reloadKnowledgeBase();
        }

        res.json({ 
            success: true, 
            message: `Import thành công ${imported.length} câu trả lời`,
            data: {
                imported: imported.length,
                errors: errors.length,
                details: errors
            }
        });
    } catch (error) {
        console.error("Lỗi khi import Excel:", error);
        res.status(500).json({ 
            success: false, 
            error: "Lỗi khi import Excel: " + error.message 
        });
    }
});

// GET: Download Excel template
app.get("/api/knowledge/template", authenticateToken, (req, res) => {
    try {
        // Create sample data for template
        const templateData = [
            {
                'STT': 1,
                'Câu hỏi': 'Ví dụ: Học phí là bao nhiêu?',
                'Câu trả lời': 'Ví dụ: Học phí học kỳ này là 10.000.000 VNĐ'
            },
            {
                'STT': 2,
                'Câu hỏi': 'Ví dụ: Lịch học tuần này?',
                'Câu trả lời': 'Ví dụ: Thứ 2: Toán (7h-9h), Thứ 3: Lý (13h-15h)'
            }
        ];

        // Create workbook
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(templateData);

        // Set column widths
        ws['!cols'] = [
            { wch: 5 },   // STT
            { wch: 40 },  // Câu hỏi
            { wch: 60 }   // Câu trả lời
        ];

        // Add worksheet
        xlsx.utils.book_append_sheet(wb, ws, 'Template');

        // Generate buffer
        const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set headers
        res.setHeader('Content-Disposition', 'attachment; filename="knowledge-template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        res.send(excelBuffer);
    } catch (error) {
        console.error("Lỗi khi tạo template:", error);
        res.status(500).json({ success: false, error: "Lỗi khi tạo template" });
    }
});

// ========== ADMIN API ENDPOINTS (Protected) ==========

// GET: Lấy tất cả câu trả lời mặc định
app.get("/api/knowledge", authenticateToken, async (req, res) => {
    try {
        await reloadKnowledgeBase();
        res.json({ 
            success: true, 
            data: knowledgeBase,
            total: knowledgeBase.length
        });
    } catch (error) {
        console.error("Lỗi khi lấy knowledge base:", error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

// POST: Thêm câu trả lời mới
app.post("/api/knowledge", authenticateToken, async (req, res) => {
    try {
        const { keyword, answer } = req.body;
        
        if (!keyword || !answer) {
            return res.status(400).json({ 
                success: false, 
                error: "Thiếu keyword hoặc answer" 
            });
        }

        const newEntry = {
            id: Date.now().toString(),
            keyword: keyword.trim(),
            keywordLower: normalizeKeyword(keyword),
            answer: answer.trim(),
            createdAt: new Date().toISOString()
        };

        if (!knowledgeCol) knowledgeCol = await getKnowledgeCollection();
        await knowledgeCol.insertOne(newEntry);
        knowledgeBase.push(newEntry);

        res.json({ 
            success: true, 
            message: "Đã thêm câu trả lời mới",
            data: newEntry 
        });
    } catch (error) {
        console.error("Lỗi khi thêm knowledge:", error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

// PUT: Cập nhật câu trả lời
app.put("/api/knowledge/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { keyword, answer } = req.body;

        if (!keyword || !answer) {
            return res.status(400).json({ 
                success: false, 
                error: "Thiếu keyword hoặc answer" 
            });
        }

        if (!knowledgeCol) knowledgeCol = await getKnowledgeCollection();
        const updatedAt = new Date().toISOString();
        await knowledgeCol.updateOne(
            { id },
            {
                $set: {
                    keyword: keyword.trim(),
                    keywordLower: normalizeKeyword(keyword),
                    answer: answer.trim(),
                    updatedAt
                }
            }
        );
        await reloadKnowledgeBase();
        const updated = knowledgeBase.find(item => item.id === id);
        if (!updated) {
            return res.status(404).json({ success: false, error: "Không tìm thấy entry" });
        }

        res.json({ 
            success: true, 
            message: "Đã cập nhật câu trả lời",
            data: updated
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật knowledge:", error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

// DELETE: Xóa câu trả lời
app.delete("/api/knowledge/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!knowledgeCol) knowledgeCol = await getKnowledgeCollection();
        const deleted = await knowledgeCol.findOneAndDelete(
            { id },
            { projection: { _id: 0 } }
        );
        if (!deleted.value) {
            return res.status(404).json({ success: false, error: "Không tìm thấy entry" });
        }
        await reloadKnowledgeBase();

        res.json({ 
            success: true, 
            message: "Đã xóa câu trả lời",
            data: deleted.value
        });
    } catch (error) {
        console.error("Lỗi khi xóa knowledge:", error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

// ========== CHAT ENDPOINT ==========

app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;
        await reloadKnowledgeBase();

        const fuse = new Fuse(knowledgeBase, getFuseOptions());
        const searchResult = fuse.search(message);
        console.log(searchResult);

        if (searchResult.length > 0) {
            // Lấy kết quả khớp nhất
            console.log("Found message in DB");

            const bestMatch = searchResult[0].item;

            return res.json({ reply: bestMatch.answer, source: "database" });
        }

        // If AI disabled, return default response
        if (!appSettings.ai.enabled) {
            return res.json({
                reply: "Mình chưa có câu trả lời phù hợp trong cơ sở dữ liệu. Bạn vui lòng liên hệ phòng đào tạo hoặc đặt câu hỏi cụ thể hơn để mình bổ sung nhé.",
                source: "default"
            });
        }

        // 1. Khởi tạo đoạn chat (để bot nhớ ngữ cảnh nếu cần mở rộng sau này)
        const chat = model.startChat({
            history: [
                // Có thể thêm các ví dụ mẫu (Few-shot learning) ở đây nếu muốn bot thông minh hơn
            ],
        });

        // 2. Gửi tin nhắn
        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        const newEntry = {
            id: Date.now().toString(),
            keyword: message,
            keywordLower: normalizeKeyword(message),
            answer: text,
            createdAt: new Date().toISOString()
        };
        if (!knowledgeCol) knowledgeCol = await getKnowledgeCollection();
        await knowledgeCol.insertOne(newEntry);
        knowledgeBase.push(newEntry);

        // 3. Trả về kết quả
        res.json({ reply: text, source: "Google Gemini AI" });

    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ error: "Lỗi khi gọi Google AI" });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📱 Mở trình duyệt và truy cập: http://localhost:${PORT}`);
});