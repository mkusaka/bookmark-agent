import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createGeminiClient } from '@/lib/gemini/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DeepResearchStartSchema = z.object({
  input: z.string().trim().min(1),
});

const DeepResearchGetSchema = z.object({
  id: z.string().trim().min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = DeepResearchStartSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { input } = parsed.data;

    const agent = process.env.GEMINI_DEEP_RESEARCH_AGENT ?? 'models/deep-research-pro-preview-12-2025';
    const storeName = process.env.GEMINI_FILE_SEARCH_STORE_NAME;
    if (!storeName) {
      return NextResponse.json(
        { error: 'GEMINI_FILE_SEARCH_STORE_NAME is required (index your bookmarks first)' },
        { status: 400 }
      );
    }

    const ai = createGeminiClient();
    const interaction = await ai.interactions.create({
      input,
      agent,
      background: true,
      tools: [{ type: 'file_search', file_search_store_names: [storeName] }],
    });

    return NextResponse.json({ id: interaction.id, status: interaction.status ?? 'pending' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = DeepResearchGetSchema.safeParse({ id: url.searchParams.get('id') });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query params', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { id } = parsed.data;

    const ai = createGeminiClient();
    const interaction = await ai.interactions.get(id);

    const latestText = interaction.outputs
      ?.map((o) => (o && typeof o === 'object' && 'text' in o ? (o as any).text : undefined))
      .filter((t): t is string => typeof t === 'string' && t.length > 0)
      .at(-1);

    return NextResponse.json({
      id: interaction.id,
      status: interaction.status,
      outputs: interaction.outputs,
      latestText,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
