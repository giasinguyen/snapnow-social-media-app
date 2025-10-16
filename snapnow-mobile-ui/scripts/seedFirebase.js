require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config from .env
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

// Fake users data
const fakeUsers = [
  {
    email: 'john.doe@snapnow.com',
    password: 'SnapNow123!',
    displayName: 'John Doe',
    username: 'johndoe',
    bio: 'Travel enthusiast 🌍 | Photography lover 📸 | Coffee addict ☕',
    profileImage: 'https://i.pravatar.cc/300?img=12',
  },
  {
    email: 'jane.smith@snapnow.com',
    password: 'SnapNow123!',
    displayName: 'Jane Smith',
    username: 'janesmith',
    bio: 'Digital Artist 🎨 | Cat mom 🐱 | Living my best life ✨',
    profileImage: 'https://i.pravatar.cc/300?img=45',
  },
  {
    email: 'mike.johnson@snapnow.com',
    password: 'SnapNow123!',
    displayName: 'Mike Johnson',
    username: 'mikejohnson',
    bio: 'Fitness coach 💪 | Healthy lifestyle 🥗 | Motivating others',
    profileImage: 'https://i.pravatar.cc/300?img=33',
  },
  {
    email: 'sarah.wilson@snapnow.com',
    password: 'SnapNow123!',
    displayName: 'Sarah Wilson',
    username: 'sarahwilson',
    bio: 'Food blogger 🍕 | Recipe creator 👩‍🍳 | Foodie at heart',
    profileImage: 'https://i.pravatar.cc/300?img=27',
  },
  {
    email: 'david.brown@snapnow.com',
    password: 'SnapNow123!',
    displayName: 'David Brown',
    username: 'davidbrown',
    bio: 'Tech enthusiast 💻 | Gamer 🎮 | Code & Coffee',
    profileImage: 'https://i.pravatar.cc/300?img=51',
  },
];

// Fake posts content
const fakePostsContent = [
  {
    caption: 'Beautiful sunset at the beach 🌅 #sunset #beach #nature',
    imageUrl: 'https://picsum.photos/800/1000?random=1',
  },
  {
    caption: 'My morning coffee routine ☕️ #coffee #morning #lifestyle',
    imageUrl: 'https://picsum.photos/800/1000?random=2',
  },
  {
    caption: 'Weekend hiking adventure! 🏔️ #hiking #adventure #outdoors',
    imageUrl: 'https://picsum.photos/800/1000?random=3',
  },
  {
    caption: 'Homemade pasta from scratch 🍝 #cooking #foodie #pasta',
    imageUrl: 'https://picsum.photos/800/1000?random=4',
  },
  {
    caption: 'New workout routine! 💪 #fitness #gym #health',
    imageUrl: 'https://picsum.photos/800/1000?random=5',
  },
  {
    caption: 'City lights at night 🌃 #cityscape #photography #night',
    imageUrl: 'https://picsum.photos/800/1000?random=6',
  },
  {
    caption: 'Morning yoga session 🧘‍♀️ #yoga #wellness #mindfulness',
    imageUrl: 'https://picsum.photos/800/1000?random=7',
  },
  {
    caption: 'Fresh from the garden 🌿 #organic #gardening #healthy',
    imageUrl: 'https://picsum.photos/800/1000?random=8',
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
];

async function seedFirebase() {
  console.log('🌱 Starting Firebase seeding...\n');

  try {
    const createdUsers = [];

    // Step 1: Create users
    console.log('📝 Creating users...');
    for (const userData of fakeUsers) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: userData.email,
          displayName: userData.displayName,
          username: userData.username,
          bio: userData.bio,
          profileImage: userData.profileImage,
          followers: 0,
          following: 0,
          posts: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        createdUsers.push({
          uid: user.uid,
          ...userData,
        });

        console.log(`✅ Created user: ${userData.username}`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️  User ${userData.email} already exists`);
        } else {
          console.error(`❌ Error creating user:`, error.message);
        }
      }
    }

    console.log(`\n✅ Created ${createdUsers.length} users\n`);

    // Step 2: Create posts
    console.log('📸 Creating posts...');
    const createdPosts = [];

    for (const user of createdUsers) {
      const numPosts = Math.floor(Math.random() * 3) + 2;
      
      for (let j = 0; j < numPosts; j++) {
        const postContent = fakePostsContent[Math.floor(Math.random() * fakePostsContent.length)];
        
        const postRef = await addDoc(collection(db, 'posts'), {
          userId: user.uid,
          username: user.username,
          userAvatar: user.profileImage,
          caption: postContent.caption,
          imageUrl: postContent.imageUrl,
          type: 'image',
          likes: 0,
          comments: 0,
          shares: 0,
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
      const numLikes = Math.floor(Math.random() * 3) + 1;
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
      const numComments = Math.floor(Math.random() * 3) + 1;
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

    console.log('🎉 Firebase seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Posts: ${createdPosts.length}`);
    console.log(`   Likes: ${likesCount}`);
    console.log(`   Comments: ${commentsCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding Firebase:', error);
  }
}

seedFirebase().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
