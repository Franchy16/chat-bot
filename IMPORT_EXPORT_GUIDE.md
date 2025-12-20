# 📊 Import/Export Excel - Hướng dẫn

## ✅ TÍNH NĂNG MỚI

Quản lý knowledge base hàng loạt với Excel!

### **3 Chức năng:**
1. 📥 **Export** - Xuất toàn bộ dữ liệu ra Excel
2. 📤 **Import** - Nhập nhiều câu hỏi từ Excel
3. 📄 **Template** - Tải mẫu Excel để điền

---

## 🚀 CÁCH SỬ DỤNG

### **1. EXPORT (Xuất dữ liệu)**

**Mục đích:** Sao lưu hoặc chỉnh sửa offline

**Các bước:**
1. Đăng nhập Admin Panel
2. Click nút **"Export Excel"** 
3. File sẽ tự động download
4. Tên file: `knowledge-base-[timestamp].xlsx`

**Nội dung file:**
- STT
- ID
- Câu hỏi
- Câu trả lời  
- Ngày tạo
- Ngày cập nhật

**Dùng để:**
- ✅ Backup định kỳ
- ✅ Chỉnh sửa hàng loạt
- ✅ Chia sẻ với team
- ✅ Báo cáo

---

### **2. TEMPLATE (Tải mẫu)**

**Mục đích:** Có file mẫu đúng format để import

**Các bước:**
1. Click nút **"Template"**
2. File `knowledge-template.xlsx` sẽ download
3. Mở file trong Excel
4. Thấy 2 dòng ví dụ

**Cột trong template:**
- **STT**: Số thứ tự (tùy chọn)
- **Câu hỏi**: Câu hỏi từ sinh viên (bắt buộc)
- **Câu trả lời**: Câu trả lời từ admin (bắt buộc)

---

### **3. IMPORT (Nhập dữ liệu)**

**Mục đích:** Thêm nhiều câu hỏi cùng lúc

**Các bước:**

#### **Bước 1: Chuẩn bị file Excel**

Tải template hoặc dùng file có sẵn với format:

| STT | Câu hỏi | Câu trả lời |
|-----|---------|-------------|
| 1 | Học phí bao nhiêu? | Học phí: 10 triệu/kỳ |
| 2 | Lịch thi khi nào? | Thi từ 15/1 - 30/1 |

**Lưu ý:**
- File phải là `.xlsx` hoặc `.xls`
- Tối đa 5MB
- Cột "STT" không bắt buộc
- Hỗ trợ tên cột tiếng Việt hoặc English:
  - Câu hỏi / Cau hoi / Question / keyword
  - Câu trả lời / Cau tra loi / Answer / answer

#### **Bước 2: Import**

1. Click nút **"Import Excel"**
2. Chọn file Excel
3. Confirm import
4. Đợi xử lý

#### **Bước 3: Xem kết quả**

Thông báo sẽ hiện:
```
Import thành công X câu trả lời
```

Nếu có lỗi:
```
Imported: 8
Errors: 2

Dòng 3: Thiếu câu hỏi hoặc câu trả lời
Dòng 5: Câu hỏi "..." đã tồn tại
```

---

## 📋 QUY TẮC IMPORT

### **✅ Được chấp nhận:**
- File Excel (.xlsx, .xls)
- Tối đa 5MB
- Nhiều dòng (không giới hạn)
- Emoji trong nội dung
- Xuống dòng trong cell

### **❌ Bị từ chối:**
- File không phải Excel
- File > 5MB
- Dòng thiếu câu hỏi hoặc câu trả lời
- Câu hỏi trùng với database (bị skip)

### **Xử lý trùng lặp:**
- So sánh câu hỏi (không phân biệt hoa/thường)
- Nếu trùng → Skip + báo lỗi
- Không ghi đè dữ liệu cũ

---

## 🎯 USE CASES

### **Case 1: Khởi tạo database**
```
1. Tải template
2. Điền 50-100 câu hỏi phổ biến
3. Import một lần
4. Có sẵn knowledge base hoàn chỉnh
```

### **Case 2: Backup định kỳ**
```
Hàng tuần:
1. Export dữ liệu
2. Lưu vào Google Drive / OneDrive
3. Version: backup-YYYY-MM-DD.xlsx
```

### **Case 3: Cập nhật hàng loạt**
```
1. Export dữ liệu hiện tại
2. Mở Excel, sửa nhiều câu trả lời
3. Xóa toàn bộ trong Admin Panel
4. Import file đã sửa
```

### **Case 4: Team collaboration**
```
1. Admin export file
2. Gửi cho team review
3. Team bổ sung câu hỏi mới
4. Admin import file từ team
```

---

## 💡 TIPS & BEST PRACTICES

