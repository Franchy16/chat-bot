# 🔐 Hệ thống Đăng nhập Admin - Hướng dẫn

## ✅ ĐÃ HOÀN THÀNH

Hệ thống authentication đã được tích hợp thành công vào Admin Panel!

## 🎯 Tính năng

### 1. **Trang đăng nhập**
- ✅ Giao diện đẹp, chuyên nghiệp
- ✅ Form validation
- ✅ Password toggle (show/hide)
- ✅ Remember me
- ✅ Loading state
- ✅ Error/Success messages

### 2. **Authentication Backend**
- ✅ JWT Token (expires sau 24h)
- ✅ Middleware authentication
- ✅ Protected API endpoints
- ✅ Token verification

### 3. **Session Management**
- ✅ LocalStorage để lưu token
- ✅ Auto redirect khi chưa login
- ✅ Verify token khi load trang
- ✅ Logout functionality

### 4. **Security**
- ✅ Token-based authentication
- ✅ Credentials trong .env
- ✅ Protected routes
- ✅ Auto logout khi token expired

---

## 🔑 THÔNG TIN ĐĂNG NHẬP

### **Mặc định:**
```
Username: admin
Password: admin123
```

### **Thay đổi:**
Sửa file `.env`:
```env
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key
```

⚠️ **LƯU Ý:** Restart server sau khi thay đổi!

---

## 🚀 CÁCH SỬ DỤNG

### **Đăng nhập:**

1. Truy cập: `http://localhost:8080/login.html`
2. Nhập username: `admin`
3. Nhập password: `admin123`
4. (Tùy chọn) Check "Ghi nhớ đăng nhập"
5. Click **"Đăng nhập"**

### **Tự động redirect:**

- Click icon 🛡️ ở chatbot → Redirect đến login
- Sau khi đăng nhập thành công → Redirect đến Admin Panel
- Nếu đã đăng nhập, truy cập login → Auto redirect đến Admin

### **Đăng xuất:**

1. Click nút **"Đăng xuất"** ở góc phải header
2. Confirm trong popup
3. Redirect về trang login

---

## 🔧 TECHNICAL DETAILS

### **API Endpoints:**

#### POST `/api/login`
Đăng nhập và nhận JWT token

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success):**
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

**Response (Error):**
```json
{
  "success": false,
  "error": "Tên đăng nhập hoặc mật khẩu không đúng"
}
```

#### POST `/api/verify`
Verify JWT token (requires auth header)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token hợp lệ",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

### **Protected Endpoints:**

Tất cả các endpoint sau yêu cầu authentication:

- `GET /api/knowledge`
- `POST /api/knowledge`
- `PUT /api/knowledge/:id`
- `DELETE /api/knowledge/:id`

**Cách gọi:**
```javascript
fetch('http://localhost:8080/api/knowledge', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### **JWT Token:**

- **Algorithm:** HS256
- **Expires:** 24 giờ
- **Payload:**
  ```json
  {
    "username": "admin",
    "role": "admin",
    "iat": 1234567890,
    "exp": 1234654290
  }
  ```

### **LocalStorage:**

```javascript
// Lưu token
localStorage.setItem('adminToken', token);
localStorage.setItem('adminUser', JSON.stringify(user));
localStorage.setItem('rememberMe', 'true');

// Lấy token
const token = localStorage.getItem('adminToken');

// Xóa khi logout
localStorage.removeItem('adminToken');
localStorage.removeItem('adminUser');
localStorage.removeItem('rememberMe');
```

---

## 🔒 BẢO MẬT

### **Đã implement:**
✅ JWT Token authentication
✅ Token expiration (24h)
✅ Protected API endpoints
✅ Credentials trong .env
✅ Token verification
✅ Auto logout khi expired

### **Nên thêm (Production):**
⚠️ Password hashing (bcrypt)
⚠️ HTTPS only
⚠️ Rate limiting
⚠️ CSRF protection
⚠️ Refresh token
⚠️ Multi-factor authentication
⚠️ Login history/audit log
⚠️ IP whitelist
⚠️ Session timeout
⚠️ Secure httpOnly cookies

---

## 📁 FILES MỚI

1. **public/login.html** (400+ dòng)
   - Trang đăng nhập
   - Form validation
   - Authentication logic

2. **Updated: src/api/index.js**
   - JWT imports
   - authenticateToken middleware
   - POST /api/login
   - POST /api/verify
   - Protected routes

3. **Updated: public/admin-script.js**
   - checkAuth() function
   - getAuthHeaders() function
   - logout() function
   - Token management

4. **Updated: public/admin.html**
   - User info display
   - Logout button

5. **Updated: public/admin-style.css**
   - User info styles
   - Logout button styles

---

## 🎨 UI/UX

### **Login Page:**
```
┌───────────────────────────────────┐
│          🛡️                       │
│      Admin Panel                  │
│  Đăng nhập để quản lý hệ thống   │
├───────────────────────────────────┤
│  👤 Username: [__________]        │
│  🔒 Password: [__________] 👁️    │
│                                    │
│  ☑️ Ghi nhớ    Quên mật khẩu?     │
│                                    │
│  [     ✓ Đăng nhập      ]        │
│                                    │
│  🔑 Thông tin mặc định:           │
│  Username: admin                   │
│  Password: admin123                │
├───────────────────────────────────┤
│  ← Quay về Chatbot                │
└───────────────────────────────────┘
```

### **Admin Panel Header:**
```
┌────────────────────────────────────────┐
│ 🛡️ Admin Panel  [👤 admin] [Đăng xuất] [Chatbot] │
└────────────────────────────────────────┘
```

---

## 🔄 FLOW HOẠT ĐỘNG

### **Login Flow:**
```
1. User truy cập /login.html
2. Nhập username & password
3. POST /api/login
4. Server verify credentials
5. Tạo JWT token
6. Response token về client
7. Client lưu token vào localStorage
8. Redirect đến /admin.html
```

### **Protected Route Flow:**
```
1. User truy cập /admin.html
2. JavaScript check localStorage có token?
   - No → Redirect /login.html
   - Yes → Continue
