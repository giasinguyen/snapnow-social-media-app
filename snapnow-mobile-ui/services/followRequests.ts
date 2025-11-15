import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    Timestamp,
    where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { createDirectFollow } from "./follow";
import { createNotification } from "./notifications";

export interface FollowRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  fromProfileImage?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

// Send a follow request
export async function sendFollowRequest(
  fromUserId: string,
  toUserId: string,
  fromUsername: string,
  fromProfileImage?: string
): Promise<void> {
  try {
    const requestId = `${fromUserId}_${toUserId}`;

    // Create follow request document
    const requestData: any = {
      fromUserId,
      toUserId,
      fromUsername,
      // Firestore does not accept `undefined` values — store `null` when image is not provided
      fromProfileImage: fromProfileImage ?? null,
      status: "pending",
      createdAt: Timestamp.now(),
    };

    await setDoc(doc(db, "followRequests", requestId), requestData);

    // Create notification for the user receiving the request
    await createNotification(
      toUserId,
      "follow_request",
      fromUserId,
      fromUsername,
      fromProfileImage
    );
  } catch (error) {
    console.error("Error sending follow request:", error);
    throw error;
  }
}

// Cancel a follow request
export async function cancelFollowRequest(
  fromUserId: string,
  toUserId: string
): Promise<void> {
  try {
    const requestId = `${fromUserId}_${toUserId}`;
    await deleteDoc(doc(db, "followRequests", requestId));
  } catch (error) {
    console.error("Error canceling follow request:", error);
    throw error;
  }
}

// Accept a follow request
export async function acceptFollowRequest(
  requestId: string,
  fromUserId: string,
  toUserId: string,
  fromUsername: string,
  fromProfileImage?: string
): Promise<void> {
  try {
    // Get the user who accepted (toUserId) info for notification
    const userDoc = await getDoc(doc(db, "users", toUserId));
    const accepterUsername = userDoc.data()?.username || "Someone";
    const accepterProfileImage = userDoc.data()?.profileImage;

    // Delete the follow request first
    await deleteDoc(doc(db, "followRequests", requestId));

    // Create the actual follow relationship directly (bypassing privacy check)
    await createDirectFollow(fromUserId, toUserId, fromUsername, fromProfileImage);
    
    // Notify the user who sent the request that it was accepted
    console.log(`📤 Sending notification to ${fromUserId} (${fromUsername}) that ${accepterUsername} accepted their request`);
    await createNotification(
      fromUserId,
      "follow_request_accepted",
      toUserId,
      accepterUsername,
      accepterProfileImage
    );
    console.log(`✅ Notification sent successfully`);
    
    console.log(`✅ Accepted follow request from ${fromUsername}`);
  } catch (error) {
    console.error("Error accepting follow request:", error);
    throw error;
  }
}

// Reject a follow request
export async function rejectFollowRequest(requestId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "followRequests", requestId));
  } catch (error) {
    console.error("Error rejecting follow request:", error);
    throw error;
  }
}

// Check if a follow request exists
export async function hasFollowRequest(
  fromUserId: string,
  toUserId: string
): Promise<boolean> {
  try {
    const requestId = `${fromUserId}_${toUserId}`;
    const requestDoc = await getDoc(doc(db, "followRequests", requestId));
    return requestDoc.exists() && requestDoc.data()?.status === "pending";
  } catch (error) {
    console.error("Error checking follow request:", error);
    return false;
  }
}

// Get all pending follow requests for a user
export async function getPendingFollowRequests(
  userId: string
): Promise<FollowRequest[]> {
  try {
    const requestsQuery = query(
      collection(db, "followRequests"),
      where("toUserId", "==", userId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(requestsQuery);
    const requests: FollowRequest[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        fromUsername: data.fromUsername,
        fromProfileImage: data.fromProfileImage,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    return requests;
  } catch (error) {
    console.error("Error getting pending follow requests:", error);
    return [];
  }
}

// Get count of pending follow requests
export async function getPendingRequestsCount(userId: string): Promise<number> {
  try {
    const requestsQuery = query(
      collection(db, "followRequests"),
      where("toUserId", "==", userId),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(requestsQuery);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting pending requests count:", error);
    return 0;
  }
}
