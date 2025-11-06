# Architecture Diagram: Direct Messaging System

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐           ┌──────────────────────────┐   │
│  │                  │           │                          │   │
│  │    Sidebar       │           │    Chat Area             │   │
│  │                  │           │                          │   │
│  │  ┌────────────┐  │           │  ┌────────────────────┐ │   │
│  │  │  General   │  │           │  │  SimpleChatRoom    │ │   │
│  │  │   Room     │◄─┼───────────┼─►│  (General Chat)    │ │   │
│  │  └────────────┘  │           │  └────────────────────┘ │   │
│  │                  │           │                          │   │
│  │  ┌────────────┐  │           │  ┌────────────────────┐ │   │
│  │  │   Direct   │  │           │  │  DirectChatRoom    │ │   │
│  │  │  Messages  │◄─┼───────────┼─►│  (1-on-1 Chat)     │ │   │
│  │  │   Panel    │  │           │  └────────────────────┘ │   │
│  │  └────────────┘  │           │                          │   │
│  │                  │           │                          │   │
│  └──────────────────┘           └──────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Real-time Listeners
                              │ (onSnapshot)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firebase Services                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────┐ │
│  │  Firebase Auth │    │   Firestore    │    │   Storage    │ │
│  │                │    │                │    │  (Future)    │ │
│  │  - Email/Pass  │    │  Collections:  │    │              │ │
│  │  - Google OAuth│    │  • users       │    │  - Images    │ │
│  │  - User State  │    │  • chatRooms   │    │  - Files     │ │
│  │                │    │  • messages    │    │  - Media     │ │
│  └────────────────┘    │  • general...  │    │              │ │
│                        └────────────────┘    └──────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App (page.tsx)
│
├─ AuthProvider (AuthContext.tsx)
│  └─ ProtectedRoute
│     │
│     └─ Main Layout
│        │
│        ├─ Sidebar
│        │  ├─ User Profile Section
│        │  ├─ General Room Button
│        │  ├─ DirectMessagesPanel
│        │  │  ├─ Chat List
│        │  │  └─ New Chat Modal
│        │  │     └─ User Search
│        │  └─ Settings/Logout
│        │
│        └─ Chat Area (Conditional)
│           │
│           ├─ SimpleChatRoom (if General selected)
│           │  ├─ Header
│           │  ├─ Messages List
│           │  └─ Message Input
│           │
│           └─ DirectChatRoom (if DM selected)
│              ├─ Header (with back button)
│              ├─ Messages List (grouped by date)
│              └─ Message Input
```

## Data Flow: Sending a Direct Message

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: User Types Message                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DirectChatRoom Component                                       │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  [Message Input Field] → [Send Button]               │      │
│  │                              │                        │      │
│  │                              ▼                        │      │
│  │                       sendMessage()                   │      │
│  └──────────────────────────────────────────────────────┘      │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────┐
│ Step 2: Add to Firestore     ▼                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Firebase Firestore                                             │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  addDoc(collection(db, 'messages'), {                │       │
│  │    chatRoomId: "chat123",                            │       │
│  │    senderId: "user1",                                │       │
│  │    text: "Hello!",                                   │       │
│  │    timestamp: serverTimestamp()                      │       │
│  │  })                                                  │       │
│  └─────────────────────────────────────────────────────┘       │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  updateDoc(doc(db, 'chatRooms', 'chat123'), {       │       │
│  │    lastMessage: {...},                               │       │
│  │    updatedAt: serverTimestamp()                      │       │
│  │  })                                                  │       │
│  └─────────────────────────────────────────────────────┘       │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────┐
│ Step 3: Real-time Broadcast  ▼                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  onSnapshot Listeners (Both Users)                              │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  onSnapshot(messagesQuery, (snapshot) => {           │       │
│  │    const messages = snapshot.docs.map(...)           │       │
│  │    setMessages(messages)  // Update UI               │       │
│  │  })                                                  │       │
│  └─────────────────────────────────────────────────────┘       │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────┐
│ Step 4: UI Updates           ▼                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Both User Screens Update                                       │
│  ┌────────────────────┐         ┌────────────────────┐         │
│  │   Sender Screen    │         │  Recipient Screen  │         │
│  │                    │         │                    │         │
│  │  [Message Appears] │         │  [Message Appears] │         │
│  │  "Hello!" (blue)   │         │  "Hello!" (white)  │         │
│  │                    │         │                    │         │
│  └────────────────────┘         └────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Starting a New Chat

```
User A wants to chat with User B (bob@example.com)

