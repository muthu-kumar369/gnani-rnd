# Stage 27: Advanced Search

## Overview
Full-text search across all conversations with filters.

## Implementation Steps

### Step 1: Add Search Endpoint
```typescript
router.post('/search', async (req, res) => {
  const { query, filters } = req.body;
  
  const searchQuery: any = {
    userId: req.user.id,
    $text: { $search: query }
  };
  
  if (filters.dateFrom) searchQuery.createdAt = { $gte: filters.dateFrom };
  if (filters.model) searchQuery.model = filters.model;
  if (filters.tags) searchQuery.tags = { $in: filters.tags };
  
  const results = await Conversation.find(searchQuery)
    .sort({ score: { $meta: 'textScore' } })
    .limit(20);
  
  res.json(results);
});
```

### Step 2: Add Search UI
```tsx
const AdvancedSearch = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  
  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search conversations..."
      />
      
      <div className="filters">
        <DateRangePicker onChange={(range) => setFilters({...filters, dateRange: range})} />
        <ModelFilter onChange={(model) => setFilters({...filters, model})} />
        <TagFilter onChange={(tags) => setFilters({...filters, tags})} />
      </div>
      
      <SearchResults query={query} filters={filters} />
    </div>
  );
};
```

### Step 3: Add Text Index
```typescript
conversationSchema.index({ 
  title: 'text', 
  'messages.message': 'text' 
});
```

## Success Criteria
- ✅ Search works across title and content
- ✅ Filters work correctly
- ✅ Results ranked by relevance
- ✅ Search is fast (<500ms)

## Estimated Time: 8 hours
