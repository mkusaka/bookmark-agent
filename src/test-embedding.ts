import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

async function testEmbedding() {
  console.log('Testing embedding with OpenAI...');
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  
  try {
    const testQuery = 'hoge';
    console.log('Test query:', testQuery);
    
    const { embeddings } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: [testQuery],
    });
    
    console.log('Embedding successful!');
    console.log('Embedding length:', embeddings[0].length);
    console.log('First 5 values:', embeddings[0].slice(0, 5));
  } catch (error) {
    console.error('Embedding failed:', error);
  }
}

testEmbedding();