# API Migration Guide - v1 to v2

> **Breaking Changes**: This document outlines all breaking changes and migration steps for the CareerForge API refactoring.

---

## Overview

**Effective Date**: 2026-01-02  
**Deprecation Period**: None (breaking immediately for development)  
**Reason**: Align with industry standards (Microsoft, Google, AWS, Stripe)

---

## Breaking Changes Summary

| Category | Count | Impact |
|:---------|:------|:-------|
| Removed Endpoints | 1 | High |
| Renamed Endpoints | 27 | High |
| Method Changes | 2 | Medium |
| New Features | 3 | Low (backward compatible) |

---

## 1. Removed Endpoints

### 1.1 User Profile from Auth Module

**Removed**: `GET /v1/auth/me`  
**Replacement**: `GET /v1/users/me`  
**Reason**: Auth module should handle authentication actions, not user data

**Migration**:
```diff
- axios.get('/v1/auth/me')
+ axios.get('/v1/users/me')
```

**Frontend Files**:
- `src/services/auth.js`
- `src/hooks/useAuth.js`
- Any component fetching current user

---

## 2. Renamed Endpoint Groups

### 2.1 Parsing Jobs

**Old Base**: `/v1/parse`  
**New Base**: `/v1/parsing-jobs`

| Old Endpoint | New Endpoint |
|:-------------|:-------------|
| `POST /v1/parse` | `POST /v1/parsing-jobs` |
| `GET /v1/parse/{id}` | `GET /v1/parsing-jobs/{id}` |
| `GET /v1/parse/history` | `GET /v1/parsing-jobs/history` |
| `GET /v1/parse/stats` | `GET /v1/parsing-jobs/stats` |
| `GET /v1/parse/formats` | `GET /v1/parsing-jobs/formats` |

**Migration**:
```javascript
// Before
const API_BASE = '/v1/parse';

// After
const API_BASE = '/v1/parsing-jobs';
```

### 2.2 Optimization Jobs

**Old Base**: `/v1/optimize`  
**New Base**: `/v1/optimization-jobs`

| Old Endpoint | New Endpoint |
|:-------------|:-------------|
| `POST /v1/optimize` | `POST /v1/optimization-jobs` |
| `POST /v1/optimize/sections` | `POST /v1/optimization-jobs/sections` |
| `POST /v1/optimize/tailor` | `POST /v1/optimization-jobs/tailor` |
| `GET /v1/optimize/capabilities` | `GET /v1/optimization-jobs/capabilities` |

### 2.3 ATS Analyses

**Old Base**: `/v1/cv-ats`  
**New Base**: `/v1/ats-analyses`

| Old Endpoint | New Endpoint |
|:-------------|:-------------|
| `POST /v1/cv-ats` | `POST /v1/ats-analyses` |
| `GET /v1/cv-ats/{id}` | `GET /v1/ats-analyses/{id}` |
| `GET /v1/cv-ats/history` | `GET /v1/ats-analyses/history` |
| `GET /v1/cv-ats/stats` | `GET /v1/ats-analyses/stats` |

### 2.4 PDF Generations

**Old Base**: `/v1/generation`  
**New Base**: `/v1/pdf-generations`

| Old Endpoint | New Endpoint |
|:-------------|:-------------|
| `POST /v1/generation` | `POST /v1/pdf-generations` |
| `GET /v1/generation/{id}` | `GET /v1/pdf-generations/{id}` |
| `GET /v1/generation/{id}/download` | `GET /v1/pdf-generations/{id}/download` |
| `GET /v1/generation/stats` | `GET /v1/pdf-generations/stats` |

---

## 3. HTTP Method Changes

### 3.1 CV Publish Action

**Old**: `POST /v1/cvs/{id}/publish`  
**New**: `PATCH /v1/cvs/{id}` with `{published: true}`

**Migration**:
```diff
- axios.post(`/v1/cvs/${id}/publish`)
+ axios.patch(`/v1/cvs/${id}`, { published: true })
```

### 3.2 CV Archive Action

**Old**: `POST /v1/cvs/{id}/archive`  
**New**: `PATCH /v1/cvs/{id}` with `{archived: true}`

