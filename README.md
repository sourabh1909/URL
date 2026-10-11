# ShortURL

**Short links. Clear insights.**

ShortURL is a modern, privacy-conscious URL shortener built with React, TypeScript, Express, MongoDB, and Prisma. It supports Google and GitHub OAuth, custom aliases, QR codes, link management, and click analytics.

> Status: project specification / implementation scaffold. Configure OAuth credentials and complete the implementation before treating it as production-ready.

## Features

- Google and GitHub OAuth sign-in.
- Create short links from HTTP/HTTPS destinations.
- Optional custom aliases.
- Copy short URLs and generate QR codes.
- Manage, search, filter, update, disable, and delete links.
- Click analytics with date filters and charts.
- Responsive Nordic-inspired light and dark UI.
- Server-side authorization and privacy-conscious analytics.

## Technology Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, Recharts, Lucide React.
- **Backend:** Node.js, Express, TypeScript, Zod.
- **Database:** PostgreSQL with Prisma ORM.
- **Authentication:** Google and GitHub OAuth / OpenID Connect as appropriate, using secure server-side sessions.
- **Testing:** Vitest or Jest, Supertest, and React Testing Library.

See [`tech.md`](./tech.md) for technology and implementation details, [`PRD.md`](./PRD.md) for product requirements, and [`Architecture.md`](./Architecture.md) for system design.

## Repository Structure

A recommended structure is:

```text
shorturl/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── schemas/
│   │   └── lib/
│   └── package.json
├── prisma/
│   └── schema.prisma
├── docs/
├── .env.example
├── docker-compose.yml
├── tech.md
├── PRD.md
├── Architecture.md
└── README.md
```

Adapt the tree as the implementation evolves, but keep frontend, HTTP handling, business logic, and persistence concerns separated.

## Prerequisites

Install:
- Node.js LTS and npm.
- Docker Desktop (recommended for local PostgreSQL) or a PostgreSQL instance.
- Google and GitHub OAuth applications for real sign-in.

## Local Setup

The following is the intended setup flow. Exact commands may vary slightly with the generated package scripts.

### 1. Install dependencies

```bash
# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Set your `DATABASE_URL`, `SESSION_SECRET`, and Google / GitHub OAuth credentials in `.env`:

```env
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nordlink?schema=public
SESSION_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/callback/google
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/callback/github
COOKIE_DOMAIN=
```

### 3. Sync Database with MongoDB

Ensure your MongoDB service is running (e.g. locally with replica set `mongodb://127.0.0.1:27017/shorturl?replicaSet=rs0&directConnection=true` or MongoDB Atlas), then synchronize your collections and indexes:

```bash
npm run prisma:generate
npm run prisma:dbpush
```

### 4. Run the Application

Run both server and client in development mode with one command:
```bash
npm run dev
```

Or run them individually:
```bash
npm run dev:server  # Runs Express API on http://localhost:4000
npm run dev:client  # Runs Vite React app on http://localhost:5173
```

### 5. Run Tests and Builds

```bash
npm test    # Runs all 21 automated unit, API, security, and UI tests
npm run build # Compiles TypeScript for server and builds Vite bundle for client
```

## OAuth Configuration

### Google
1. Create an OAuth client in Google Cloud Console.
2. Configure the authorized redirect URI to match `GOOGLE_CALLBACK_URL`.
3. Set the client ID and secret in the backend environment.

### GitHub
1. Register an OAuth application in GitHub Developer Settings.
2. Set its callback URL to match `GITHUB_CALLBACK_URL`.
3. Set the client ID and secret in the backend environment.

OAuth will not work until provider credentials, callback URLs, session settings, and allowed frontend origins are configured. Do not place client secrets in `VITE_*` variables or other frontend-exposed configuration.

## Main Routes

### Frontend
- `/` — Landing page
- `/login` — OAuth sign-in
- `/dashboard` — Link management
- `/analytics` — Click analytics
- `/settings` — Account settings

### API (planned)
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/links`
- `GET /api/links`
- `GET /api/links/:id`
- `PATCH /api/links/:id`
- `DELETE /api/links/:id`
- `GET /api/links/check-alias/:alias`
- `GET /api/analytics/overview`
- `GET /api/analytics/clicks`
- `GET /api/analytics/:linkId`
- `GET /:shortCode` — Short-link redirect

The exact API may be refined during implementation; document any changes in the architecture/API docs.

## Security Notes

- Validate all URLs on the server and allow only HTTP/HTTPS.
- Use secure, HTTP-only session cookies and production HTTPS.
- Validate OAuth state and OIDC nonce where applicable.
- Use CSRF protection appropriate to the session design.
- Apply rate limiting and security headers.
- Enforce user ownership in every private endpoint.
- Keep secrets out of source control and logs.
- Do not expose arbitrary redirect destinations.
- Define click-data retention and account-deletion behavior.

## Testing

Add automated tests for:
- URL validation and unsafe schemes.
- Short-code uniqueness and alias conflicts.
- Valid, missing, and disabled redirects.
- OAuth callback and session behavior.
- Cross-user authorization attempts.
- Link CRUD operations.
- Analytics filters and ownership.

Run the configured lint, type-check, and test scripts before deployment.

## Deployment Checklist

- [ ] Set production environment variables.
- [ ] Configure production database and apply migrations.
- [ ] Register production OAuth callback URLs.
- [ ] Configure HTTPS, secure cookies, and allowed CORS origins.
- [ ] Configure rate limits and security headers.
- [ ] Confirm no secrets are committed or logged.
- [ ] Run tests and type checks.
- [ ] Verify redirect behavior, authorization, and analytics.
- [ ] Document privacy, retention, and account-deletion policies.
- [ ] Configure monitoring, backups, and error reporting.

## Documentation

- [`tech.md`](./tech.md) — Technology stack and engineering conventions.
- [`PRD.md`](./PRD.md) — Goals, features, user journeys, and acceptance criteria.
- [`Architecture.md`](./Architecture.md) — Components, data flow, data model, and API boundaries.
