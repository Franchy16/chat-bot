# 🛡️ Admin Panel - Hướng dẫn Quản lý

## 📋 Tổng quan

Admin Panel cho phép bạn quản lý tất cả câu trả lời mặc định của chatbot.

## 🔗 Truy cập

**URL:** `http://localhost:8080/admin.html`

Hoặc click icon 🛡️ ở góc phải header của trang chatbot.

## ✨ Tính năng

### 1. **Xem danh sách câu trả lời**
- Hiển thị tất cả câu hỏi và câu trả lời
- Xem theo bảng với đầy đủ thông tin
- Hiển thị ngày tạo

### 2. **Thêm câu trả lời mới**
- Click nút "Thêm mới"
- Nhập câu hỏi (tối đa 200 ký tự)
- Nhập câu trả lời (tối đa 2000 ký tự)
- Hỗ trợ emoji và xuống dòng
- Click "Lưu lại"

### 3. **Chỉnh sửa câu trả lời**
- Click nút ✏️ (Edit) ở dòng muốn sửa
- Cập nhật thông tin
- Click "Lưu lại"

### 4. **Xóa câu trả lời**
- Click nút 🗑️ (Delete) ở dòng muốn xóa
- Xác nhận xóa trong popup
- **Lưu ý:** Không thể hoàn tác!

### 5. **Tìm kiếm**
- Nhập từ khóa vào ô "Tìm kiếm..."
- Tìm trong cả câu hỏi và câu trả lời
- Real-time search (tìm ngay khi gõ)

### 6. **Làm mới dữ liệu**
- Click nút "Làm mới"
- Load lại dữ liệu mới nhất từ server

## 📊 Thống kê

Dashboard hiển thị 3 chỉ số:
- **Tổng câu trả lời:** Tổng số entry trong database
- **Thêm hôm nay:** Số entry được tạo trong ngày
- **Đã cập nhật:** Số entry đã từng được chỉnh sửa

## 🎨 Giao diện

### Layout
```
┌─────────────────────────────────────────┐
│  🛡️ Admin Panel          [Chatbot]     │
├──────────┬──────────────────────────────┤
│          │  [Thêm mới] [Làm mới] [🔍]  │
│ Sidebar  │  ┌────────────────────────┐  │
│          │  │  Thống kê Cards         │  │
│ • Câu TL │  └────────────────────────┘  │
│ • Thống kê│ ┌────────────────────────┐  │
│ • Cài đặt│ │  Bảng dữ liệu           │  │
│          │  │  [Edit] [Delete]        │  │
│          │  └────────────────────────┘  │
└──────────┴──────────────────────────────┘
```

