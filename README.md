# 🤖 Chatbot Tư Vấn Học Tập - Đại Học

Chatbot AI thông minh dùng Google Gemini để tư vấn học tập cho sinh viên đại học.

## ✨ Tính năng

- 💬 Chat với AI sử dụng Google Gemini (Gemini 1.5 Pro)
- 🧠 Knowledge Base tự động học và lưu trữ câu hỏi/trả lời
- 🔍 Fuzzy Search thông minh với Fuse.js
- 💾 Lưu lịch sử chat (LocalStorage)
- 🎨 Giao diện đẹp, hiện đại, responsive
- ⚡ Nhanh, mượt mà với typing indicator
- 📱 Hỗ trợ mobile hoàn hảo
- 🛡️ **Admin Panel quản lý câu trả lời mặc định**
- 🔐 **Hệ thống đăng nhập bảo mật (JWT Authentication)**
- 📊 **Import/Export Excel cho quản lý hàng loạt**

## 🛠️ Công nghệ sử dụng

### Backend
- Node.js + Express
- Google Gemini AI SDK
- Fuse.js (Fuzzy Search)
- dotenv (Environment Variables)
- CORS

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome Icons
- Responsive Design
- LocalStorage API

## 📦 Cài đặt

### 1. Clone hoặc tải project

```bash
cd chatbot
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình API Key

File `.env` đã được tạo sẵn với API key mẫu. Để sử dụng API key của riêng bạn:

1. Truy cập: https://makersuite.google.com/app/apikey
2. Tạo API key mới
3. Thay thế trong file `.env`:

```env
GEMINI_API_KEY=your_api_key_here
PORT=8080
```

## 🚀 Chạy ứng dụng

### Chạy server

```bash
npm run server
```

hoặc

```bash
node src/api/index.js
```

### Truy cập ứng dụng

Mở trình duyệt và truy cập:
```
http://localhost:8080
```

Server sẽ chạy tại cổng 8080 (có thể thay đổi trong file `.env`)

## 📖 Hướng dẫn sử dụng

### Chatbot (User)

1. **Gửi tin nhắn**: Nhập câu hỏi vào ô input và nhấn Enter hoặc click nút gửi
2. **Gợi ý nhanh**: Click vào các gợi ý ở góc phải màn hình
3. **Xóa lịch sử**: Click icon thùng rác ở header
4. **Xem nguồn**: Mỗi câu trả lời hiển thị nguồn (Database hoặc Google Gemini AI)

### Admin Panel

Truy cập: `http://localhost:8080/login.html`

**Thông tin đăng nhập mặc định:**
- Username: `admin`
- Password: `admin123`

1. **Đăng nhập**: Nhập username/password → Đăng nhập
2. **Xem danh sách**: Tất cả câu trả lời hiển thị trong bảng
3. **Thêm mới**: Click "Thêm mới" → Nhập thông tin → Lưu
4. **Chỉnh sửa**: Click nút ✏️ → Cập nhật → Lưu
5. **Xóa**: Click nút 🗑️ → Xác nhận
6. **Tìm kiếm**: Nhập từ khóa vào ô tìm kiếm
7. **Export Excel**: Click "Export Excel" → File tự động download
8. **Import Excel**: Click "Import Excel" → Chọn file → Confirm
9. **Template**: Click "Template" → Tải mẫu Excel
10. **Đăng xuất**: Click nút "Đăng xuất" ở header

📚 **Xem chi tiết:** 
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Hướng dẫn Admin Panel
- [AUTH_GUIDE.md](AUTH_GUIDE.md) - Hướng dẫn Authentication
- [IMPORT_EXPORT_GUIDE.md](IMPORT_EXPORT_GUIDE.md) - Hướng dẫn Import/Export Excel

## 📁 Cấu trúc thư mục

