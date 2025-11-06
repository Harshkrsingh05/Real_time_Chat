'use client';

import React from 'react';
import { Hash, MessageCircle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DirectMessagesPanel } from './DirectMessagesPanel';
import { ChatRoom } from '@/types';

interface SidebarProps {
  className?: string;
  onSelectChat?: (chatRoom: ChatRoom | null) => void;
  selectedChatId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  className = '',
  onSelectChat,
  selectedChatId 
}) => {
  const { userProfile, signOut } = useAuth();

  return (
    <div className={`flex flex-col h-full bg-white border-r ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-blue-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Real Time Chat</h1>
        </div>

        {/* User info */}
        {userProfile && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-medium">
              {userProfile.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{userProfile.displayName}</div>
              <div className="text-sm text-blue-100">{userProfile.email}</div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Rooms */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {/* General Room */}
          <div className="p-4 border-b">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Public Rooms
            </h3>
            
            <div 
              onClick={() => onSelectChat && onSelectChat(null)}
              className={`rounded-lg p-3 cursor-pointer transition-colors ${
                selectedChatId === null 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Hash className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">General</div>
                  <div className="text-xs text-gray-500">Everyone can join this chat</div>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Direct Messages Panel */}
          {onSelectChat && (
            <DirectMessagesPanel 
              onSelectChat={onSelectChat}
              selectedChatId={selectedChatId}
            />
          )}

          {/* Future Features */}
          <div className="p-4 border-t">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              More Features
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">Group Chats </span>
              </div>
              <div className="flex items-center space-x-3 p-2 text-gray-400">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">File Sharing</span>
              </div>
              <div className="flex items-center space-x-3 p-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">Voice Calls</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={signOut}
          className="w-full text-left p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign Out
        </button>
        
        <div className="text-xs text-gray-500 text-center mt-2">
          Real Time Chat v1.0
        </div>
      </div>
    </div>
  );
};