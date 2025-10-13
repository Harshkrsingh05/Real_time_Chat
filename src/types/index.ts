import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOnline: boolean;
  lastSeen: Timestamp;
  createdAt: Timestamp;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'direct' | 'group';
  participants: string[]; // User UIDs
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Timestamp;
    type: MessageType;
  };
  unreadCount?: { [userId: string]: number };
}

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video';

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  text: string;
  type: MessageType;
  timestamp: Timestamp;
  editedAt?: Timestamp;
  reactions?: { [emoji: string]: string[] }; // emoji -> user IDs
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  };
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  thumbnailUrl?: string; // For images/videos
  isDeleted?: boolean;
  readBy?: { [userId: string]: Timestamp };
}

export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  chatRoomId: string;
  messageId?: string;
}

export interface TypingIndicator {
  chatRoomId: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
}

// Helper types for real-time updates
export interface ChatRoomWithMessages extends ChatRoom {
  messages: Message[];
}

export interface UserPresence {
  uid: string;
  isOnline: boolean;
  lastSeen: Timestamp;
}

// API Response types
export interface CreateChatRoomRequest {
  name: string;
  description?: string;
  type: 'direct' | 'group';
  participantEmails?: string[];
  participantIds?: string[];
}

export interface SendMessageRequest {
  text: string;
  type: MessageType;
  replyToId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}