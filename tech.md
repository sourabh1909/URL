# ShortURL — Technical Stack and Implementation Guide

## 1. Overview

ShortURL is a full-stack URL shortener with OAuth authentication, link management, QR codes, and click analytics. The UI follows a calm, clean minimalist design language.

This document defines the selected technologies and implementation conventions. Product requirements live in `PRD.md`; system boundaries and data flows live in `Architecture.md`; local setup and usage live in `README.md`.

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite + TypeScript | Responsive single-page application |
| Styling | Tailwind CSS | Utility-first styling and design tokens |
| UI components | shadcn/ui | Accessible, composable UI primitives |
| Icons | Lucide React | Consistent line icons |
| Routing | React Router | Client-side page navigation |
| Charts | Recharts | Analytics visualizations |
| Backend | Node.js + Express + TypeScript | REST API and redirect service |
| Validation | Zod | Runtime validation for requests and environment |
| Database | MongoDB | Persistent users, links, and click events |
| ORM | Prisma | Schema, database synchronization, and typed access |
| Authentication | OAuth 2.0 / OpenID Connect | Google and GitHub sign-in |
| Sessions | Server-side sessions + connect-mongo store | Authenticated state |
| QR codes | A maintained QR-code generation library | Link sharing |
| Testing | Vitest/Jest, Supertest, React Testing Library | Unit and integration tests |
| Local services | Docker Compose | Local PostgreSQL development |

Use maintained, mutually compatible stable package versions. Pin versions in the lockfile.

## 3. Frontend

### Main libraries
- React, Vite, and TypeScript.
- Tailwind CSS with shared design tokens.
- shadcn/ui for buttons, inputs, dialogs, tables, dropdowns, tabs, tooltips, and toasts.
- React Router for `/`, `/login`, `/dashboard`, `/analytics`, and `/settings`.
- Recharts for click trends and breakdown charts.
- Lucide React for interface icons.

### Frontend conventions
- Keep API access in a central typed API client.
- Separate pages, reusable components, hooks, and feature modules.
- Use explicit loading, empty, success, and error states.
- Do not store OAuth client secrets or session secrets in frontend variables.
- Do not treat client-side route guards as authorization; the server must authorize every private request.
- Use accessible labels, keyboard focus indicators, and semantic HTML.
- Use responsive tables or card layouts on narrow screens.

## 4. Nordic Design Tokens

### Light theme
- Background: `#F8FAFC` (Snow White)
- Surface: `#FFFFFF`
- Primary: `#244A42` (Nordic Pine)
- Secondary: `#DCE7ED` (Misty Blue)
- Accent: `#A8B9A5` (Soft Sage)
- Text: `#263238` (Charcoal)
- Muted text: `#64748B` (Slate Gray)
- Border: `#E2E8F0` (Pale Gray)

### Design rules
- Minimal, calm, spacious, and functional.
- Use generous whitespace and a consistent spacing scale.
- Use approximately 12–16px corner radii for cards and controls.
- Prefer subtle borders over heavy shadows.
- Use Inter or another readable sans-serif.
- Keep transitions short and restrained; respect `prefers-reduced-motion`.
- Avoid neon colors, excessive gradients, glassmorphism, and decorative animation.
- Provide a dark theme with equivalent semantic tokens and adequate contrast.
- Validate contrast and focus states against WCAG accessibility guidance.

## 5. Backend

### Core packages and patterns
- Express routes should delegate to controllers or service functions.
- Validate request bodies, query strings, and path parameters with Zod.
- Centralize error handling and use a consistent JSON error shape.
- Use Helmet, restrictive CORS, and rate limiting.
- Keep business logic out of route declarations.
- Use structured logging while excluding secrets and unnecessary personal data.

Suggested modules:
- `routes/` — endpoint definitions.
- `controllers/` — HTTP request/response handling.
- `services/` — link creation, redirects, analytics, and account logic.
- `middleware/` — authentication, authorization, rate limiting, validation, and errors.
- `schemas/` — Zod schemas.
- `config/` — validated environment configuration.
- `lib/` — Prisma client and shared integrations.

