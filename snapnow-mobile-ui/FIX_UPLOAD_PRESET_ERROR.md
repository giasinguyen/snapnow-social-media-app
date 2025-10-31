# 🔧 Fix: Upload Preset Not Found

## ❌ Lỗi hiện tại:
```
ERROR ❌ Cloudinary upload error: [Error: Upload preset not found]
```

## 🔍 Nguyên nhân:
Upload preset `snapnow` chưa được tạo trên Cloudinary hoặc chưa được cấu hình đúng.

---

## ✅ Giải pháp: Tạo Upload Preset

### Bước 1: Đăng nhập Cloudinary

1. Truy cập: https://console.cloudinary.com/
2. Đăng nhập với tài khoản của bạn (Cloud Name: **dqmlxcbxt**)

### Bước 2: Vào Settings

1. Click vào icon **⚙️ Settings** (góc trên bên phải)
2. Hoặc truy cập trực tiếp: https://console.cloudinary.com/settings

### Bước 3: Tạo Upload Preset

1. Trong Settings, tìm tab **Upload** ở sidebar bên trái
2. Scroll xuống phần **Upload presets**
3. Click nút **Add upload preset** (màu xanh)

### Bước 4: Cấu hình Upload Preset

**⚠️ CỰC KỲ QUAN TRỌNG - Cấu hình đúng như sau:**

```
📝 Upload preset name: snapnow
🔓 Signing Mode: Unsigned    <-- PHẢI CHỌN UNSIGNED!
📁 Folder: snapnow           (optional)
```

**Chi tiết cấu hình:**

#### Tab "General":
- **Upload preset name**: `snapnow` (chính xác như trong .env)
- **Signing Mode**: **Unsigned** ⚠️ (KHÔNG phải Signed!)
- **Folder**: `snapnow` (để tự động tạo folder)

#### Tab "Upload Manipulations" (Optional):
- **Unique filename**: ✅ ON (tránh trùng tên)
- **Overwrite**: ❌ OFF (giữ lại file cũ)
- **Format**: Leave as default
- **Quality**: Auto

#### Tab "Eager transformations" (Optional):
Skip - không cần thiết

### Bước 5: Save

1. Scroll xuống cuối trang
2. Click nút **Save** (màu xanh)
3. Đợi notification "Preset saved successfully"

---

## 🔍 Verify Upload Preset đã tạo thành công

1. Vẫn ở trang Settings → Upload
2. Scroll xuống phần **Upload presets**
3. Bạn sẽ thấy preset `snapnow` trong danh sách
4. Click vào để xem chi tiết:
   ```
   Name: snapnow
   Signing Mode: Unsigned  ✅
   ```

---

## 🧪 Test lại trong App

Sau khi tạo xong upload preset:

### Không cần restart app!

1. **Test Upload Avatar**:
   - Profile → Edit Profile
   - Chọn ảnh
   - Click Save
   - Xem console log

2. **Expect logs**:
   ```
   🔧 Cloudinary Config: {
     cloudName: 'dqmlxcbxt',
     uploadPreset: 'snapnow',
     uploadUrl: 'https://api.cloudinary.com/v1_1/dqmlxcbxt/image/upload'
   }
   📋 Using upload preset: snapnow
   ✅ Cloudinary upload success: {
     url: 'https://res.cloudinary.com/...',
     ...
   }
   ```

---

## 🐛 Nếu vẫn lỗi

### Kiểm tra lại:

1. **Upload preset name phải chính xác**: `snapnow` (không có spaces, lowercase)

2. **Signing Mode phải là Unsigned**:
   - Settings → Upload → Click vào preset `snapnow`
   - Xem "Signing Mode" → Phải là **Unsigned**
   - Nếu là "Signed" → Edit → Chọn **Unsigned** → Save

3. **Cloud name đúng chưa**:
   - Check console log: `cloudName: 'dqmlxcbxt'`
   - Nếu hiện `''` hoặc `undefined` → Restart Metro: `npx expo start -c`

4. **Upload URL đúng chưa**:
   - Should be: `https://api.cloudinary.com/v1_1/dqmlxcbxt/image/upload`

---

## 📸 Screenshots để tham khảo

### Settings → Upload page:
```
┌─────────────────────────────────────┐
│ Upload                              │
├─────────────────────────────────────┤
│ Upload presets                      │
│                                     │
│ [+ Add upload preset]               │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ snapnow                         ││
│ │ Signing Mode: Unsigned          ││
│ │ Folder: snapnow                 ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Create/Edit preset form:
```
┌─────────────────────────────────────┐
│ Upload preset name                  │
│ [snapnow                        ]   │
│                                     │
│ Signing Mode                        │
│ ○ Signed                            │
│ ● Unsigned  ← SELECT THIS!          │
│                                     │
│ Folder (optional)                   │
│ [snapnow                        ]   │
│                                     │
│ [Save]  [Cancel]                    │
└─────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] Đăng nhập Cloudinary Console
- [ ] Vào Settings → Upload
- [ ] Click "Add upload preset"
- [ ] Đặt tên: `snapnow`
- [ ] Chọn Signing Mode: **Unsigned** ⚠️
- [ ] (Optional) Set folder: `snapnow`
- [ ] Click Save
- [ ] Verify preset xuất hiện trong danh sách
- [ ] Test upload trong app
- [ ] Check console logs
- [ ] Upload thành công!

---

## 💡 Giải thích

### Tại sao cần Unsigned mode?

- **Unsigned**: Client (mobile app) có thể upload trực tiếp mà không cần backend signature
- **Signed**: Cần backend generate signature cho mỗi upload (secure hơn nhưng phức tạp)

### Hiện tại dùng Unsigned vì:
- ✅ Đơn giản, không cần backend
- ✅ Phù hợp cho development
- ✅ Vẫn an toàn với rate limiting của Cloudinary

### Production nên:
- Chuyển sang Signed mode
- Upload qua backend API
- Backend validate file size, type
- Backend generate signature

---

## 📞 Nếu vẫn bị lỗi

Share console logs này để debug:
```
🔧 Cloudinary Config: { ... }
📋 Using upload preset: ...
❌ Cloudinary API Error: { ... }
```

---

**🎯 Sau khi làm xong các bước trên, thử upload lại ngay!**
