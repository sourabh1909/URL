# ShortURL — Product Requirements Document (PRD)

## 1. Product Summary

**Product name:** ShortURL  
**Product type:** URL-shortening SaaS  
**Design direction:** Nordic / Scandinavian minimalist  
**Primary users:** Students, creators, teams, and individuals who need manageable short links and basic performance analytics.

ShortURL lets authenticated users turn long URLs into short, shareable links, manage those links, and understand how they are being used.

## 2. Problem Statement

Long URLs are difficult to share, remember, and present cleanly. Users also need a central place to organize links and understand click activity without using a cluttered interface.

ShortURL solves this with short links, custom aliases, QR codes, link management, and simple analytics in a clean, privacy-conscious product.

## 3. Goals

- Make shortening a URL quick and straightforward.
- Provide secure Google and GitHub OAuth sign-in.
- Let each user manage only their own links.
- Provide reliable redirects and clear disabled/unknown-link behavior.
- Offer useful click analytics with transparent limitations.
- Deliver a responsive, accessible Nordic-themed experience.
- Keep the MVP maintainable and deployable.

## 4. Non-Goals for the Initial MVP

- Paid subscriptions, billing, and plan enforcement.
- Team workspaces and shared ownership.
- Password-based authentication.
- Advanced marketing attribution.
- Guaranteed identity-level unique visitor tracking.
- Offline support.
- Native mobile applications.
- Custom domains for customers.
- AI-generated link recommendations.

These may be considered later, after the core application is stable.

## 5. User Roles

### Guest
- View the public landing page.
- Open the login page.
- Attempt a demo shortening flow only if explicitly implemented as a non-persistent preview.
- Cannot view private dashboards or manage saved links.

### Authenticated user
- Create and manage their own short links.
- Set custom aliases when available.
- Copy links and access QR codes.
- View analytics for their links.
- Update basic account preferences and log out.
- Request account deletion.

### Administrator
An administrator interface is not required for the MVP. Operational moderation and abuse controls may initially be handled through secured server-side procedures.

## 6. Core User Journeys

### Journey A: Sign in
1. User opens the landing page.
2. User selects “Get started” or “Sign in”.
3. User chooses Google or GitHub.
4. The backend begins the OAuth flow.
5. The provider authenticates the user and redirects to the callback.
6. The backend validates the response and establishes a secure session.
7. The user lands on the dashboard.

### Journey B: Create a short link
1. Authenticated user enters a destination URL.
2. Optionally, they enter a custom alias.
3. The UI validates required fields and submits the request.
4. The server validates the URL and alias.
5. The server generates a unique code or reserves the requested alias.
6. The link is saved and returned to the UI.
7. The user can copy the short URL or show its QR code.

### Journey C: Open a short link
1. A visitor opens `/:shortCode`.
2. The server finds the link.
3. If it is active, the server records a click event and redirects to the stored destination.
4. If missing or disabled, the server shows a useful error page.
5. The click appears in analytics after processing.

### Journey D: Review analytics
1. User opens Analytics.
2. The dashboard loads overview metrics for links owned by that user.
3. User selects a date range.
4. Charts and breakdowns update.
5. If there is no data, a useful empty state is shown.

## 7. Functional Requirements

### Authentication
- **FR-AUTH-01:** Support Google OAuth sign-in.
- **FR-AUTH-02:** Support GitHub OAuth sign-in.
- **FR-AUTH-03:** Provide a current-user endpoint.
- **FR-AUTH-04:** Provide logout and invalidate the server session.
- **FR-AUTH-05:** Protect all private API endpoints.
- **FR-AUTH-06:** Handle failed, denied, and expired OAuth flows gracefully.
- **FR-AUTH-07:** Prevent unsafe automatic account merging.

### Link creation and redirects
- **FR-LINK-01:** Accept valid HTTP and HTTPS destination URLs.
- **FR-LINK-02:** Generate unique short codes.
- **FR-LINK-03:** Support optional custom aliases.
- **FR-LINK-04:** Detect alias conflicts and return a clear message.
- **FR-LINK-05:** Display the resulting short URL.
- **FR-LINK-06:** Provide a copy-to-clipboard action.
- **FR-LINK-07:** Provide a QR code for each link.
- **FR-LINK-08:** Redirect to the destination stored for the short code.
- **FR-LINK-09:** Use a temporary redirect by default.
- **FR-LINK-10:** Show clear states for unknown and disabled links.

