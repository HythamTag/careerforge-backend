# REST API Test Collection

Complete test collection for all CV Enhancer API endpoints.

## Files

- `api.rest` - Main test collection (40+ endpoints)
- `.env.rest.example` - Environment variables template

## Quick Start

1. Copy `.env.rest.example` to `.env.rest.local`
2. Open `api.rest` in VS Code
3. Click "Send Request" above any endpoint

## Test Flow

1. **Register** → Get account
2. **Login** → Copy `accessToken`
3. **Update `.env.rest.local`** → Set `AUTH_TOKEN`
4. **Upload CV** → Copy CV ID
5. **Update `.env.rest.local`** → Set `CV_ID`
6. **Test features** → Optimize, ATS, Export

## Endpoint Categories

| Category | Count | Examples |
|----------|-------|----------|
| Auth | 9 | Register, Login, Logout |
| CVs | 12 | Upload, CRUD, Search |
| Versions | 3 | List, Get, Activate |
| Optimization | 2 | Optimize, Status |
| ATS | 2 | Analyze, Score |
| Generation | 3 | PDF, DOCX, Custom |
| Jobs | 2 | Status, List |
| Users | 4 | Profile, Update |
| Webhooks | 3 | Register, List |
