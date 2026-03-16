# 📱 Truy cập từ Mobile - Hướng dẫn

## ❌ VẤN ĐỀ

Khi truy cập từ điện thoại, gặp lỗi "Lỗi kết nối server" vì:
- `localhost` trên mobile = chính điện thoại, không phải máy tính
- Cần dùng **IP address** của máy tính chạy server

## ✅ ĐÃ FIX

Code đã được cập nhật để **tự động detect** API URL:
- Desktop (localhost) → Dùng `localhost:8080`
- Mobile/Remote → Tự động dùng IP từ URL hiện tại

## 🚀 CÁCH TRUY CẬP TỪ MOBILE

### **Bước 1: Tìm IP Address của máy tính**

**Windows:**
```powershell
ipconfig
```
Tìm **IPv4 Address** (ví dụ: `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# hoặc
ip addr
```

### **Bước 2: Đảm bảo cùng mạng WiFi**

- ✅ Mobile và máy tính phải cùng WiFi
- ✅ Hoặc cùng mạng LAN

### **Bước 3: Truy cập từ mobile**

Thay `localhost` bằng IP address:

```
http://192.168.1.100:8080
```

**Ví dụ:**
- Login: `http://192.168.1.100:8080/login.html`
- Chatbot: `http://192.168.1.100:8080`
- Admin: `http://192.168.1.100:8080/admin.html`

### **Bước 4: Kiểm tra Firewall**

**Windows:**
1. Windows Defender Firewall
2. Allow an app → Node.js
3. Hoặc tắt firewall tạm thời (không khuyến nghị)

**Mac:**
1. System Preferences → Security & Privacy → Firewall
2. Allow Node.js

## 🔧 CẤU HÌNH NÂNG CAO

### **Option 1: Dùng IP cố định**

Nếu muốn dùng IP cố định, sửa code:

**public/login.html:**
```javascript
const API_URL = 'http://192.168.1.100:8080/api';
```

**public/admin-script.js:**
```javascript
const API_BASE = 'http://192.168.1.100:8080/api';
```

**public/script.js:**
```javascript
const API_URL = 'http://192.168.1.100:8080/chat';
```

### **Option 2: Environment variable**

Có thể thêm config trong HTML:
```html
<script>
    window.API_BASE = 'http://192.168.1.100:8080';
</script>
```

## 🐛 TROUBLESHOOTING

### **Lỗi: "Lỗi kết nối server"**

**Nguyên nhân:**
1. IP address sai
2. Không cùng mạng WiFi
3. Firewall chặn
4. Server không chạy

**Giải pháp:**
1. ✅ Kiểm tra IP address đúng chưa
2. ✅ Đảm bảo cùng WiFi
3. ✅ Tắt firewall tạm thời để test
4. ✅ Kiểm tra server đang chạy: `npm run server`

### **Lỗi: "CORS policy"**

**Nguyên nhân:** Server chưa cho phép CORS từ IP khác

**Giải pháp:** Đã fix trong code với `app.use(cors())`

### **Không tìm thấy trang**

**Nguyên nhân:** Port 8080 bị chặn hoặc server không chạy

**Giải pháp:**
1. Kiểm tra server: `http://localhost:8080` trên máy tính
2. Nếu không được → Restart server
3. Thử port khác trong `.env`

## 💡 TIPS

### **1. Dùng ngrok để truy cập từ xa**

```bash
npm install -g ngrok
ngrok http 8080
```

Sẽ có URL public: `https://xxxx.ngrok.io`

### **2. Dùng IP động (DHCP)**

IP có thể thay đổi mỗi lần kết nối WiFi. Để tránh:
- Set IP tĩnh trong router
- Hoặc dùng hostname (nếu router hỗ trợ)

### **3. Test từ mobile browser**

1. Mở Chrome/Safari trên mobile
2. Nhập: `http://[IP]:8080`
3. Nếu thấy trang → OK
4. Nếu không → Check firewall/network

## 📊 CHECKLIST

- [ ] Tìm IP address máy tính
- [ ] Mobile và máy tính cùng WiFi
- [ ] Firewall cho phép port 8080
- [ ] Server đang chạy
- [ ] Truy cập `http://[IP]:8080` từ mobile
- [ ] Test login từ mobile
- [ ] Test chatbot từ mobile

## 🎯 QUICK START

**1. Tìm IP:**
```powershell
# Windows
ipconfig | findstr IPv4
```

**2. Truy cập từ mobile:**
```
http://[YOUR_IP]:8080
```

**3. Nếu không được:**
- Check firewall
- Check cùng WiFi
- Restart server

---

**Status:** ✅ Code đã được fix để tự động detect  
**Date:** Dec 2025

