# 🏠 GoodHome

> A private family communication platform — think Discord, but built exclusively for families.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://good-home-frontend.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://goodhome-backend.onrender.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)

---

## 📸 Preview

> Dashboard — Group Workspace — Channels — Media

<img width="1867" height="1006" alt="image" src="https://github.com/user-attachments/assets/6718797a-ed6d-42fd-b535-d3292fea1a9b" />
<img width="1885" height="981" alt="image" src="https://github.com/user-attachments/assets/c7c8f8be-092e-4064-a069-d25fe0fa8baf" />
<img width="1864" height="988" alt="image" src="https://github.com/user-attachments/assets/8c416384-9f4a-4b01-aa3a-22f09ddfa04d" />


---

## ✨ Features

### 🔐 Authentication
- Register & Login with JWT
- Per-tab session isolation using `sessionStorage`
- Protected routes with persistent auth on refresh

### 👨‍👩‍👧 Groups (Private Servers)
- Create private family groups with auto-generated invite codes
- Join groups via invite code
- Leave groups (non-owners)
- Delete group with cascade (owner only)
- Full data isolation — users only see groups they belong to

### 💬 Channels & Messaging
- Create channels inside groups
- Real-time messaging with 5-second polling
- Delete messages (sender or group owner)
- Auto-scroll to latest messages

### 👥 Members
- View all group members with role badges
- Share invite code directly from members page
- Remove members (owner only)

### 📅 Events
- Create family events with title, date, time, description
- View upcoming events sorted by date
- Delete events (creator or owner)

### 🖼️ Media
- Upload photos (stored as base64 in MongoDB — no filesystem dependency)
- Group-scoped photo gallery
- Delete photos (uploader or owner)

### ⚙️ Settings
- Update display name
- Change password securely

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| State | React Context API |
| Styling | Vanilla CSS (custom dark theme) |
| Icons | lucide-react |
| Backend | Node.js + Express.js |
| Auth | JWT + bcrypt |
| Database | MongoDB Atlas + Mongoose |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## 🏗️ Architecture

```
┌─────────────────┐     HTTPS      ┌──────────────────┐     Mongoose    ┌─────────────────┐
│  React (Vercel) │ ─────────────► │ Express (Render) │ ──────────────► │ MongoDB (Atlas) │
└─────────────────┘                └──────────────────┘                 └─────────────────┘
```

### Route Structure
```
/                     → Redirect to /login
/login                → LoginPage
/register             → RegisterPage
/dashboard            → GroupsPage (My Groups)
/groups/:groupId/     → GroupLayout
  channels            → ChannelsPage
  members             → MembersPage
  events              → EventsPage
  media               → MediaPage
  settings            → SettingsPage
```

### Data Model
```
User ──────────────────────────────────────────┐
  │                                            │
  ├── owns ──► Group ◄── members []            │
  │              │                             │
  │              ├── has ──► Channel           │
  │              │             └── has ──► Message (sender: User)
  │              ├── has ──► Event (createdBy: User)
  │              ├── has ──► Media (uploadedBy: User)
  │              └── has ──► Activity (createdBy: User)
  │
  └── sessionStorage: { token, user }
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Clone the Repositories
```bash
# Frontend
git clone https://github.com/sathwik324/GoodHome-frontend
cd GoodHome-frontend
npm install

# Backend
git clone https://github.com/sathwik324/GoodHome-backend
cd GoodHome-backend
npm install
```

### Backend Environment Setup
Create `.env` in the backend root:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/goodhome?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_secret_key_here
```

> ⚠️ **Note:** If your local network blocks MongoDB ports (common in universities/offices), use a mobile hotspot for local development or a VPN.

### Run Locally
```bash
# Backend
cd GoodHome-backend
npm run dev

# Frontend (separate terminal)
cd GoodHome-frontend
npm run dev
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| PATCH | `/api/auth/profile` | Update display name |
| PATCH | `/api/auth/password` | Change password |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups/my` | Get user's groups |
| POST | `/api/groups/create` | Create group |
| POST | `/api/groups/join` | Join via invite code |
| GET | `/api/groups/:id` | Get group details |
| DELETE | `/api/groups/:id` | Delete group (owner) |
| POST | `/api/groups/:id/leave` | Leave group |
| GET | `/api/groups/:id/invite` | Get invite code |
| GET | `/api/groups/:id/members` | Get members |
| DELETE | `/api/groups/:id/members/:memberId` | Remove member (owner) |
| GET | `/api/groups/:id/channels` | Get channels |
| POST | `/api/groups/:id/channels` | Create channel |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/channels/:id/messages` | Get messages |
| POST | `/api/channels/:id/messages` | Send message |
| DELETE | `/api/channels/:id/messages/:msgId` | Delete message |

### Events & Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events?groupId=` | Get group events |
| POST | `/api/events` | Create event |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/groups/:id/media` | Get group media |
| POST | `/api/media/upload` | Upload photo (base64) |
| DELETE | `/api/media/:id` | Delete photo |

---

## 🔒 Security

- All routes except `/auth/*` require a valid JWT
- Every query is scoped to groups the user is a member of
- ObjectId comparisons always use `.toString()` to prevent bypass
- `sessionStorage` used instead of `localStorage` for per-tab session isolation
- Passwords hashed with bcrypt (salt rounds: 10)
- Media stored as base64 in MongoDB (no exposed file system paths)

---

## 📁 Project Structure

```
GoodHome-frontend/
├── src/
│   ├── api/
│   │   └── axiosInstance.js      # Axios with auth interceptor
│   ├── context/
│   │   └── AuthContext.jsx       # Auth state (user, login, logout)
│   ├── layouts/
│   │   └── GroupLayout.jsx       # Sidebar + TopBar for group workspace
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── GroupsPage.jsx        # My Groups dashboard
│   │   ├── ChannelsPage.jsx
│   │   ├── MembersPage.jsx
│   │   ├── EventsPage.jsx
│   │   ├── MediaPage.jsx
│   │   └── SettingsPage.jsx
│   └── components/
│       ├── TopBar.jsx
│       └── ProtectedRoute.jsx

GoodHome-backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection with retry
│   ├── middleware/
│   │   └── auth.middleware.js    # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Channel.js
│   │   ├── Message.js
│   │   ├── Event.js
│   │   ├── Media.js
│   │   └── Activity.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── group.routes.js
│   │   ├── channel.routes.js
│   │   ├── message.routes.js
│   │   ├── event.routes.js
│   │   ├── media.routes.js
│   │   └── dashboard.routes.js
│   ├── app.js
│   └── server.js
```

---

## 🚢 Deployment

### Frontend (Vercel)
- Connected to `main` branch of GoodHome-frontend
- Auto-deploys on every push

### Backend (Render)
- Connected to `main` branch of GoodHome-backend
- Auto-deploys on every push
- Environment variables set in Render dashboard

> ⚠️ Render free tier **spins down after 15 min inactivity**. First request may take 30–60 seconds to wake up.

---

## 🗺️ Roadmap

- [ ] WebSocket real-time messaging (replace polling)
- [ ] Push notifications
- [ ] Voice/video channels
- [ ] Message reactions
- [ ] File attachments (beyond images)
- [ ] Group discovery / public groups
- [ ] Mobile app (React Native)

---

## 👨‍💻 Author

**Sathwik Gajula**
- GitHub: [@sathwik324](https://github.com/sathwik324)

---

## 📄 License

MIT License — feel free to use this project for learning and inspiration.
