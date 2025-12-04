# Stage 4.4: Documentation

## Summary
Create comprehensive documentation for users and developers.

## Goals
- API documentation (Swagger/OpenAPI)
- User guide (how to use features)
- Developer documentation (architecture, setup)
- Deployment guide

## Files to Modify / Create

- `/docs/api/openapi.yaml` → **[NEW]** API spec
- `/docs/user-guide.md` → **[NEW]** User manual
- `/docs/developer-guide.md` → **[NEW]** Dev docs

## Detailed Implementation Instructions

### Step 1: Generate API Docs
Use `swagger-jsdoc` to generate OpenAPI spec from code comments.

### Step 2: Write User Guide
Document all features (Model Switcher, Attachments, etc.) with screenshots.

## Acceptance Criteria
- [ ] API docs are complete and accurate
- [ ] User guide covers all major features
- [ ] Developer guide enables new dev to setup project
