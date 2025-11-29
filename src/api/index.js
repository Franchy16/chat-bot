import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import Fuse from "fuse.js";

dotenv.config();

const app = express();
app.use(express.json());

const fuseOptions = {
    keys: ["keyword"],
    threshold: 0.4
}

// Cấu hình Key (Nên để trong file .env, không code cứng ở đây)
// Nếu dùng key Vertex AI/Google AI Studio
const genAI = new GoogleGenerativeAI("AIzaSyDuLFY5yF_qZy4DjZm4uDOSBRIUsJ5Sb0Y");

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
        res.json({ reply: text, source: "Open AI" });

    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ error: "Lỗi khi gọi Google AI" });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});