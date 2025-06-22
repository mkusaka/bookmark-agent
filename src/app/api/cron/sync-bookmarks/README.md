# Bookmark Sync Cron Job

This API endpoint synchronizes the latest bookmarks from Hatena Bookmark for all registered users.

## Schedule

- Runs every 10 minutes (*/10 * * * *)
- Can be triggered manually via GET or POST request

## Authentication

Requires `Authorization` header with Bearer token:
```
Authorization: Bearer YOUR_CRON_SECRET
```

## Manual Testing

```bash
# Test locally
curl -X GET http://localhost:3000/api/cron/sync-bookmarks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test on production
curl -X GET https://your-domain.vercel.app/api/cron/sync-bookmarks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How it works

1. Fetches all unique Hatena user IDs from the database
2. For each user:
   - Gets the most recent bookmark date from the database
   - Fetches new bookmarks from Hatena API since that date
   - Imports only new bookmarks (stops when it finds an existing one)
3. Returns a summary of imported bookmarks for each user

## Response Format

```json
{
  "success": true,
  "message": "Bookmark sync completed",
  "results": [
    {
      "hatenaId": "username",
      "imported": 10,
      "skipped": 0,
      "sinceDate": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T06:00:00.000Z"
}
```