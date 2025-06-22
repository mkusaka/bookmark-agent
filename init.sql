-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create bookmarks table with embeddings
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    content TEXT,
    description TEXT,
    tags TEXT[],
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS bookmarks_embedding_idx ON bookmarks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE
    ON bookmarks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();