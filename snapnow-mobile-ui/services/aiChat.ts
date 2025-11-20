import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  limit as firestoreLimit,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { CLOUDINARY_CONFIG, CLOUDINARY_UPLOAD_URL } from "../config/cloudinary";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";
const REPLICATE_API_KEY = process.env.EXPO_PUBLIC_REPLICATE_API_KEY;
const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

// Model version hashes - using stable, publicly available models
const FLUX_VERSION = "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637"; // FLUX Schnell
const SD3_VERSION = "f437ab8c4e29d53c44e94e6eb046170c02dc3fc2bdd542f8e451bcb8a88df0e6"; // Stable Diffusion 1.5 (fallback)


export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string; // For AI-generated images
  imagePrompt?: string; // The prompt used to generate the image
  timestamp: Timestamp;
  createdAt: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  lastMessage: string;
  lastUpdated: Timestamp;
  userName?: string;
}

/**
 * Send a message to Gemini AI and get response
 */
export const sendMessageToAI = async (
  message: string,
  userId: string,
  conversationHistory: AIMessage[] = []
): Promise<string> => {
  try {
    if (!message.trim()) {
      throw new Error("Message cannot be empty");
    }

    // Build conversation context
    let conversationContext = "";
    if (conversationHistory.length > 0) {
      conversationContext = conversationHistory
        .slice(-10) // Only keep last 10 messages for context
        .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.text}`)
        .join("\n");
      conversationContext += "\n";
    }

    // System prompt to make AI behave like Meta AI
    const systemPrompt = `You are SnapNow AI, an intelligent assistant integrated into the SnapNow social media app, similar to Meta AI on Instagram. You help users with:
- Answering questions about various topics
- Providing creative suggestions for posts and stories
- Offering photography and content creation tips
- Helping with general information and recommendations
- Being friendly, helpful, and conversational

Keep your responses concise, friendly, and helpful. Use emojis occasionally to be more engaging. If users ask about SnapNow features, be supportive and enthusiastic.

${conversationContext}User: ${message}
AI:`;

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to get AI response");
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from AI");
    }

    const aiMessage = data.candidates[0].content.parts[0].text;

    // Save conversation to Firestore
    await saveAIConversation(userId, message, aiMessage);

    return aiMessage;
  } catch (error) {
    console.error("Error sending message to AI:", error);
    throw error;
  }
};

/**
 * Generate an image using Replicate (flux-1.1-pro or ideogram-v2-turbo)
 */
export const generateImageWithAI = async (
  prompt: string,
  userId: string
): Promise<string> => {
  try {
    if (!prompt.trim()) {
      throw new Error("Image prompt cannot be empty");
    }

    console.log("🎨 Generating image with Replicate (FLUX-Schnell)...");

    // Create prediction with FLUX-Schnell (free, fast model)
    const createResponse = await fetch(REPLICATE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${REPLICATE_API_KEY}`,
      },
      body: JSON.stringify({
        version: FLUX_VERSION,
        input: {
          prompt: prompt,
          go_fast: true,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 80,
          num_inference_steps: 4,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error("Replicate API Error:", errorData);
      throw new Error(
        errorData.detail || "Failed to create image generation request"
      );
    }

    const prediction = await createResponse.json();
    console.log("📝 Prediction created:", prediction.id);

    // Poll for result from Replicate
    let replicateUrl = await pollReplicateResult(prediction.id);

    if (!replicateUrl) {
      // Fallback to Stable Diffusion 1.5 if FLUX fails
      console.log("🔄 Trying fallback model: Stable Diffusion 1.5...");
      replicateUrl = await generateWithIdeogram(prompt, userId);
    }

    // Upload Replicate image to Cloudinary for permanent storage
    console.log("📤 Uploading image to Cloudinary...");
    const cloudinaryUrl = await uploadImageToCloudinary(
      replicateUrl,
      userId,
      prompt
    );

    // Save to Firestore with Cloudinary URL
    await saveAIImageConversation(userId, prompt, cloudinaryUrl);

    return cloudinaryUrl;
  } catch (error) {
    console.error("Error generating image with AI:", error);
    throw error;
  }
};

/**
 * Upload image from URL to Cloudinary
 */
const uploadImageToCloudinary = async (
  imageUrl: string,
  userId: string,
  prompt: string
): Promise<string> => {
  try {
    console.log("📤 Uploading image to Cloudinary...");
    console.log("🔗 Source URL:", imageUrl);

    // Download image from Replicate first
    console.log("⬇️ Downloading image from Replicate...");
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download image from Replicate");
    }

    const imageBlob = await imageResponse.blob();
    console.log(
      "✅ Image downloaded, size:",
      (imageBlob.size / 1024).toFixed(2),
      "KB"
    );

    // Create FormData with the actual file blob
    const formData = new FormData();
    formData.append("file", {
      uri: imageUrl,
      type: "image/jpeg",
      name: `ai-generated-${Date.now()}.jpg`,
    } as any);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append("folder", "snapnow/ai-generated");
    formData.append("tags", "ai,generated," + userId);

    // Add context metadata
    formData.append("context", `prompt=${prompt}|user=${userId}`);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Cloudinary upload failed:", errorData);
      throw new Error(errorData.error?.message || "Cloudinary upload failed");
    }

    const data = await response.json();
    console.log("✅ Image uploaded to Cloudinary:", data.secure_url);
    console.log("📊 Image details:", {
      publicId: data.public_id,
      size: `${(data.bytes / 1024).toFixed(2)} KB`,
      dimensions: `${data.width}x${data.height}`,
    });

    return data.secure_url;
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error);
    throw error;
  }
};