### **1. Chuẩn bị dữ liệu:**
```excel
✅ Tốt:
Câu hỏi: "Học phí học kỳ này là bao nhiêu?"
Câu trả lời: "💰 Học phí: 10.000.000 VNĐ"

❌ Không tốt:
Câu hỏi: "hoc phi"
Câu trả lời: "10tr"
```

### **2. Sử dụng Excel:**
- Format cells as "Text" để giữ nguyên format
- Wrap text cho câu trả lời dài
- Dùng Alt+Enter để xuống dòng trong cell

### **3. Emoji:**
```
✅ Có thể dùng emoji trong Excel:
📚 Học tập
💰 Học phí
📅 Lịch
⏰ Thời gian
```

### **4. Xuống dòng:**
```
Câu trả lời có thể nhiều dòng:
"Học phí bao gồm:
- Học phí cơ bản: 10 triệu
- Phí dịch vụ: 500k
- Bảo hiểm: 600k"
```

### **5. Backup:**
- Export mỗi tuần
- Đặt tên file có ngày tháng
- Lưu ở nhiều nơi (local + cloud)

---

## 🔧 API ENDPOINTS

### **GET `/api/knowledge/export`**
Export toàn bộ knowledge base

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
- File Excel binary
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="knowledge-base-[timestamp].xlsx"`

---

### **POST `/api/knowledge/import`**
Import từ Excel file

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
FormData with key: 'file'
```

**Response:**
```json
{
  "success": true,
  "message": "Import thành công 10 câu trả lời",
  "data": {
    "imported": 10,
    "errors": 2,
    "details": [
      "Dòng 3: Thiếu câu hỏi",
      "Dòng 5: Câu hỏi đã tồn tại"
    ]
  }
}
```

---

### **GET `/api/knowledge/template`**
Download template Excel

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
- Template file Excel
- Filename: `knowledge-template.xlsx`

---

## 🐛 TROUBLESHOOTING

### **Lỗi: "Chỉ chấp nhận file Excel"**
- File không phải .xlsx hoặc .xls
- → Lưu file Excel dạng .xlsx

### **Lỗi: "File quá lớn"**
- File > 5MB
- → Chia nhỏ thành nhiều file

### **Lỗi: "File Excel rỗng"**
- Không có dữ liệu hoặc format sai
- → Kiểm tra có ít nhất 1 dòng data

### **Lỗi: "Thiếu câu hỏi hoặc câu trả lời"**
- Dòng có cell trống
- → Điền đầy đủ cả 2 cột

### **Import thành công nhưng 0 dòng:**
- Tất cả câu hỏi đều trùng
- → Check database có sẵn câu hỏi đó chưa

---

## 📊 FORMAT FILE EXCEL

### **Cột bắt buộc:**
```
| Câu hỏi | Câu trả lời |
```

### **Cột tùy chọn:**
```
| STT | ID | Ngày tạo | Ngày cập nhật |
```

### **Tên cột hỗ trợ:**

**Câu hỏi:**
- Câu hỏi (tiếng Việt)
- Cau hoi (không dấu)
- Question (English)
- keyword (lowercase)

**Câu trả lời:**
- Câu trả lời
- Cau tra loi
- Answer
- answer

---

## ⚙️ CONFIGURATION

### **File size limit:**
Mặc định: 5MB

Để thay đổi, sửa `src/api/index.js`:
```javascript
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    //...
});
```

### **Accepted file types:**
```javascript
fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file Excel'));
    }
}
```

---

## 📚 EXAMPLES

### **Example 1: Import simple**
```excel
| STT | Câu hỏi | Câu trả lời |
|-----|---------|-------------|
| 1 | Học phí? | 10 triệu VNĐ |
| 2 | Lịch thi? | 15/1 - 30/1 |
```

### **Example 2: Import with emoji**
```excel
| Câu hỏi | Câu trả lời |
|---------|-------------|
| Thư viện mở cửa? | 📚 7h00 - 21h00 |
| Học phí? | 💰 10.000.000 VNĐ |
```

### **Example 3: Import with multiline**
```excel
| Câu hỏi | Câu trả lời |
|---------|-------------|
| Học phí? | Học phí bao gồm:
- Cơ bản: 10 triệu
- Dịch vụ: 500k
- Bảo hiểm: 600k |
```

---

## 🎉 SUMMARY

**3 nút mới trong Admin Panel:**
- 📥 **Export Excel** - Xuất dữ liệu
- 📤 **Import Excel** - Nhập dữ liệu
- 📄 **Template** - Tải mẫu

**Benefits:**
- ✅ Quản lý hàng loạt
- ✅ Backup dễ dàng
- ✅ Team collaboration
- ✅ Offline editing

**Status:** ✅ Production Ready

---

**Version:** 2.1.0  
**Last Updated:** Dec 2025

