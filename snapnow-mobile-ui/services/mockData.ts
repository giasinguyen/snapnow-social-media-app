// Mock Data Service for SnapNow
// This provides sample data for development and testing

export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  isVerified?: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export interface MockPost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likes: number;
  commentsCount: number;
  createdAt: Date;
  isVerified?: boolean;
  location?: string;
}

export interface MockStory {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  image: string;
  hasStory: boolean;
  isYourStory?: boolean;
}

// Sample Users
export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    username: 'john_doe',
    displayName: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Travel enthusiast 🌍 | Photographer 📸',
    isVerified: false,
    followersCount: 2543,
    followingCount: 892,
    postsCount: 156,
  },
  {
    id: '2',
    username: 'jane_smith',
    displayName: 'Jane Smith',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Fashion & Lifestyle ✨',
    isVerified: true,
    followersCount: 15420,
    followingCount: 432,
    postsCount: 289,
  },
  {
    id: '3',
    username: 'mike_wilson',
    displayName: 'Mike Wilson',
    avatar: 'https://i.pravatar.cc/150?img=13',
    bio: 'Fitness coach 💪 | Nutrition',
    isVerified: false,
    followersCount: 8932,
    followingCount: 567,
    postsCount: 421,
  },
  {
    id: '4',
    username: 'sarah_jones',
    displayName: 'Sarah Jones',
    avatar: 'https://i.pravatar.cc/150?img=9',
    bio: 'Food blogger 🍕 | Recipe creator',
    isVerified: true,
    followersCount: 34521,
    followingCount: 234,
    postsCount: 678,
  },
  {
    id: '5',
    username: 'alex_brown',
    displayName: 'Alex Brown',
    avatar: 'https://i.pravatar.cc/150?img=33',
    bio: 'Tech enthusiast 💻 | Developer',
    isVerified: false,
    followersCount: 5678,
    followingCount: 789,
    postsCount: 234,
  },
  {
    id: '6',
    username: 'emma_davis',
    displayName: 'Emma Davis',
    avatar: 'https://i.pravatar.cc/150?img=47',
    bio: 'Art & Design 🎨',
    isVerified: false,
    followersCount: 12340,
    followingCount: 456,
    postsCount: 345,
  },
  {
    id: '7',
    username: 'chris_martin',
    displayName: 'Chris Martin',
    avatar: 'https://i.pravatar.cc/150?img=52',
    bio: 'Music producer 🎵 | DJ',
    isVerified: true,
    followersCount: 45678,
    followingCount: 123,
    postsCount: 567,
  },
  {
    id: '8',
    username: 'lisa_taylor',
    displayName: 'Lisa Taylor',
    avatar: 'https://i.pravatar.cc/150?img=20',
    bio: 'Yoga instructor 🧘‍♀️ | Wellness',
    isVerified: false,
    followersCount: 9876,
    followingCount: 432,
    postsCount: 234,
  },
];

// Sample Posts
export const MOCK_POSTS: MockPost[] = [
  {
    id: 'post1',
    userId: '2',
    username: 'jane_smith',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    imageUrl: 'https://picsum.photos/seed/post1/800/800',
    caption: 'Beautiful sunset at the beach 🌅 #sunset #beach #nature',
    likes: 1234,
    commentsCount: 89,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isVerified: true,
    location: 'Malibu Beach',
  },
  {
    id: 'post2',
    userId: '1',
    username: 'john_doe',
    userAvatar: 'https://i.pravatar.cc/150?img=12',
    imageUrl: 'https://picsum.photos/seed/post2/800/800',
    caption: 'Exploring new places 🗺️✈️ #travel #adventure',
    likes: 567,
    commentsCount: 34,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isVerified: false,
    location: 'Tokyo, Japan',
  },
  {
    id: 'post3',
    userId: '3',
    username: 'mike_wilson',
    userAvatar: 'https://i.pravatar.cc/150?img=13',
    imageUrl: 'https://picsum.photos/seed/post3/800/800',
    caption: 'Morning workout routine 💪 Stay consistent! #fitness #gym #motivation',
    likes: 892,
    commentsCount: 56,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    isVerified: false,
  },
  {
    id: 'post4',
    userId: '4',
    username: 'sarah_jones',
    userAvatar: 'https://i.pravatar.cc/150?img=9',
    imageUrl: 'https://picsum.photos/seed/post4/800/800',
    caption: 'Homemade pasta carbonara 🍝 Recipe in bio! #foodie #cooking #pasta',
    likes: 2341,
    commentsCount: 156,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    isVerified: true,
    location: 'Rome, Italy',
  },
  {
    id: 'post5',
    userId: '5',
    username: 'alex_brown',
    userAvatar: 'https://i.pravatar.cc/150?img=33',
    imageUrl: 'https://picsum.photos/seed/post5/800/800',
    caption: 'New setup complete! 🖥️⌨️ #tech #coding #workspace',
    likes: 678,
    commentsCount: 45,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
    isVerified: false,
  },
  {
    id: 'post6',
    userId: '6',
    username: 'emma_davis',
    userAvatar: 'https://i.pravatar.cc/150?img=47',
    imageUrl: 'https://picsum.photos/seed/post6/800/800',
    caption: 'Latest artwork 🎨 What do you think? #art #painting #creative',
    likes: 1456,
    commentsCount: 98,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isVerified: false,
    location: 'New York, USA',
  },
  {
    id: 'post7',
    userId: '7',
    username: 'chris_martin',
    userAvatar: 'https://i.pravatar.cc/150?img=52',
    imageUrl: 'https://picsum.photos/seed/post7/800/800',
    caption: 'Studio session 🎧🎹 New track coming soon! #music #producer #studio',
    likes: 3421,
    commentsCount: 234,
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
    isVerified: true,
    location: 'Los Angeles, USA',
  },
  {
    id: 'post8',
    userId: '8',
    username: 'lisa_taylor',
    userAvatar: 'https://i.pravatar.cc/150?img=20',
    imageUrl: 'https://picsum.photos/seed/post8/800/800',
    caption: 'Morning meditation by the lake 🧘‍♀️☀️ #yoga #wellness #meditation',
    likes: 1123,
    commentsCount: 67,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    isVerified: false,
    location: 'Bali, Indonesia',
  },
];