/**
 * Poll Replicate API for result
 */
const pollReplicateResult = async (
  predictionId: string,
  maxAttempts: number = 30
): Promise<string> => {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between polls

    const response = await fetch(`${REPLICATE_API_URL}/${predictionId}`, {
      headers: {
        Authorization: `Bearer ${REPLICATE_API_KEY}`,
      },
    });

    const prediction = await response.json();
    console.log(`🔍 Poll ${i + 1}/${maxAttempts}: ${prediction.status}`);

    if (prediction.status === "succeeded") {
      // Log the full output to debug
      console.log(
        "📦 Full prediction output:",
        JSON.stringify(prediction.output, null, 2)
      );

      let replicateUrl = "";

      // Handle different output formats
      if (Array.isArray(prediction.output)) {
        replicateUrl = prediction.output[0];
      } else if (typeof prediction.output === "string") {
        replicateUrl = prediction.output;
      } else if (prediction.output?.url) {
        replicateUrl = prediction.output.url;
      }

      if (replicateUrl && replicateUrl.startsWith("http")) {
        console.log("✅ Image generated by Replicate!");
        console.log("🔗 Replicate URL (temporary):", replicateUrl);
        return replicateUrl;
      } else {
        console.error("❌ Invalid URL received:", replicateUrl);
        throw new Error("Invalid image URL from Replicate");
      }
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(
        prediction.error || "Image generation failed or was canceled"
      );
    }
  }

  throw new Error("Image generation timed out");
};

/**
 * Fallback: Generate with Stable Diffusion 1.5
 */
