# 🚀 SnapNow Dashboard - Setup Guide

## Hoàn thành setup Backend + Frontend Dashboard

### ✅ Backend đã hoàn thành:

1. **Analytics Service** (`src/services/analytics.service.js`)
   - `getDashboardOverview()` - Tổng quan dashboard
   - `getUserGrowth(days)` - Tăng trưởng người dùng
   - `getPostActivity(days)` - Hoạt động đăng bài
   - `getEngagementMetrics()` - Chỉ số tương tác
   - `getTopUsers(limit)` - Top người dùng
   - `getTopPosts(limit)` - Top bài viết
   - `getRecentActivity(limit)` - Hoạt động gần đây

2. **Analytics Controller** (`src/controllers/analytics.controller.js`)
   - Đã refactor để sử dụng Analytics Service
   - Xử lý request/response cho tất cả endpoints

3. **Analytics Routes** (`src/routes/analytics.routes.js`)
   - `GET /api/analytics/overview`
   - `GET /api/analytics/user-growth?days=30`
   - `GET /api/analytics/post-activity?days=30`
   - `GET /api/analytics/engagement`
   - `GET /api/analytics/top-users?limit=10`
   - `GET /api/analytics/top-posts?limit=10`
   - `GET /api/analytics/recent-activity?limit=20`

### ✅ Frontend Dashboard đã hoàn thành:

1. **Firebase Config** (`.env` + `src/config/firebase.js`)
   - Sử dụng environment variables cho bảo mật
   - `.env` không được commit vào Git

2. **Authentication System**
   - `AuthContext.jsx` - Quản lý auth state
   - `ProtectedRoute.jsx` - Bảo vệ routes
   - `Login.jsx` - Trang đăng nhập đẹp mắt

3. **Dashboard UI**
   - `DashboardLayout.jsx` - Layout với sidebar responsive
   - `DashboardOverview.jsx` - Trang tổng quan với stats cards
   - Gradient design, animations, professional UI

4. **Services**
   - `api.js` - Axios instance với JWT token
   - `analyticsService.js` - API calls cho analytics

## 🔧 Cách chạy:

### Backend:
```bash
cd snapnow-backend
npm start
# Chạy trên http://localhost:5000
```

### Frontend Dashboard:
```bash
cd snapnow-dashboard-ui
npm run dev
# Chạy trên http://localhost:5175
```

## 🔑 Tạo Admin User:

Sử dụng Firebase Console hoặc code:

```javascript
// Trong Firebase Console > Authentication
// Tạo user với email/password
// Hoặc dùng script:

const admin = require('firebase-admin');
admin.initializeApp();

const email = 'admin@snapnow.com';
const password = 'your-secure-password';

admin.auth().createUser({
  email: email,
  password: password,
  emailVerified: true,
  displayName: 'Admin'
}).then(user => {
  console.log('Admin user created:', user.uid);
});
```

## 🎨 Features Dashboard:

1. **Login Page**
   - Gradient background với animated blobs
   - Email/password form
   - Error handling
   - Loading states

2. **Dashboard Overview**
   - 4 Stats cards (Users, Posts, Likes, Comments)
   - Trend indicators (↑ percentage)
   - Average engagement metrics
   - Circular engagement rate indicator
   - Gradient progress bars

3. **Layout**
   - Responsive sidebar
   - Mobile hamburger menu
   - User profile section
   - Logout button

## 🔒 Security:

- ✅ Firebase credentials trong `.env`
- ✅ `.env` trong `.gitignore`
- ✅ JWT token authentication
- ✅ Protected routes
- ✅ Admin role verification

## 📊 API Endpoints đã test:

Tất cả endpoints yêu cầu:
- Header: `Authorization: Bearer <firebase-jwt-token>`
- Role: Admin

## 🎯 Next Steps (Optional):

1. Tạo thêm pages:
   - Users management
   - Posts moderation
   - Advanced analytics với charts (Recharts)
   
2. Thêm features:
   - Dark mode
   - Export data (CSV/PDF)
   - Real-time updates
   - Notifications

## 🐛 Troubleshooting:

1. **Lỗi CORS**: Thêm dashboard URL vào CORS config backend
2. **Auth failed**: Kiểm tra Firebase config trong `.env`
3. **API không connect**: Verify `VITE_API_URL` trong `.env`

## ✨ UI/UX Highlights:

- Professional gradient design
- Smooth transitions và animations
- Responsive trên mọi devices
- Loading states và error handling
- Beautiful color schemes (purple → pink gradients)
- Icon system với Lucide React

---

**Status**: ✅ HOÀN THÀNH
**Backend**: ✅ Analytics Service + Controller + Routes
**Frontend**: ✅ Login + Dashboard + Layout + Services
**Security**: ✅ Environment variables + Protected routes
