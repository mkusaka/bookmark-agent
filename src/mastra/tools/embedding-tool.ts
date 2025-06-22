import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import pkg from 'pg';
const { Pool } = pkg;

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY environment variable is not set');
}

// PostgreSQL connection pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bookmark_rag',
  user: 'postgres',
  password: 'postgres',
});

// Ensure pgvector extension is installed
async function ensurePgVector() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
  } finally {
    client.release();
  }
}

// Initialize pgvector on module load
ensurePgVector().catch(console.error);

export const embedAndStoreTool = createTool({
  id: 'embed-and-store',
  description: 'Embed text content and store it in pgvector for RAG',
  inputSchema: z.object({
    title: z.string().describe('Title of the bookmark'),
    url: z.string().url().describe('URL of the bookmark'),
    content: z.string().describe('Content to embed'),
    description: z.string().optional().describe('Description of the bookmark'),
    tags: z.array(z.string()).optional().describe('Tags for the bookmark'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.number().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { title, url, content, description, tags } = context;
    try {
      // Generate embedding using OpenAI
      const { embeddings } = await embedMany({
        model: openai.embedding('text-embedding-3-small'),
        values: [content],
      });
      const embedding = embeddings[0];

      // Store in PostgreSQL with pgvector
      const client = await pool.connect();
      try {
        const query = `
          INSERT INTO bookmarks (title, url, content, description, tags, embedding)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        
        const values = [
          title,
          url,
          content,
          description || null,
          tags || [],
          `[${embedding.join(',')}]`, // Convert array to pgvector format
        ];

        const result = await client.query(query, values);
        
        return {
          success: true,
          id: result.rows[0].id,
          message: `Successfully embedded and stored bookmark: ${title}`,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in embedAndStore:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

export const searchBookmarksTool = createTool({
  id: 'search-bookmarks',
  description: 'Search bookmarks using vector similarity',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    topK: z.number().optional().default(5).describe('Number of results to return'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    results: z.array(z.object({
      id: z.number(),
      title: z.string(),
      url: z.string(),
      description: z.string().nullable(),
      content: z.string(),
      tags: z.array(z.string()),
      similarity: z.number(),
    })).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    console.log('Tool context:', context);
    const { query, topK = 5 } = context;
    try {
      // Validate input
      if (!query || typeof query !== 'string') {
        throw new Error('Query must be a non-empty string');
      }
      
      console.log('Search query:', query);
      console.log('topK:', topK);
      
      // Generate embedding for the search query
      const { embeddings } = await embedMany({
        model: openai.embedding('text-embedding-3-small'),
        values: [query],
      });
      const embedding = embeddings[0];

      // Search using pgvector
      const client = await pool.connect();
      try {
        const searchQuery = `
          SELECT 
            id,
            title,
            url,
            description,
            content,
            tags,
            1 - (embedding <=> $1::vector) as similarity
          FROM bookmarks
          ORDER BY embedding <=> $1::vector
          LIMIT $2
        `;
        
        const result = await client.query(searchQuery, [
          `[${embedding.join(',')}]`,
          topK,
        ]);

        return {
          success: true,
          results: result.rows.map(row => ({
            id: row.id,
            title: row.title,
            url: row.url,
            description: row.description,
            content: row.content,
            tags: row.tags,
            similarity: row.similarity,
          })),
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in searchBookmarks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});