### Màu sắc
- **Primary:** Xanh dương (#3b82f6)
- **Success:** Xanh lá (#10b981)
- **Danger:** Đỏ (#ef4444)
- **Warning:** Cam (#f59e0b)

## 🔧 API Endpoints

Admin Panel sử dụng các API sau:

### GET `/api/knowledge`
Lấy tất cả câu trả lời

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 8
}
```

### POST `/api/knowledge`
Thêm câu trả lời mới

**Request:**
```json
{
  "keyword": "Câu hỏi",
  "answer": "Câu trả lời"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã thêm câu trả lời mới",
  "data": {...}
}
```

### PUT `/api/knowledge/:id`
Cập nhật câu trả lời

**Request:**
```json
{
  "keyword": "Câu hỏi updated",
  "answer": "Câu trả lời updated"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã cập nhật câu trả lời",
  "data": {...}
}
```

### DELETE `/api/knowledge/:id`
Xóa câu trả lời

**Response:**
```json
{
  "success": true,
  "message": "Đã xóa câu trả lời",
  "data": {...}
}
```

## 💡 Tips & Best Practices

### 1. Viết câu hỏi tốt
✅ **Tốt:**
- "Lịch học tuần này như thế nào?"
- "Cách đăng ký môn học?"
- "Học phí học kỳ này là bao nhiêu?"

❌ **Không tốt:**
- "Lịch" (quá ngắn)
- "học học học" (không rõ nghĩa)
- "????????" (vô nghĩa)

### 2. Viết câu trả lời tốt
✅ **Tốt:**
- Có cấu trúc rõ ràng
- Sử dụng emoji để dễ đọc
- Chia thành các điểm với bullet points
- Có thông tin cụ thể (số, ngày, địa chỉ)

❌ **Không tốt:**
- Quá ngắn, không đầy đủ
- Không có cấu trúc
- Thông tin mơ hồ

### 3. Sử dụng emoji
Emoji giúp câu trả lời sinh động hơn:
- 📅 Lịch, thời gian
- 📚 Học tập, sách
- 💰 Tiền, học phí
- 📍 Địa điểm
- ⏰ Giờ giấc
- 📞 Liên hệ
- ✅ Xác nhận
- ❌ Từ chối
- 🎓 Tốt nghiệp

### 4. Xuống dòng
Sử dụng Enter để xuống dòng trong textarea:
```
📅 Lịch học tuần này:
- Thứ 2: Toán cao cấp
- Thứ 3: Lập trình Web
- Thứ 4: Cơ sở dữ liệu
```

### 5. Thông tin cụ thể
Luôn cung cấp:
- Số điện thoại liên hệ
- Địa chỉ cụ thể (tòa nhà, phòng)
- Link website
- Thời gian cụ thể
- Hạn chót nếu có

## 🐛 Xử lý lỗi

### Lỗi: "Lỗi kết nối server"
**Nguyên nhân:** Server không chạy hoặc mất kết nối

**Giải pháp:**
1. Kiểm tra server có chạy không: `npm run server`
2. Kiểm tra URL API đúng chưa
3. Kiểm tra kết nối internet

### Lỗi: "Thiếu keyword hoặc answer"
**Nguyên nhân:** Chưa điền đầy đủ form

**Giải pháp:**
1. Điền cả 2 trường bắt buộc (có dấu *)
2. Không để trống

### Lỗi: "Không tìm thấy entry"
**Nguyên nhân:** Entry đã bị xóa hoặc không tồn tại

**Giải pháp:**
1. Click "Làm mới" để reload dữ liệu
2. Kiểm tra lại ID

## ⌨️ Phím tắt

- **Ctrl + S:** Lưu form (khi đang mở modal)
- **Esc:** Đóng modal
- **Ctrl + F:** Focus vào ô tìm kiếm

## 📱 Responsive

Admin Panel tối ưu cho:
- **Desktop:** Full features
- **Tablet:** Sidebar chuyển thành top bar
- **Mobile:** Scroll ngang cho bảng

## 🔐 Bảo mật (Tương lai)

Hiện tại Admin Panel chưa có authentication. Trong production nên:
- Thêm login page
- Xác thực JWT token
- Phân quyền user/admin
- Rate limiting
- HTTPS bắt buộc

## 🚀 Workflow Khuyến nghị

### Thêm kiến thức mới:
1. Sinh viên hỏi câu mới trong chatbot
2. AI trả lời và tự động lưu vào database
3. Admin vào Admin Panel
4. Kiểm tra và chỉnh sửa câu trả lời cho chính xác
5. Lưu lại

### Cập nhật định kỳ:
1. Mỗi tuần/tháng review lại database
2. Xóa câu trả lời lỗi thời
3. Cập nhật thông tin mới (học phí, lịch...)
4. Thêm câu hỏi thường gặp mới

### Backup:
1. Export file `db.json` định kỳ
2. Lưu trữ ở nơi an toàn
3. Version control với Git

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra Console log (F12)
2. Kiểm tra Network tab (F12)
3. Restart server
4. Clear browser cache

---

**Version:** 1.0.0  
**Last Updated:** Dec 2025

