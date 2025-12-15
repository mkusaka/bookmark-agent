'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type AskResponse = {
  answer: string;
  bookmarks: Array<{
    id: string;
    title: string;
    url: string;
    bookmarkedAt: string;
    tags: Array<{ id: string; label: string }>;
    user: { id: string; name: string };
  }>;
  model: string;
};

export function AiBookmarkSearch() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskResponse | null>(null);

  const canSubmit = useMemo(() => question.trim().length > 0 && !loading, [question, loading]);

  async function onAsk() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Request failed');
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 flex flex-col gap-3">
        <label className="text-sm font-medium">質問</label>
        <textarea
          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例: 自分が保存した「Next.js 15 のキャッシュ」関連のブックマークを探して要点をまとめて"
        />
        <div className="flex items-center gap-2">
          <Button onClick={onAsk} disabled={!canSubmit}>
            {loading ? 'Searching…' : 'Ask'}
          </Button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </Card>

      {result && (
        <div className="flex flex-col gap-4">
          <Card className="p-4 flex flex-col gap-2">
            <div className="text-sm text-muted-foreground">Model: {result.model}</div>
            <div className="whitespace-pre-wrap text-sm">{result.answer}</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium mb-3">
              関連ブックマーク ({result.bookmarks.length})
            </div>
            <div className="flex flex-col gap-3">
              {result.bookmarks.map((b) => (
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
        </div>
      )}
    </div>
  );
}

