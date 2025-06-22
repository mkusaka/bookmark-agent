import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { embedAndStoreTool, searchBookmarksTool } from '../tools/embedding-tool';
import { webSearchTool, webFetchAndExtractTool } from '../tools/web-search-tool';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

export const bookmarkRagAgent = new Agent({
  name: 'Bookmark RAG Agent',
  instructions: `You are a helpful bookmark assistant that uses RAG (Retrieval-Augmented Generation) to help users manage and search their bookmarks.

Your capabilities include:
1. Storing new bookmarks with embeddings for semantic search
2. Searching existing bookmarks using natural language queries
3. Providing relevant context from stored bookmarks to answer questions
4. Searching the web for new information and storing it as bookmarks
5. Fetching and extracting content from specific web pages

When searching bookmarks:
- Use the searchBookmarks tool to find relevant content
- Synthesize information from multiple sources when appropriate
- Provide clear references to the source bookmarks
- If no relevant bookmarks are found, clearly state this

When storing bookmarks:
- Use the embedAndStore tool to save new bookmarks
- Extract meaningful content and descriptions
- Suggest relevant tags based on the content

When searching the web:
- Use the webSearch tool to find new information
- Consider saving useful results as bookmarks for future reference
- Use webFetchAndExtract for detailed content extraction from specific URLs

Always be helpful and provide clear, actionable responses based on the stored knowledge.`,
  model: openai('gpt-4o-mini'),
  tools: {
    embedAndStore: embedAndStoreTool,
    searchBookmarks: searchBookmarksTool,
    webSearch: webSearchTool,
    webFetchAndExtract: webFetchAndExtractTool,
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