### Link management
- **FR-MGMT-01:** List only the current user's links.
- **FR-MGMT-02:** Search by short code, alias, or destination URL.
- **FR-MGMT-03:** Filter and paginate results.
- **FR-MGMT-04:** Update the destination URL.
- **FR-MGMT-05:** Enable or disable a link.
- **FR-MGMT-06:** Delete a link after confirmation.
- **FR-MGMT-07:** Show creation date and click count.

### Analytics
- **FR-AN-01:** Display total clicks and link counts.
- **FR-AN-02:** Show click trends over time.
- **FR-AN-03:** Support 7-day, 30-day, 90-day, and all-time filters.
- **FR-AN-04:** Show referrer and device categories when data is available.
- **FR-AN-05:** Show country/region only when reliable data is available.
- **FR-AN-06:** Scope every analytics query to links owned by the user.
- **FR-AN-07:** Explain empty or estimated data honestly.

### Settings
- **FR-SET-01:** Display basic profile information.
- **FR-SET-02:** Display connected OAuth provider information.
- **FR-SET-03:** Allow logout.
- **FR-SET-04:** Allow account deletion with confirmation and documented data-deletion behavior.

## 8. UI and Design Requirements

### Design principles
- Minimal, calm, spacious, and functional.
- Scandinavian-inspired color palette and typography.
- Clear hierarchy, generous whitespace, subtle borders, and restrained motion.
- Responsive from mobile to desktop.
- Accessible keyboard navigation and visible focus indicators.
- Light and dark themes.

### Initial color tokens
| Token | Value |
|---|---|
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Primary / Nordic Pine | `#244A42` |
| Secondary / Misty Blue | `#DCE7ED` |
| Accent / Soft Sage | `#A8B9A5` |
| Text / Charcoal | `#263238` |
| Muted text | `#64748B` |
| Border | `#E2E8F0` |

### Required pages
- `/` — Landing page
- `/login` — OAuth login
- `/dashboard` — Link creation, stats, and recent links
- `/analytics` — Click analytics and filters
- `/settings` — Profile, providers, and account actions
- `/:shortCode` — Redirect handler and invalid/disabled states

## 9. Non-Functional Requirements

### Security
- Keep provider secrets on the backend.
- Validate OAuth state and OIDC nonce where applicable.
- Use secure server-side sessions and suitable cookie settings.
- Use CSRF protection appropriate to the session architecture.
- Apply rate limits and security headers.
- Validate and normalize user input.
- Prevent cross-user access and insecure direct object references.
- Never accept an arbitrary destination from a redirect query parameter.

### Performance and reliability
- Redirects should be fast and predictable.
- Use indexes for short-code lookup and analytics queries.
- Paginate large link lists.
- Avoid blocking redirects on slow analytics processing.
- Return consistent error responses.

### Privacy
- Collect only analytics data needed for product functionality.
- Avoid retaining raw IP addresses longer than necessary.
- Document analytics limitations and retention.
- Provide an account-deletion policy.

### Accessibility
- Semantic markup and accessible labels.
- Keyboard-accessible forms and dialogs.
- Adequate color contrast.
- Reduced-motion support.
- Clear validation and error messages.

## 10. Acceptance Criteria

The MVP is acceptable when:
1. A user can sign in using Google and GitHub after credentials are configured.
2. OAuth errors do not create an authenticated session.
3. An authenticated user can create a valid short link.
4. Invalid schemes such as `javascript:` are rejected.
5. Custom aliases cannot collide with existing short codes.
6. A valid short code redirects to the stored destination.
7. Unknown and disabled links do not redirect.
8. A user cannot read, modify, delete, or analyze another user's links.
9. Search, filtering, pagination, copying, QR codes, and deletion work.
10. Analytics reflect recorded click events and date filters.
11. The interface works on mobile and desktop.
12. Critical flows have automated tests and setup instructions.

## 11. Milestones

### Phase 1 — Foundation
- Repository setup, environment validation, PostgreSQL, Prisma, migrations.
- Basic Nordic UI shell and navigation.

### Phase 2 — Authentication
- Google and GitHub OAuth.
- Secure sessions, logout, and route authorization.

### Phase 3 — Short links
- URL validation, code generation, custom aliases, redirects, and link management.

### Phase 4 — Analytics
- Click tracking, summary metrics, filters, charts, and privacy-conscious aggregation.

### Phase 5 — Quality and launch
- Responsive polish, accessibility, security checks, automated tests, deployment, and documentation.

## 12. Success Metrics

For an initial MVP, track:
- Successful OAuth sign-ins.
- Number of links created.
- Redirect success rate.
- Median redirect response time.
- Percentage of users who create a first link after sign-in.
- Error rate for link creation and redirects.

Do not introduce invasive tracking solely to measure product success.
