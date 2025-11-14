<div align="center">

# ✨📸 SnapNow – Social Media Application ✨

A modern social platform for sharing your moments with the world.

</div>

<div align="center">

![SnapNow Logo](https://img.shields.io/badge/SnapNow-Social_Media-blue?style=for-the-badge&logo=instagram)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)

*Capture and share moments instantly – A modern social media platform inspired by Instagram, Threads, and Facebook*

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation--setup) • [Structure](#-project-structure) • [Contributors](#-development-team)

</div>

---

## 👥 Development Team – **The Challengers** 🏆

### Team Introduction:

SnapNow was developed by **The Challengers**, a team of passionate developers who wanted to build a modern and engaging social media platform. Here’s a quick introduction to our talented team:

* **Nguyễn Trần Gia Sĩ**: Team Leader & Full Stack Developer. A dedicated leader with a strong focus on both frontend and backend development, ensuring the app runs seamlessly across multiple platforms. [GitHub: @giasinguyen](https://github.com/giasinguyen)

* **Đào Quốc Tuấn**: Frontend Developer & UI/UX Designer. With a keen eye for design and user experience, Tuấn has worked on building the stunning, intuitive interfaces for SnapNow. [GitHub: @tuandaocode](https://github.com/yezsudev)

* **Hà Xuân Phú**: Backend Developer & Database Architect. Phú has implemented the robust backend system, ensuring smooth data flow and real-time features on SnapNow. [GitHub: @phuhx](https://github.com/haphu2512-java)

---

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Installation & Setup](#-installation--setup)
- [Project Structure](#-project-structure)
- [Detailed Functionality](#-detailed-functionality)
- [Development Team](#-development-team)
- [License](#-license)

---

## 🎯 Introduction

**SnapNow** is a modern social media application for photo sharing and community connection, developed as a **Mobile Application Development** course project. The app combines the best features from Instagram, Threads, and Facebook, delivering a smooth and intuitive user experience.

### 🎨 Highlights

- ✅ Modern and user-friendly interface
- ✅ Firebase integration for backend and realtime updates
- ✅ Multi-platform support (iOS, Android, Web)
- ✅ Clean, scalable code architecture
- ✅ TypeScript for type safety
- ✅ Responsive design with NativeWind (Tailwind CSS)

---

## ✨ Key Features

### 🔐 Authentication & User Management
- **Sign Up / Sign In** with Firebase Authentication
- **Profile Management**: Avatar, bio, display name
- **Edit Profile**: Update profile, change avatar
- **Share Profile**: Share profile with friends

### 📱 Content Feed
- **Dynamic Feed**: "For You" and "Following" tabs
- **Stories**: View and post 24-hour stories
- **Infinite Scroll**: Auto-load posts on scroll
- **Pull to Refresh**: Refresh content

### 🖼️ Post Creation & Content
- **Create New Posts**: Photo + caption + hashtags
- **Upload Photos**: From library or camera
- **Privacy Settings**: Control who can view/interact
- **Grid/List View**: Multiple display options

### 💬 Social Interactions
- **Like & Unlike**: Like/unlike posts
- **Comment**: Comment and reply to comments
- **Follow/Unfollow**: Follow users
- **Share**: Share posts

### 🔔 Notifications
- **Realtime Notifications**: Instant notifications
- **Activity Feed**: Like, comment, follow notifications
- **Categories**: Recent and Older notifications

### 🔍 Search
- **User Search**: By username/display name
- **Post Search**: By hashtag, caption
- **Search History**: Recent searches
- **Debounced Search**: Performance optimization

### ⚙️ Settings
- **Account**: Manage personal information
- **Privacy**: Privacy settings
- **Notifications**: Customize notifications
- **Analytics**: Time spent tracking
- **Help & Support**: Help center, terms, privacy policy

### 🏆 Advanced Features
- **Achievements**: Achievement system
- **Albums**: Organize photos in albums
- **Tagged Posts**: View tagged posts
- **Profile Insights**: Interaction statistics

---

## 🛠️ Tech Stack

### Frontend - Mobile App

```json
{
  "framework": "React Native 0.81.4",
  "runtime": "Expo SDK 54",
  "language": "TypeScript 5.9.2",
  "navigation": "Expo Router 6.0",
  "ui-library": [
    "React Native Paper 5.14.5",
    "NativeWind 4.2.1 (Tailwind CSS)",
    "Expo Linear Gradient",
    "Expo Blur"
  ],
  "state-management": "React Hooks",
  "icons": "@expo/vector-icons 15.0.2"
}
```

### Backend & Database

```json
{
  "backend": "Firebase",
  "services": {
    "authentication": "Firebase Authentication",
    "database": "Cloud Firestore",
    "storage": "Firebase Storage",
    "realtime": "Firestore Realtime Updates"
  }
}
```

### Frontend - Web App (In Progress)

```json
{
  "framework": "React 19.1.1",
  "build-tool": "Vite 7.1.2",
  "language": "TypeScript 5.8.3"
}
```

### Developer Tools

- **Linting**: ESLint 9.25.0
- **CSS Processing**: PostCSS, Autoprefixer
- **Package Manager**: npm/yarn
- **Version Control**: Git

---

## 🚀 Installation & Setup

### System Requirements

- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **iOS Simulator** (macOS) or **Android Studio** (for Android Emulator)
- **Expo Go** app (for physical devices)

### Step 1: Clone the repository

```bash
git clone https://github.com/giasinguyen/snapnow-social-media-app.git
cd snapnow-social-media-app
```

### Step 2: Install dependencies

#### Mobile App

```bash
cd snapnow-mobile-ui
npm install
# or
yarn install
```

#### Web App (Optional)

```bash
cd snapnow-web-ui
npm install
# or
yarn install
```

### Step 3: Configure Firebase

1. Create a project on [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - **Authentication**: Email/Password
   - **Firestore Database**: Start in test mode
   - **Storage**: Start in test mode
3. Create a `.env` file in the `snapnow-mobile-ui` directory:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Step 4: Seed sample data (Optional)

```bash
cd snapnow-mobile-ui
npm run seed
```

### Step 5: Run the application

#### Development mode

```bash
# Run on all platforms
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

#### Production build

```bash
# Build Android
expo build:android

# Build iOS
expo build:ios
```

### Step 6: Login

**Default admin account:**
- Email: `admin@admin.com`
- Password: `123`

---

## 📁 Cấu trúc dự án

```
SnapNow/
├── 📱 snapnow-mobile-ui/          # React Native Mobile App
│   ├── app/                       # App screens (Expo Router)
│   │   ├── (auth)/               # Authentication screens
│   │   │   ├── login.tsx         # Màn hình đăng nhập
│   │   │   └── register.tsx      # Màn hình đăng ký
│   │   ├── (tabs)/               # Main app tabs
│   │   │   ├── index.tsx         # Home feed
│   │   │   ├── search.tsx        # Search users/posts
│   │   │   ├── create.tsx        # Create new post
│   │   │   ├── activity.tsx      # Notifications
│   │   │   ├── profile.tsx       # User profile
│   │   │   ├── edit-profile.tsx  # Edit profile
│   │   │   ├── share-profile.tsx # Share profile
│   │   │   └── settings/         # Settings screens
│   │   │       ├── index.tsx     # Settings menu
│   │   │       ├── privacy.tsx   # Privacy settings
│   │   │       ├── term.tsx      # Terms of service
│   │   │       ├── about.tsx     # About app
│   │   │       ├── help-center.tsx # Help center
│   │   │       └── time-spent.tsx # Time tracking
│   │   ├── _layout.tsx           # Root layout
│   │   └── index.tsx             # Entry point
│   ├── components/               # Reusable components
│   │   ├── PostCard.tsx          # Post display card
│   │   ├── StoryItem.tsx         # Story item
│   │   ├── CommentsModal.tsx     # Comments modal
│   │   ├── UserProfileHeader.tsx # Profile header
│   │   ├── SuggestionCard.tsx    # User suggestion
│   │   ├── LogoHeader.tsx        # Logo header
│   │   ├── create/               # Create post components
│   │   │   ├── ActionBar.tsx     # Action toolbar
│   │   │   ├── HeaderBar.tsx     # Header bar
│   │   │   ├── PrivacySheet.tsx  # Privacy options
│   │   │   ├── SelectedImage.tsx # Image preview
│   │   │   └── UserComposer.tsx  # Text composer
│   │   └── ui/                   # UI primitives
│   │       ├── Avatar.tsx        # Avatar component
│   │       ├── Button.tsx        # Button component
│   │       ├── Card.tsx          # Card component
│   │       ├── Header.tsx        # Header component
│   │       └── Input.tsx         # Input component
│   ├── services/                 # Business logic & API
│   │   ├── authService.ts        # Authentication service
│   │   ├── posts.ts              # Posts CRUD operations
│   │   ├── comments.ts           # Comments operations
│   │   ├── likes.ts              # Likes operations
│   │   ├── follow.ts             # Follow/unfollow
│   │   ├── notifications.ts      # Notifications service
│   │   ├── search.ts             # Search functionality
│   │   ├── storage.ts            # File upload/storage
│   │   ├── user.ts               # User operations
│   │   └── mockData.ts           # Mock data for testing
│   ├── types/                    # TypeScript types
│   │   ├── index.ts              # Main types
│   │   └── firebase.ts           # Firebase types
│   ├── config/                   # Configuration
│   │   └── firebase.ts           # Firebase config
│   ├── src/                      # Additional source files
│   │   ├── constants/            # App constants
│   │   │   ├── colors.ts         # Color palette
│   │   │   ├── sizes.ts          # Size constants
│   │   │   └── firebase.ts       # Firebase constants
│   │   └── utils/                # Utility functions
│   │       ├── dateUtils.ts      # Date formatting
│   │       ├── numberUtils.ts    # Number formatting
│   │       └── validation.ts     # Input validation
│   ├── assets/                   # Static assets
│   │   ├── images/               # Image files
│   │   └── fonts/                # Custom fonts
│   ├── scripts/                  # Build scripts
│   │   └── seedFirebase.ts       # Database seeding
│   ├── __mocks__/                # Test mocks
│   ├── app.json                  # Expo configuration
│   ├── package.json              # Dependencies
│   ├── tsconfig.json             # TypeScript config
│   ├── tailwind.config.js        # Tailwind config
│   └── .env                      # Environment variables
│
├── 🌐 snapnow-web-ui/            # Web Application (In Progress)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── assets/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── 🔧 snapnow-backend/           # Backend Documentation
│   └── README.md
│
└── 📄 README.md                  # This file
```

---

## 🎯 Detailed Functionality

### 1. Authentication Flow

```typescript
// Login
await loginUser(email, password)

// Register
await registerUser(email, password, username, displayName)

// Logout
await logoutUser()

// Get current user
const user = await getCurrentUserProfile()
```

### 2. Posts Management

```typescript
// Create post
await createPost({
  userId, username, userImage,
  imageUrl, caption, hashtags
})

// Fetch feed
const posts = await fetchFeedPosts(userId)

// Like/Unlike post
await likePost(postId)
await unlikePost(postId)
```

### 3. Social Interactions

```typescript
// Follow user
await followUser(followerId, followingId, followerUsername)

// Unfollow user
await unfollowUser(followerId, followingId)

// Add comment
await addComment(postId, userId, username, text)

// Create notification
await createNotification(userId, type, fromUserId, ...)
```

### 4. Search Functionality

```typescript
// Search users
const users = await searchUsersByUsernamePrefix(query)

// Search posts
const posts = await searchPostsByQuery(query)
```

---

## 📊 Data Models

### User Profile

```typescript
interface UserProfile {
  id: string
  email: string
  username: string
  displayName: string
  profileImage?: string
  bio?: string
  followersCount: number
  followingCount: number
  postsCount: number
  createdAt: Date
  isAdmin?: boolean
}
```

### Post

```typescript
interface Post {
  id: string
  userId: string
  username: string
  userImage?: string
  imageUrl: string
  caption?: string
  hashtags?: string[]
  likes: number
  commentsCount: number
  isLiked: boolean
  createdAt: Date
}
```

### Notification

```typescript
interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'follow'
  fromUserId: string
  fromUsername: string
  fromUserProfileImage?: string
  postId?: string
  postImageUrl?: string
  message: string
  isRead: boolean
  createdAt: Date
}
```

---

## 🎨 UI/UX Features

### Design System

- **Color Palette**: Instagram-inspired gradient colors
- **Typography**: San Francisco (iOS), Roboto (Android)
- **Spacing**: 4px base unit system
- **Icons**: Ionicons from @expo/vector-icons

### Animations

- Pull-to-refresh animations
- Like button animations
- Tab transitions
- Modal slide-ups
- Image loading states

### Responsive Design

- Adaptive layouts for different screen sizes
- Support for tablets and phones
- Portrait and landscape orientations

---

## 🔒 Security Features

- ✅ Firebase Authentication with email/password
- ✅ Firestore Security Rules
- ✅ Input validation and sanitization
- ✅ Secure image upload with Firebase Storage
- ✅ Protected routes for authenticated users

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

---

## 📈 Roadmap & Future Enhancements

### Phase 1 (Current)
- [x] Basic authentication
- [x] Post creation and feed
- [x] Like and comment functionality
- [x] Follow/unfollow system
- [x] Notifications
- [x] Search functionality

### Phase 2 (Planned)
- [ ] Stories feature
- [ ] Direct messaging
- [ ] Video posts
- [ ] Reels/Short videos
- [ ] Advanced filters and editing
- [ ] Hashtag trending

### Phase 3 (Future)
- [ ] AI-powered recommendations
- [ ] Live streaming
- [ ] Shopping integration
- [ ] Creator monetization
- [ ] Advanced analytics

---

## 👥 Development Team

### **Team: The Challengers** 🏆

| Member | Role | GitHub |
|------------|---------|--------|
| **Nguyễn Trần Gia Sĩ** | Team Leader & Full Stack Developer | [@giasinguyen](https://github.com/giasinguyen) |
| **Đào Quốc Tuấn** | Frontend Developer & UI/UX Designer | |
| **Hà Xuân Phú** | Backend Developer & Database Architect | |

### Contact

- **Email**: [contact@snapnow.com](mailto:contact@snapnow.com)
- **Repository**: [github.com/giasinguyen/snapnow-social-media-app](https://github.com/giasinguyen/snapnow-social-media-app)

---

## 🙏 Acknowledgments

- **Expo Team**: For the amazing React Native framework
- **Firebase Team**: For the powerful backend services
- **Instagram, Threads, Facebook**: For UI/UX inspiration
- **React Native Community**: For helpful libraries and resources

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🐛 Bug Reports & Feature Requests

If you discover a bug or have an idea for a new feature, please:

1. Check [Issues](https://github.com/giasinguyen/snapnow-social-media-app/issues) to see if it has already been reported
2. Create a new issue with a detailed description
3. Pull requests are always welcome! 🎉

---

## ⭐ Show Your Support

If you find this project useful, please give us a ⭐ on GitHub!

---

<div align="center">

**Made with ❤️ by The Challengers Team**

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen)
![Maintenance](https://img.shields.io/badge/maintained-yes-brightgreen)

*SnapNow - Capture Every Moment, Share Every Story* 📸

</div>
