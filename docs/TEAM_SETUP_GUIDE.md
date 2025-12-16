# CareerForge Backend Team Setup Guide

## 🚀 Quick Start for All Developers

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/HythamTag/careerforge-backend.git
cd careerforge-backend

# Install dependencies
cd backend
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your local settings
```

### 2. Branch Strategy (Important!)
- **NEVER work on `main` or `develop` directly**
- **ALWAYS create feature branches** for your work
- **Branch naming**: `feature/<area>-<task-description>`
- **Keep branches short**: 2-5 days max, then merge

### 3. Your Development Workflow
```bash
# 1. Sync with latest changes
git checkout develop
git pull origin develop

# 2. Create your feature branch
git checkout -b feature/auth-register-endpoint  # Example for Auth dev

# 3. Work on your changes
# ... make commits as you go ...

# 4. Push and create PR
git push -u origin feature/auth-register-endpoint

# 5. On GitHub: Create Pull Request → develop
#    - Title: "feat(auth): implement register endpoint"
#    - Description: what you built + how to test
#    - Backend Leader will review

# 6. After merge: delete branch locally and remotely
git branch -d feature/auth-register-endpoint
git push origin --delete feature/auth-register-endpoint
```

---

## 👥 Developer Roles & Responsibilities

### Backend Leader (HythamTag)
**Areas**: AI, LaTeX, Notifications, Health, Core Infrastructure
- Reviews ALL pull requests
- Owns shared infrastructure (middleware, utils, config)
- Coordinates between team members
- Merges approved PRs to `develop`

### Auth Developer
**Files you can modify**:
- `src/routes/auth.js`
- `src/controllers/authController.js`
- `src/services/authService.js`
- `src/validators/authValidator.js`
- `src/dto/authDto.js`
- `src/models/User.js`
- `src/repositories/UserRepository.js`
- `tests/auth.test.js`
- `tests/integration/authRoutes.test.js`

**Your first tasks**:
1. `feature/auth-register-endpoint` - POST /api/v1/auth/register
2. `feature/auth-login-endpoint` - POST /api/v1/auth/login
3. `feature/auth-refresh-token` - POST /api/v1/auth/refresh

### Resume Developer
**Files you can modify**:
- `src/routes/resume.js`
- `src/controllers/resumeController.js`
- `src/services/resumeService.js`
- `src/dto/resumeDto.js`
- `src/models/Resume.js`
- `src/repositories/ResumeRepository.js`
- `tests/resume.test.js`

**Your first tasks**:
1. `feature/resume-upload-endpoint` - POST /api/v1/resumes (file upload)
2. `feature/resume-get-endpoint` - GET /api/v1/resumes/:id
3. `feature/resume-pdf-parse` - Parse uploaded PDF to text

### ATS Developer
**Files you can modify**:
- `src/routes/ats.js`
- `src/controllers/atsController.js`
- `src/services/atsService.js`
- `src/dto/atsDto.js`
- `tests/ats.test.js`

**Your first tasks**:
1. `feature/ats-analysis-endpoint` - POST /api/v1/ats/analyze
2. `feature/ats-keyword-scoring` - Implement keyword density analysis
3. `feature/ats-overall-score` - Calculate ATS compatibility score

---

## 📋 Code Quality Standards

### Before Submitting PR:
- ✅ **Tests pass**: `npm test`
- ✅ **Linting passes**: `npm run lint`
- ✅ **Only touch your files** (CODEOWNERS will enforce this)
- ✅ **Meaningful commit messages**:
  - `feat(auth): add user registration`
  - `fix(resume): handle PDF parsing errors`
  - `test(ats): add keyword scoring tests`

### PR Requirements:
- **Title**: `feat/area: short description`
- **Description**: What you built + how to test it
- **Tests**: Include unit tests for new features
- **No breaking changes** without Backend Leader approval

---

## 🆘 Getting Help

### If you're stuck:
1. **Check existing code** in your area for patterns
2. **Read FILE_OWNERSHIP.md** for file ownership rules
3. **Ask Backend Leader** in team chat for clarification
4. **Don't touch shared files** (middleware, utils, config) without permission

### Common mistakes to avoid:
- ❌ Modifying files outside your area
- ❌ Pushing directly to `develop` or `main`
- ❌ Long-lived branches (merge within 5 days)
- ❌ No tests for new features
- ❌ Breaking existing functionality

---

## 🎯 Weekly Goals

### Week 1 Focus:
- **Auth Dev**: Basic registration and login
- **Resume Dev**: File upload and basic parsing
- **ATS Dev**: Resume analysis endpoint skeleton
- **Backend Leader**: AI enhancement endpoint working

### Daily Standup (Every morning):
- What did you finish yesterday?
- What are you working on today?
- Any blockers?

---

## 🛠️ Development Tools

### Local Development:
```bash
# Start server in development mode
npm run dev

# Run tests
npm test

# Run specific test file
npm test -- auth.test.js

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Environment Setup:
- **Node.js**: v18+
- **MongoDB**: Local or Atlas connection
- **Redis**: For rate limiting (optional for local dev)

---

## 📞 Contact

- **Backend Leader**: HythamTag (GitHub)
- **Questions**: Create an issue in the repo or ask in team chat
- **Reviews**: All PRs go through Backend Leader review

---

**Remember**: Focus on your area, write tests, follow the workflow. We'll build something great together! 🚀