const generateWithIdeogram = async (
  prompt: string,
  userId: string
): Promise<string> => {
  console.log("🔄 Using fallback: Stable Diffusion 1.5...");
  const createResponse = await fetch(REPLICATE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${REPLICATE_API_KEY}`,
    },
    body: JSON.stringify({
      version: SD3_VERSION,
      input: {
        prompt: prompt,
        width: 512,
        height: 512,
        num_outputs: 1,
        num_inference_steps: 25,
        guidance_scale: 7.5,
      },
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    console.error("SD 1.5 API Error:", errorData);
    throw new Error("Failed to create SD 1.5 prediction");
  }

  const prediction = await createResponse.json();
  const replicateUrl = await pollReplicateResult(prediction.id);

  // Upload to Cloudinary
  const cloudinaryUrl = await uploadImageToCloudinary(
    replicateUrl,
    userId,
    prompt
  );
  return cloudinaryUrl;
};

/**
 * Save AI conversation to Firestore
 */
const saveAIConversation = async (
  userId: string,
  userMessage: string,
  aiMessage: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, "aiConversations", userId);
    const messagesRef = collection(conversationRef, "messages");

    // Add user message
    await addDoc(messagesRef, {
      role: "user",
      text: userMessage,
      timestamp: serverTimestamp(),
    });

    // Add AI message
    await addDoc(messagesRef, {
      role: "assistant",
      text: aiMessage,
      timestamp: serverTimestamp(),
    });

    // Update conversation metadata
    await addDoc(collection(db, "aiConversations"), {
      userId,
      lastMessage: aiMessage,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving AI conversation:", error);
    // Don't throw error here, conversation can still work without saving
  }
};

/**
 * Save AI image generation conversation to Firestore
 */
const saveAIImageConversation = async (
  userId: string,
  prompt: string,
  imageUrl: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, "aiConversations", userId);
    const messagesRef = collection(conversationRef, "messages");

    console.log("💾 Saving image conversation to Firestore...");

    // Add user prompt
    await addDoc(messagesRef, {
      role: "user",
      text: `🎨 Tạo ảnh: ${prompt}`,
      timestamp: serverTimestamp(),
    });

    console.log("✅ User prompt saved");

    // Add AI image response
    await addDoc(messagesRef, {
      role: "assistant",
      text: "Đây là ảnh tôi tạo cho bạn:",
      imageUrl: imageUrl,
      imagePrompt: prompt,
      timestamp: serverTimestamp(),
    });

    console.log("✅ AI image response saved with URL:", imageUrl);

    // No need to update metadata separately - realtime listener handles this
  } catch (error) {
    console.error("❌ Error saving AI image conversation:", error);
    throw error; // Re-throw to show error to user
  }
};

/**
 * Get AI conversation history
 */
export const getAIConversationHistory = async (
  userId: string,
  limitCount: number = 50
): Promise<AIMessage[]> => {
  try {
    const conversationRef = doc(db, "aiConversations", userId);
    const messagesRef = collection(conversationRef, "messages");

    const q = query(
      messagesRef,
      orderBy("timestamp", "asc"),
      firestoreLimit(limitCount)
    );

    const querySnapshot = await getDocs(q);

    const messages: AIMessage[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        role: data.role,
        text: data.text,
        timestamp: data.timestamp,
        createdAt: data.timestamp?.toDate() || new Date(),
      };
    });

    return messages;
  } catch (error) {
    console.error("Error getting AI conversation history:", error);
    return [];
  }
};

/**
 * Subscribe to AI conversation updates
 */
export const subscribeToAIConversation = (
  userId: string,
  onUpdate: (messages: AIMessage[]) => void,
  limitCount: number = 50
): (() => void) => {
  try {
    const conversationRef = doc(db, "aiConversations", userId);
    const messagesRef = collection(conversationRef, "messages");

    const q = query(
      messagesRef,
      orderBy("timestamp", "asc"),
      firestoreLimit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: AIMessage[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role,
          text: data.text,
          timestamp: data.timestamp,
          createdAt: data.timestamp?.toDate() || new Date(),
        };
      });

      onUpdate(messages);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to AI conversation:", error);
    return () => {};
  }
};

/**
 * Clear AI conversation history
 */
export const clearAIConversation = async (userId: string): Promise<void> => {
  try {
    const conversationRef = doc(db, "aiConversations", userId);
    const messagesRef = collection(conversationRef, "messages");

    const querySnapshot = await getDocs(messagesRef);

    const deletePromises = querySnapshot.docs.map((docSnap) =>
      deleteDoc(docSnap.ref)
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error clearing AI conversation:", error);
    throw error;
  }
};

/**
 * Get quick AI suggestions for social media content
 */
export const getAISuggestions = async (
  type: "caption" | "hashtags" | "bio" | "story-idea",
  context?: string
): Promise<string[]> => {
  try {
    let prompt = "";

    switch (type) {
      case "caption":
        prompt = `Generate 3 creative Instagram-style captions${
          context ? ` for: ${context}` : ""
        }. Keep them short, engaging, and include relevant emojis.`;
        break;
      case "hashtags":
        prompt = `Generate 10 relevant hashtags${
          context ? ` for: ${context}` : " for a social media post"
        }. Return only hashtags, one per line.`;
        break;
      case "bio":
        prompt = `Generate 3 creative Instagram bio ideas${
          context ? ` for someone who: ${context}` : ""
        }. Keep them under 150 characters and use emojis.`;
        break;
      case "story-idea":
        prompt = `Generate 5 creative Instagram story ideas${
          context ? ` related to: ${context}` : ""
        }. Be specific and engaging.`;
        break;
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get AI suggestions");
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // Split response into array
    return text.split("\n").filter((line: string) => line.trim().length > 0);
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    return [];
  }
};
