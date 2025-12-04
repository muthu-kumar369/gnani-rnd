# Stage 2.5: Enhanced Markdown Rendering

## Summary
Support full GitHub Flavored Markdown including tables, task lists, footnotes, and LaTeX math to improve content presentation.

## Goals
- Support GFM (tables, task lists, strikethrough)
- Support LaTeX math rendering
- Support Mermaid diagrams
- Ensure consistent styling with Jarvis theme

## Files to Modify / Create

### Frontend
- `/src/utils/markdown-renderer.ts` → Update with GFM plugins
- `/src/styles/markdown.css` → **[NEW]** Custom markdown styles
- `/src/components/Terminal/MessageBubble.tsx` → Ensure proper rendering

## Detailed Implementation Instructions

### Frontend Implementation

#### Step 1: Update Markdown Renderer
In `/src/utils/markdown-renderer.ts`:

- Add `remark-gfm`
- Add `remark-math` and `rehype-katex`
- Add `remark-mermaid` (optional)

#### Step 2: Create Markdown Styles
In `/src/styles/markdown.css`:

- Style tables (borders, padding, background)
- Style task lists (checkboxes)
- Style blockquotes
- Style math equations

## Acceptance Criteria
- [ ] Tables render correctly with borders and styling
- [ ] Task lists render as checkboxes
- [ ] Math equations render correctly using KaTeX
- [ ] Styles match the dark Jarvis theme
