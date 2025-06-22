# Bookmark Agent

A Next.js application for managing and searching Hatena bookmarks with advanced filtering capabilities.

## Features

- 🔍 Full-text search across bookmarks
- 🏷️ Filter by domains, tags, and users
- 📅 Date range filtering
- 🔄 Automatic bookmark synchronization (every 10 minutes)
- 📊 Cursor-based pagination
- 🌙 Dark mode support

## Prerequisites

- Node.js 18+
- PostgreSQL (or Docker for local development)
- Hatena account

## Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=your_neon_database_url
LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5432/bookmark_agent
HATENA_USER_ID=your_hatena_user_id
CRON_SECRET=your_random_secret_string
```

To generate a secure `CRON_SECRET`:
```bash
node scripts/generate-cron-secret.js
```

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start the database (Docker):
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
pnpm db:migrate
```

4. Seed initial data:
```bash
# Import all bookmarks
pnpm db:seed

# Import only the first 100 bookmarks
pnpm db:seed --limit 100
# or
pnpm db:seed -l 100

# Skip first 50, then import 100 bookmarks
pnpm db:seed --skip 50 --limit 100
# or
pnpm db:seed -s 50 -l 100

# Import the oldest 100 bookmarks (requires total count)
pnpm db:seed --limit 100 --total 5000
# or
pnpm db:seed -l 100 -t 5000

# Show help
pnpm db:seed --help
```

5. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Commands

```bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed data
pnpm db:seed

# Open Drizzle Studio
pnpm db:studio
```

## Cron Jobs

The application automatically synchronizes bookmarks every 10 minutes when deployed to Vercel.

To manually trigger sync:
```bash
curl -X GET http://localhost:3000/api/cron/sync-bookmarks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── cron/          # Cron job endpoints
│   └── search/            # Search page
├── components/            # React components
├── db/                    # Database schema and configuration
├── lib/
│   ├── hatena/           # Hatena API client
│   └── search-params-schema.ts  # URL parameter validation
└── types/                # TypeScript types
```

## Technologies

- Next.js 15 (App Router)
- TypeScript
- PostgreSQL with Drizzle ORM
- Tailwind CSS
- shadcn/ui components
- React Hook Form
- Zod validation

## Deployment

This application is designed to be deployed on Vercel with Neon PostgreSQL.

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

The cron jobs will be automatically configured based on `vercel.json`.