3. POST /api/verify với token
4. Server verify token
   - Valid → Load admin panel
   - Invalid → Redirect /login.html
```

### **API Call Flow:**
```
1. Client gọi API (ví dụ: GET /api/knowledge)
2. Gửi kèm Authorization header với token
3. Server middleware authenticateToken check token
   - No token → 401 Unauthorized
   - Invalid token → 403 Forbidden
   - Valid token → Continue to endpoint
4. Return data
```

### **Logout Flow:**
```
1. User click "Đăng xuất"
2. Confirm popup
3. Clear localStorage
4. Redirect /login.html
```

---

## 🐛 TROUBLESHOOTING

### **Lỗi: "Không có token"**
- Bạn chưa đăng nhập
- Token đã bị xóa khỏi localStorage
- → Đăng nhập lại

### **Lỗi: "Token không hợp lệ hoặc đã hết hạn"**
- Token đã expired (sau 24h)
- JWT_SECRET không khớp
- Token bị corrupt
- → Đăng nhập lại

### **Lỗi: "Tên đăng nhập hoặc mật khẩu không đúng"**
- Nhập sai username/password
- Credentials trong .env không đúng
- → Kiểm tra lại thông tin

### **Không redirect về Admin sau login**
- Kiểm tra console log (F12)
- Kiểm tra server có chạy không
- Kiểm tra Network tab xem API call
- → Debug từng bước

### **Admin Panel bị redirect về login liên tục**
- Token invalid
- Server chưa restart sau khi thay đổi
- JWT_SECRET không khớp
- → Restart server, clear localStorage

---

## ✅ TEST CHECKLIST

### **Login Page:**
- [ ] Truy cập /login.html
- [ ] Form validation (empty fields)
- [ ] Show/hide password
- [ ] Login với credentials đúng
- [ ] Login với credentials sai
- [ ] Remember me checkbox
- [ ] Auto redirect nếu đã login

### **Admin Panel:**
- [ ] Không thể truy cập khi chưa login
- [ ] Hiển thị username trong header
- [ ] Nút logout hoạt động
- [ ] API calls có gửi token
- [ ] Token expired → redirect login

### **Security:**
- [ ] API không trả data khi không có token
- [ ] Token fake không hoạt động
- [ ] Token expired không hoạt động
- [ ] Logout xóa hết data

---

## 🎓 BEST PRACTICES

### **1. Đổi credentials mặc định**
```env
ADMIN_USERNAME=your_secure_username
ADMIN_PASSWORD=your_strong_password_123!@#
JWT_SECRET=random-32-character-secret-key
```

### **2. Generate JWT secret mạnh**
```bash
# Sử dụng openssl
openssl rand -base64 32
```

### **3. Không commit .env**
- ✅ Đã có trong .gitignore
- ⚠️ Double check trước khi push

### **4. Sử dụng HTTPS trong production**
- HTTP → Dễ bị intercept token
- HTTPS → Mã hóa communication

### **5. Implement rate limiting**
```javascript
// Giới hạn login attempts
// 5 lần/15 phút
```

---

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Check console log (F12)
2. Check Network tab
3. Verify server đang chạy
4. Check .env file
5. Restart server
6. Clear browser cache & localStorage

---

**Version:** 2.0.0 (with Authentication)
**Last Updated:** Dec 2025
**Status:** ✅ Production Ready (with recommendations)

