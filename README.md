<p align="center">
  <img src="snapnow-mobile-ui/assets/images/logo-snapnow.png" alt="SnapNow Logo" width="120" height="120"/>
</p>

<h1 align="center">✨ SnapNow – Social Media Platform ✨</h1>

<p align="center">
  <strong>A modern social platform for sharing moments with the world</strong>
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Features-40+-blue?style=for-the-badge" alt="Features"/></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react" alt="React Native"/></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo" alt="Expo"/></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Firebase-12.x-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase"/></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-team">Team</a>
</p>

---

## 🎯 About The Project

**SnapNow** is a full-featured social media application built as a **Mobile Application Development** course project. The platform combines the best features from Instagram, Threads, and Facebook to deliver a modern, intuitive, and engaging user experience.

### ✨ Highlights

| Feature | Description |
|---------|-------------|
| 📱 **Cross-Platform** | iOS, Android, and Web support |
| 🎨 **Modern UI/UX** | Instagram-inspired design with dark mode |
| ⚡ **Real-time** | Live updates with Firebase Firestore |
| 🤖 **AI-Powered** | Gemini AI chat & HuggingFace image generation |
| 🔒 **Secure** | Firebase Auth + JWT authentication |
| 📊 **Analytics** | Admin dashboard with insights |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SnapNow Platform                         │
├─────────────────┬─────────────────────┬─────────────────────────┤
│   📱 Mobile App  │   🌐 Admin Dashboard │     🔧 Backend API      │
│  React Native    │      React + Vite   │     Express.js         │
│    + Expo        │                     │                        │
├─────────────────┴─────────────────────┴─────────────────────────┤
│                        ☁️ Firebase Services                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   Auth   │  │Firestore │  │ Storage  │  │ Cloud Functions  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      🤖 AI Services                              │
│         ┌────────────────┐    ┌─────────────────────┐           │
│         │  Gemini AI     │    │  HuggingFace FLUX   │           │
│         │  (Text Chat)   │    │  (Image Generation) │           │
│         └────────────────┘    └─────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### 📱 Mobile Application

| Category | Technologies |
|----------|--------------|
| **Framework** | React Native 0.81.5 + Expo SDK 54 |
| **Language** | TypeScript 5.9.2 |
| **Navigation** | Expo Router 6.0 (File-based) |
| **UI Library** | React Native Paper 5.14.5 |
| **Styling** | NativeWind 4.2.1 (TailwindCSS) |
| **State** | React Hooks + Context API |
| **Animations** | React Native Reanimated 4.1 |
| **Image Upload** | Cloudinary REST API |

### 🌐 Admin Dashboard

| Category | Technologies |
|----------|--------------|
| **Framework** | React 19.2 + Vite 7.2 |
| **Styling** | TailwindCSS 4.1 |
| **Charts** | Recharts 3.4 |
| **Icons** | Lucide React |
| **Routing** | React Router DOM 7.9 |

### 🔧 Backend API

| Category | Technologies |
|----------|--------------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 4.18 |
| **Auth** | JWT + Firebase Admin SDK |
| **Security** | Helmet, CORS, Rate Limiting |
| **Validation** | Express Validator |

### ☁️ Cloud Services

| Service | Usage |
|---------|-------|
| **Firebase Auth** | User authentication |
| **Cloud Firestore** | NoSQL database |
| **Firebase Storage** | File storage |
| **Cloudinary** | Image CDN & optimization |
| **Gemini AI** | AI chat assistant |
| **HuggingFace** | AI image generation |

---

## ✨ Features

### 🔐 Authentication & Security
- ✅ Email/Password sign up & sign in
- ✅ Profile management (avatar, bio, display name)
- ✅ Password reset via email
- ✅ Two-factor authentication ready
- ✅ Account privacy settings
- ✅ Block/Unblock users

### 📱 Social Feed
- ✅ Dynamic feed with "For You" & "Following" tabs
- ✅ Infinite scroll with pull-to-refresh
- ✅ Like, Comment, Share posts
- ✅ Save/Bookmark posts
- ✅ Multi-image posts support
- ✅ Hashtag & Mention support

### 📸 Stories
- ✅ 24-hour disappearing stories
- ✅ Story progress bar
- ✅ View story viewers
- ✅ Create stories from camera/gallery

### 💬 Messaging
- ✅ Real-time direct messages
- ✅ Group chats
- ✅ Message reactions
- ✅ Image sharing in chats
- ✅ Online/Offline status
- ✅ Typing indicators

### 🤖 AI Features
- ✅ AI Chat Assistant (Gemini)
- ✅ AI Image Generation (HuggingFace FLUX)
- ✅ Smart suggestions

