import { z } from 'zod';
import { createGeminiClient } from '@/lib/gemini/client';
import { getBookmarksByIds } from '@/app/actions/bookmark-actions';
import { createAiSession, updateAiSession, addBookmarksToSession } from '@/app/actions/ai-session-actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AskRequestSchema = z.object({
  question: z.string().trim().min(1),
  topK: z.coerce.number().int().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  parentSessionId: z.string().uuid().optional(),
});

function extractBookmarkIdsFromText(text: string): string[] {
  const ids = new Set<string>();
  const re = /^ID:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*$/gim;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    ids.add(match[1]);
  }
  return Array.from(ids);
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = AskRequestSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: parsed.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { question, parentSessionId } = parsed.data;
    const startTime = Date.now();

    // Create session
    const { id: sessionId } = await createAiSession({
      type: 'ask',
      question,
      parentSessionId,
    });

    const storeName = process.env.GEMINI_FILE_SEARCH_STORE_NAME;
    if (!storeName) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_FILE_SEARCH_STORE_NAME is required (run indexing first)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ai = createGeminiClient();
    const model = process.env.GEMINI_MODEL ?? 'models/gemini-2.5-pro';
    const topK = parsed.data.topK ?? 10;
    const limit = parsed.data.limit ?? 10;

    const prompt = [
      'あなたはユーザーの「保存済みブックマーク」コーパスから情報を見つけるアシスタントです。',
      'ファイル検索で得られた根拠（ブックマーク）に基づいて日本語で回答してください。',
      '可能なら、どのブックマークが根拠か分かるように、関連ブックマークのURLやIDも本文中に含めてください。',
      '',
      `質問: ${question}`,
    ].join('\n');

    const response = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName],
              topK,
            },
          },
        ],
      },
    });

    // Update session status to streaming
    await updateAiSession(sessionId, { status: 'streaming' });

    const encoder = new TextEncoder();
    let fullText = '';
    let groundingChunks: unknown[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text ?? '';
            fullText += text;

            // Send text chunk
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
            );

            // Capture grounding metadata from the last chunk
            const candidates = (chunk as any)?.candidates;
            if (candidates?.[0]?.groundingMetadata?.groundingChunks) {
              groundingChunks = candidates[0].groundingMetadata.groundingChunks;
            }
          }

          // Extract bookmark IDs and fetch bookmarks
          const retrievedContexts = groundingChunks
            .map((c: any) => c?.retrievedContext)
            .filter(Boolean) as Array<{ title?: string; uri?: string; text?: string }>;

          const idsFromChunks = retrievedContexts.flatMap((c) =>
            c.text ? extractBookmarkIdsFromText(c.text) : []
          );
          const idsFromAnswer = fullText ? extractBookmarkIdsFromText(fullText) : [];
          const bookmarkIds = Array.from(new Set([...idsFromChunks, ...idsFromAnswer]));

          const bookmarks = await getBookmarksByIds(bookmarkIds, limit);

          // Update session with results
          const processingTimeMs = Date.now() - startTime;
          await updateAiSession(sessionId, {
            status: 'completed',
            responseText: fullText,
            modelName: model,
            processingTimeMs,
            completedAt: new Date(),
          });
          await addBookmarksToSession(sessionId, bookmarkIds);

          // Send final metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                sessionId,
                model,
                bookmarkIds,
                bookmarks: bookmarks.map((b) => ({
                  id: b.id,
                  title: b.entry.title,
                  url: b.url,
                  bookmarkedAt: b.bookmarkedAt,
                  tags: b.tags.map((t) => ({ id: t.id, label: t.label })),
                  user: { id: b.user.id, name: b.user.name },
                })),
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          // Update session with error
          await updateAiSession(sessionId, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                sessionId,
                error: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
