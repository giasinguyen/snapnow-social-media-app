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
const HUGGINGFACE_API_KEY = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
const HUGGINGFACE_API_URL =
  "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

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
 * Generate an image using Hugging Face FLUX.1-schnell
 */
export const generateImageWithAI = async (
  prompt: string,
  userId: string
): Promise<string> => {
  try {
    if (!prompt.trim()) {
      throw new Error("Image prompt cannot be empty");
    }

    if (!HUGGINGFACE_API_KEY) {
      throw new Error(
        "Hugging Face API key is not configured. Please add EXPO_PUBLIC_HUGGINGFACE_API_KEY to your .env file"
      );
    }

    console.log("🎨 Generating image with Hugging Face FLUX.1-schnell...");
    console.log("📝 Prompt (original):", prompt);

    // Translate Vietnamese to English for better results
    let enhancedPrompt = prompt;
    
    // Simple Vietnamese to English translation for common words
    const translations: { [key: string]: string } = {
      'mèo': 'cat',
      'chó': 'dog',
      'hoa': 'flower',
      'cây': 'tree',
      'biển': 'ocean',
      'núi': 'mountain',
      'hoàng hôn': 'sunset',
      'bầu trời': 'sky',
      'đẹp': 'beautiful',
      'dễ thương': 'cute',
      'thành phố': 'city',
      'vườn': 'garden',
      'ngôi nhà': 'house',
      'ô tô': 'car',
      'người': 'person',
      'phụ nữ': 'woman',
      'đàn ông': 'man',
      'trẻ em': 'child',
      'phong cảnh': 'landscape',
      'thiên nhiên': 'nature',
    };

    // Apply translations
    let translatedPrompt = prompt.toLowerCase();
    Object.entries(translations).forEach(([vietnamese, english]) => {
      translatedPrompt = translatedPrompt.replace(new RegExp(vietnamese, 'gi'), english);
    });

    // If prompt is in Vietnamese and got translated, use enhanced version
    if (translatedPrompt !== prompt.toLowerCase()) {
      enhancedPrompt = translatedPrompt;
      console.log("🌐 Translated prompt:", enhancedPrompt);
    }

    // Add quality modifiers for better results
    enhancedPrompt = `${enhancedPrompt}, high quality, detailed, professional photography, 4k`;
    console.log("✨ Enhanced prompt:", enhancedPrompt);

    // Generate image with Hugging Face
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: enhancedPrompt,
        parameters: {
          num_inference_steps: 4, // Fast generation (1-4 steps for schnell)
          guidance_scale: 0, // FLUX.1-schnell doesn't use guidance
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face API Error:", errorText);

      // Handle model loading
      if (response.status === 503) {
        throw new Error("Model is loading, please try again in 20-30 seconds");
      }

      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    // Get image as blob
    const imageBlob = await response.blob();
    console.log(
      "✅ Image generated, size:",
      (imageBlob.size / 1024).toFixed(2),
      "KB"
    );

    // Upload to Cloudinary
    console.log("📤 Uploading image to Cloudinary...");
    const cloudinaryUrl = await uploadBlobToCloudinary(
      imageBlob,
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
 * Upload image blob to Cloudinary
 */
const uploadBlobToCloudinary = async (
  imageBlob: Blob,
  userId: string,
  prompt: string
): Promise<string> => {
  try {
    console.log("📤 Uploading image to Cloudinary...");
    console.log("📊 Size:", (imageBlob.size / 1024).toFixed(2), "KB");

    // Convert blob to base64 for mobile upload
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    const base64Image = await base64Promise;

    // Create FormData for Cloudinary upload
    const formData = new FormData();
    formData.append("file", base64Image);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append("folder", "snapnow/ai-generated");
    formData.append("tags", "ai,generated," + userId);
    formData.append(
      "context",
      `prompt=${prompt}|user=${userId}|model=FLUX.1-schnell`
    );

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
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
        imageUrl: data.imageUrl,
        imagePrompt: data.imagePrompt,
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
          imageUrl: data.imageUrl,
          imagePrompt: data.imagePrompt,
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
