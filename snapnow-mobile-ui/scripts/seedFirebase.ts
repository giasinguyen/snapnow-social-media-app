import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config - update với config của bạn
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Fake users data
const fakeUsers = [
  {
    email: 'john.doe@example.com',
    password: 'password123',
    displayName: 'John Doe',
    username: 'johndoe',
    bio: 'Travel enthusiast 🌍 | Photography lover 📸 | Coffee addict ☕',
    profileImage: 'https://i.pravatar.cc/300?img=12',
    followers: 1234,
    following: 567,
    posts: 89,
  },
  {
    email: 'jane.smith@example.com',
    password: 'password123',
    displayName: 'Jane Smith',
    username: 'janesmith',
    bio: 'Digital Artist 🎨 | Cat mom 🐱 | Living my best life ✨',
    profileImage: 'https://i.pravatar.cc/300?img=45',
    followers: 2345,
    following: 678,
    posts: 156,
  },
  {
    email: 'mike.johnson@example.com',
    password: 'password123',
    displayName: 'Mike Johnson',
    username: 'mikejohnson',
    bio: 'Fitness coach 💪 | Healthy lifestyle 🥗 | Motivating others',
    profileImage: 'https://i.pravatar.cc/300?img=33',
    followers: 5678,
    following: 345,
    posts: 234,
  },
  {
    email: 'sarah.wilson@example.com',
    password: 'password123',
    displayName: 'Sarah Wilson',
    username: 'sarahwilson',
    bio: 'Food blogger 🍕 | Recipe creator 👩‍🍳 | Foodie at heart',
    profileImage: 'https://i.pravatar.cc/300?img=27',
    followers: 3456,
    following: 890,
    posts: 178,
  },
  {
    email: 'david.brown@example.com',
    password: 'password123',
    displayName: 'David Brown',
    username: 'davidbrown',
    bio: 'Tech enthusiast 💻 | Gamer 🎮 | Code & Coffee',
    profileImage: 'https://i.pravatar.cc/300?img=51',
    followers: 4567,
    following: 432,
    posts: 267,
  },
  {
    email: 'emily.davis@example.com',
    password: 'password123',
    displayName: 'Emily Davis',
    username: 'emilydavis',
    bio: 'Fashion designer 👗 | Style influencer 💃 | NY based',
    profileImage: 'https://i.pravatar.cc/300?img=38',
    followers: 8901,
    following: 567,
    posts: 345,
  },
  {
    email: 'alex.miller@example.com',
    password: 'password123',
    displayName: 'Alex Miller',
    username: 'alexmiller',
    bio: 'Adventure seeker 🏔️ | Nature lover 🌲 | Outdoor photographer',
    profileImage: 'https://i.pravatar.cc/300?img=15',
    followers: 2890,
    following: 445,
    posts: 198,
  },
  {
    email: 'olivia.garcia@example.com',
    password: 'password123',
    displayName: 'Olivia Garcia',
    username: 'oliviagarcia',
    bio: 'Yoga instructor 🧘‍♀️ | Mindfulness coach 🌸 | Peaceful living',
    profileImage: 'https://i.pravatar.cc/300?img=42',
    followers: 4123,
    following: 678,
    posts: 223,
  },
];

// Fake posts data
const fakePostsContent = [
  {
    caption: 'Beautiful sunset at the beach 🌅 #sunset #beach #nature',
    imageUrl: 'https://picsum.photos/800/1000?random=1',
    type: 'image',
  },
  {
    caption: 'My morning coffee routine ☕️ #coffee #morning #lifestyle',
    imageUrl: 'https://picsum.photos/800/1000?random=2',
    type: 'image',
  },
  {
    caption: 'Weekend hiking adventure! 🏔️ #hiking #adventure #outdoors',
    imageUrl: 'https://picsum.photos/800/1000?random=3',
    type: 'image',
  },
  {
    caption: 'Homemade pasta from scratch 🍝 #cooking #foodie #pasta',
    imageUrl: 'https://picsum.photos/800/1000?random=4',
    type: 'image',
  },
  {
    caption: 'New workout routine! 💪 #fitness #gym #health',
    imageUrl: 'https://picsum.photos/800/1000?random=5',
    type: 'image',
  },
  {
    caption: 'City lights at night 🌃 #cityscape #photography #night',
    imageUrl: 'https://picsum.photos/800/1000?random=6',
    type: 'image',
  },
  {
    caption: 'Morning yoga session 🧘‍♀️ #yoga #wellness #mindfulness',
    imageUrl: 'https://picsum.photos/800/1000?random=7',
    type: 'image',
  },
  {
    caption: 'Fresh from the garden 🌿 #organic #gardening #healthy',
    imageUrl: 'https://picsum.photos/800/1000?random=8',
    type: 'image',
  },
  {
    caption: 'Beach day with friends! 🏖️ #beach #summer #friends',
    imageUrl: 'https://picsum.photos/800/1000?random=9',
    type: 'image',
  },
  {
    caption: 'Cozy reading corner 📚 #books #reading #cozy',
    imageUrl: 'https://picsum.photos/800/1000?random=10',
    type: 'image',
  },
];

// Fake comments
const fakeComments = [
  'Amazing! 🔥',
  'Love this! ❤️',
  'So beautiful! 😍',
  'Great shot! 📸',
  'Incredible work! 👏',
  'This is awesome! 🙌',
  'Wow! Just wow! 😲',
  'Keep it up! 💪',
  'Stunning! ✨',
  'Absolutely gorgeous! 🌟',
  'Goals! 🎯',
  'This is everything! 💯',
  'So inspiring! 🌈',
  'Love your content! 💖',
  'Can\'t stop looking at this! 👀',
];

