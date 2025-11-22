'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Send, ArrowLeft, User } from 'lucide-react';
import { ChatRoom, Message } from '@/types';

interface DirectChatRoomProps {
  chatRoom: ChatRoom;
  onBack: () => void;
}

export const DirectChatRoom: React.FC<DirectChatRoomProps> = ({ chatRoom, onBack }) => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otherUserName, setOtherUserName] = useState('');
  const [otherUserEmail, setOtherUserEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get other user's info
  useEffect(() => {
    const getOtherUserInfo = async () => {
      if (!user || !chatRoom.participants) return;

      const otherUserId = chatRoom.participants.find(id => id !== user.uid);
      if (!otherUserId) return;

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('__name__', '==', otherUserId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setOtherUserName(userData.displayName || 'User');
          setOtherUserEmail(userData.email || '');
        }
      } catch (error) {
        console.error('Error fetching other user info:', error);
      }
    };

    getOtherUserInfo();
  }, [chatRoom, user]);

  // Listen to messages
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoom.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      
      setMessages(messageList);
    });

    return unsubscribe;
  }, [chatRoom.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !userProfile || loading) return;

    setLoading(true);
    
    try {
      const messageData: any = {
        chatRoomId: chatRoom.id,
        senderId: user.uid,
        senderName: userProfile.displayName,
        text: newMessage.trim(),
        type: 'text' as const,
        timestamp: serverTimestamp(),
      };

      // Only add senderPhotoURL if it exists
      if (userProfile.photoURL) {
        messageData.senderPhotoURL = userProfile.photoURL;
      }

      await addDoc(collection(db, 'messages'), messageData);

      // Update chat room's last message and updatedAt
      const chatRoomRef = doc(db, 'chatRooms', chatRoom.id);
      await updateDoc(chatRoomRef, {
        lastMessage: {
          text: newMessage.trim(),
          senderId: user.uid,
          senderName: userProfile.displayName,
          timestamp: serverTimestamp(),
          type: 'text',
        },
        updatedAt: serverTimestamp(),
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = message.timestamp ? formatDate(message.timestamp) : 'Unknown';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
          {otherUserName.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
        </div>
        
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">{otherUserName || 'Loading...'}</h2>
          <p className="text-xs text-gray-500">{otherUserEmail}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
              <p className="text-gray-600">Send a message to {otherUserName}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {date}
                  </div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {msgs.map((message) => {
                    const isOwnMessage = message.senderId === user?.uid;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 border rounded-bl-md'
                          }`}
                        >
                          {/* Message text */}
                          <div className="break-words">{message.text}</div>
                          
                          {/* Timestamp */}
                          <div
                            className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${otherUserName}...`}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-black"
          />
          
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{loading ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
