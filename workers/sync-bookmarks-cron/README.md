# Sync Bookmarks Cron Worker

Cloudflare Worker that periodically syncs bookmarks by calling the sync-bookmarks API endpoint.

## Setup

### 1. Install Dependencies

```bash
cd workers/sync-bookmarks-cron
pnpm install
```

### 2. Configure Environment Variables

You need to set up two secrets in Cloudflare:

1. **CRON_SECRET**: The Bearer token for authenticating with the sync-bookmarks API
2. **TARGET_URL**: The URL of the sync-bookmarks endpoint (optional, defaults to `http://localhost:3000/api/cron/sync-bookmarks`)

To add secrets using Wrangler:

```bash
# Set the CRON_SECRET (use the same secret from your .env file)
npx wrangler secret put CRON_SECRET

# Optionally set a custom target URL (e.g., for production)
npx wrangler secret put TARGET_URL
```

When prompted, enter the secret value.

### 3. Test Locally

To test the cron trigger locally:

```bash
# Start the dev server with scheduled event testing
pnpm run test-scheduled

# In another terminal, trigger the cron
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

## Deployment

### Deploy to Production

```bash
pnpm run deploy
```

By default, this will deploy with the production cron schedule (every 6 hours).

### Deploy to Staging

To deploy with a more frequent schedule (every 5 minutes) for testing:

```bash
npx wrangler deploy --env staging
```

## Cron Schedules

- **Production**: `*/5 * * * *` - Runs every 5 minutes
- **Staging**: `*/5 * * * *` - Runs every 5 minutes

## Monitoring

After deployment, you can monitor the worker execution:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages
3. Select your worker (sync-bookmarks-cron)
4. View logs and cron trigger events

## Troubleshooting

- Ensure the CRON_SECRET matches the one used by your API endpoint
- Check that the TARGET_URL is accessible from Cloudflare's edge network
- Remember that cron triggers run in UTC time
- Use the Cloudflare dashboard to view execution logs and debug issues