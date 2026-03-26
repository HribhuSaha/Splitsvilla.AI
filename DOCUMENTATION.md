# 📺 Splitsvilla — Application Documentation

## About the Application

**Splitsvilla** is a full-stack web application inspired by the popular reality TV dating show. It serves as an interactive platform where users can manage and participate in a virtual Splitsvilla experience — complete with contestant profiles, romantic pairings ("Splits"), compatibility analysis, challenge tasks, live voting, leaderboards, and an AI-powered Oracle chat.

Beyond the show experience, Splitsvilla also ships with a **built-in dating application** called **Cupid**. Cupid works as a fully independent dating platform — so even if you have no interest in the Splitsvilla contest, you can sign up purely to discover, match, and chat with other people. Think of it as two apps in one: a reality-show management tool **and** a standalone dating app that anyone can use on its own.

The application is composed of two main modules:

### 🏡 Villa Module (Admin / Show Management)

The Villa module provides a dashboard-driven interface for managing the show's core mechanics:

| Feature | Description |
|---|---|
| **Dashboard** | Central hub displaying key stats, recent activity feed, and an overview of the villa's current state. |
| **Contestants** | Manage contestant profiles — view bios, photos, and status within the villa. |
| **Splits** | Create and manage romantic pairings (Splits) between contestants. |
| **Compatibility** | AI-powered compatibility analysis between contestants, generating match scores and insights. |
| **Tasks** | Create and track challenge tasks that contestants participate in. |
| **Voting** | Set up and manage voting rounds; view real-time vote tallies. |
| **Leaderboard** | Ranked standings of contestants based on votes, task performance, and compatibility. |
| **Oracle Chat** | An AI-powered conversational assistant (powered by Google Gemini) that answers questions about the villa, contestants, and show dynamics. |
| **My Account** | User profile page with personal details, settings, uploaded photos, and split/match history. |

### 💘 Cupid Module (Dating / Social)

The Cupid module transforms Splitsvilla into a real dating experience for authenticated users:

| Feature | Description |
|---|---|
| **Login / Authentication** | Secure user authentication with session-based login. |
| **Profile Setup** | Onboarding flow for new users to set up their dating profile with photos, bio, and preferences. |
| **Discover** | Swipe-style discovery feed to browse and interact with other user profiles. |
| **Matches** | View mutual matches and connection history. |
| **Chat** | Real-time messaging between matched users. |
| **Profile** | View and edit your own dating profile. |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.1 | Core UI library for building component-driven interfaces |
| **TypeScript** | — | Type-safe development across the entire frontend |
| **Vite** | 7.x | Lightning-fast build tool and dev server with HMR |
| **TailwindCSS** | 4.x | Utility-first CSS framework for rapid, responsive styling |
| **Radix UI** | Latest | Accessible, unstyled headless UI primitives (dialogs, dropdowns, tabs, tooltips, etc.) |
| **Framer Motion** | 12.x | Fluid animations and page transitions |
| **TanStack React Query** | 5.x | Server-state management with caching, background refetching, and optimistic updates |
| **Wouter** | 3.x | Lightweight client-side routing |
| **React Hook Form + Zod** | Latest | Performant form handling with schema-based validation |
| **Recharts** | 2.x | Data visualization and charts for dashboards and leaderboards |
| **Lucide React** | Latest | Modern, consistent icon set |
| **Sonner** | 2.x | Toast notification system |
| **date-fns** | 3.x | Lightweight date formatting and manipulation |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | — | JavaScript runtime for the server |
| **Express** | 5.x | Web framework for API routing and middleware |
| **TypeScript** | — | Type-safe backend development |
| **Drizzle ORM** | 0.45 | Type-safe, lightweight ORM for database queries and migrations |
| **PostgreSQL** | — | Primary relational database for persistent data storage |
| **Google Gemini AI** | Latest | Powers the Oracle Chat and AI-driven compatibility analysis |
| **Zod** | 3.x | Runtime schema validation for API request/response payloads |
| **Multer** | 2.x | File upload handling (profile pictures, contestant photos) |
| **bcryptjs** | 3.x | Secure password hashing for authentication |
| **cookie-parser** | 1.x | Session cookie parsing for auth middleware |
| **OpenID Client** | 6.x | OAuth / OpenID Connect integration |
| **tsx** | 4.x | TypeScript execution for the development server |
| **esbuild** | 0.27 | Fast bundler for production builds |
| **Drizzle Kit** | 0.31 | Database migration tooling and schema management |

### Infrastructure & Tooling

| Tool | Purpose |
|---|---|
| **Vite Dev Server** | Frontend served on `localhost:5173` with API proxy to backend |
| **Express Server** | Backend API served on `localhost:5000` |
| **API Proxy** | Vite proxies `/api` requests to the Express backend during development |
| **Drizzle Kit** | Database schema migrations and management |

---

## Project Structure

```
splitsvilla_local/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components (layout, ui primitives)
│   │   ├── pages/             # Page-level components
│   │   │   ├── dashboard.tsx
│   │   │   ├── contestants.tsx
│   │   │   ├── splits.tsx
│   │   │   ├── compatibility.tsx
│   │   │   ├── tasks.tsx
│   │   │   ├── voting.tsx
│   │   │   ├── leaderboard.tsx
│   │   │   ├── oracle.tsx
│   │   │   ├── my-account.tsx
│   │   │   └── cupid/         # Cupid dating module pages
│   │   │       ├── login.tsx
│   │   │       ├── setup-profile.tsx
│   │   │       ├── discover.tsx
│   │   │       ├── matches.tsx
│   │   │       ├── chat.tsx
│   │   │       └── profile.tsx
│   │   └── lib/               # Utilities, API clients, hooks
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # Express + Drizzle backend
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   │   ├── contestants.ts
│   │   │   ├── splits.ts
│   │   │   ├── compatibility.ts
│   │   │   ├── tasks.ts
│   │   │   ├── votes.ts
│   │   │   ├── events.ts
│   │   │   ├── gemini.ts      # Oracle AI chat endpoint
│   │   │   ├── health.ts
│   │   │   └── cupid/         # Cupid module API routes
│   │   ├── lib/
│   │   │   ├── db/            # Database schema & connection
│   │   │   ├── cupid-auth.ts  # Authentication logic
│   │   │   └── integrations-gemini-ai/  # Gemini AI integration
│   │   ├── middlewares/       # Express middleware (auth, etc.)
│   │   └── index.ts           # Server entry point
│   ├── uploads/               # User-uploaded files
│   ├── drizzle.config.ts
│   └── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **PostgreSQL** database
- **Google Gemini API Key** (for AI features)

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory with the required configuration (database URL, Gemini API key, etc.).

### Running the Application

```bash
# Start the backend server (port 5000)
cd backend
npm run dev

# Start the frontend dev server (port 5173)
cd frontend
npm run dev
```

Open your browser and navigate to **http://localhost:5173** to access the application.
