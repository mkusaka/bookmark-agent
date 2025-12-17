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
  // thinkingBudget: -1 = dynamic (default), 0 = disabled, 128-32768 = fixed budget
  thinkingBudget: z.coerce.number().int().min(-1).max(32768).optional(),
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
    // Default to dynamic thinking (-1) for 2.5 Pro's reasoning capabilities
    const thinkingBudget = parsed.data.thinkingBudget ?? -1;

    const prompt = `<role>
ユーザーの保存済みブックマークコーパスから情報を検索・要約するアシスタント
</role>

<task>
ファイル検索ツールを使用して関連ブックマークを検索し、その内容に基づいて質問に回答してください。
</task>

<constraints>
- 回答は日本語で行う
- ファイル検索で得られた情報のみを根拠として使用する
- 根拠となったブックマークのIDを必ず明記する（形式: ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）
- 複数のブックマークが関連する場合は、それぞれのIDを列挙する
- 検索結果が見つからない場合は、その旨を正直に伝える
</constraints>

<output_format>
1. 質問への回答（根拠に基づく要約・説明）
2. 参照したブックマーク一覧（各ブックマークのIDを行頭に記載）
</output_format>

<question>
${question}
</question>`;

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
        // Enable thinking for Gemini 2.5 Pro's enhanced reasoning
        ...(thinkingBudget !== 0 && {
          thinkingConfig: {
            thinkingBudget: thinkingBudget === -1 ? undefined : thinkingBudget,
          },
        }),
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
