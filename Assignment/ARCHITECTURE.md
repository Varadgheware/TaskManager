# Architecture Documentation

## System Overview

The Task Collaboration Hub is a full-stack web application built with Vue.js (frontend) and Node.js/Express (backend), using SQLite as the database.

## Architecture Diagram

```
┌─────────────────┐
│   Vue.js SPA    │
│   (Frontend)    │
│   Port: 5174    │
└────────┬────────┘
         │ HTTP/REST API
         │ (with JWT tokens)
         │
┌────────▼────────┐
│  Express API    │
│  (Backend)      │
│  Port: 3000     │
└────────┬────────┘
         │
         │ SQL Queries
         │
┌────────▼────────┐
│   SQLite DB     │
│   (Database)    │
│   app.db        │
└─────────────────┘
```

## Data Flow

### Authentication Flow

1. User submits login form with email and password
2. Frontend sends POST request to `/api/login`
3. Backend validates credentials:
   - Checks if account is locked (5 failed attempts = 15 min lockout)
   - Retrieves user from database
   - Verifies password using crypto.scrypt
   - Generates JWT token (valid for 30 minutes)
4. Backend returns JWT token and user info
5. Frontend stores token in sessionStorage
6. Frontend includes token in Authorization header for subsequent requests

### Task Retrieval Flow

1. User navigates to dashboard
2. Frontend sends GET request to `/api/tasks` with JWT token
3. Backend middleware:
   - Authenticates JWT token
   - Extracts user role from token
4. Backend queries database based on role:
   - **Moderator**: Gets all tasks
   - **Contributor**: Gets tasks they created or are assigned to
   - **Viewer**: Gets only tasks assigned to them
5. Backend joins with users table to get creator/assignee emails
6. Backend fetches updates for each task
7. Backend returns tasks with updates
8. Frontend displays tasks grouped by status

### Task Creation Flow

1. User (contributor/moderator) fills out task creation form
2. Frontend optimistically adds task to UI
3. Frontend sends POST request to `/api/tasks` with JWT token
4. Backend middleware:
   - Authenticates JWT token
   - Authorizes user (contributor or moderator only)
   - Validates request body (title, status, max 5KB)
5. Backend creates task in database
6. Backend returns created task
7. Frontend replaces optimistic task with real task
8. If error occurs, frontend rolls back optimistic update

### Update Creation Flow

1. User clicks "Add Update" on a task
2. Frontend opens modal with textarea
3. User enters update message and submits
4. Frontend optimistically adds update to task
5. Frontend sends POST request to `/api/updates` with JWT token
6. Backend middleware:
   - Authenticates JWT token
   - Validates request body (task_id, message, max 5KB)
   - Checks if user can access task (role-based)
7. Backend creates update in database
8. Backend returns created update
9. Frontend replaces optimistic update with real update
10. If error occurs, frontend rolls back optimistic update

## Database Schema

### Tables

1. **users**
   - id (INTEGER PRIMARY KEY)
   - email (TEXT UNIQUE)
   - password_hash (TEXT)
   - role (TEXT: viewer, contributor, moderator)
   - created_at (DATETIME)

2. **tasks**
   - id (INTEGER PRIMARY KEY)
   - title (TEXT)
   - status (TEXT: to do, in progress, done)
   - assignee_id (INTEGER, FOREIGN KEY → users.id)
   - creator_id (INTEGER, FOREIGN KEY → users.id)
   - created_at (DATETIME)

3. **updates**
   - id (INTEGER PRIMARY KEY)
   - task_id (INTEGER, FOREIGN KEY → tasks.id)
   - author_id (INTEGER, FOREIGN KEY → users.id)
   - message (TEXT)
   - created_at (DATETIME)

### Relationships

- Tasks → Users (creator): Many-to-One (CASCADE DELETE)
- Tasks → Users (assignee): Many-to-One (SET NULL on delete)
- Updates → Tasks: Many-to-One (CASCADE DELETE)
- Updates → Users: Many-to-One (CASCADE DELETE)

## Security Layers

1. **Authentication**: JWT tokens with 30-minute expiration
2. **Authorization**: Role-based access control (RBAC)
3. **Password Security**: crypto.scrypt with random salts
4. **Rate Limiting**: 30 requests/minute per IP
5. **Input Validation**: Request body size (5KB max), type validation
6. **Account Lockout**: 5 failed attempts = 15-minute lockout
7. **CORS**: Configured for cross-origin requests
8. **Error Handling**: Centralized error messages

## Middleware Stack

1. **CORS Middleware**: Handles cross-origin requests
2. **Body Parser**: Parses JSON (5KB limit)
3. **Request Logger**: Logs route, user, status, time
4. **Rate Limiter**: Limits requests per IP
5. **Authentication**: Validates JWT tokens
6. **Authorization**: Checks user roles
7. **Validation**: Validates request data
8. **Error Handler**: Centralized error responses

## Frontend Architecture

### Components

- **LoginView**: Login form with validation
- **DashboardView**: Task board with create/update functionality
- **App.vue**: Root component with theme management

### Composables

- **useAuth**: Authentication state and methods
- **useTheme**: Theme management (light/dark)

### State Management

- Authentication state: sessionStorage
- Theme preference: localStorage
- Task data: Component-level reactive state

### Optimistic Updates

- Tasks and updates are added to UI immediately
- API calls happen in background
- On success: Replace optimistic data with real data
- On error: Rollback optimistic update and show error

## API Design

### RESTful Endpoints

- `POST /api/login` - Authentication
- `GET /api/tasks` - Get tasks (role-based)
- `POST /api/tasks` - Create task (contributor/moderator)
- `POST /api/updates` - Create update (all authenticated users)

### Response Format

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Environment Variables

- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 3000)
- `DB_PATH`: Database file path

## Deployment Considerations

1. Set strong JWT_SECRET in production
2. Use environment-specific database files
3. Configure CORS for production domain
4. Set up proper logging and monitoring
5. Use HTTPS in production
6. Consider using Redis for rate limiting in production
7. Set up database backups

## Performance Considerations

1. Database indexes on foreign keys and status
2. Efficient SQL queries with JOINs
3. Optimistic UI updates for better perceived performance
4. Rate limiting to prevent abuse
5. Request validation to prevent large payloads

## Scalability Considerations

1. Database can be migrated to PostgreSQL/MySQL for better scalability
2. JWT tokens can be stored in Redis for revocation
3. Rate limiting can use Redis for distributed systems
4. Frontend can be served via CDN
5. API can be load balanced with multiple instances