**Migration**:
```diff
- axios.post(`/v1/cvs/${id}/archive`)
+ axios.patch(`/v1/cvs/${id}`, { archived: true })
```

### 3.3 Combined Operations

You can now update multiple states in one call:

```javascript
// Unpublish and archive in one request
axios.patch(`/v1/cvs/${id}`, {
  published: false,
  archived: true
})
```

---

## 4. New Features (Optional)

### 4.1 Query Parameter Filtering

All async job endpoints now support filtering:

```javascript
// Filter by CV
GET /v1/parsing-jobs/history?cvId=123

// Filter by user (supports 'me' keyword)
GET /v1/parsing-jobs/history?userId=me

// Combine filters
GET /v1/optimization-jobs/history?cvId=123&userId=me
```

**Supported Endpoints**:
- `/v1/parsing-jobs/history`
- `/v1/optimization-jobs/*` (when implemented)
- `/v1/ats-analyses/history`
- `/v1/pdf-generations/*` (when implemented)

### 4.2 Expand Parameter (Future)

Planned Stripe-style data expansion:

```javascript
// Future feature
GET /v1/cvs/123?expand=user,versions,atsScores
```

---

## Frontend Migration Checklist

### Step 1: Update API Service Files

- [ ] `src/services/auth.js` - Change `/auth/me` to `/users/me`
- [ ] `src/services/parsing.js` - Change `/parse` to `/parsing-jobs`
- [ ] `src/services/optimization.js` - Change `/optimize` to `/optimization-jobs`
- [ ] `src/services/ats.js` - Change `/cv-ats` to `/ats-analyses`
- [ ] `src/services/generation.js` - Change `/generation` to `/pdf-generations`
- [ ] `src/services/cv.js` - Update publish/archive to PATCH

### Step 2: Update Constants

If you have an API constants file:

```javascript
// src/constants/api.js
export const API_ENDPOINTS = {
  // OLD
  PARSE: '/v1/parse',
  OPTIMIZE: '/v1/optimize',
  ATS: '/v1/cv-ats',
  GENERATION: '/v1/generation',
  
  // NEW
  PARSING_JOBS: '/v1/parsing-jobs',
  OPTIMIZATION_JOBS: '/v1/optimization-jobs',
  ATS_ANALYSES: '/v1/ats-analyses',
  PDF_GENERATIONS: '/v1/pdf-generations',
}
```

### Step 3: Search & Replace

Use IDE global search to find and replace:

1. Search: `/v1/parse` → Replace: `/v1/parsing-jobs`
2. Search: `/v1/optimize` → Replace: `/v1/optimization-jobs`
3. Search: `/v1/cv-ats` → Replace: `/v1/ats-analyses`
4. Search: `/v1/generation` → Replace: `/v1/pdf-generations`
5. Search: `/auth/me` → Replace: `/users/me`

### Step 4: Manual Review

Check these patterns manually:

```javascript
// Find all publish/archive calls
axios.post(/.*\/publish/)
axios.post(/.*\/archive/)

// Replace with PATCH
axios.patch(url, { published: true })
axios.patch(url, { archived: true })
```

### Step 5: Test

- [ ] Login → Verify profile loads
- [ ] Upload CV → Verify parsing works
- [ ] Optimize CV → Verify optimization works
- [ ] Run ATS analysis → Verify analysis works
- [ ] Generate PDF → Verify generation works
- [ ] Publish/Archive CV → Verify state changes work

---

## Testing Endpoints

Use the updated `backend/api-tests.rest` file:

1. Open in VS Code with REST Client extension
2. Run tests in order:
   - Health checks
   - Register/Login
   - CV operations
   - Async jobs (parsing, optimization, ATS, generation)

---

## Rollback Plan

If critical issues arise:

1. **Revert Git Commit**: Single commit contains all changes
2. **Emergency Patch**: Can add deprecated endpoints back temporarily
3. **Timeline**: Monitor for 24 hours after deployment

---

## Support

- **Backend Changes**: See [walkthrough.md](./walkthrough.md)
- **Questions**: Contact backend team
- **Swagger Docs**: http://localhost:5000/api-docs