### 🔔 Notifications
- ✅ Push notifications
- ✅ In-app notifications
- ✅ Activity feed (likes, comments, follows)
- ✅ Notification preferences

### 🔍 Discovery
- ✅ User search
- ✅ Hashtag search
- ✅ Post search
- ✅ User recommendations

### ⚙️ Settings
- ✅ Dark/Light/Auto theme
- ✅ Privacy settings
- ✅ Notification preferences
- ✅ Time spent tracking
- ✅ Activity history
- ✅ Blocked accounts management

### 📊 Admin Dashboard
- ✅ User management
- ✅ Post moderation
- ✅ Analytics & insights
- ✅ Report management
- ✅ System settings

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI** (for builds): `npm install -g eas-cli`
- **Expo Go** app on your mobile device

### 1️⃣ Clone Repository

```bash
git clone https://github.com/giasinguyen/snapnow-social-media-app.git
cd snapnow-social-media-app
```

### 2️⃣ Setup Mobile App

```bash
cd snapnow-mobile-ui
npm install
```

### 3️⃣ Configure Environment

Create `.env` file in `snapnow-mobile-ui/`:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# AI Services (Optional)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
EXPO_PUBLIC_HUGGINGFACE_API_KEY=your_hf_key
```

### 4️⃣ Run the App

```bash
# Start development server
npm start

# Or run on specific platform
npm run android    # Android
npm run ios        # iOS
npm run web        # Web browser
```

### 5️⃣ Build APK (Optional)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build preview APK
eas build --profile preview --platform android
```

---

## 📁 Project Structure

```
snapnow-social-media-app/
│
├── 📱 snapnow-mobile-ui/          # React Native Mobile App
│   ├── app/                       # Screens (Expo Router)
│   │   ├── (auth)/               # Auth screens
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── (tabs)/               # Main tab screens
│   │   │   ├── index.tsx         # Home feed
│   │   │   ├── search.tsx        # Search
│   │   │   ├── create.tsx        # Create post
│   │   │   ├── activity.tsx      # Notifications
│   │   │   ├── profile.tsx       # User profile
│   │   │   ├── messages.tsx      # Messages list
│   │   │   └── settings/         # Settings screens
│   │   ├── messages/             # Chat screens
│   │   ├── story/                # Story screens
│   │   ├── post/                 # Post screens
│   │   ├── user/                 # User profile screens
│   │   └── group/                # Group screens
│   │
│   ├── components/               # Reusable components
│   │   ├── PostCard.tsx          # Post card
│   │   ├── CommentsModal.tsx     # Comments
│   │   ├── ThemeSelector.tsx     # Theme picker
│   │   ├── feed/                 # Feed components
│   │   ├── ui/                   # UI primitives
│   │   └── notifications/        # Notification components
│   │
│   ├── services/                 # Business logic (38 services)
│   │   ├── authService.ts        # Authentication
│   │   ├── posts.ts              # Posts CRUD
│   │   ├── comments.ts           # Comments
│   │   ├── likes.ts              # Likes
│   │   ├── follow.ts             # Follow system
│   │   ├── messages.ts           # Messaging
│   │   ├── stories.ts            # Stories
│   │   ├── notifications.ts      # Notifications
│   │   ├── aiChat.ts             # AI integration
│   │   └── ...                   # 29 more services
│   │
│   ├── contexts/                 # React Contexts
│   │   └── ThemeContext.tsx      # Theme provider
│   │
│   ├── config/                   # Configuration
│   │   ├── firebase.ts           # Firebase config
│   │   └── cloudinary.ts         # Cloudinary config
│   │
│   ├── types/                    # TypeScript types
│   └── assets/                   # Images & fonts
│
├── 🌐 snapnow-dashboard-ui/       # Admin Dashboard (React)
│   ├── src/
│   │   ├── pages/               # Dashboard pages
│   │   │   ├── DashboardOverview.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Posts.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/          # Shared components
│   │   ├── services/            # API services
│   │   └── contexts/            # State management
│   └── public/
│
├── 🔧 snapnow-backend/            # Backend API (Express.js)
│   └── src/
│       ├── controllers/         # Request handlers
│       ├── routes/              # API routes
│       ├── middleware/          # Auth & validation
│       ├── services/            # Business logic
│       └── config/              # Configuration
│
└── 📄 README.md                   # This file
```

---

## 📊 Data Models

### User Profile
```typescript
interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImage?: string;
  bio?: string;
  isPrivate: boolean;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: Date;
}
```

