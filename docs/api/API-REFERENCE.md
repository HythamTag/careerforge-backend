# CV Enhancer - API Reference

**Base URL**: `/v1`

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | User login |
| POST | `/refresh` | No | Refresh access token |
| POST | `/logout` | Yes | Logout user |
| POST | `/forgot-password` | No | Request reset email |
| POST | `/reset-password` | No | Reset password |
| GET | `/verify-email/:token` | No | Verify email |
| POST | `/resend-verification` | Yes| Resend verification |
| GET | `/me` | Yes | Get current user |

---

## 2. CV Parsing (`/parse`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Start parsing job |
| GET | `/history` | Yes | Get parsing history |
| GET | `/stats` | Yes | Get parsing stats |
| GET | `/formats` | Yes | Get supported formats |
| GET | `/:jobId` | Yes | Get job status |
| GET | `/:jobId/result` | Yes | Get job result |
| POST | `/:jobId/cancel` | Yes | Cancel job |
| POST | `/:jobId/retry` | Yes | Retry job |

---

## 3. CV Management (`/cvs`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload` | Yes | Upload CV file (multipart) |
| POST | `/` | Yes | Create CV (manual) |
| GET | `/` | Yes | List user CVs |
| GET | `/search` | Yes | Search CVs |
| GET | `/stats` | Yes | Get CV stats |
| POST | `/bulk` | Yes | Bulk operation |
| GET | `/:id` | Yes | Get CV details |
| GET | `/:id/status` | Yes | Get CV status |
| PUT | `/:id` | Yes | Update CV |
| DELETE | `/:id` | Yes | Delete CV |
| POST | `/:id/duplicate`| Yes | Duplicate CV |
| POST | `/:id/archive` | Yes | Archive CV |
| POST | `/:id/publish` | Yes | Publish CV |

### CV Versions (`/cvs/:id/versions`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List versions |
| POST | `/` | Yes | Create version |
| GET | `/:versionId` | Yes | Get version details |
| POST | `/:versionId/activate` | Yes | Activate version |

---

## 4. CV ATS (`/cv-ats`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Start ATS analysis |
| GET | `/history` | Yes | Get analysis history |
| GET | `/stats` | Yes | Get analysis stats |
| GET | `/trends` | Yes | Get analysis trends |
| GET | `/recent-scores`| Yes | Get recent scores |
| GET | `/:id` | Yes | Get job status |
| GET | `/:id/result` | Yes | Get analysis result |
| POST | `/:id/cancel` | Yes | Cancel job |

---

## 5. CV Optimizer (`/optimize`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Full CV optimization |
| POST | `/sections` | Yes | Section optimization |
| POST | `/tailor` | Yes | Tailor CV for job |
| GET | `/capabilities` | No | Get optimizer capabilities |

---

## 6. CV Generation (`/generation`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Start PDF generation |
| GET | `/history` | Yes | Get generation history |
| GET | `/stats` | Yes | Get generation stats |
| POST | `/preview` | Yes | Preview HTML generation |
| GET | `/:jobId` | Yes | Get job status |
| GET | `/:jobId/download` | Yes | Download PDF |
| POST | `/:jobId/cancel` | Yes | Cancel job |

---

## 7. Job Management (`/jobs`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List user jobs |
| GET | `/stats` | Yes | Get job stats |
| GET | `/:id` | Yes | Get job details |
| GET | `/:id/logs` | Yes | Get job logs |
| DELETE | `/:id` | Yes | Cancel/Remove job |
| POST | `/:id/retry` | Yes | Retry failed job |

---

## 8. User Management (`/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | Yes | Get profile |
| PATCH | `/me` | Yes | Update profile |
| PATCH | `/me/password` | Yes | Change password |
| POST | `/me/avatar` | Yes | Upload avatar (file) |
| DELETE | `/me/avatar` | Yes | Delete avatar |
| GET | `/me/stats` | Yes | Get user stats |
| GET | `/me/subscription`| Yes | Get subscription details|
| PATCH | `/me/subscription`| Yes | Update subscription |
| DELETE | `/me` | Yes | Delete account |

---

## 9. System Health (`/health`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Basic health check |
| GET | `/ready` | No | Readiness probe |
| GET | `/live` | No | Liveness probe |
| GET | `/detailed` | No | Detailed health stats |
| GET | `/system` | No | System info |
| GET | `/performance`| No | Performance metrics |

---

## 10. Webhooks (`/webhooks`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Create webhook |
| GET | `/` | Yes | List webhooks |
| GET | `/stats` | Yes | Get webhook stats |
| POST | `/cleanup` | Yes | Cleanup old deliveries |
| GET | `/:id` | Yes | Get webhook details |
| PUT | `/:id` | Yes | Update webhook |
| DELETE | `/:id` | Yes | Delete webhook |
| POST | `/:id/test` | Yes | Test webhook |
| POST | `/:id/suspend` | Yes | Suspend webhook |
| POST | `/:id/activate`| Yes | Activate webhook |
| GET | `/:id/deliveries`| Yes | List deliveries |
| GET | `/:id/deliveries/:deliveryId`| Yes | Get delivery details |
| POST | `/:id/deliveries/:deliveryId/retry`| Yes | Retry delivery |
| GET | `/:id/trends` | Yes | Get webhook trends |

---
**Note**: All routes require `authMiddleware` unless explicitly marked as `Auth: No`.
