# Direct Messaging Feature

## Overview

The Real Time Chat application now includes person-to-person direct messaging functionality. Users can search for other users by their email address and start private conversations.

## Features

### 1. User Search by Email
- Search for any registered user by their email address
- Real-time search results
- User profiles display name, email, and online status

### 2. Direct Chat Rooms
- Create private one-on-one conversations
- Automatic chat room creation/retrieval
- Persistent message history
- Real-time message delivery

### 3. Chat Management
- View all your direct message conversations
- See last message preview
- Unread message indicators (ready for implementation)
- Easy switching between conversations

### 4. Message Interface
- Clean, modern chat interface
- Messages grouped by date
- Sender identification
- Timestamps for each message
- Mobile-responsive design

## How to Use

### Starting a New Direct Message

1. **Navigate to Direct Messages**
   - Find the "Direct Messages" section in the sidebar
   - Click the "+" button to start a new conversation

2. **Search for a User**
   - Enter the user's email address in the search field
   - Click "Search" or press Enter
   - User profile will appear in the results

3. **Start Chatting**
   - Click "Chat" button next to the user's name
   - If a conversation already exists, it will open that chat
   - If not, a new chat room will be created automatically

4. **Send Messages**
   - Type your message in the input field
   - Press Enter or click "Send"
   - Messages appear instantly for both users

### Managing Conversations

- **View All Chats**: All your direct message conversations are listed in the sidebar
- **Switch Chats**: Click on any conversation to open it
- **Return to General**: Click "General" to go back to the public chat room
- **Mobile Navigation**: Use the back arrow to return to the sidebar on mobile

## Technical Implementation

### New Components

#### `DirectMessagesPanel.tsx`
- Manages the list of direct message conversations
- Handles user search functionality
- Creates new chat rooms
- Real-time updates of conversation list

**Key Features:**
- Email-based user search
- Duplicate chat prevention
- Real-time chat room synchronization
- Modal interface for new chats

#### `DirectChatRoom.tsx`
- Displays messages for a specific conversation
- Handles sending and receiving messages
- Shows other user's information
- Groups messages by date

**Key Features:**
- Real-time message synchronization
- Auto-scroll to latest message
- Date-based message grouping
- Mobile-responsive layout

### Database Structure

#### ChatRooms Collection
```typescript
{
  id: string;                    // Auto-generated ID
  name: string;                  // "User1 & User2"
  type: 'direct';                // Chat type
  participants: string[];        // [userId1, userId2]
  createdBy: string;             // Creator's UID
  createdAt: Timestamp;          // Creation time
  updatedAt: Timestamp;          // Last activity
  lastMessage?: {                // Preview of last message
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Timestamp;
  };
}
```

#### Messages Collection
```typescript
{
  id: string;                    // Auto-generated ID
  chatRoomId: string;            // Reference to chat room
  senderId: string;              // Sender's UID
  senderName: string;            // Sender's display name
  text: string;                  // Message content
  type: 'text';                  // Message type
  timestamp: Timestamp;          // Send time
}
```

### Security Rules

The Firestore security rules ensure:

1. **User Privacy**: Users can only access chat rooms they're part of
2. **Message Security**: Only participants can read/write messages
3. **User Discovery**: Authenticated users can search for other users
4. **Data Integrity**: Users can only create chats where they're participants

```javascript
// Chat rooms - only participants can access
match /chatRooms/{chatRoomId} {
  allow read: if isAuthenticated() && 
             isParticipant(resource.data.participants);
  allow create: if isAuthenticated() && 
               request.auth.uid in request.resource.data.participants;
}

// Messages - only chat participants can access
match /messages/{messageId} {
  allow read: if isAuthenticated() && 
             request.auth.uid in getChatRoom(resource.data.chatRoomId).participants;
  allow create: if isAuthenticated() && 
               request.auth.uid == request.resource.data.senderId;
}
```

## API Usage

### Creating a Direct Chat

```typescript
// 1. Search for user by email
const usersRef = collection(db, 'users');
const q = query(usersRef, where('email', '==', email));
const snapshot = await getDocs(q);

// 2. Create chat room
const newChatRoom = {
  name: `${currentUser.name} & ${otherUser.name}`,
  type: 'direct',
  participants: [currentUser.uid, otherUser.uid],
  createdBy: currentUser.uid,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

const docRef = await addDoc(collection(db, 'chatRooms'), newChatRoom);
```

### Sending a Message

```typescript
// Create message document
const messageData = {
  chatRoomId: chatRoom.id,
  senderId: user.uid,
  senderName: user.displayName,
  text: messageText,
  type: 'text',
  timestamp: serverTimestamp(),
};

await addDoc(collection(db, 'messages'), messageData);

// Update chat room with last message
await updateDoc(doc(db, 'chatRooms', chatRoom.id), {
  lastMessage: {
    text: messageText,
    senderId: user.uid,
    senderName: user.displayName,
    timestamp: serverTimestamp(),
  },
  updatedAt: serverTimestamp(),
});
```

### Listening to Messages

```typescript
// Real-time listener for messages
const q = query(
  collection(db, 'messages'),
  where('chatRoomId', '==', chatRoomId),
  orderBy('timestamp', 'asc')
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const messages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  setMessages(messages);
});
```

## Mobile Responsiveness

The direct messaging feature is fully responsive:

- **Desktop**: Sidebar and chat view side-by-side
- **Mobile**: Single-view navigation with back button
- **Conditional Rendering**: 
  - Sidebar visible when no chat selected (mobile)
  - Chat view visible when chat selected (mobile)
  - Both visible simultaneously (desktop)

## Future Enhancements

- [ ] Typing indicators
- [ ] Read receipts
- [ ] Message reactions
- [ ] Reply to specific messages
- [ ] Edit/delete messages
- [ ] Image/file sharing in DMs
- [ ] User blocking
- [ ] Mute conversations
- [ ] Archive chats
- [ ] Search messages within chat
- [ ] Voice messages
- [ ] Video calls

## Troubleshooting

### User Not Found
- Verify the email address is correct
- Ensure the user has registered an account
- Check that the user's profile was created in Firestore

### Messages Not Appearing
- Check internet connection
- Verify Firestore rules are deployed
- Ensure both users are authenticated
- Check browser console for errors

### Can't Start Chat
- Verify Firebase authentication is working
- Check that user has permission to create chat rooms
- Ensure Firestore security rules allow creation

## Performance Considerations

- **Real-time Listeners**: Automatically unsubscribe when component unmounts
- **Pagination**: Consider implementing message pagination for large chat histories
- **Indexing**: Create composite indexes in Firestore for optimal query performance
- **Caching**: Firebase automatically caches data for offline support

## Best Practices

1. **Error Handling**: Always wrap Firebase operations in try-catch blocks
2. **Loading States**: Show loading indicators during async operations
3. **Optimistic Updates**: Consider optimistic UI updates for better UX
4. **Cleanup**: Always unsubscribe from listeners when components unmount
5. **Security**: Never trust client-side validation alone; rely on Firestore rules

---

For more information, see the main [README.md](./README.md) file.
