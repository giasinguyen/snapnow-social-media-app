import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedUsername: string;
  blockedUserImage?: string;
  createdAt: any;
}

// Block a user
export async function blockUser(
  userId: string,
  blockedUserId: string,
  blockedUsername: string,
  blockedUserImage?: string
): Promise<void> {
  try {
    // Check if already blocked
    const existingBlock = await isUserBlocked(userId, blockedUserId);
    if (existingBlock) {
      return;
    }

    await addDoc(collection(db, "blocks"), {
      userId,
      blockedUserId,
      blockedUsername,
      blockedUserImage: blockedUserImage || null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    throw error;
  }
}

// Unblock a user
export async function unblockUser(
  userId: string,
  blockedUserId: string
): Promise<void> {
  try {
    const q = query(
      collection(db, "blocks"),
      where("userId", "==", userId),
      where("blockedUserId", "==", blockedUserId)
    );

    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((document) =>
      deleteDoc(doc(db, "blocks", document.id))
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error unblocking user:", error);
    throw error;
  }
}

// Check if a user is blocked
export async function isUserBlocked(
  userId: string,
  blockedUserId: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db, "blocks"),
      where("userId", "==", userId),
      where("blockedUserId", "==", blockedUserId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking if user is blocked:", error);
    return false;
  }
}

// Get all blocked users for a user
export async function getBlockedUsers(userId: string): Promise<BlockedUser[]> {
  try {
    const q = query(
      collection(db, "blocks"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const blockedUsers: BlockedUser[] = [];

    snapshot.forEach((document) => {
      const data = document.data();
      blockedUsers.push({
        id: document.id,
        userId: data.userId,
        blockedUserId: data.blockedUserId,
        blockedUsername: data.blockedUsername,
        blockedUserImage: data.blockedUserImage,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      });
    });

    return blockedUsers;
  } catch (error) {
    console.error("Error getting blocked users:", error);
    throw error;
  }
}

// Check if current user is blocked by another user
export async function isBlockedBy(
  userId: string,
  otherUserId: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db, "blocks"),
      where("userId", "==", otherUserId),
      where("blockedUserId", "==", userId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking if blocked by user:", error);
    return false;
  }
}