async function seedFirebase() {
  console.log('🌱 Starting Firebase seeding...\n');

  try {
    // Step 1: Create users
    console.log('📝 Creating users...');
    const createdUsers: any[] = [];

    for (const userData of fakeUsers) {
      try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
        const user = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: userData.email,
          displayName: userData.displayName,
          username: userData.username,
          bio: userData.bio,
          profileImage: userData.profileImage,
          followers: userData.followers,
          following: userData.following,
          posts: userData.posts,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        createdUsers.push({
          uid: user.uid,
          ...userData,
        });

        console.log(`✅ Created user: ${userData.username}`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Created ${createdUsers.length} users\n`);

    // Step 2: Create posts
    console.log('📸 Creating posts...');
    const createdPosts: any[] = [];

    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      
      // Each user creates 3-5 posts
      const numPosts = Math.floor(Math.random() * 3) + 3;
      
      for (let j = 0; j < numPosts; j++) {
        const postContent = fakePostsContent[Math.floor(Math.random() * fakePostsContent.length)];
        
        const postRef = await addDoc(collection(db, 'posts'), {
          userId: user.uid,
          username: user.username,
          userAvatar: user.profileImage,
          caption: postContent.caption,
          imageUrl: postContent.imageUrl,
          type: postContent.type,
          likes: Math.floor(Math.random() * 500),
          comments: Math.floor(Math.random() * 50),
          shares: Math.floor(Math.random() * 20),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        createdPosts.push({
          id: postRef.id,
          userId: user.uid,
        });

        console.log(`✅ Created post for ${user.username}`);
      }
    }

    console.log(`\n✅ Created ${createdPosts.length} posts\n`);

    // Step 3: Create likes
    console.log('❤️  Creating likes...');
    let likesCount = 0;

    for (const post of createdPosts) {
      // Random users like this post
      const numLikes = Math.floor(Math.random() * 5) + 2;
      const likedUsers = createdUsers
        .sort(() => 0.5 - Math.random())
        .slice(0, numLikes);

      for (const user of likedUsers) {
        await addDoc(collection(db, 'posts', post.id, 'likes'), {
          userId: user.uid,
          username: user.username,
          userAvatar: user.profileImage,
          createdAt: serverTimestamp(),
        });
        likesCount++;
      }
    }

    console.log(`✅ Created ${likesCount} likes\n`);

    // Step 4: Create comments
    console.log('💬 Creating comments...');
    let commentsCount = 0;

    for (const post of createdPosts) {
      // Random users comment on this post
      const numComments = Math.floor(Math.random() * 4) + 2;
      const commentingUsers = createdUsers
        .sort(() => 0.5 - Math.random())
        .slice(0, numComments);

      for (const user of commentingUsers) {
        const commentText = fakeComments[Math.floor(Math.random() * fakeComments.length)];
        
        await addDoc(collection(db, 'posts', post.id, 'comments'), {
          userId: user.uid,
          username: user.username,
          userAvatar: user.profileImage,
          text: commentText,
          createdAt: serverTimestamp(),
        });
        commentsCount++;
      }
    }

    console.log(`✅ Created ${commentsCount} comments\n`);

    // Step 5: Create follow relationships
    console.log('👥 Creating follow relationships...');
    let followsCount = 0;

    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      
      // Each user follows 2-4 random users
      const numFollows = Math.floor(Math.random() * 3) + 2;
      const usersToFollow = createdUsers
        .filter((u) => u.uid !== user.uid)
        .sort(() => 0.5 - Math.random())
        .slice(0, numFollows);

      for (const followUser of usersToFollow) {
        // Create follow relationship
        await setDoc(doc(db, 'users', user.uid, 'following', followUser.uid), {
          userId: followUser.uid,
          username: followUser.username,
          userAvatar: followUser.profileImage,
          createdAt: serverTimestamp(),
        });

        await setDoc(doc(db, 'users', followUser.uid, 'followers', user.uid), {
          userId: user.uid,
          username: user.username,
          userAvatar: user.profileImage,
          createdAt: serverTimestamp(),
        });

        followsCount++;
      }
    }

    console.log(`✅ Created ${followsCount} follow relationships\n`);

    // Step 6: Create notifications
    console.log('🔔 Creating notifications...');
    let notificationsCount = 0;

    for (const user of createdUsers) {
      // Create 5-10 notifications per user
      const numNotifications = Math.floor(Math.random() * 6) + 5;

      for (let i = 0; i < numNotifications; i++) {
        const notifType = ['like', 'comment', 'follow'][Math.floor(Math.random() * 3)];
        const fromUser = createdUsers.filter(u => u.uid !== user.uid)[
          Math.floor(Math.random() * (createdUsers.length - 1))
        ];

        let message = '';
        switch (notifType) {
          case 'like':
            message = 'liked your post';
            break;
          case 'comment':
            message = 'commented on your post';
            break;
          case 'follow':
            message = 'started following you';
            break;
        }

        await addDoc(collection(db, 'users', user.uid, 'notifications'), {
          type: notifType,
          fromUserId: fromUser.uid,
          fromUsername: fromUser.username,
          fromUserAvatar: fromUser.profileImage,
          message,
          read: Math.random() > 0.3, // 70% read, 30% unread
          createdAt: serverTimestamp(),
        });

        notificationsCount++;
      }
    }

    console.log(`✅ Created ${notificationsCount} notifications\n`);

    console.log('🎉 Firebase seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Posts: ${createdPosts.length}`);
    console.log(`   Likes: ${likesCount}`);
    console.log(`   Comments: ${commentsCount}`);
    console.log(`   Follows: ${followsCount}`);
    console.log(`   Notifications: ${notificationsCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding Firebase:', error);
  }
}

// Run the seed function
seedFirebase().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
