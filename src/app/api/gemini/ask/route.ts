import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createGeminiClient } from '@/lib/gemini/client';
import { getBookmarksByIds } from '@/app/actions/bookmark-actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AskRequestSchema = z.object({
  question: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  topK: z.coerce.number().int().min(1).max(50).optional(),
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
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { question } = parsed.data;

    const storeName = process.env.GEMINI_FILE_SEARCH_STORE_NAME;
    if (!storeName) {
      return NextResponse.json(
        { error: 'GEMINI_FILE_SEARCH_STORE_NAME is required (run indexing first)' },
        { status: 400 }
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

    const response = await ai.models.generateContent({
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

    const answerText = (response as any).text ?? '';
    const groundingChunks = (response as any)?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const retrievedContexts = groundingChunks
      .map((c: any) => c?.retrievedContext)
      .filter(Boolean) as Array<{ title?: string; uri?: string; text?: string; fileSearchStore?: string }>;

    const idsFromChunks = retrievedContexts.flatMap((c) => (c.text ? extractBookmarkIdsFromText(c.text) : []));
    const idsFromAnswer = answerText ? extractBookmarkIdsFromText(answerText) : [];
    const bookmarkIds = Array.from(new Set([...idsFromChunks, ...idsFromAnswer]));

    const bookmarks = await getBookmarksByIds(bookmarkIds, limit);

    return NextResponse.json({
      answer: answerText,
      bookmarkIds,
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        title: b.entry.title,
        url: b.url,
        bookmarkedAt: b.bookmarkedAt,
        tags: b.tags.map((t) => ({ id: t.id, label: t.label })),
        user: { id: b.user.id, name: b.user.name },
      })),
      retrievedContexts,
      model,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
