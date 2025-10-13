# Real Time Chat Application

A modern, real-time chat application built with Next.js, Firebase, and TypeScript. Features include user authentication, real-time messaging, file sharing, and online presence indicators.

## Features

### 🔐 Authentication
- Email/Password authentication
- Google OAuth integration
- User profile management
- Online/offline status tracking
Real-Time Chat (Firestore / Realtime Database)
Instant message updates with no refresh.
Persistent chat history across sessions.
Cloud Storage (Firebase Storage)
Media (images, files) uploaded and stored securely.
URLs auto-generated and shared inside the chat.
Deployment (Vercel Cloud)
Deployed on Vercel (Next.js-native cloud hosting).
Auto-scaling, global CDN, HTTPS support.

| Layer         | Technology                                    | Purpose                                    |
| ------------- | --------------------------------------------- | ------------------------------------------ |
| Frontend      | **Next.js**, **TailwindCSS**                  | UI + SSR Rendering                         |
| Cloud Backend | **Firebase Auth**, **Firestore**, **Storage** | Authentication, Real-time DB, File Storage |
| Hosting       | **Vercel (Serverless)**                       | Cloud Deployment                           |
| Tools         | GitHub, Firebase Console                      | Versioning + Cloud Config                  |

FlowChart:
User → Login/Register (Firebase Auth)
↓
Authentication Success → Chat Interface
↓
Send Message → Stored in Firestore (Realtime)
↓
Upload File → Stored in Firebase Cloud Storage (link shared)
↓
Messages → Displayed in Real-time to all active clients
