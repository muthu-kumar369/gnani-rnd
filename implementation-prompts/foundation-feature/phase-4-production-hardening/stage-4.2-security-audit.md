# Stage 4.2: Security Audit

## Summary
Penetration testing and security hardening to protect user data and system integrity.

## Goals
- Input validation and sanitization
- SQL/NoSQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting per user
- Secure file upload validation

## Files to Modify / Create

### Backend
- `/src/middleware/security.middleware.ts` → **[NEW]** Security headers (Helmet)
- `/src/middleware/rate-limit.middleware.ts` → Update rules

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Implement Helmet
Add `helmet` middleware for secure headers.

#### Step 2: Audit Input Validation
Ensure all endpoints use `zod` or `joi` for validation.

## Acceptance Criteria
- [ ] All endpoints have input validation
- [ ] Rate limiting is active
- [ ] Security headers are present
- [ ] No known vulnerabilities in dependencies (`npm audit`)