## 6. Authentication

Implement Google and GitHub sign-in using maintained OAuth/OIDC libraries and documented provider flows.

Requirements:
- Use Authorization Code flow; use PKCE where supported by the selected provider/library.
- Validate OAuth `state`; validate OIDC `nonce` when applicable.
- Keep client secrets server-side.
- Use HTTP-only cookies with `Secure` in production and an appropriate `SameSite` setting.
- Use server-side sessions stored in a durable session store.
- Regenerate the session identifier after successful authentication.
- Implement logout and session invalidation.
- Apply CSRF protection appropriate to the cookie/session architecture.
- Handle provider denial, invalid callback state, and expired sessions.
- Do not merge accounts solely because their email strings match. Require verified identity and a safe account-linking flow.
- Store provider identifiers in `OAuthAccount`; do not store provider access tokens unless a specific feature needs them.

Prefer a well-maintained authentication library rather than implementing OAuth protocol details from scratch.

## 7. Database and Prisma

Core models:
- `User`
- `OAuthAccount`
- `ShortLink`
- `ClickEvent`
- Session model/store, according to the chosen session library

Database rules:
- `ShortLink.shortCode` must have a unique constraint.
- `OAuthAccount` must uniquely identify a provider account, for example by `(provider, providerAccountId)`.
- Add indexes for user link listings, creation dates, short-code lookups, and click-event time queries.
- Use foreign keys and explicit deletion behavior.
- Use migrations in development and production; do not depend on production schema auto-sync.
- Store timestamps consistently, preferably as UTC.
- Use transactions where multiple related writes must succeed together.

## 8. URL Safety and Redirects

- Accept only `http:` and `https:` destination URLs.
- Parse URLs with a standard URL parser and validate them on the server.
- Reject `javascript:`, `data:`, `file:`, and other unsupported schemes.
- Store the validated destination and resolve redirects only from the database.
- Do not build an arbitrary redirect endpoint that accepts a destination URL from a query parameter.
- Generate random, unguessable short codes and retry on unique-constraint collisions.
- Use HTTP 302 by default so destinations can be changed without long-lived permanent redirect caching.
- Return clear 404/410-style states for unknown or disabled links.
- Consider blocking known unsafe destinations and adding abuse-reporting controls before public launch.

## 9. Analytics and Privacy

Track link ID and click timestamp. Optional referrer, coarse device category, and country/region may be recorded only when reliably available and configured.

- Do not claim unique visitors unless a privacy-conscious estimation method is implemented.
- Avoid retaining raw IP addresses; if needed for rate limiting or short-lived abuse prevention, define a short retention period and document it.
- Use aggregation and retention policies for analytics.
- Do not infer a precise location from incomplete data.
- Ensure analytics queries are scoped to the authenticated user's links.
- Avoid slowing redirects with synchronous analytics work; use efficient writes or a queue if scale requires it.

## 10. Testing

At minimum, test:
- URL validation and rejection of unsupported schemes.
- Short-code uniqueness and custom alias conflicts.
- Redirect behavior for valid, missing, and disabled links.
- OAuth state/callback error handling.
- Session-protected routes.
- Cross-user access attempts (IDOR prevention).
- Link create, list, update, and delete behavior.
- Analytics filtering and ownership.
- Responsive and accessible critical UI flows.

## 11. Environment Variables

Provide an `.env.example` containing variable names only, such as:

```env
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nordlink
SESSION_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/callback/google
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/callback/github
COOKIE_DOMAIN=
```

Validate required variables at server startup. Never commit real credentials. Adjust callback URLs and cookie settings for the actual deployment.

## 12. Implementation Order

1. Repository setup, linting, formatting, and environment validation.
2. PostgreSQL, Prisma models, and migrations.
3. OAuth and session handling.
4. URL creation, custom aliases, and redirects.
5. Authenticated link management.
6. Click events and analytics.
7. Nordic UI and responsive states.
8. Security hardening, tests, and deployment documentation.
