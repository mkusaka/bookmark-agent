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
- Cloudflare account (for Browser Rendering API)

## Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=your_neon_database_url
LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5432/bookmark_agent
HATENA_USER_ID=your_hatena_user_id
CRON_SECRET=your_random_secret_string
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

To generate a secure `CRON_SECRET`:
```bash
node scripts/generate-cron-secret.js
```

### Cloudflare Browser Rendering API Setup

To enable markdown content fetching for bookmark detail pages:

1. Create a Cloudflare account at https://cloudflare.com
2. Navigate to your account dashboard
3. Find your Account ID in the sidebar
4. Generate an API token with Browser Rendering permissions:
   - Go to "My Profile" → "API Tokens"
   - Click "Create Token"
   - Use the "Custom token" template
   - Add permission: Account → Browser Rendering → Read
   - Create and copy the token

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

## MCP (Model Context Protocol) Integration

This application provides an MCP server that allows AI assistants like Claude Desktop to search and filter your bookmarks directly.

### MCP Server Features

- **Advanced Search**: Search across titles, URLs, comments, descriptions, and markdown content
- **Smart Filtering**: Filter by domains, tags, users, and date ranges
- **Metadata Access**: Get available domains, tags, and users for informed filtering
- **Rich Results**: Returns comprehensive bookmark information with context

### Setting up MCP Access

#### For Claude Code (CLI)

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Add the MCP server using Claude Code CLI**:
   ```bash
   # Add MCP server configuration
   claude-code mcp add bookmark-agent --url http://localhost:3000/api/mcp
   
   # For production deployment
   claude-code mcp add bookmark-agent --url https://your-app.vercel.app/api/mcp
   ```

3. **Verify the configuration**:
   ```bash
   claude-code mcp list
   ```

4. **Test the connection**:
   ```bash
   claude-code mcp test bookmark-agent
   ```

#### Managing Claude Code MCP Configuration

```bash
# List all configured MCP servers
claude-code mcp list

# Remove an MCP server
claude-code mcp remove bookmark-agent

# Update an existing MCP server URL
claude-code mcp update bookmark-agent --url https://new-url.vercel.app/api/mcp

# Get help for MCP commands
claude-code mcp --help
```

#### For Claude Desktop

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Configure Claude Desktop**:
   Edit your Claude Desktop configuration file:
   
   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

3. **Add the MCP server configuration**:
   ```json
   {
     "mcpServers": {
       "bookmark-agent": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "-y",
           "http://localhost:3000/api/mcp"
         ]
       }
     }
   }
   ```

4. **Install mcp-remote** (if not already installed):
   ```bash
   npm install -g mcp-remote
   ```

5. **Restart Claude Desktop** to pick up the configuration changes.

#### For Cursor

1. **Configure Cursor**:
   Edit the MCP configuration file at `~/.cursor/mcp.json`:
   ```json
   {
     "bookmark-agent": {
       "command": "npx",
       "args": [
         "mcp-remote",
         "-y",
         "http://localhost:3000/api/mcp"
       ]
     }
   }
   ```

2. **Restart Cursor** to apply the changes.

#### For Windsurf

1. **Configure Windsurf**:
   Edit the configuration file at `~/.codeium/windsurf/mcp_config.json`:
   ```json
   {
     "bookmark-agent": {
       "command": "npx",
       "args": [
         "mcp-remote",
         "-y",
         "http://localhost:3000/api/mcp"
       ]
     }
   }
   ```

2. **Restart Windsurf** to apply the changes.

### Available MCP Tools

Once configured, you can use these tools in your AI assistant:

1. **`search_bookmarks`**: Search bookmarks with advanced filtering
   - Parameters: query, domains, tags, users, from, to, sortBy, order, limit
   - Returns bookmark IDs for detailed lookup
   - Example: "Find bookmarks about React from the last month"

2. **`get_bookmark`**: Get detailed information about a specific bookmark
   - Parameters: id (required), fetchMarkdown (optional)
   - Includes full content, markdown if available/requested
   - Example: "Get details for bookmark ID abc-123"

3. **`get_domains`**: List all available domains for filtering
   - Example: "What domains do I have bookmarks from?"

4. **`get_tags`**: List all available tags for filtering
   - Example: "Show me all my bookmark tags"

5. **`get_users`**: List all available users for filtering
   - Example: "What users have bookmarks in my collection?"

### Example MCP Queries

- "Search my bookmarks for TypeScript tutorials"
- "Find bookmarks from github.com with the tag 'frontend'"
- "Show me recent bookmarks from the last week"
- "What domains do I bookmark most frequently?"
- "Find bookmarks by user 'john-doe' about databases"
- "Get full details for bookmark ID abc-123-def with markdown content"
- "Show me the content of that first bookmark result"

### Production Deployment

For production use, replace `http://localhost:3000` with your deployed application URL:
```json
{
  "mcpServers": {
    "bookmark-agent": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "-y",
        "https://your-app.vercel.app/api/mcp"
      ]
    }
  }
}
```

## Technologies

- Next.js 15 (App Router)
- TypeScript
- PostgreSQL with Drizzle ORM
- Tailwind CSS
- shadcn/ui components
- React Hook Form
- Zod validation
- **MCP (Model Context Protocol)** with @vercel/mcp-adapter

## Deployment

This application is designed to be deployed on Vercel with Neon PostgreSQL.

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

The cron jobs will be automatically configured based on `vercel.json`.