1. Click "+" Button
   │
   ├─ DirectMessagesPanel opens modal
   │
2. Enter "bob@example.com" and Search
   │
   ├─ Query Firestore users collection
   │  WHERE email == "bob@example.com"
   │
   ├─ Results returned: [{ uid: "user_b_id", name: "Bob", ... }]
   │
3. Click "Chat" button
   │
   ├─ Check if chat already exists
   │  └─ Query chatRooms WHERE participants contains both UIDs
   │
   ├─ If exists: Open existing chat
   │  └─ onSelectChat(existingChatRoom)
   │
   └─ If not exists: Create new chat
      │
      ├─ addDoc(chatRooms, {
      │    name: "Alice & Bob",
      │    type: "direct",
      │    participants: ["user_a_id", "user_b_id"],
      │    createdBy: "user_a_id",
      │    timestamps...
      │  })
      │
      └─ onSelectChat(newChatRoom)
         │
         └─ DirectChatRoom component loads
            │
            ├─ Fetch messages for this chatRoomId
            │
            └─ Set up real-time listener
```

## Security Flow

```
┌────────────────────────────────────────────────────────────┐
│                     Client Request                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  User tries to: Read messages in chat room "chat123"      │
│                                                             │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│              Firebase Authentication Check                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Is user authenticated?                                  │
│    request.auth != null                                    │
│                                                             │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│              Firestore Security Rules Check                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  match /messages/{messageId} {                             │
│    allow read: if                                          │
│      isAuthenticated() &&                                  │
│      request.auth.uid in                                   │
│        getChatRoom(resource.data.chatRoomId).participants  │
│  }                                                         │
│                                                             │
│  1. Get chat room data                                     │
│  2. Check if user.uid in participants array                │
│  3. Allow or Deny                                          │
│                                                             │
└─────────────────────────┬──────────────────────────────────┘
                          │
                ┌─────────┴──────────┐
                │                    │
                ▼                    ▼
         ┌───────────┐        ┌──────────┐
         │  ALLOWED  │        │  DENIED  │
         │           │        │          │
         │ Return    │        │ Return   │
         │ Data      │        │ Error    │
         └───────────┘        └──────────┘
```

## State Management Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Global State                           │
│                  (AuthContext)                            │
│                                                           │
│  • user: User | null                                     │
│  • userProfile: UserProfile | null                       │
│  • loading: boolean                                      │
│                                                           │
└──────────────────────┬───────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Sidebar   │ │    Chat     │ │   Header    │
│             │ │   Rooms     │ │             │
│  • Display  │ │             │ │  • Display  │
│    user     │ │  • Filter   │ │    user     │
│    info     │ │    by user  │ │    name     │
│             │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘

┌──────────────────────────────────────────────────────────┐
│                    Local State                            │
│                  (page.tsx)                               │
│                                                           │
│  selectedChat: ChatRoom | null                           │
│  │                                                        │
│  ├─ null: Show SimpleChatRoom (General)                  │
│  └─ ChatRoom: Show DirectChatRoom                        │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Real-time Update Flow

```
     Firestore Database
            │
            │ Real-time Stream
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
User A's          User B's
Browser           Browser
    │                │
    │ onSnapshot     │ onSnapshot
    │ Listener       │ Listener
    │                │
    ▼                ▼
Update UI        Update UI
automatically    automatically

When ANY user:
• Sends a message
• Edits a message
• Deletes a message
• Updates profile

ALL connected users see the change INSTANTLY
(typically < 100ms latency)
```

## Key Benefits of This Architecture

1. **Real-time**: Firestore's `onSnapshot` provides instant updates
2. **Scalable**: Firebase handles infrastructure automatically
3. **Secure**: Rules enforce authorization at database level
4. **Offline**: Firebase caches data for offline access
5. **Simple**: No need for WebSocket server management
6. **Reliable**: Firebase handles reconnection and sync

---

This architecture ensures a smooth, real-time chat experience with minimal complexity!
