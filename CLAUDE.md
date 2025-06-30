# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bookmark Agent is a Next.js 15 application for managing and searching Hatena bookmarks with advanced filtering capabilities. It features automatic synchronization, full-text search with PostgreSQL trigram indexes, and comprehensive statistics.

## Essential Commands

### Development
```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Create production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking
```

### Database Management
```bash
# Initial setup
docker-compose up -d        # Start PostgreSQL container
pnpm db:push               # Push schema to database
pnpm db:seed               # Import bookmarks from Hatena

# Development
pnpm db:generate           # Generate Drizzle migrations
pnpm db:migrate           # Run migrations
pnpm db:studio            # Open Drizzle Studio UI

# Seeding options
pnpm db:seed --limit 100  # Import first 100 bookmarks
pnpm db:seed -s 50 -l 100 # Skip 50, import next 100
```

### Testing
```bash
pnpm test         # Run all tests with Vitest
pnpm test:ui      # Run tests with UI interface
pnpm test:unit    # Run unit tests only
```

### Running a Single Test
```bash
pnpm test path/to/test.test.ts              # Run specific test file
pnpm test -t "test name"                    # Run tests matching pattern
pnpm test path/to/test.test.ts -t "pattern" # Combine file and pattern
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.1.6 with App Router
- **Language**: TypeScript with strict mode
- **UI**: React 19, Tailwind CSS v4, shadcn/ui (Radix UI)
- **Database**: PostgreSQL with Drizzle ORM
- **Testing**: Vitest with React Testing Library
- **PWA**: Serwist service worker
- **Background Jobs**: Cloudflare Workers for cron tasks

### Key Architectural Patterns

1. **Server Components by Default**: All components are React Server Components unless marked with "use client"

2. **Server Actions**: All data mutations go through server actions in `src/actions/`:
   - `bookmark-actions.ts` - CRUD operations
   - `stats-actions.ts` - Statistics calculations
   - `markdown-actions.ts` - Content fetching with caching

3. **Database Layer**: 
   - Schema defined in `src/db/schema.ts`
   - Uses Drizzle ORM with type-safe queries
   - Trigram indexes for full-text search
   - Normalized domain storage for efficient filtering

4. **Search Implementation**:
   - URL-based state management with Zod validation
   - Fuzzy matching with trigram similarity
   - Cursor-based pagination for performance
   - Advanced filters: domains, tags, users, date ranges

5. **Component Organization**:
   - `src/components/ui/` - Reusable shadcn/ui components
   - Feature-specific components in `src/components/`
   - Client components only when needed for interactivity

6. **Background Sync**:
   - API endpoint at `/api/cron/sync-bookmarks`
   - Cloudflare Worker runs every 5 minutes in production
   - Protected by `CRON_SECRET` authentication

### Environment Setup

Required environment variables:
```env
DATABASE_URL=postgresql://...           # Production database
LOCAL_DATABASE_URL=postgresql://...     # Local development database
HATENA_USER_ID=your_username           # Hatena account
CRON_SECRET=generated_secret           # Use scripts/generate-cron-secret.js
CLOUDFLARE_ACCOUNT_ID=...              # Optional: for markdown fetching
CLOUDFLARE_API_TOKEN=...               # Optional: for browser rendering
```

### Testing Strategy

- Test database automatically created/cleaned between tests
- Use `src/test/setup.ts` for test utilities
- Tests organized alongside source files in `__tests__/` directories
- Database tests use transactions for isolation

### Important Implementation Details

1. **Path Aliases**: Use `@/` for imports from `src/` directory

2. **Database Queries**: Always use Drizzle's query builder for type safety:
   ```typescript
   const bookmarks = await db.query.bookmarks.findMany({
     with: { entry: true, tags: true }
   });
   ```

3. **Server Actions**: Return typed results with proper error handling:
   ```typescript
   export async function actionName() {
     try {
       // implementation
       return { success: true, data: result };
     } catch (error) {
       return { success: false, error: error.message };
     }
   }
   ```

4. **Search Params**: Use `search-params-schema.ts` for URL parameter validation

5. **Performance**: 
   - Use cursor-based pagination for large datasets
   - Implement proper database indexes
   - Cache expensive operations (like markdown fetching)

### Development Workflow

1. Always run `pnpm typecheck` before committing
2. Use server components by default, client components only when necessary
3. Place database queries in server actions, not components
4. Use URL state for search/filter parameters
5. Follow existing patterns in the codebase for consistency