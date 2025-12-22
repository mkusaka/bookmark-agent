'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/markdown-renderer';

type DeepResearchStartResponse = {
  id: string;
  sessionId: string;
  status: string;
};

type DeepResearchGetResponse = {
  id: string;
  sessionId?: string;
  status: string;
  outputs?: unknown[];
  latestText?: string;
  error?: unknown;
};

export function AiDeepResearch() {
  const searchParams = useSearchParams();
  const continueFromSession = searchParams.get('continue');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [latestText, setLatestText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pollTimer = useRef<number | null>(null);

  const isPolling = useMemo(
    () => interactionId !== null && status !== null && !['completed', 'failed', 'cancelled'].includes(status),
    [interactionId, status]
  );

  const canStart = useMemo(() => input.trim().length > 0 && !loading && !isPolling, [input, loading, isPolling]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, []);

  const pollOnce = useCallback(async function pollOnce(id: string, sid: string) {
    try {
      const res = await fetch(`/api/gemini/deep-research?id=${encodeURIComponent(id)}&sessionId=${encodeURIComponent(sid)}`);
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
    setSessionId(null);

    try {
      const res = await fetch('/api/gemini/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          parentSessionId: continueFromSession || undefined,
        }),
      });
      const json = (await res.json()) as DeepResearchStartResponse & { error?: string };
      if (!res.ok) throw new Error(json?.error ?? 'Request failed');

      setInteractionId(json.id);
      setSessionId(json.sessionId);
      setStatus(json.status);
      await pollOnce(json.id, json.sessionId);

      if (pollTimer.current) window.clearInterval(pollTimer.current);
      pollTimer.current = window.setInterval(() => pollOnce(json.id, json.sessionId), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [input, continueFromSession, pollOnce]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canStart) {
        e.preventDefault();
        start();
      }
    },
    [canStart, start]
  );

  const handleCopy = useCallback(async () => {
    if (!latestText) return;
    await navigator.clipboard.writeText(latestText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [latestText]);

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
            {(loading || isPolling) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Starting…' : isPolling ? 'Researching…' : 'Start Deep Research'}
          </Button>
          <span className="text-xs text-muted-foreground">⌘+Enter で送信</span>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
        {interactionId && (
          <div className="text-xs text-muted-foreground break-all flex items-center gap-2">
            <span>Interaction: {interactionId} {status ? `(${status})` : ''}</span>
            {sessionId && (
              <Link
                href={`/ai/session/${sessionId}`}
                className="text-primary hover:underline flex items-center gap-1"
              >
                View session
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </Card>

      {continueFromSession && (
        <Card className="p-2 px-4 text-sm text-muted-foreground flex items-center gap-2">
          <span>Continuing from session:</span>
          <Link href={`/ai/session/${continueFromSession}`} className="text-primary hover:underline flex items-center gap-1">
            {continueFromSession.slice(0, 8)}...
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Card>
      )}

      {latestText && (
        <Card className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">結果（最新）</div>
            {status === 'completed' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopy}
                title="結果をコピー"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <MarkdownRenderer content={latestText} />
        </Card>
      )}
    </div>
  );
}

