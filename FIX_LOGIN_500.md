# 🔧 FIX: Lỗi 500 khi đăng nhập

## ❌ VẤN ĐỀ

Khi đăng nhập vào Admin Panel, gặp lỗi 500:
```
{"success":false,"error":"Lỗi server"}
```

Server log:
```
Error: secretOrPrivateKey must have a value
```

## 🔍 NGUYÊN NHÂN

File `.env` có **encoding sai** hoặc có **BOM (Byte Order Mark)**, khiến dotenv không đọc được các biến môi trường.

Khi check log:
```
[dotenv@17.2.3] injecting env (0) from .env
                                 ^^^
                                 0 biến = KHÔNG ĐỌC ĐƯỢC!
```

## ✅ GIẢI PHÁP

### **Cách 1: Tạo lại file .env (Khuyến nghị)**

Xóa và tạo lại file `.env` với encoding UTF-8 đúng:

**Windows PowerShell:**
```powershell
Remove-Item .env -Force

@"
GEMINI_API_KEY=AIzaSyDuLFY5yF_qZy4DjZm4uDOSBRIUsJ5Sb0Y
PORT=8080
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
"@ | Out-File -FilePath .env -Encoding UTF8 -NoNewline
```

**Linux/Mac:**
```bash
cat > .env << 'EOF'
GEMINI_API_KEY=AIzaSyDuLFY5yF_qZy4DjZm4uDOSBRIUsJ5Sb0Y
PORT=8080
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EOF
```

### **Cách 2: Fix dotenv config trong code**

Cập nhật `src/api/index.js`:

```javascript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env with explicit path (for ES modules)
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath });
```

## 🔄 SAU KHI FIX

1. **Restart server:**
```bash
npm run server
```

2. **Kiểm tra log phải thấy:**
```
[dotenv@17.2.3] injecting env (5) from .env
                                 ^^^
                                 5 biến = OK!
```

3. **Test login API:**
```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Response thành công:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

## 📝 CHECKLIST

- [x] File `.env` tồn tại trong project root
- [x] File `.env` có encoding UTF-8 (không có BOM)
- [x] Không có dòng trống ở đầu/cuối file
- [x] Không có comment (#) ở đầu dòng có giá trị
- [x] Không có khoảng trắng thừa
- [x] dotenv.config() có path đúng
- [x] Server đã restart
- [x] Log hiện (5) hoặc số biến đúng

## 🐛 DEBUG

### Kiểm tra dotenv có load được không:

Thêm vào `src/api/index.js` tạm thời:
```javascript
dotenv.config({ path: envPath, debug: true });

console.log('ENV loaded:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME ? 'Set' : 'NOT SET');
```

Nếu vẫn "NOT SET" → File `.env` có vấn đề về encoding!

## ⚠️ LƯU Ý

1. **Không sử dụng Notepad** để tạo/sửa `.env`
   - Notepad thường thêm BOM
   - Dùng VS Code, Notepad++, hoặc terminal

2. **Line endings**
   - Windows: `CRLF` (đã OK)
   - Linux/Mac: `LF`
   - Git có thể tự động convert

3. **Không có dấu ngoặc kép** (trừ khi giá trị có space):
   ```env
   # ✅ Đúng
   JWT_SECRET=my-secret-key
   
   # ❌ Sai (trừ khi cần)
   JWT_SECRET="my-secret-key"
   ```

4. **Restart bắt buộc**
   - Mỗi lần sửa `.env` phải restart server
   - Ctrl+C và chạy lại `npm run server`

## 🎯 TÓM TẮT

**Vấn đề:** File `.env` encoding sai → dotenv load 0 biến → JWT_SECRET undefined → lỗi 500

**Giải pháp:** Tạo lại `.env` với UTF-8 encoding đúng + fix dotenv config path

**Kết quả:** Login thành công ✅

---

**Status:** ✅ FIXED
**Date:** Dec 2025

