import { bookmarkRagAgent } from './mastra/agents/bookmark-rag-agent';

async function exampleUsage() {
  console.log('=== Bookmark RAG Agent Example ===\n');

  // Example 1: Store a new bookmark
  console.log('1. Storing a new bookmark:');
  const storeResponse = await bookmarkRagAgent.generate([
    {
      role: 'user',
      content: 'Please store this bookmark: Title: "Understanding Vector Databases", URL: "https://example.com/vector-db-guide", Content: "Vector databases are specialized databases designed to store and query high-dimensional vector embeddings. They are essential for modern AI applications including semantic search, recommendation systems, and retrieval-augmented generation (RAG). Popular vector databases include Pinecone, Weaviate, and pgvector for PostgreSQL."',
    },
  ]);
  console.log('Response:', storeResponse.text);
  console.log('\n---\n');

  // Example 2: Search bookmarks
  console.log('2. Searching bookmarks:');
  const searchResponse = await bookmarkRagAgent.generate([
    {
      role: 'user',
      content: 'Find bookmarks about vector databases and PostgreSQL',
    },
  ]);
  console.log('Response:', searchResponse.text);
  console.log('\n---\n');

  // Example 3: Web search and store
  console.log('3. Web search (simulated):');
  const webSearchResponse = await bookmarkRagAgent.generate([
    {
      role: 'user',
      content: 'Search the web for information about "Mastra AI framework" and save useful results',
    },
  ]);
  console.log('Response:', webSearchResponse.text);
}

// Run the example
exampleUsage().catch(console.error);