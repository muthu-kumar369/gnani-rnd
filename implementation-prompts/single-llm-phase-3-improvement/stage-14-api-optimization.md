# Stage 14: API Optimization

## Overview
Optimize API endpoints with pagination, field selection, and compression.

## Implementation Steps

### Step 1: Add Pagination
```typescript
interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

router.get('/', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const conversations = await conversationService.listConversations(
    req.user.id,
    { page: Number(page), limit: Number(limit) }
  );
  
  res.json({
    data: conversations,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: await Conversation.countDocuments({ userId: req.user.id })
    }
  });
});
```

### Step 2: Add Field Selection
```typescript
router.get('/:id', async (req, res) => {
  const { fields } = req.query;
  const select = fields ? fields.split(',').join(' ') : '';
  
  const conversation = await Conversation.findById(req.params.id).select(select);
  res.json(conversation);
});
```

### Step 3: Add Response Compression
```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6
}));
```

## Success Criteria
- ✅ Response size reduced by 60%
- ✅ Pagination works smoothly
- ✅ Field selection reduces payload

## Estimated Time: 6 hours