// Sample Stories
export const MOCK_STORIES: MockStory[] = [
  {
    id: 'story0',
    userId: 'me',
    username: 'your_story',
    avatar: 'https://i.pravatar.cc/150?img=1',
    hasStory: false,
    isYourStory: true,
    image:  'https://picsum.photos/seed/haphu/1080/1920',
  
  },
  {
    id: 'story1',
    userId: '2',
    username: 'jane_smith',
    avatar: 'https://i.pravatar.cc/150?img=5',
    hasStory: true,
     image:  'https://picsum.photos/1080/1920?random=2',
  },
  {
    id: 'story2',
    userId: '1',
    username: 'john_doe',
    avatar: 'https://i.pravatar.cc/150?img=12',
    hasStory: true,
     image:  'https://picsum.photos/seed/haphu/1080/1920',
  },
  {
    id: 'story3',
    userId: '3',
    username: 'mike_wilson',
    avatar: 'https://i.pravatar.cc/150?img=13',
    hasStory: true,
     image:  'https://picsum.photos/1080/1920?random=2',
  },
  {
    id: 'story4',
    userId: '4',
    username: 'sarah_jones',
    avatar: 'https://i.pravatar.cc/150?img=9',
    hasStory: true,
     image:  'https://picsum.photos/seed/haphu/1080/1920',
  },
  {
    id: 'story5',
    userId: '7',
    username: 'chris_martin',
    avatar: 'https://i.pravatar.cc/150?img=52',
    hasStory: true,
     image:  'https://picsum.photos/1080/1920?random=2',
  },
  {
    id: 'story6',
    userId: '8',
    username: 'lisa_taylor',
    avatar: 'https://i.pravatar.cc/150?img=20',
    hasStory: true,
     image:  'https://picsum.photos/1080/1920?grayscale',
  },
];

// Suggested Users (for "Suggestions For You")
export const SUGGESTED_USERS: MockUser[] = [
  {
    id: '9',
    username: 'david_lee',
    displayName: 'David Lee',
    avatar: 'https://i.pravatar.cc/150?img=15',
    bio: 'Street photographer 📷',
    isVerified: false,
    followersCount: 4521,
    followingCount: 234,
    postsCount: 178,
  },
  {
    id: '10',
    username: 'olivia_white',
    displayName: 'Olivia White',
    avatar: 'https://i.pravatar.cc/150?img=45',
    bio: 'Beauty & Skincare ✨',
    isVerified: true,
    followersCount: 23456,
    followingCount: 345,
    postsCount: 456,
  },
  {
    id: '11',
    username: 'ryan_garcia',
    displayName: 'Ryan Garcia',
    avatar: 'https://i.pravatar.cc/150?img=68',
    bio: 'Sports enthusiast ⚽',
    isVerified: false,
    followersCount: 8765,
    followingCount: 432,
    postsCount: 267,
  },
  {
    id: '12',
    username: 'sophia_chen',
    displayName: 'Sophia Chen',
    avatar: 'https://i.pravatar.cc/150?img=32',
    bio: 'Digital artist 🎨',
    isVerified: false,
    followersCount: 6543,
    followingCount: 567,
    postsCount: 189,
  },
  {
    id: '13',
    username: 'daniel_kim',
    displayName: 'Daniel Kim',
    avatar: 'https://i.pravatar.cc/150?img=59',
    bio: 'Coffee addict ☕ | Barista',
    isVerified: false,
    followersCount: 3421,
    followingCount: 678,
    postsCount: 145,
  },
];

// Helper function to get random posts
export function getRandomPosts(count: number = 5): MockPost[] {
  const shuffled = [...MOCK_POSTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to get user by id
export function getUserById(userId: string): MockUser | undefined {
  return MOCK_USERS.find(user => user.id === userId);
}

// Helper function to simulate API delay
export function simulateDelay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Format followers count
export function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
