import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { getBookmarks, getDomains, getTags, getUsers, getBookmarkById } from "@/app/actions/bookmark-actions";
import { getOrFetchMarkdownContent } from "@/app/actions/markdown-actions";
import type { Bookmark, BookmarkFilters, BookmarkSort, BookmarkTag } from "@/types/bookmark";

const handler = createMcpHandler(
  (server) => {
    // Bookmark search tool
    server.tool(
      "search_bookmarks",
      "Search Hatena bookmarks with advanced filtering by title, URL, comments, tags, domains, and users.",
      {
        query: z.string().optional().describe("Search query (searches in title, URL, comment, description, and markdown content)"),
        domains: z.array(z.string()).optional().describe("Filter by domains"),
        tags: z.array(z.string()).optional().describe("Filter by tags"),
        users: z.array(z.string()).optional().describe("Filter by users"),
        from: z.string().optional().describe("Start date (YYYY-MM-DD format)"),
        to: z.string().optional().describe("End date (YYYY-MM-DD format)"),
        sortBy: z.enum(["bookmarkedAt", "title", "user"]).optional().describe("Sort field"),
        order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
        limit: z.number().int().min(1).max(100).optional().describe("Number of results to return (max 100)")
      },
      {
        readOnlyHint: true
      },
      async (params) => {
        try {
          const filters: BookmarkFilters = {
            searchQuery: params.query || "",
            selectedDomains: params.domains || [],
            selectedTags: params.tags || [],
            selectedUsers: params.users || [],
            dateRange: {
              from: params.from ? new Date(params.from) : undefined,
              to: params.to ? new Date(params.to) : undefined
            }
          };

          const sort: BookmarkSort = {
            field: (params.sortBy as BookmarkSort['field']) || 'bookmarkedAt',
            order: params.order || 'desc'
          };

          const limit = params.limit || 20;

          const result = await getBookmarks(filters, sort, limit);
          const bookmarks = result.bookmarks;
          
          if (bookmarks.length === 0) {
            return {
              content: [{ 
                type: "text", 
                text: "No bookmarks found matching your search criteria." 
              }]
            };
          }

          const bookmarkText = bookmarks.map((bookmark: Bookmark, index: number) => {
            const tags = bookmark.tags.length > 0 ? `[${bookmark.tags.map(t => t.label).join(", ")}]` : "";
            const comment = bookmark.comment ? `💬 ${bookmark.comment}` : "";
            const user = bookmark.user.name;
            const date = new Date(bookmark.bookmarkedAt).toLocaleDateString("en-US");
            
            return `${index + 1}. **${bookmark.entry.title}**
URL: ${bookmark.url}
User: ${user} | Date: ${date} | ID: ${bookmark.id}
${tags}
${comment}
---`;
          }).join("\n\n");

          return {
            content: [{ 
              type: "text", 
              text: `🔖 Found ${bookmarks.length} bookmark${bookmarks.length === 1 ? "" : "s"}:\n\n${bookmarkText}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Search error: ${error instanceof Error ? error.message : "Unknown error"}` 
            }]
          };
        }
      }
    );

    // Get bookmark by ID tool
    server.tool(
      "get_bookmark",
      "Get detailed information about a specific bookmark by its ID, including markdown content",
      {
        id: z.string().describe("The bookmark ID"),
        fetchMarkdown: z.boolean().optional().describe("Whether to fetch/refresh markdown content (default: false)")
      },
      {
        readOnlyHint: true,
        openWorldHint: true
      },
      async (params) => {
        try {
          const bookmark = await getBookmarkById(params.id);
          
          if (!bookmark) {
            return {
              content: [{ 
                type: "text", 
                text: `Bookmark with ID "${params.id}" not found.` 
              }]
            };
          }

          let markdownContent = bookmark.markdownContent;

          // Fetch markdown content if requested or if not cached
          if (params.fetchMarkdown || !markdownContent) {
            markdownContent = await getOrFetchMarkdownContent(bookmark.id, bookmark.url);
          }

          const tags = bookmark.tags.length > 0 ? `[${bookmark.tags.map(t => t.label).join(", ")}]` : "";
          const comment = bookmark.comment ? `💬 ${bookmark.comment}` : "";
          const description = bookmark.description ? `📝 ${bookmark.description}` : "";
          const user = bookmark.user.name;
          const date = new Date(bookmark.bookmarkedAt).toLocaleDateString("en-US");
          const domain = bookmark.entry.domain;
          
          let result = `📖 **${bookmark.entry.title}**

**URL**: ${bookmark.url}
**Domain**: ${domain}
**User**: ${user}
**Date**: ${date}
**ID**: ${bookmark.id}

${tags}
${comment}
${description}`;

          if (bookmark.entry.summary) {
            result += `\n\n**Summary**: ${bookmark.entry.summary}`;
          }

          if (markdownContent) {
            result += `\n\n**Content**:\n---\n${markdownContent.substring(0, 3000)}${markdownContent.length > 3000 ? '\n\n...(truncated)' : ''}`;
          } else if (params.fetchMarkdown) {
            result += `\n\n**Content**: Unable to fetch markdown content for this URL.`;
          }

          return {
            content: [{ 
              type: "text", 
              text: result
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error fetching bookmark: ${error instanceof Error ? error.message : "Unknown error"}` 
            }]
          };
        }
      }
    );

    // Domain list tool
    server.tool(
      "get_domains",
      "Get list of available domains for filtering bookmarks",
      {},
      {
        readOnlyHint: true
      },
      async () => {
        try {
          const domains = await getDomains();
          const domainText = domains.map((domain: string, index: number) => 
            `${index + 1}. ${domain}`
          ).join("\n");

          return {
            content: [{ 
              type: "text", 
              text: `📊 Available domains (${domains.length} total):\n\n${domainText}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error fetching domains: ${error instanceof Error ? error.message : "Unknown error"}` 
            }]
          };
        }
      }
    );

    // Tag list tool
    server.tool(
      "get_tags",
      "Get list of available tags for filtering bookmarks",
      {},
      {
        readOnlyHint: true
      },
      async () => {
        try {
          const tags = await getTags();
          const tagText = tags.map((tag: BookmarkTag, index: number) => 
            `${index + 1}. ${tag.label}`
          ).join("\n");

          return {
            content: [{ 
              type: "text", 
              text: `🏷️ Available tags (${tags.length} total):\n\n${tagText}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error fetching tags: ${error instanceof Error ? error.message : "Unknown error"}` 
            }]
          };
        }
      }
    );

    // User list tool
    server.tool(
      "get_users",
      "Get list of available users for filtering bookmarks",
      {},
      {
        readOnlyHint: true
      },
      async () => {
        try {
          const users = await getUsers();
          const userText = users.map((user, index) => 
            `${index + 1}. ${user.name}`
          ).join("\n");

          return {
            content: [{ 
              type: "text", 
              text: `👥 Available users (${users.length} total):\n\n${userText}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error fetching users: ${error instanceof Error ? error.message : "Unknown error"}` 
            }]
          };
        }
      }
    );
  },
  {
    // Server options
    instructions: `This extension provides comprehensive search and filtering capabilities for Hatena bookmarks with advanced content analysis.
It's designed to help users efficiently discover and retrieve bookmarks from their personal collection using natural language queries.

Capabilities:
1. Search bookmarks by content across title, URL, comments, descriptions, and markdown content with fuzzy matching.
2. Filter bookmarks by specific domains, tags, and users for targeted discovery.
3. Sort results by bookmark date, title, or user for organized browsing.
4. Retrieve metadata including available domains, tags, and users for informed filtering.

When to use bookmark search tools:
- When users need to find specific bookmarks or articles they've saved
- When exploring bookmarks within particular domains or topics
- When searching for bookmarks with specific tags or from certain users
- When analyzing bookmark patterns or discovering related content
- When building research or reference collections from saved bookmarks

Search capabilities include:
- Full-text search across all bookmark content including fetched markdown content
- Domain-based filtering (e.g., "github.com", "stackoverflow.com")
- Tag-based discovery for topical exploration
- User-based filtering to find bookmarks from specific contributors
- Date range filtering for temporal analysis
- Advanced sorting options for result organization

Interaction Protocol:
When users express interest in finding or exploring bookmarks:
1. Use search_bookmarks with appropriate query parameters based on user intent
2. For domain-specific searches, first use get_domains to show available options
3. For tag-based discovery, use get_tags to display available categories
4. For user-focused searches, use get_users to list bookmark contributors
5. Combine multiple filters for precise results (e.g., domain + tags + date range)

Keywords that suggest using bookmark tools:
- "find bookmarks"
- "search my bookmarks"
- "bookmarks about"
- "show me bookmarks"
- "what domains"
- "what tags"
- "bookmarks from user"
- "recent bookmarks"
- "old bookmarks"

The system automatically searches across:
- Entry titles and summaries
- Bookmark comments and descriptions
- Full URLs
- Fetched markdown content from bookmark pages
- Associated tags and user information

Results include rich context with titles, URLs, users, dates, tags, and comments for comprehensive bookmark analysis.`
  },
  {
    // Adapter configuration
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development"
  }
);

export { handler as GET, handler as POST };
