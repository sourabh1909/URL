# NordLink — System Architecture

## 1. Purpose

This document describes the logical architecture for NordLink, a URL shortener with OAuth authentication, link management, and analytics.

The intended architecture separates the React frontend, Express API, authentication/session handling, business services, and PostgreSQL persistence.

## 2. High-Level Architecture

```text
                         ┌─────────────────────────┐
                         │        Browser          │
                         │ React + Vite + Tailwind │
                         └────────────┬────────────┘
                                      │ HTTPS / JSON
                                      ▼
                         ┌─────────────────────────┐
                         │      Express API        │
                         │ Security + Validation   │
                         └───────┬─────────┬───────┘
                                 │         │
                   ┌─────────────▼─┐   ┌───▼────────────────┐
                   │ Auth / Session│   │ Application Services│
                   │ OAuth handlers│   │ Links / Analytics   │
                   └──────┬────────┘   └───┬────────────────┘
                          │                │
                 ┌────────▼───────┐   ┌────▼──────────────┐
                 │ Google / GitHub│   │ Prisma ORM        │
                 │ OAuth providers│   └────┬──────────────┘
                 └────────────────┘        │
                                           ▼
                                  ┌──────────────────┐
                                  │   PostgreSQL     │
                                  │ Users, Links,    │
                                  │ Clicks, Sessions │
                                  └──────────────────┘
```

The short-link redirect route is handled by the backend. It resolves a code to a stored destination, records a click event, and issues a temporary redirect.

## 3. Component Responsibilities

### Frontend
- Renders the public landing page, OAuth login page, dashboard, analytics, and settings.
- Calls the backend through a typed API client.
- Presents loading, error, empty, and success states.
- Uses Nordic design tokens and responsive components.
- Never makes final authorization decisions.

### Express API
- Exposes authentication, link, and analytics endpoints.
- Validates requests and normalizes inputs.
- Applies security middleware, rate limits, and error handling.
- Delegates domain behavior to services.
- Enforces authentication and ownership on private operations.

### Authentication service
- Starts Google and GitHub OAuth flows.
- Validates callback parameters, OAuth state, and OIDC nonce when applicable.
- Maps provider identities to local users.
- Creates and invalidates server-side sessions.
- Handles safe account linking and authentication errors.

### Link service
- Validates destination URLs.
- Creates random short codes or reserves custom aliases.
- Handles uniqueness conflicts.
- Lists, updates, disables, and deletes links.
- Enforces ownership through the service/API authorization boundary.

### Redirect service
- Looks up a short code using an indexed query.
- Checks whether the link exists and is active.
- Records a click event using an efficient persistence path.
- Responds with HTTP 302 to the destination stored in the database.
- Does not accept an arbitrary target URL from the incoming request.

### Analytics service
- Aggregates click events by time range, referrer, device, and available coarse location.
- Scopes every query to the authenticated user's links.
- Returns explicit empty states and avoids claiming unsupported metrics.

### PostgreSQL and Prisma
- Persist user identities, short links, click events, and sessions.
- Enforce unique constraints and relationships.
- Provide migrations and indexed access patterns.

## 4. Suggested Source Layout

```text
nordlink/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── features/
│       │   ├── auth/
│       │   ├── links/
│       │   └── analytics/
│       ├── hooks/
│       ├── lib/
│       └── styles/
├── server/
│   └── src/
│       ├── config/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── middleware/
│       ├── schemas/
│       ├── lib/
│       └── app.ts
├── prisma/
│   └── schema.prisma
├── docs/
├── docker-compose.yml
├── .env.example
├── tech.md
├── PRD.md
├── README.md
└── Architecture.md
```

## 5. Data Model

### User
- `id` — primary key.
- `name` — display name.
- `email` — normalized email where available.
- `emailVerified` — nullable/boolean verification status, based on provider claims.
- `avatarUrl` — optional profile image URL.
- `createdAt`, `updatedAt`.

### OAuthAccount
- `id` — primary key.
- `userId` — foreign key to User.
- `provider` — e.g. `google` or `github`.
- `providerAccountId` — stable provider subject/account ID.
- `createdAt`.
- Unique constraint on `(provider, providerAccountId)`.

### ShortLink
- `id` — primary key.
- `userId` — foreign key to User.
- `shortCode` — globally unique public code.
- `originalUrl` — validated HTTP/HTTPS destination.
- `isActive` — whether redirects are allowed.
- `createdAt`, `updatedAt`.

### ClickEvent
- `id` — primary key.
- `shortLinkId` — foreign key to ShortLink.
- `clickedAt` — timestamp.
- `referrer` — nullable.
- `countryCode` — nullable and only populated when reliable.
- `deviceType` — nullable category.

### Session
Use the schema required by the chosen server-side session store. Store only the session data necessary to maintain authenticated state and configure expiry/cleanup.

### Constraints and indexes
- Unique index on `ShortLink.shortCode`.
- Unique index on `(OAuthAccount.provider, OAuthAccount.providerAccountId)`.
- Index on `ShortLink(userId, createdAt)`.
- Index on `ClickEvent(shortLinkId, clickedAt)`.
- Foreign keys for all ownership relationships.
- Explicitly define deletion behavior and whether click events are deleted with their parent link.

