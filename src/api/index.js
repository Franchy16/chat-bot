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

const fuseOptions = {
    keys: ["keyword"],
    threshold: 0.4
}

// Cấu hình Key từ .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Sử dụng model Gemini 1.5 Flash (Nhanh, rẻ, phù hợp chatbot tư vấn)
const model = genAI.getGenerativeModel({
    model: "gemini-3-pro-preview",
    systemInstruction: "Bạn là chatbot tư vấn học tập cho trường đại học. Hãy trả lời ngắn gọn, thân thiện và chính xác."
});

const DB_FILE_PATH = "src/database/db.json";

let knowledgeBase = [];
if (fs.existsSync(DB_FILE_PATH)) {
    const data = fs.readFileSync(DB_FILE_PATH);
    knowledgeBase = JSON.parse(data);
}
else {
    console.log("---Not Found Data---");
    fs.writeFileSync(DB_FILE_PATH, "[]");
}

function normalizeText(text) {
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
        .trim();
}

// Helper function để reload knowledge base từ file
function reloadKnowledgeBase() {
    if (fs.existsSync(DB_FILE_PATH)) {
        const data = fs.readFileSync(DB_FILE_PATH);
        knowledgeBase = JSON.parse(data);
    }
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

        // Kiểm tra thông tin đăng nhập
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (username !== adminUsername || password !== adminPassword) {
            return res.status(401).json({ 
                success: false, 
                error: "Tên đăng nhập hoặc mật khẩu không đúng" 
            });
        }

        // Tạo JWT token (hết hạn sau 24 giờ)
        const token = jwt.sign(
            { username: username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true, 
            message: "Đăng nhập thành công",
            token: token,
            user: {
                username: username,
                role: 'admin'
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

// ========== MULTER CONFIG FOR FILE UPLOAD ==========

// Configure multer for memory storage (temporary)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// GET: Export knowledge base to Excel
app.get("/api/knowledge/export", authenticateToken, (req, res) => {
    try {
        reloadKnowledgeBase();

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
app.post("/api/knowledge/import", authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: "Không có file được upload" 
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

            if (existing) {
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

            knowledgeBase.push(newEntry);
            imported.push(newEntry);
        });

        // Save to file
        if (imported.length > 0) {
            fs.writeFileSync(DB_FILE_PATH, JSON.stringify(knowledgeBase, null, 2));
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
app.get("/api/knowledge", authenticateToken, (req, res) => {
    try {
        reloadKnowledgeBase();
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
app.post("/api/knowledge", authenticateToken, (req, res) => {
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
            answer: answer.trim(),
            createdAt: new Date().toISOString()
        };

        knowledgeBase.push(newEntry);
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(knowledgeBase, null, 2));

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
app.put("/api/knowledge/:id", authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { keyword, answer } = req.body;

        if (!keyword || !answer) {
            return res.status(400).json({ 
                success: false, 
                error: "Thiếu keyword hoặc answer" 
            });
        }

        const index = knowledgeBase.findIndex(item => item.id === id);
        
        if (index === -1) {
            return res.status(404).json({ 
                success: false, 
                error: "Không tìm thấy entry" 
            });
        }

        knowledgeBase[index] = {
            ...knowledgeBase[index],
            keyword: keyword.trim(),
            answer: answer.trim(),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(knowledgeBase, null, 2));

        res.json({ 
            success: true, 
            message: "Đã cập nhật câu trả lời",
            data: knowledgeBase[index]
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật knowledge:", error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

// DELETE: Xóa câu trả lời
app.delete("/api/knowledge/:id", authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const index = knowledgeBase.findIndex(item => item.id === id);
        
        if (index === -1) {
            return res.status(404).json({ 
                success: false, 
                error: "Không tìm thấy entry" 
            });
        }

        const deleted = knowledgeBase.splice(index, 1);
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(knowledgeBase, null, 2));

        res.json({ 
            success: true, 
            message: "Đã xóa câu trả lời",
            data: deleted[0]
        });
    } catch (error) {
        console.error("Lỗi khi xóa knowledge:", error);
        res.status(500).json({ success: false, error: "Lỗi server" });
    }
});

// ========== CHAT ENDPOINT ==========

app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;

        const fuse = new Fuse(knowledgeBase, fuseOptions);
        const searchResult = fuse.search(message);
        console.log(searchResult);

        if (searchResult.length > 0) {
            // Lấy kết quả khớp nhất
            console.log("Found message in DB");

            const bestMatch = searchResult[0].item;

            return res.json({ reply: bestMatch.answer, source: "database" });
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
            keyword: message,
            answer: text
        }

        knowledgeBase.push(newEntry)

        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(knowledgeBase, null, 2));

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