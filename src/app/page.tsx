'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SimpleChatRoom } from '@/components/chat/SimpleChatRoom';
import { Sidebar } from '@/components/chat/Sidebar';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <Sidebar className="h-full" />
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <SimpleChatRoom />
        </div>
      </div>
    </ProtectedRoute>
  );
}