# Real_time_Chat
Cloud-Hosted Real-Time Chat Application (Next.js + Firebase) With Authentication, Media Sharing, and Cloud Deployment

A cloud-native, real-time chat platform built using Next.js and Firebase, enabling users to chat instantly, share media, and stay connected seamlessly.
The project demonstrates core cloud computing principles — serverless architecture, real-time database, cloud storage, and identity management

Key Cloud Features:
Authentication (Firebase Auth)
Secure login/signup with Email + Google Sign-In.
Cloud-based identity management.
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
