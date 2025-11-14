/**
 * Generate a deterministic room ID for video calls between two users.
 * The room ID is always the same regardless of who initiates the call.
 * 
 * @param userId1 First user's ID
 * @param userId2 Second user's ID
 * @returns A consistent room ID for the two users
 */
export function generateRoomId(userId1: string, userId2: string): string {
  // Sort user IDs to ensure consistency regardless of who calls first
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
}
