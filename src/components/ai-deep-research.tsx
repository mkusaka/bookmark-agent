'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type DeepResearchStartResponse = {
  id: string;
  status: string;
};

type DeepResearchGetResponse = {
  id: string;
  status: string;
  outputs?: unknown[];
  latestText?: string;
  error?: unknown;
};

export function AiDeepResearch() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [latestText, setLatestText] = useState<string | null>(null);

  const pollTimer = useRef<number | null>(null);

  const canStart = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, []);

  const pollOnce = useCallback(async function pollOnce(id: string) {
    try {
      const res = await fetch(`/api/gemini/deep-research?id=${encodeURIComponent(id)}`);
      const json = (await res.json()) as DeepResearchGetResponse & { error?: string };
      if (!res.ok) throw new Error(json?.error ?? 'Polling failed');

      setStatus(json.status);
      if (typeof json.latestText === 'string') setLatestText(json.latestText);

      if (json.status === 'completed' || json.status === 'failed' || json.status === 'cancelled') {
        if (pollTimer.current) window.clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      if (pollTimer.current) window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLatestText(null);
    setStatus(null);
    setInteractionId(null);

    try {
      const res = await fetch('/api/gemini/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const json = (await res.json()) as DeepResearchStartResponse & { error?: string };
      if (!res.ok) throw new Error(json?.error ?? 'Request failed');

      setInteractionId(json.id);
      setStatus(json.status);
      await pollOnce(json.id);

      if (pollTimer.current) window.clearInterval(pollTimer.current);
      pollTimer.current = window.setInterval(() => pollOnce(json.id), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [input, pollOnce]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canStart) {
        e.preventDefault();
        start();
      }
    },
    [canStart, start]
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 flex flex-col gap-3">
        <label className="text-sm font-medium">調査テーマ</label>
        <textarea
          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例: 自分のブックマークも参照しつつ、Next.js 15のキャッシュ戦略の要点を比較検討してレポートにして"
        />
        <div className="flex items-center gap-2">
          <Button onClick={start} disabled={!canStart}>
            {loading ? 'Starting…' : 'Start Deep Research'}
          </Button>
          <span className="text-xs text-muted-foreground">⌘+Enter で送信</span>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
        {interactionId && (
          <div className="text-xs text-muted-foreground break-all">
            Interaction: {interactionId} {status ? `(${status})` : ''}
          </div>
        )}
      </Card>

      {latestText && (
        <Card className="p-4 flex flex-col gap-2">
          <div className="text-sm font-medium">結果（最新）</div>
          <div className="whitespace-pre-wrap text-sm">{latestText}</div>
        </Card>
      )}
    </div>
  );
}

