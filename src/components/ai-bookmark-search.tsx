'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Bookmark = {
  id: string;
  title: string;
  url: string;
  bookmarkedAt: string;
  tags: Array<{ id: string; label: string }>;
  user: { id: string; name: string };
};

type StreamEvent =
  | { type: 'text'; content: string }
  | { type: 'done'; model: string; bookmarkIds: string[]; bookmarks: Bookmark[] }
  | { type: 'error'; error: string };

export function AiBookmarkSearch() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [model, setModel] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const canSubmit = useMemo(() => question.trim().length > 0 && !loading, [question, loading]);

  const onAsk = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnswer('');
    setModel(null);
    setBookmarks([]);

    try {
      const res = await fetch('/api/gemini/ask-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? 'Request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          if (!jsonStr) continue;

          try {
            const event: StreamEvent = JSON.parse(jsonStr);

            if (event.type === 'text') {
              setAnswer((prev) => prev + event.content);
            } else if (event.type === 'done') {
              setModel(event.model);
              setBookmarks(event.bookmarks);
            } else if (event.type === 'error') {
              setError(event.error);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [question]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
        e.preventDefault();
        onAsk();
      }
    },
    [canSubmit, onAsk]
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 flex flex-col gap-3">
        <label className="text-sm font-medium">質問</label>
        <textarea
          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例: 自分が保存した「Next.js 15 のキャッシュ」関連のブックマークを探して要点をまとめて"
        />
        <div className="flex items-center gap-2">
          <Button onClick={onAsk} disabled={!canSubmit}>
            {loading ? 'Searching…' : 'Ask'}
          </Button>
          <span className="text-xs text-muted-foreground">⌘+Enter で送信</span>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </Card>

      {(answer || loading) && (
        <Card className="p-4 flex flex-col gap-2">
          {model && <div className="text-sm text-muted-foreground">Model: {model}</div>}
          <div className="whitespace-pre-wrap text-sm">
            {answer}
            {loading && <span className="animate-pulse">▌</span>}
          </div>
        </Card>
      )}

      {bookmarks.length > 0 && (
        <Card className="p-4">
          <div className="text-sm font-medium mb-3">関連ブックマーク ({bookmarks.length})</div>
          <div className="flex flex-col gap-3">
            {bookmarks.map((b) => (
              <div key={b.id} className="flex flex-col gap-1">
                <div className="font-medium text-sm">
                  <Link href={`/bookmarks/${b.id}`} className="hover:underline">
                    {b.title}
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground break-all">{b.url}</div>
                <div className="text-xs text-muted-foreground">
                  {b.user.name} ・ {new Date(b.bookmarkedAt).toLocaleString()}
                  {b.tags.length ? ` ・ ${b.tags.map((t) => t.label).join(', ')}` : ''}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
