# Stage 1.3: Unit Testing Infrastructure

**Duration:** Week 4 (5 working days)  
**Priority:** 🟡 High  
**Dependencies:** Stage 1.2 (Session Manager Refactoring)

---

## Overview

Set up comprehensive unit testing infrastructure to achieve 80% code coverage. This ensures code quality, prevents regressions, and makes future refactoring safer.

## Goals

1. Set up Jest testing framework
2. Write unit tests for all 6 session services
3. Achieve 80% code coverage
4. Set up CI/CD pipeline for automated testing

## Setup Tasks

### Task 1: Install Testing Dependencies

```bash
cd gnani-rnd-backend
npm install --save-dev jest ts-jest @types/jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Task 2: Configure Jest

**File:** `gnani-rnd-backend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Task 3: Write Tests for Each Service

See full implementation details in the file.

## Success Metrics

- ✅ 80% code coverage achieved
- ✅ All tests passing
- ✅ CI/CD pipeline running tests automatically
- ✅ Test execution time < 30 seconds

---

**Next:** Month 2 - Production Features