## 6. OAuth Sequence

```text
Browser             Express                 Provider
   │                    │                       │
   │ GET /api/auth/google                       │
   ├───────────────────►│                       │
   │                    │ Create state/nonce    │
   │◄───────────────────┤ Redirect to provider  │
   │                    │                       │
   ├────────────────────────────────────────────►
   │                    │       User consent    │
   │◄────────────────────────────────────────────┤
   │ GET callback with authorization code       │
   ├───────────────────►│                       │
   │                    │ Validate state/nonce  │
   │                    │ Exchange code securely│
   │                    ├──────────────────────►│
   │                    │◄───────────────────────┤
   │                    │ Find/create user      │
   │                    │ Regenerate session ID │
   │◄───────────────────┤ Set secure cookie     │
   │ Redirect dashboard │                       │
```

Implementation notes:
- Use a maintained OAuth/OIDC library.
- Use Authorization Code flow and PKCE where supported.
- Validate `state` and OIDC `nonce` when applicable.
- Keep provider secrets on the server.
- Do not merge accounts only because email strings match.
- Configure exact callback URLs per environment.

## 7. Link Creation Sequence

```text
User → Frontend → Express API → Link Service → PostgreSQL
                     │               │
                     │ Validate body │
                     │ Validate URL  │
                     │ Check session │
                     │               │ Generate code/alias
                     │               ├───────────────► Insert link
                     │               │◄────────────── Return link
                     │◄──────────────┤
User ◄──────────── Short URL + QR code data
```

If the short-code insert hits a uniqueness conflict, generate a new code and retry a bounded number of times. If a custom alias is already taken, return a conflict response rather than silently changing the alias.

## 8. Redirect Sequence

```text
Visitor → GET /:shortCode → Redirect Service → PostgreSQL
                                  │                │
                                  │ Lookup code    │
                                  │◄───────────────┤
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
             Missing/disabled                Active link
                    │                           │
              Error response              Record click event
                                                │
                                          HTTP 302 redirect
                                                │
                                           Destination
```

The redirect destination must come from the stored link record. The server must not treat the path or query string as a destination URL.

## 9. API Boundaries

### Authentication
- `GET /api/auth/google`
- `GET /api/auth/github`
- `GET /api/auth/callback/:provider`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Links
- `POST /api/links`
- `GET /api/links`
- `GET /api/links/:id`
- `PATCH /api/links/:id`
- `DELETE /api/links/:id`
- `GET /api/links/check-alias/:alias`

### Analytics
- `GET /api/analytics/overview`
- `GET /api/analytics/clicks`
- `GET /api/analytics/:linkId`

### Public redirect
- `GET /:shortCode`

Private routes require an authenticated session. Every read, update, delete, and analytics operation must verify that the target link belongs to the current user. Alias availability endpoints should be rate-limited.

## 10. Security Boundaries

- **Browser boundary:** Treat all client input as untrusted.
- **OAuth boundary:** Validate callback state and applicable OIDC claims; keep secrets server-side.
- **Session boundary:** Use HTTP-only cookies, production `Secure` cookies, appropriate `SameSite`, session rotation, expiry, and CSRF protection.
- **API boundary:** Validate inputs, rate-limit sensitive endpoints, and enforce ownership.
- **Redirect boundary:** Allow only stored HTTP/HTTPS destinations; do not implement arbitrary redirects.
- **Database boundary:** Use Prisma queries, constraints, indexes, and transactions where appropriate.
- **Analytics boundary:** Minimize personal data and enforce ownership in aggregation queries.

## 11. Error Handling

Use a consistent response shape, for example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The destination URL is invalid."
  }
}
```

Suggested status codes:
- `400` — malformed or invalid input.
- `401` — authentication required.
- `403` — authenticated but not authorized.
- `404` — resource or short code not found.
- `409` — custom alias or other uniqueness conflict.
- `429` — rate limit exceeded.
- `500` — unexpected server error.

Do not expose stack traces, tokens, session contents, or internal secrets to clients.

## 12. Scaling Considerations

For the initial MVP, a single Express service and PostgreSQL are sufficient. As traffic grows:
- Move click processing to a queue if analytics writes affect redirect latency.
- Add caching for frequently requested short codes with careful invalidation.
- Partition or archive click events based on measured data volume.
- Add monitoring, structured logs, database backups, and error reporting.
- Consider abuse detection and destination reputation checks.

Do not add queues, caches, or microservices before actual requirements justify their operational cost.

## 13. Architecture Decisions

1. **Monolith first:** One Express API keeps deployment and debugging straightforward.
2. **PostgreSQL:** Relational constraints are useful for ownership, aliases, and analytics relationships.
3. **Prisma:** Migrations and typed database access improve maintainability.
4. **Server-side sessions:** Suitable for a browser application using secure cookies; configure the session store for production.
5. **Temporary redirects:** HTTP 302 is the default so destination changes can take effect without permanent caching.
6. **Privacy-conscious analytics:** Track useful aggregate behavior without promising identity-level tracking.
7. **Nordic UI system:** Keep visual consistency through shared semantic design tokens and reusable components.
