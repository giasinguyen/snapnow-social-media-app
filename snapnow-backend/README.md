# SnapNow Backend API 🚀

Backend server cho SnapNow Dashboard - Quản lý ứng dụng mạng xã hội chia sẻ ảnh.

## 🚀 Công nghệ sử dụng

- **Runtime**: Node.js v18+
- **Framework**: Express.js 4.18
- **Database**: Firebase Firestore
- **Authentication**: JWT + Firebase Admin SDK
- **Security**: Helmet, CORS, Rate Limiting

## 📦 Cài đặt

1. **Clone repository và di chuyển vào thư mục backend:**
```bash
cd snapnow-backend
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình Firebase Admin SDK:**

   **Cách 1: Sử dụng Service Account JSON file (Khuyến nghị)**
   - Truy cập [Firebase Console](https://console.firebase.google.com/)
   - Chọn project của bạn
   - Vào **Project Settings** > **Service accounts**
   - Click **Generate new private key**
   - Lưu file JSON vào `snapnow-backend/serviceAccountKey.json`

   **Cách 2: Sử dụng Environment Variables**
   - Copy nội dung từ service account JSON
   - Điền vào các biến trong file `.env` (xem bước tiếp theo)

4. **Cấu hình Environment Variables:**
   - Copy file `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
   
   - Mở file `.env` và cập nhật các giá trị:
   ```env
   NODE_ENV=development
   PORT=5000
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   
   # Firebase Admin SDK (Chọn 1 trong 2 cách)
   # Cách 1: Dùng file JSON (để trống nếu dùng cách này)
   # FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   
   # Cách 2: Dùng environment variables (điền nếu không dùng file JSON)
   # FIREBASE_PROJECT_ID=your-project-id
   # FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   # FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
   ```

5. **Tạo admin account đầu tiên (Optional):**
   - Sau khi start server, gọi API:
   ```bash
   POST http://localhost:5000/api/auth/register
   Content-Type: application/json
   
   {
     "email": "admin@snapnow.com",
     "password": "Admin@123456",
     "displayName": "Admin"
   }
   ```

## 🏃‍♂️ Chạy ứng dụng

### Development mode (với nodemon - auto reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server sẽ chạy tại: **http://localhost:5000**

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Tất cả các endpoint (trừ login/register) yêu cầu JWT token trong header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 🔐 Authentication (`/api/auth`)
- `POST /auth/login` - Đăng nhập dashboard admin
- `POST /auth/register` - Đăng ký admin mới
- `GET /auth/me` - Lấy thông tin admin hiện tại
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Đăng xuất

#### 👥 Users Management (`/api/users`)
- `GET /users` - Danh sách users (có phân trang, tìm kiếm)
- `GET /users/stats` - Thống kê users
- `GET /users/:userId` - Chi tiết user
- `PUT /users/:userId` - Cập nhật user
- `DELETE /users/:userId` - Xóa user
- `PUT /users/:userId/ban` - Ban/Unban user
- `GET /users/:userId/posts` - Danh sách posts của user
- `GET /users/:userId/activity` - Lịch sử hoạt động

#### 📝 Posts Management (`/api/posts`)
- `GET /posts` - Danh sách posts (có phân trang, lọc)
- `GET /posts/stats` - Thống kê posts
- `GET /posts/:postId` - Chi tiết post
- `DELETE /posts/:postId` - Xóa post
- `PUT /posts/:postId/hide` - Ẩn/Hiện post
- `GET /posts/:postId/comments` - Danh sách comments
- `GET /posts/reported` - Danh sách posts bị báo cáo

#### 📊 Analytics (`/api/analytics`)
- `GET /analytics/overview` - Tổng quan dashboard
- `GET /analytics/users` - Phân tích users
- `GET /analytics/posts` - Phân tích posts
- `GET /analytics/engagement` - Phân tích tương tác
- `GET /analytics/trending` - Nội dung trending
- `GET /analytics/retention` - Tỷ lệ giữ chân user

#### 🛡️ Moderation (`/api/moderation`)
- `GET /moderation/reports` - Danh sách báo cáo
- `PUT /moderation/reports/:reportId/resolve` - Xử lý báo cáo
- `GET /moderation/flagged` - Nội dung bị gắn cờ
- `POST /moderation/content/:contentId/review` - Review nội dung
- `GET /moderation/stats` - Thống kê moderation

### Response Format
Tất cả API response đều theo format:
```json
{
  "success": true,
  "data": { ... },
  "pagination": { // Nếu có phân trang
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🔒 Security Features

- **Helmet**: Bảo vệ khỏi các lỗ hổng web phổ biến
- **CORS**: Kiểm soát cross-origin requests
- **Rate Limiting**: Giới hạn 100 requests/15 phút mỗi IP
- **JWT**: Token-based authentication
- **bcryptjs**: Mã hóa password
- **Input Validation**: Sẵn sàng với express-validator

## 📁 Cấu trúc thư mục

```
snapnow-backend/
├── src/
│   ├── config/
│   │   └── firebase.admin.js      # Firebase Admin SDK config
│   ├── controllers/
│   │   ├── auth.controller.js     # Authentication logic
│   │   ├── user.controller.js     # User management
│   │   ├── post.controller.js     # Post management
│   │   ├── analytics.controller.js # Analytics & stats
│   │   └── moderation.controller.js # Content moderation
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT & Firebase auth
│   │   └── errorHandler.js        # Error handling
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── post.routes.js
│   │   ├── analytics.routes.js
│   │   └── moderation.routes.js
│   └── server.js                  # Main app entry
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testing

```bash
npm test
```

## 📝 Scripts

- `npm start` - Chạy production server
- `npm run dev` - Chạy development server với nodemon
- `npm test` - Chạy tests
- `npm run lint` - Kiểm tra code style
- `npm run format` - Format code với Prettier

## 🐛 Troubleshooting

### Lỗi: "Firebase Admin SDK initialization failed"
- Kiểm tra lại file `serviceAccountKey.json`
- Hoặc kiểm tra các biến môi trường Firebase trong `.env`

### Lỗi: "Port 5000 already in use"
- Thay đổi PORT trong file `.env`

### Lỗi: "JWT secret not configured"
- Đảm bảo đã set `JWT_SECRET` trong file `.env`

## 👥 Development Team – *The Challengers*
1. Nguyễn Trần Gia Sĩ – Team Leader  
2. Đào Quốc Tuấn  
3. Hà Xuân Phú  

---

## ✨ Key Features
- User Registration / Login (Firebase Authentication)
- Edit personal profile
- Create posts (photo + caption, hashtag)
- View feed (follow other users)
- Like & Comment on posts
- Follow / Unfollow
- Interaction notifications (Realtime)
- Upload photos to Firebase Storage
- User search

---
## 🛠️ Technologies Used
- **Frontend:** React Native (Expo), TypeScript  
- **Backend / Database:** MongoDB / Firebase (Auth, Firestore, Storage, Cloud Functions)  
- **Realtime:** Firestore Realtime Updates  
- **UI:** React Native Paper / Tailwind RN  
---
