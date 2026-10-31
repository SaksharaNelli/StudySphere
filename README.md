# StudySphere

Student academic management and productivity platform: React frontend plus Node/Express microservices and MySQL.

## Architecture

```
Browser (React, :3000)
        |
   api-gateway :8080  (CORS, routing, global search, health)
        |
 +------+---------+-----------+-----------+-----------+-----------+-----------+
 auth :4001   academic :4002  planner :4003  sessions :4004  notes :4005  notifications :4006  analytics :4007  ai :4008
        \________________ MySQL :3306 (one database per service) ________________/
```

| Service | Database | Responsibility |
|---|---|---|
| auth-service | studysphere_auth | Register, login, profile, settings |
| academic-service | studysphere_academic | Subjects, assignments, exams, syllabus, exam prep |
| planner-service | studysphere_planner | Study plans, smart planner, daily goals |
| session-service | studysphere_sessions | Focus sessions, history, streaks |
| notes-service | studysphere_notes | Subject-wise notes |
| notification-service | studysphere_notifications | Deadline, exam, session and goal reminders |
| analytics-service | none | Charts data and productivity insights (reads other services) |
| ai-service | none | Study assistant (Claude API, or offline fallback) |

Services verify the same JWT, and every query is filtered by the logged-in user's id.
Tables are created automatically on first start.

## Run locally

Requirements: Node.js 18+ and a running MySQL 8 server.

```bash
npm run setup      # installs every package and creates .env from .env.example
# edit .env: set DB_PASSWORD (and DB_USER if not root)
npm run dev        # starts the gateway, 8 services and the frontend together
npm run seed       # optional: loads demo data (demo@studysphere.dev / demo1234)
```

Open http://localhost:3000. Check service status at http://localhost:8080/api/health.

## Ports and environment

Service URLs default to localhost ports (see `.env.example` and each `src/index.js`).
They can be overridden with `AUTH_URL`, `ACADEMIC_URL`, `PLANNER_URL`, `SESSION_URL`, `NOTES_URL`,
`NOTIFICATION_URL`, `ANALYTICS_URL`, `AI_URL`, which is how Docker Compose will wire the containers later.
The frontend reads `VITE_API_URL` (default `http://localhost:8080/api`).
