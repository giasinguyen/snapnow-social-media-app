# SnapNow Mobile App �

React Native mobile application cho SnapNow social media platform.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup Firebase** (QUAN TRỌNG!)
   - Đọc hướng dẫn chi tiết trong [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Tạo Firebase project và copy config vào `config/firebase.ts`

3. **Run the app**
   ```bash
   npm start
   ```

4. **Open app**
   - Scan QR code với Expo Go app (Android/iOS)
   - Hoặc press `w` để mở web version
   - Hoặc press `a` để mở Android emulator

## 📱 Features Implemented

### ✅ Completed
- [x] Project structure setup
- [x] Navigation system (Expo Router)
- [x] Authentication UI (Login/Register)
- [x] Firebase integration setup
- [x] Bottom tab navigation (Instagram-style)
- [x] Basic screen placeholders

### 🔄 In Progress
- [ ] User profile management
- [ ] Post creation with camera/gallery
- [ ] Feed implementation
- [ ] Social features (like, comment, follow)
- [ ] Search functionality
- [ ] Real-time notifications

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **UI**: React Native Paper
- **Language**: TypeScript

## 📂 Project Structure

```
app/
├── (auth)/              # Authentication screens
│   ├── login.tsx        # Login screen
│   ├── register.tsx     # Register screen
│   └── _layout.tsx      # Auth layout
├── (tabs)/              # Main app screens
│   ├── index.tsx        # Home feed
│   ├── search.tsx       # Search screen
│   ├── create.tsx       # Create post
│   ├── activity.tsx     # Activity/notifications
│   ├── profile.tsx      # Profile screen
│   └── _layout.tsx      # Tabs layout
├── _layout.tsx          # Root layout
└── index.tsx            # Entry point

components/              # Reusable components (coming soon)
config/
└── firebase.ts          # Firebase configuration
services/
└── auth.ts             # Authentication service
types/
└── index.ts            # TypeScript type definitions
```

## 🎯 Next Development Steps

1. **Complete Firebase Setup**
   - Follow `FIREBASE_SETUP.md` guide
   - Test authentication flow

2. **Implement Core Features**
   - User profile management
   - Image upload functionality
   - Post creation flow

3. **Build Social Features**
   - Feed with posts
   - Like/comment system
   - Follow/unfollow users

4. **Add Advanced Features**
   - Search and discovery
   - Real-time notifications
   - Stories (optional)

## 🚨 Important Notes

1. **Firebase Config**: App sẽ crash nếu chưa setup Firebase config đúng
2. **Dependencies**: Một số packages có version conflicts (check terminal output)
3. **Testing**: Test trên device thật để đảm bảo camera/gallery hoạt động

## 🔧 Troubleshooting

### Common Issues

1. **Metro bundler errors**
   ```bash
   npm start --reset-cache
   ```

2. **Firebase connection issues**
   - Check internet connection
   - Verify Firebase config in `config/firebase.ts`
   - Ensure Firebase services are enabled

3. **Navigation errors**
   - Make sure all required screens are created
   - Check Expo Router documentation for route syntax

## 📝 Development Guidelines

1. **Code Style**: Follow TypeScript best practices
2. **Components**: Create reusable components in `components/` folder
3. **Services**: Put business logic in `services/` folder
4. **Types**: Define interfaces in `types/` folder

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://reactnativepaper.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Router](https://docs.expo.dev/router/introduction/)

---

**Team**: The Challengers  
**Leader**: Nguyễn Trần Gia Sĩ
