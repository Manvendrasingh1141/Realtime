# Jugaad – Real-Time Collaborative Messaging

A clean, responsive, fully functional real-time collaborative messaging web application built with **React**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, **Socket.IO**, and **MongoDB Atlas (Mongoose)**.

Designed for seamless deployment with frontend on **Vercel** and backend on persistent hosting (Render, Railway, Fly.io, or VPS).

---

## 🚀 Key Features

1. **Home Page – Rooms Overview & Creation**
   - Displays all available rooms in real time with message counters and activity timestamps.
   - Anyone can create a room by simply entering a name (e.g. `Design Sync`, `Engineering`).
   - Automatically generates collision-free, human-readable unique IDs (e.g. `engineering-7k2x9a1b`).
   - Rooms and history persist permanently in MongoDB and are accessible to everyone anytime.
   - Instant search/filter for rooms.

2. **Room View – Real-Time Collaborative Messaging**
   - Instant message history loading directly from MongoDB on entry.
   - Clean single input field with send button (supports `Enter` to submit).
   - Real-time bi-directional message synchronization powered by Socket.IO.
   - Anonymous user labeling (`Guest #...` or custom label) without requiring login, signup, passwords, or tokens.
   - Automatic smooth scroll to the newest message upon receiving messages or loading history.
   - One-click "Copy Link" to share the room URL directly with teammates.

3. **Reliability & Multi-User Synchronization**
   - Messages are saved directly to MongoDB before / concurrently with broadcasting to room sockets.
   - Deduplication handling and connection state indicators (Connected / Connecting).
   - Messages remain permanently stored even if all users disconnect or servers restart.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Socket.IO Client.
- **Backend**: Node.js, Express, Socket.IO, Mongoose.
- **Database**: MongoDB Atlas.
- **Deployment**:
  - Frontend: [Vercel](https://vercel.com) (configured with `vercel.json`).
  - Backend: [Render](https://render.com) (configured with `render.yaml` & `Dockerfile`), [Railway](https://railway.app), or [Fly.io](https://fly.io).

---

## 📂 Project Structure

```
jugaad/
├── client/                     # Vite + React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Top navigation with live connection & user status
│   │   │   ├── HomePage.jsx    # Room directory, creation form & live search
│   │   │   └── RoomPage.jsx    # Real-time chat view, history, & input
│   │   ├── services/
│   │   │   ├── api.js          # REST API calls for rooms and message history
│   │   │   ├── socket.js       # Socket.IO client instance
│   │   │   └── identity.js     # Anonymous user identification
│   │   ├── App.jsx             # Main routing and global state
│   │   ├── main.jsx            # React root
│   │   └── index.css           # Tailwind CSS directives
│   ├── index.html
│   ├── vite.config.js          # Dev proxy for API and WebSockets
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── server/                     # Node.js + Express + Socket.IO Backend
│   ├── src/
│   │   ├── models/
│   │   │   ├── Room.js         # Mongoose schema for persistent rooms
│   │   │   └── Message.js      # Mongoose schema for persistent messages
│   │   ├── routes/
│   │   │   └── roomRoutes.js   # REST endpoints for rooms and message history
│   │   ├── db.js               # MongoDB connection handler
│   │   ├── socket.js           # Socket.IO join/leave/message handlers
│   │   └── index.js            # Server entrypoint
│   ├── Dockerfile
│   ├── package.json
│   ├── .env                    # Local environment variables
│   └── .env.example
│
├── vercel.json                 # Vercel deployment configuration
├── render.yaml                 # Render 1-click blueprint configuration
└── README.md
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- npm
- MongoDB Atlas database connection string

### 2. Backend Setup
1. Navigate into `server/`:
   ```bash
   cd server
   ```
2. Verify or create `.env`:
   ```env
   PORT=5001
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/jugaad
   CLIENT_ORIGIN=http://localhost:5173
   NODE_ENV=development
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend:
   ```bash
   npm run dev
   # or
   npm start
   ```
   *The server will run on `http://localhost:5001`.*

### 3. Frontend Setup
1. In another terminal, navigate into `client/`:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will open on `http://localhost:5173`.*

---

## 🧪 Testing the Real-Time Flows

1. Open `http://localhost:5173` in Browser Window 1.
2. In the "Create a New Room" input, enter a room name (e.g. `Product Launch`) and click **Create Room**.
3. Open `http://localhost:5173` in Browser Window 2 (or an incognito window).
   - Notice that the room `Product Launch` appears immediately in the available rooms list!
4. Click **Open Room** in Window 2 to join.
5. In Window 1, type a message (e.g. `"Hello from Window 1"`) and hit Enter.
   - The message instantly appears in Window 2 without refreshing!
6. In Window 2, reply with `"Hey from Window 2!"`.
   - Window 1 instantly displays the reply.
7. Close both browser windows or reload the tab. Reopen `http://localhost:5173` and click into the room.
   - All messages are loaded completely from MongoDB Atlas!

---

## ☁️ Deployment Instructions

### A. Deploying the Backend (Render / Railway / Fly.io)
Because WebSockets require an active, persistent TCP connection, host the backend on a service supporting long-lived Node.js servers:

#### Deploying on Render:
1. Push this repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
3. Connect your repository.
4. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `MONGO_URI`: Your MongoDB Atlas connection URI.
   - `PORT`: `5001` (Render automatically overrides this with its own port, which our server handles via `process.env.PORT`).
   - `CLIENT_ORIGIN`: Your frontend URL (e.g., `https://jugaad.vercel.app` or `*`).
6. Click **Deploy**. Note your backend URL (e.g., `https://jugaad-api.onrender.com`).

---

### B. Deploying the Frontend on Vercel
1. Go to [Vercel](https://vercel.com) → **Add New Project**.
2. Select your repository.
3. In **Project Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
4. Under **Environment Variables**, add:
   - `VITE_BACKEND_URL`: The URL of your deployed backend (e.g., `https://jugaad-api.onrender.com`).
5. Click **Deploy**.

`vercel.json` included in this repository handles SPA URL rewrites so refreshing on any route works cleanly.

---

## 🔒 Security & Data Hygiene
- Secrets and MongoDB URIs are managed strictly via environment variables.
- Input validation sanitizes room names and caps message lengths at 2,000 characters.
- Mongoose indexing optimizes room queries and timestamp-based message retrieval.
