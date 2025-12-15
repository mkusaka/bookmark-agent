import { createHash } from 'crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  bookmarkTags,
  bookmarks,
  tags,
  users,
} from '@/db/schema';
import { createGeminiClient } from '@/lib/gemini/client';

function sha256(text: string) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function renderBookmarkMarkdown(input: {
  id: string;
  url: string;
  title: string;
  normalizedDomain: string;
  bookmarkedAt: Date;
  userName: string;
  tagLabels: string[];
  comment: string;
  description: string;
  summary: string;
  markdownContent: string | null;
}): string {
  const maxMarkdownChars = 15_000;

  const lines: string[] = [];
  lines.push(`# ${input.title}`);
  lines.push(`ID: ${input.id}`);
  lines.push(`URL: ${input.url}`);
  lines.push(`Domain: ${input.normalizedDomain}`);
  lines.push(`BookmarkedAt: ${input.bookmarkedAt.toISOString()}`);
  if (input.userName) lines.push(`User: ${input.userName}`);
  if (input.tagLabels.length > 0) lines.push(`Tags: ${input.tagLabels.join(', ')}`);
  lines.push('');

  if (input.comment?.trim()) {
    lines.push('Comment:');
    lines.push(input.comment.trim());
    lines.push('');
  }

  if (input.description?.trim()) {
    lines.push('Description:');
    lines.push(input.description.trim());
    lines.push('');
  }

  if (input.summary?.trim()) {
    lines.push('Summary:');
    lines.push(input.summary.trim());
    lines.push('');
  }

  if (input.markdownContent?.trim()) {
    const md = input.markdownContent.trim();
    lines.push('Content:');
    lines.push(md.length > maxMarkdownChars ? `${md.slice(0, maxMarkdownChars)}\n...(truncated)` : md);
    lines.push('');
  }

  return lines.join('\n');
}

async function waitForOperation(ai: any, operation: any) {
  let op = operation;
  while (!op?.done) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    op = await ai.operations.get({ operation: op });
  }
  if (op?.error) {
    throw new Error(op.error?.message ?? 'Gemini File Search operation failed');
  }
  return op;
}

export async function syncBookmarkToGeminiFileSearchStore(bookmarkId: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  const fileSearchStoreName = process.env.GEMINI_FILE_SEARCH_STORE_NAME;
  if (!apiKey || !fileSearchStoreName) {
    throw new Error('GEMINI_API_KEY and GEMINI_FILE_SEARCH_STORE_NAME are required');
  }

  const rows = await db
    .select({
      bookmark: bookmarks,
      user: users,
    })
    .from(bookmarks)
    .innerJoin(users, eq(bookmarks.userId, users.id))
    .where(eq(bookmarks.id, bookmarkId))
    .limit(1);

  if (rows.length === 0) {
    return { ok: false as const, skipped: true as const, reason: 'Bookmark not found' };
  }

  const { bookmark, user } = rows[0];

  const tagRows = await db
    .select({ label: tags.label })
    .from(bookmarkTags)
    .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
    .where(and(eq(bookmarkTags.bookmarkId, bookmarkId), eq(bookmarkTags.userId, user.id)));

  const markdown = renderBookmarkMarkdown({
    id: bookmark.id,
    url: bookmark.url,
    title: bookmark.title,
    normalizedDomain: bookmark.normalizedDomain,
    bookmarkedAt: bookmark.bookmarkedAt,
    userName: user.name,
    tagLabels: tagRows.map((t) => t.label),
    comment: bookmark.comment,
    description: bookmark.description,
    summary: bookmark.summary,
    markdownContent: bookmark.markdownContent ?? null,
  });
  const contentHash = sha256(markdown);

  if (
    bookmark.geminiContentHash === contentHash &&
    bookmark.geminiFileSearchStoreName === fileSearchStoreName
  ) {
    return { ok: true as const, skipped: true as const, reason: 'No content change' };
  }

  const ai = createGeminiClient();

  if (bookmark.geminiDocumentName) {
    try {
      await ai.fileSearchStores.documents.delete({
        name: bookmark.geminiDocumentName,
        config: { force: true },
      });
    } catch {
      // Ignore delete errors (document may already be gone).
    }
  }

  const displayName = `bookmark-${bookmark.id}.md`;
  const operation = await ai.fileSearchStores.uploadToFileSearchStore({
    fileSearchStoreName,
    file: new Blob([markdown], { type: 'text/markdown' }),
    config: {
      displayName,
      mimeType: 'text/markdown',
      customMetadata: [
        { key: 'bookmarkId', stringValue: bookmark.id },
        { key: 'url', stringValue: bookmark.url },
        { key: 'userId', stringValue: user.id },
        { key: 'normalizedDomain', stringValue: bookmark.normalizedDomain },
      ],
    },
  });

  const done = await waitForOperation(ai, operation);
  const documentName = done?.response?.documentName;
  if (!documentName || typeof documentName !== 'string') {
    throw new Error('Gemini upload completed but documentName was not returned');
  }

  await db
    .update(bookmarks)
    .set({
      geminiDocumentName: documentName,
      geminiFileSearchStoreName: fileSearchStoreName,
      geminiContentHash: contentHash,
      geminiIndexedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookmarks.id, bookmark.id));

  return { ok: true as const, skipped: false as const, documentName };
}

export async function deleteGeminiDocumentsForBookmarks(bookmarkIds: string[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  const fileSearchStoreName = process.env.GEMINI_FILE_SEARCH_STORE_NAME;
  if (!apiKey || !fileSearchStoreName) {
    throw new Error('GEMINI_API_KEY and GEMINI_FILE_SEARCH_STORE_NAME are required');
  }
  if (bookmarkIds.length === 0) return { ok: true as const, deleted: 0 };

  const docs = await db
    .select({ id: bookmarks.id, documentName: bookmarks.geminiDocumentName })
    .from(bookmarks)
    .where(inArray(bookmarks.id, bookmarkIds));

  const ai = createGeminiClient();
  let deleted = 0;

  for (const doc of docs) {
    if (!doc.documentName) continue;
    try {
      await ai.fileSearchStores.documents.delete({ name: doc.documentName, config: { force: true } });
    } catch {
      // ignore
    }
    await db
      .update(bookmarks)
      .set({
        geminiDocumentName: null,
        geminiFileSearchStoreName: null,
        geminiContentHash: null,
        geminiIndexedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(bookmarks.id, doc.id));
    deleted += 1;
  }

  return { ok: true as const, deleted };
}
