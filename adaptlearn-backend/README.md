# AdaptLearn — Backend API

A Node.js / Express / MongoDB backend for the **AdaptLearn** adaptive learning platform.

---

## Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Runtime     | Node.js 18+                         |
| Framework   | Express 4                           |
| Database    | MongoDB (via Mongoose)              |
| Auth        | JWT (jsonwebtoken) + bcryptjs       |
| Validation  | express-validator                   |
| Security    | helmet, cors, express-rate-limit    |

---

## Project Structure

```
adaptlearn-backend/
├── config/
│   └── db.js               # MongoDB connection
├── middleware/
│   ├── auth.js             # JWT protect middleware
│   └── errorHandler.js     # Global error handler
├── models/
│   ├── User.js
│   ├── Topic.js
│   ├── Lesson.js
│   ├── Quiz.js
│   └── QuizResult.js
├── routes/
│   ├── auth.js             # POST /signup, /login  GET /me
│   ├── topics.js           # GET /topics, /topics/:id, /topics/:id/lessons
│   ├── lessons.js          # GET /lessons/:id, /lessons/:id/quiz, /lessons/:id/next
│   ├── quiz.js             # POST /quiz/:id/submit  GET /quiz/result/:id
│   └── progress.js         # GET /progress, /progress/recommended, /progress/history
├── seed/
│   └── seed.js             # Populate DB with sample data
├── script.js               # ⬅️  Copy this to your frontend folder
├── server.js               # Entry point
├── .env.example
└── package.json
```

---

## Quick Start

### 1 — Install dependencies
```bash
npm install
```

### 2 — Configure environment
```bash
cp .env.example .env
# Edit .env and set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN
```

### 3 — Seed the database
```bash
npm run seed
```
This creates 4 topics, 9 lessons, and 9 quizzes.

### 4 — Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```
Server runs on **http://localhost:5000** by default.

---

## Connect the Frontend

1. Copy `script.js` into your frontend folder (alongside the HTML files).
2. Make sure every HTML page already has:
   ```html
   <script src="script.js"></script>
   ```
3. Set `CLIENT_ORIGIN` in `.env` to your frontend's URL (e.g. `http://127.0.0.1:5500`).

---

## API Reference

### Auth
| Method | Endpoint            | Auth | Description         |
|--------|---------------------|------|---------------------|
| POST   | `/api/auth/signup`  | ❌   | Register new user   |
| POST   | `/api/auth/login`   | ❌   | Login, get JWT      |
| GET    | `/api/auth/me`      | ✅   | Current user info   |

### Topics
| Method | Endpoint                        | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| GET    | `/api/topics`                   | ❌   | All topics               |
| GET    | `/api/topics/:id`               | ❌   | Single topic             |
| GET    | `/api/topics/:id/lessons`       | ❌   | Lessons for a topic      |

### Lessons
| Method | Endpoint                        | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| GET    | `/api/lessons/:id`              | ❌   | Lesson content           |
| GET    | `/api/lessons/:id/quiz`         | ❌   | Quiz (answers hidden)    |
| GET    | `/api/lessons/:id/next`         | ❌   | Next lesson in topic     |

### Quiz
| Method | Endpoint                        | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| POST   | `/api/quiz/:quizId/submit`      | ✅   | Submit answers, get score|
| GET    | `/api/quiz/result/:resultId`    | ✅   | Retrieve saved result    |

### Progress
| Method | Endpoint                        | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| GET    | `/api/progress`                 | ✅   | Full progress summary    |
| GET    | `/api/progress/recommended`     | ✅   | Adaptive recommendations |
| GET    | `/api/progress/history`         | ✅   | Last 20 quiz attempts    |

---

## Adaptive Logic

- After each quiz submission the backend checks if **all lessons** in the topic are now complete; if so the topic is automatically marked complete.
- The `/progress/recommended` endpoint boosts lessons from **already-started topics** so learners finish what they began before jumping to new subjects.
- A score of **≥ 70 %** is required to mark a lesson as passed/complete.
