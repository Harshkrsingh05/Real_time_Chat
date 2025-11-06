'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search, Plus, MessageCircle, X } from 'lucide-react';
import { ChatRoom } from '@/types';

interface DirectMessagesPanelProps {
  onSelectChat: (chatRoom: ChatRoom) => void;
  selectedChatId?: string;
}

interface UserSearchResult {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOnline: boolean;
}

interface ChatRoomWithUserName extends ChatRoom {
  otherUserName?: string;
}

export const DirectMessagesPanel: React.FC<DirectMessagesPanelProps> = ({ 
  onSelectChat,
  selectedChatId 
}) => {
  const { user, userProfile } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoomWithUserName[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load user's direct message chat rooms
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chatRooms'),
      where('type', '==', 'direct'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatRoom[];
      
      // Fetch other user names for each chat room
      const roomsWithNames = await Promise.all(
        rooms.map(async (room) => {
          const otherUserId = room.participants.find(id => id !== user.uid);
          if (otherUserId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', otherUserId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...room,
                  otherUserName: userData.displayName || userData.email || 'User'
                };
              }
            } catch (error) {
              console.error('Error fetching user:', error);
            }
          }
          return { ...room, otherUserName: 'User' };
        })
      );
      
      setChatRooms(roomsWithNames);
    });

    return unsubscribe;
  }, [user]);

  const searchUsers = async () => {
    if (!searchEmail.trim() || !user) return;

    setSearching(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '==', searchEmail.trim().toLowerCase())
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as UserSearchResult[];

      // Filter out current user
      const filteredUsers = users.filter(u => u.uid !== user.uid);
      setSearchResults(filteredUsers);

      if (filteredUsers.length === 0) {
        alert('No user found with this email address.');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      alert('Failed to search users. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const createDirectChat = async (otherUser: UserSearchResult) => {
    if (!user || !userProfile || creating) return;

    setCreating(true);
    try {
      // Check if chat already exists
      const existingChatQuery = query(
        collection(db, 'chatRooms'),
        where('type', '==', 'direct'),
        where('participants', 'array-contains', user.uid)
      );

      const existingChats = await getDocs(existingChatQuery);
      const existingChat = existingChats.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(otherUser.uid);
      });

      if (existingChat) {
        // Chat already exists, select it
        const chatData = { id: existingChat.id, ...existingChat.data() } as ChatRoom;
        onSelectChat(chatData);
        setShowNewChatModal(false);
        setSearchEmail('');
        setSearchResults([]);
        return;
      }

      // Create new chat room
      const newChatRoom: Omit<ChatRoom, 'id'> = {
        name: `${userProfile.displayName} & ${otherUser.displayName}`,
        type: 'direct',
        participants: [user.uid, otherUser.uid],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'chatRooms'), newChatRoom);
      
      const createdChat: ChatRoom = {
        id: docRef.id,
        ...newChatRoom,
      } as ChatRoom;

      onSelectChat(createdChat);
      setShowNewChatModal(false);
      setSearchEmail('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating direct chat:', error);
      alert('Failed to create chat. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getOtherUserName = (chatRoom: ChatRoomWithUserName): string => {
    return chatRoom.otherUserName || 'User';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Direct Messages
          </h3>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chatRooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No direct messages yet</p>
            <p className="text-xs mt-1">Start a new conversation!</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {chatRooms.map((chatRoom) => (
              <div
                key={chatRoom.id}
                onClick={() => onSelectChat(chatRoom)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChatId === chatRoom.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                    {getOtherUserName(chatRoom).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {getOtherUserName(chatRoom)}
                    </div>
                    {chatRoom.lastMessage && (
                      <div className="text-xs text-gray-500 truncate">
                        {chatRoom.lastMessage.text}
                      </div>
                    )}
                  </div>
                  {chatRoom.unreadCount && chatRoom.unreadCount[user?.uid || ''] > 0 && (
                    <div className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {chatRoom.unreadCount[user?.uid || '']}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">New Direct Message</h3>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSearchEmail('');
                  setSearchResults([]);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Email
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                      placeholder="Enter user's email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <button
                    onClick={searchUsers}
                    disabled={searching || !searchEmail.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Search Results:</p>
                  {searchResults.map((user) => (
                    <div
                      key={user.uid}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => createDirectChat(user)}
                        disabled={creating}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {creating ? 'Creating...' : 'Chat'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
