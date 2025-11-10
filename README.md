# Task Collaboration Hub

A full-stack web application for task management with role-based access control, built with Vue.js, Node.js, Express, and SQLite.

## 🚀 Quick Start

### Prerequisites

- Node.js v18.19.0
- npm v10.2.4
  
###How to Run

cd TaskManager > cd Assignment
Inside the Assignment install npm -> npm i
Then run -> npm start

### Setup


1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Seed the database:**
   ```bash
   npm run seed
   ```

3. **Start the application:**
   ```bash
   npm run start
   ```

   This will start both the backend server (port 3000) and frontend dev server (port 5174).

4. **Open your browser:**
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:3000

## 📋 Test Accounts

- **Viewer**: `viewer@example.com` / `viewer123`
- **Contributor**: `contributor@example.com` / `contributor123`
- **Moderator**: `moderator@example.com` / `moderator123`

## 🎯 Features

### Authentication
- Secure login with JWT tokens
- Password hashing using crypto.scrypt
- Account lockout after 5 failed login attempts (15 minutes)
- Token rotation on each login

### Role-Based Access Control
- **Viewer**: Can only view tasks assigned to them
- **Contributor**: Can create tasks and view tasks they created or are assigned to
- **Moderator**: Can view all tasks and create new tasks

### Task Management
- Create tasks with status (To Do, In Progress, Done)
- View tasks grouped by status
- Add updates to tasks
- Optimistic UI updates for better user experience

### Security
- Rate limiting (30 requests/minute per user)
- Request validation (max 5KB body size)
- CORS enabled
- Centralized error handling

### UI/UX
- Light/Dark theme toggle (persisted in localStorage)
- Keyboard accessibility (Esc to close modals, etc.)
- ARIA labels for screen readers
- Responsive design
- Loading states and error messages

## 📁 Project Structure

```
.
├── src/
│   ├── frontend/          # Vue.js frontend
│   │   ├── src/
│   │   │   ├── composables/   # Composables (useAuth, useTheme)
│   │   │   ├── views/         # Vue views (Login, Dashboard)
│   │   │   ├── router/        # Vue Router configuration
│   │   │   └── App.vue        # Main app component
│   │   └── index.html
│   └── server/            # Node.js backend
│       ├── middleware/    # Express middleware (auth, logging, rate limit, validation)
│       ├── routes/        # API routes (auth, tasks, updates)
│       ├── services/      # Business logic (auth, database)
│       └── main.js        # Server entry point
├── database/
│   ├── schema.sql         # Database schema
│   ├── seed.js           # Database seed script
│   └── app.db            # SQLite database (created automatically)
├── package.json
└── vite.config.js
```

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - Login with email and password

### Tasks
- `GET /api/tasks` - Get all visible tasks (based on role)
- `POST /api/tasks` - Create a new task (contributor & moderator only)

### Updates
- `POST /api/updates` - Add an update to a task (all logged-in users)

## 🧪 Testing

Run tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

## 🛠️ Development

### Scripts

- `npm run start` - Start both frontend and backend
- `npm run start:server` - Start only the backend server
- `npm run start:client` - Start only the frontend dev server
- `npm run build` - Build frontend for production
- `npm run seed` - Seed the database
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## 📝 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and data flow
- [TEST_SUMMARY.md](./TEST_SUMMARY.md) - Test coverage and summary
- [WORK_LOG.md](./WORK_LOG.md) - Development log and notes

## 🔒 Security Notes

- JWT secret should be changed in production (set in `.env` file)
- Passwords are hashed using crypto.scrypt with random salts
- Rate limiting prevents abuse
- Input validation prevents malicious data
- CORS is configured for cross-origin requests

## 🐛 Troubleshooting
### Login issues
- Make sure you've run `npm run seed` to create test users
- Check that the backend server is running
- Verify JWT_SECRET is set in `.env` (or uses default)

