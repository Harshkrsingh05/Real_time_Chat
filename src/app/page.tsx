'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SimpleChatRoom } from '@/components/chat/SimpleChatRoom';
import { DirectChatRoom } from '@/components/chat/DirectChatRoom';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatRoom } from '@/types';

export default function Home() {
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [showChat, setShowChat] = useState(false); // Track if chat should be shown on mobile

  const handleSelectChat = (chatRoom: ChatRoom | null) => {
    setSelectedChat(chatRoom);
    setShowChat(true); // Show chat area when any chat is selected
  };

  const handleBack = () => {
    setShowChat(false); // Go back to sidebar on mobile
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 hidden lg:block">
          <Sidebar 
            className="h-full" 
            onSelectChat={setSelectedChat}
            selectedChatId={selectedChat?.id}
          />
        </div>
        
        {/* Mobile Sidebar - shown when chat is not visible */}
        <div className={`w-full lg:hidden ${showChat ? 'hidden' : 'block'}`}>
          <Sidebar 
            className="h-full" 
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChat?.id}
          />
        </div>
        
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${!showChat && 'hidden lg:flex'}`}>
          {selectedChat ? (
            <DirectChatRoom 
              chatRoom={selectedChat} 
              onBack={handleBack}
            />
          ) : (
            <SimpleChatRoom onBack={handleBack} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}