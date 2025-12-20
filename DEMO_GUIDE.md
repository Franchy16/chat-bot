# 📸 Hướng dẫn Sử dụng Chatbot - Demo

## 🎯 Giao diện chính

```
┌─────────────────────────────────────────────────────┐
│  🤖  Chatbot Tư Vấn Học Tập         [🗑️]          │
│      Đang hoạt động ●                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🤖  Xin chào! 👋 Tôi là trợ lý AI...              │
│      Tôi có thể giúp bạn về:                       │
│      • 📚 Thông tin học tập                        │
│      • 📅 Lịch học và lịch thi                     │
│      • 📝 Đăng ký môn học                          │
│      • 💯 Điểm số và kết quả                       │
│                                                     │
│                        👤  Lịch học tuần này?      │
│                           như thế nào?             │
│                                                     │
│  🤖  📅 Lịch học tuần này:                         │
│      - Thứ 2: Toán cao cấp...                     │
│      - Thứ 3: Lập trình Web...                    │
│      Nguồn: Database                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [📎]  Nhập câu hỏi của bạn...          [✈️]      │
│  0/500 ký tự                                       │
└─────────────────────────────────────────────────────┘
```

## 💡 Các tính năng

### 1. Gửi tin nhắn
- Nhập câu hỏi vào ô input
- Nhấn Enter hoặc click nút gửi (✈️)
- Bot sẽ trả lời ngay lập tức

### 2. Gợi ý nhanh
Ở góc phải màn hình có các gợi ý:
- "Lịch học tuần này như thế nào?"
- "Cách đăng ký môn học?"
- "Học phí học kỳ này là bao nhiêu?"
- "Thời gian nghỉ tết là khi nào?"
- "Làm sao để xem điểm?"

Click vào gợi ý để gửi nhanh!

### 3. Xóa lịch sử
Click icon 🗑️ ở góc phải header để xóa toàn bộ chat

### 4. Xem nguồn
Mỗi câu trả lời hiển thị nguồn:
- "Database" → Lấy từ knowledge base
- "Google Gemini AI" → Trả lời từ AI

## 🎨 Màu sắc

### Tin nhắn của Bot
- Nền: Trắng
- Avatar: Gradient tím-xanh
- Icon: 🤖

### Tin nhắn của User
- Nền: Xanh dương
- Avatar: Gradient hồng-đỏ
- Icon: 👤

## ⌨️ Phím tắt

- **Enter**: Gửi tin nhắn
- **Shift + Enter**: Xuống dòng trong tin nhắn
- **Ctrl + K**: Focus vào input (tùy chọn)

## 📱 Responsive

### Desktop (> 768px)
- Chiều rộng tối đa: 900px
- Hiển thị suggestions ở bên phải
- Chat box với border radius đẹp

### Mobile (≤ 768px)
- Toàn màn hình
- Ẩn suggestions
- Avatar nhỏ hơn
- Input tối ưu cho touch

## 🔔 Thông báo

### Typing Indicator
Khi bot đang suy nghĩ:
```
🤖 ●●●
```
3 chấm nhảy lên xuống

### Error Message
Khi có lỗi:
```
🤖 Xin lỗi, đã có lỗi xảy ra...
   (Nền đỏ nhạt)
```

### Offline Warning
Khi mất mạng:
```
🤖 ⚠️ Bạn đang offline. Vui lòng kiểm tra...
```

## 💾 Lưu trữ

### LocalStorage
Chat history tự động lưu vào browser:
- Không mất khi refresh
- Mất khi clear browser data
- Chỉ lưu trên thiết bị hiện tại

### Knowledge Base
Lưu trong file `db.json`:
- Lưu vĩnh viễn trên server
- Tất cả user đều truy cập được
- Tự động cập nhật khi có câu hỏi mới

## 🎯 Demo Flow

```
User: "Lịch học tuần này?"
  ↓
🔍 Search trong database
  ↓ (Tìm thấy)
Bot: "📅 Lịch học tuần này: ..."
     Nguồn: Database

──────────────────────────

User: "Tổng thống Mỹ là ai?"
  ↓
🔍 Search trong database
  ↓ (Không tìm thấy)
🤖 Hỏi Google Gemini AI
  ↓
Bot: "Tổng thống Mỹ hiện nay là..."
     Nguồn: Google Gemini AI
  ↓
💾 Lưu vào database
```

## ⚡ Performance

- Load trang: < 1s
- API response: 1-3s (tùy AI)
- Database search: < 100ms
- Animation: 60 FPS
- Memory: < 50MB

## 🎓 Tips

1. **Đặt câu hỏi rõ ràng**
   ❌ "Học"
   ✅ "Lịch học tuần này như thế nào?"

2. **Sử dụng gợi ý**
   Giúp bạn biết bot có thể làm gì

3. **Kiểm tra nguồn**
   Database = Nhanh & Chính xác
   AI = Linh hoạt nhưng cần kiểm chứng

4. **Xóa lịch sử định kỳ**
   Giúp trang load nhanh hơn

5. **Bookmark trang**
   Để truy cập nhanh mỗi ngày

## 🐛 Troubleshooting

**Q: Bot không trả lời?**
A: Kiểm tra:
- Kết nối internet
- Console log (F12)
- Server có chạy không

**Q: Trả lời sai?**
A: Bot học từ câu hỏi trước
- Xóa entry sai trong db.json
- Restart server

**Q: Loading lâu?**
A: Google AI có thể chậm
- Đợi 3-5s
- Kiểm tra API quota

**Q: Mất lịch sử chat?**
A: LocalStorage bị xóa
- Không phục hồi được
- Knowledge base vẫn còn

---

🎉 **Chúc bạn sử dụng vui vẻ!** 🎉