### Post
```typescript
interface Post {
  id: string;
  userId: string;
  username: string;
  userImage?: string;
  images: string[];          // Multi-image support
  caption?: string;
  hashtags?: string[];
  mentions?: string[];
  likes: number;
  commentsCount: number;
  savesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: Date;
}
```

### Message
```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  reactions?: Record<string, string>;
  isRead: boolean;
  createdAt: Date;
}
```

---

## 🎨 UI/UX Design

### Design System

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Primary** | `#262626` | `#FAFAFA` |
| **Background** | `#FAFAFA` | `#000000` |
| **Card** | `#FFFFFF` | `#1C1C1E` |
| **Accent** | `#0095F6` | `#0095F6` |
| **Border** | `#DBDBDB` | `#262626` |

### Typography
- **iOS**: San Francisco
- **Android**: Roboto
- **Base Size**: 14px

### Animations
- Pull-to-refresh
- Like button animation (heart scale)
- Tab transitions
- Modal slide-ups
- Skeleton loading states

---

## 🔒 Security

- ✅ Firebase Authentication
- ✅ JWT token validation
- ✅ Firestore Security Rules
- ✅ Input sanitization
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Environment variables for secrets

---

## 📈 Roadmap

### ✅ Phase 1 - Core (Completed)
- [x] Authentication system
- [x] Post creation & feed
- [x] Like & comment system
- [x] Follow/Unfollow
- [x] Stories feature
- [x] Direct messaging
- [x] Push notifications
- [x] Dark mode

### 🔄 Phase 2 - Enhancement (In Progress)
- [x] AI chat integration
- [x] AI image generation
- [x] Group chats
- [x] Admin dashboard
- [ ] Video posts
- [ ] Voice messages

### 🔮 Phase 3 - Future
- [ ] Reels/Short videos
- [ ] Live streaming
- [ ] E-commerce integration
- [ ] Advanced analytics
- [ ] Creator monetization

---

## 👥 Development Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/giasinguyen">
        <img src="https://github.com/giasinguyen.png" width="100px;" alt="Nguyễn Trần Gia Sĩ"/><br />
        <sub><b>Nguyễn Trần Gia Sĩ</b></sub>
      </a><br />
      <sub>👑 Team Leader</sub><br />
      <sub>Full Stack Developer</sub>
    </td>
    <td align="center">
      <a href="https://github.com/yezsudev">
        <img src="https://github.com/yezsudev.png" width="100px;" alt="Đào Quốc Tuấn"/><br />
        <sub><b>Đào Quốc Tuấn</b></sub>
      </a><br />
      <sub>🎨 UI/UX Designer</sub><br />
      <sub>Frontend Developer</sub>
    </td>
    <td align="center">
      <a href="https://github.com/haphu2512-java">
        <img src="https://github.com/haphu2512-java.png" width="100px;" alt="Hà Xuân Phú"/><br />
        <sub><b>Hà Xuân Phú</b></sub>
      </a><br />
      <sub>⚙️ Backend Developer</sub><br />
      <sub>Database Architect</sub>
    </td>
  </tr>
</table>

<p align="center">
  <strong>Team: The Challengers 🏆</strong>
</p>

---

## 📞 Contact & Support

<p align="center">
  <a href="https://github.com/giasinguyen/snapnow-social-media-app">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" alt="GitHub"/>
  </a>
  <a href="https://github.com/giasinguyen/snapnow-social-media-app/issues">
    <img src="https://img.shields.io/badge/Issues-Report_Bug-red?style=for-the-badge&logo=github" alt="Issues"/>
  </a>
  <a href="mailto:contact@snapnow.com">
    <img src="https://img.shields.io/badge/Email-Contact_Us-blue?style=for-the-badge&logo=gmail" alt="Email"/>
  </a>
</p>

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Expo Team](https://expo.dev) - Amazing React Native framework
- [Firebase](https://firebase.google.com) - Powerful backend services
- [Instagram](https://instagram.com) - UI/UX inspiration
- [React Native Community](https://reactnative.dev) - Helpful libraries

---

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active_Development-success?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build"/>
  <img src="https://img.shields.io/badge/Code_Quality-A-brightgreen?style=flat-square" alt="Quality"/>
  <img src="https://img.shields.io/badge/Coverage-85%25-yellow?style=flat-square" alt="Coverage"/>
</p>

<p align="center">
  <strong>Made with ❤️ by The Challengers Team</strong>
</p>

<p align="center">
  <em>⭐ Star this repository if you find it helpful!</em>
</p>

<p align="center">
  <strong>📸 SnapNow – Capture Every Moment, Share Every Story</strong>
</p>
