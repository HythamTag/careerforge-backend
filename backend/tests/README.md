# Tests Directory

Organized test suite for the CV Enhancer backend.

## Structure

```
tests/
├── api/                    # REST API test collections
│   ├── api.rest           # Main API test file (VS Code REST Client)
│   └── .env.rest.example  # Environment variables template
├── unit/                   # Unit tests (Jest)
├── integration/            # Integration tests
├── e2e/                    # End-to-end tests
├── fixtures/               # Test data and fixtures
├── helpers/                # Test utilities and helpers
├── mocks/                  # Mock implementations
└── __mocks__/              # Jest mocks

```

## Quick Start

### REST API Testing (Manual)

1. Install [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) in VS Code
2. Copy `api/.env.rest.example` to `api/.env.rest.local`
3. Open `api/api.rest` and click "Send Request" above any endpoint

### Unit/Integration Tests (Automated)

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- unit
npm test -- integration

# Run with coverage
npm test -- --coverage
```

## Test Coverage

- **API Endpoints**: 40+ endpoints in `api/api.rest`
- **Unit Tests**: Core business logic
- **Integration Tests**: Service interactions
- **E2E Tests**: Full user workflows
