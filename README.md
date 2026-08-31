# s1-server

A lean, production-ready, modular REST API server tailored specifically for the `s1` content management platform built with **Node.js**, **Express 5**, **Prisma ORM (PostgreSQL)**, and **TypeScript**.

---

## 🚀 Features

* **Modular Architecture**: Clean separation into `routes`, `controllers`, `services`, and `interfaces`.
* **Authentication & Authorization**:
  * Registration & Login with `bcrypt` password hashing.
  * JWT Access Token + Refresh Token rotation.
  * HTTP-only secure cookie support and Bearer header fallback.
  * Role-Based Access Control (`USER`, `ADMIN`).
  * Account active status verification (`ACTIVE`, `BLOCKED`).
* **Content Management (s1 Frontend Compatible)**:
  * Public feed with status filtering, searching, and pagination.
  * User-specific "My Posts" query.
  * Admin moderation: approve/publish, draft, pending, and delete posts.
  * Admin analytics & statistics (total posts, status breakdown, user counts).
* **Error Handling**: Global centralized error handler with Prisma-specific error parsing.

---

## 📁 Project Structure

```
s1-server/
├── prisma/
│   └── schema/                    # Modular Prisma Schema
│       ├── schema.prisma          # Datasource & Generator
│       ├── enum.prisma            # Enums (Role, ActiveStatus, PostStatus)
│       ├── user.prisma            # User Model
│       └── post.prisma            # Post Model
├── src/
│   ├── config/                    # Environment variables
│   ├── lib/                       # Prisma client instance
│   ├── middlewares/
│   │   ├── auth.ts                # JWT authentication & RBAC
│   │   ├── globalErrorHandler.ts  # Standard error handler
│   │   └── notFound.ts            # 404 handler
│   ├── utils/
│   │   ├── catchAsync.ts          # Async route wrapper
│   │   ├── sendResponse.ts        # Uniform API response formatter
│   │   └── jwt.ts                 # JWT helper
│   ├── modules/
│   │   ├── auth/                  # Register, Login, Refresh, Me, Logout
│   │   ├── user/                  # User profile & status management
│   │   └── post/                  # Post CRUD, moderation, search, stats
│   ├── app.ts                     # Express app configuration
│   └── server.ts                  # Server entry point
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🛠️ Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file from `.env.example`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/s1_db?schema=public"
APP_URL="http://localhost:3000"
BCRYPT_SALT_ROUNDS=10
JWT_ACCESS_SECRET="s1_access_secret_super_secure_key_2026"
JWT_REFRESH_SECRET="s1_refresh_secret_super_secure_key_2026"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="30d"
```

### 3. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 📚 API Endpoints Summary

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Login with email & password |
| `POST` | `/api/auth/refresh-token` | Public | Reissue access token via cookie/body |
| `GET` | `/api/auth/me` | Authenticated | Get current user profile |
| `POST` | `/api/auth/logout` | Public | Clear authentication cookies |

### Posts (`/api/posts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | Public | Get all published posts (search, page, limit) |
| `POST` | `/api/posts` | Authenticated | Create a new post |
| `GET` | `/api/posts/my-posts` | Authenticated | Get current user's posts |
| `GET` | `/api/posts/admin/all` | Admin | Get all posts with status/date filters |
| `GET` | `/api/posts/admin/stats` | Admin | Get post status counts & user statistics |
| `GET` | `/api/posts/:id` | Public | Get single post details |
| `PATCH` | `/api/posts/:id` | Author / Admin | Update post content & status |
| `PATCH` | `/api/posts/:id/status` | Admin | Moderate post status |
| `DELETE` | `/api/posts/:id` | Author / Admin | Delete post |

### Users (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Admin | List all users |
| `GET` | `/api/users/profile` | Authenticated | Get profile details |
| `PATCH` | `/api/users/profile` | Authenticated | Update profile photo, bio, name |
| `GET` | `/api/users/:id` | Authenticated | Get user by ID |
| `PATCH` | `/api/users/:id/status` | Admin | Toggle user status (`ACTIVE` / `BLOCKED`) |
| `PATCH` | `/api/users/:id/role` | Admin | Change user role (`USER` / `ADMIN`) |
