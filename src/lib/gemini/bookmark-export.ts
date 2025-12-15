import { and, desc, eq, inArray, lte, or } from 'drizzle-orm';
import { db } from '@/db';
import { bookmarks, bookmarkTags, tags, users } from '@/db/schema';

export type BookmarkIndexItem = {
  id: string;
  title: string;
  url: string;
  normalizedDomain: string;
  bookmarkedAt: Date;
  userName: string;
  tagLabels: string[];
  comment: string;
  description: string;
  summary: string;
  markdownContent: string | null;
};

export type BookmarkIndexCursor = `${string}_${string}`;

export async function fetchBookmarkIndexBatch(options: {
  limit: number;
  cursor?: BookmarkIndexCursor;
}): Promise<{ items: BookmarkIndexItem[]; nextCursor?: BookmarkIndexCursor }> {
  const { limit, cursor } = options;

  let cursorCondition;
  if (cursor) {
    const [bookmarkedAt, id] = cursor.split('_');
    cursorCondition = or(
      lte(bookmarks.bookmarkedAt, new Date(bookmarkedAt)),
      and(eq(bookmarks.bookmarkedAt, new Date(bookmarkedAt)), lte(bookmarks.id, id))
    );
  }

  const results = await db
    .select({
      bookmark: bookmarks,
      user: users,
    })
    .from(bookmarks)
    .leftJoin(users, eq(bookmarks.userId, users.id))
    .where(cursorCondition ? and(cursorCondition) : undefined)
    .orderBy(desc(bookmarks.bookmarkedAt), desc(bookmarks.id))
    .limit(limit + 1);

  const hasNextPage = results.length > limit;
  const page = hasNextPage ? results.slice(0, limit) : results;

  const pageBookmarkIds = page.map((r) => r.bookmark.id);
  const bookmarkTagsData =
    pageBookmarkIds.length === 0
      ? []
      : await db
          .select({
            bookmarkId: bookmarkTags.bookmarkId,
            tag: tags,
          })
          .from(bookmarkTags)
          .leftJoin(tags, eq(bookmarkTags.tagId, tags.id))
          .where(inArray(bookmarkTags.bookmarkId, pageBookmarkIds));

  const tagsByBookmark = bookmarkTagsData.reduce(
    (acc, row) => {
      if (!acc[row.bookmarkId]) acc[row.bookmarkId] = [];
      if (row.tag?.label) acc[row.bookmarkId].push(row.tag.label);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const items: BookmarkIndexItem[] = page.map(({ bookmark, user }) => ({
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    normalizedDomain: bookmark.normalizedDomain,
    bookmarkedAt: bookmark.bookmarkedAt,
    userName: user?.name ?? '',
    tagLabels: tagsByBookmark[bookmark.id] ?? [],
    comment: bookmark.comment,
    description: bookmark.description,
    summary: bookmark.summary,
    markdownContent: bookmark.markdownContent ?? null,
  }));

  let nextCursor: BookmarkIndexCursor | undefined;
  if (hasNextPage && items.length > 0) {
    const last = items[items.length - 1];
    nextCursor = `${last.bookmarkedAt.toISOString()}_${last.id}`;
  }

  return { items, nextCursor };
}

export function renderBookmarksAsMarkdown(
  items: BookmarkIndexItem[],
  options?: {
    maxMarkdownCharsPerBookmark?: number;
  }
): string {
  const maxMarkdownCharsPerBookmark = options?.maxMarkdownCharsPerBookmark ?? 8000;

  const lines: string[] = [];
  lines.push('# Bookmark Index');
  lines.push('');
  lines.push(
    'このファイルはブックマーク検索用のインデックスです。各ブックマークは `ID:` と `URL:` を含みます。'
  );
  lines.push('');

  for (const b of items) {
    lines.push(`## ${b.title}`);
    lines.push(`ID: ${b.id}`);
    lines.push(`URL: ${b.url}`);
    lines.push(`Domain: ${b.normalizedDomain}`);
    lines.push(`BookmarkedAt: ${b.bookmarkedAt.toISOString()}`);
    if (b.userName) lines.push(`User: ${b.userName}`);
    if (b.tagLabels.length > 0) lines.push(`Tags: ${b.tagLabels.join(', ')}`);
    lines.push('');

    if (b.comment?.trim()) {
      lines.push('Comment:');
      lines.push(b.comment.trim());
      lines.push('');
    }

    if (b.description?.trim()) {
      lines.push('Description:');
      lines.push(b.description.trim());
      lines.push('');
    }

    if (b.summary?.trim()) {
      lines.push('Summary:');
      lines.push(b.summary.trim());
      lines.push('');
    }

    if (b.markdownContent?.trim()) {
      const md = b.markdownContent.trim();
      lines.push('Content:');
      lines.push(md.length > maxMarkdownCharsPerBookmark ? `${md.slice(0, maxMarkdownCharsPerBookmark)}\n...(truncated)` : md);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function splitTextByByteSize(text: string, maxBytes: number): string[] {
  const parts: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(text.length, start + Math.max(1024, Math.floor(maxBytes / 2)));
    while (end < text.length && Buffer.byteLength(text.slice(start, end), 'utf8') < maxBytes) {
      const next = Math.min(text.length, end + 8192);
      if (next === end) break;
      const candidate = text.slice(start, next);
      if (Buffer.byteLength(candidate, 'utf8') > maxBytes) break;
      end = next;
    }

    // Try to split on a section boundary for stability.
    const window = text.slice(start, end);
    const lastSep = window.lastIndexOf('\n## ');
    if (lastSep > 0) end = start + lastSep;

    parts.push(text.slice(start, end).trimEnd() + '\n');
    start = end;
  }

  return parts.filter((p) => p.trim().length > 0);
}