```
chatbot/
├── src/
│   ├── api/
│   │   └── index.js          # Backend API server
│   └── database/
│       └── db.json           # Knowledge base
├── public/
│   ├── index.html            # Frontend HTML
│   ├── style.css             # Styles
│   ├── script.js             # Frontend logic
│   ├── admin.html            # Admin Panel
│   ├── admin-style.css       # Admin styles
│   ├── admin-script.js       # Admin logic
│   └── 404.html             # Error page
├── .env                      # Environment variables
├── .env.example             # Config template
├── .gitignore               
├── package.json
├── README.md                 # Hướng dẫn chi tiết
├── ADMIN_GUIDE.md           # Hướng dẫn Admin Panel
├── QUICK_START.txt          # Hướng dẫn nhanh
└── DEMO_GUIDE.md            # Hướng dẫn demo
```

## 🔧 API Endpoints

### Chat Endpoint

#### POST `/chat`

Gửi tin nhắn và nhận phản hồi từ chatbot.

**Request Body:**
```json
{
  "message": "Câu hỏi của bạn"
}
```

**Response:**
```json
{
  "reply": "Câu trả lời",
  "source": "database" | "Google Gemini AI"
}
```

### Admin API Endpoints

#### GET `/api/knowledge`
Lấy tất cả câu trả lời

#### POST `/api/knowledge`
Thêm câu trả lời mới

#### PUT `/api/knowledge/:id`
Cập nhật câu trả lời

#### DELETE `/api/knowledge/:id`
Xóa câu trả lời

📚 **Chi tiết API:** Xem [ADMIN_GUIDE.md](ADMIN_GUIDE.md)

## 🎨 Tùy chỉnh

### Thay đổi màu sắc

Chỉnh sửa CSS variables trong `public/style.css`:

```css
:root {
    --primary-color: #2563eb;
    --primary-dark: #1d4ed8;
    /* ... */
}
```

### Thay đổi AI Model

Chỉnh sửa trong `src/api/index.js`:

```javascript
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",  // Thay đổi model
    systemInstruction: "..."   // Thay đổi instruction
});
```

### Điều chỉnh Fuzzy Search

Trong `src/api/index.js`:

```javascript
const fuseOptions = {
    keys: ["keyword"],
    threshold: 0.4  // 0.0 = chính xác, 1.0 = mờ nhất
}
```

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "Lỗi khi gọi Google AI"

- Kiểm tra API key trong `.env`
- Đảm bảo có kết nối internet
- Kiểm tra quota API còn lại

### Lỗi: CORS

- Đã được xử lý với `cors` package
- Nếu vẫn lỗi, kiểm tra URL trong `script.js`

### Lỗi: Port đã được sử dụng

Thay đổi PORT trong `.env`:
```env
PORT=3000
```

## 📝 Ghi chú

- Knowledge base lưu trong MongoDB (collection `MONGODB_KNOWLEDGE_COLLECTION`)
- Lịch sử chat lưu trong LocalStorage của browser
- API key Google Gemini miễn phí có giới hạn request/ngày
- Model `gemini-1.5-pro` nhanh và hiệu quả cho chatbot

## 🔒 Bảo mật

- ✅ API key được lưu trong `.env` (không commit lên Git)
- ✅ `.gitignore` đã cấu hình đúng
- ⚠️ Không chia sẻ file `.env` với người khác
- ⚠️ Không commit API key lên GitHub

## 📈 Nâng cao

Có thể mở rộng thêm:
- Authentication cho sinh viên
- Tích hợp database thực (MongoDB, PostgreSQL)
- Admin panel để quản lý knowledge base
- Analytics và tracking
- Export chat history
- Multi-language support
- Voice input/output

## 📞 Hỗ trợ

Nếu có vấn đề, hãy kiểm tra:
1. Console log trong browser (F12)
2. Terminal log của server
3. File `db.json` có tồn tại không

## 📄 License

MIT License - Tự do sử dụng cho mục đích học tập và thương mại.

---

**Tạo bởi:** AI Assistant
**Phiên bản:** 1.0.0
**Ngày:** 2025

