# Backend Architecture

## Overview

The CareerForge backend follows a layered architecture pattern with clear separation of concerns.

## Layers

### 1. Routes Layer
- HTTP endpoint definitions
- Route parameter validation
- Request delegation to controllers

### 2. Controller Layer
- Request/response handling
- Input validation
- Business logic orchestration

### 3. Service Layer
- Business logic implementation
- External API integrations
- Complex operations

### 4. Repository Layer
- Data access abstraction
- Database query optimization
- Model relationships

### 5. Model Layer
- Data schema definitions
- Database constraints
- Data validation rules

## Middleware

### Authentication
- JWT token validation
- User context extraction

### Validation
- Request data validation
- Input sanitization

### Error Handling
- Centralized error processing
- Consistent error responses

### Security
- Rate limiting
- Input sanitization
- Security headers

## File Structure

```
backend/src/
├── routes/         # HTTP endpoints
├── controllers/    # Request handlers
├── services/       # Business logic
├── repositories/   # Data access
├── models/         # Data schemas
├── middleware/     # Cross-cutting concerns
├── utils/          # Helper functions
├── validators/     # Input validation
├── errors/         # Error definitions
└── constants/      # Application constants
```
