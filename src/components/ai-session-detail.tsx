'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Beaker,
  Clock,
  Bookmark,
  Copy,
  Check,
  MessageCirclePlus,
  ExternalLink,
  History,
} from 'lucide-react';
import type { AiSessionWithBookmarks } from '@/types/ai-session';

interface AiSessionDetailProps {
  session: AiSessionWithBookmarks;
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'pending':
    case 'streaming':
      return 'secondary';
    case 'failed':
      return 'destructive';
    case 'cancelled':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'pending':
      return 'Pending';
    case 'streaming':
      return 'Streaming';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function AiSessionDetail({ session }: AiSessionDetailProps) {
  const [copied, setCopied] = useState(false);
  const TypeIcon = session.type === 'ask' ? MessageSquare : Beaker;
  const typeLabel = session.type === 'ask' ? 'Ask' : 'Deep Research';

  const handleCopy = async () => {
    if (session.responseText) {
      await navigator.clipboard.writeText(session.responseText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <TypeIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <Badge variant="outline">{typeLabel}</Badge>
                <Badge variant={getStatusBadgeVariant(session.status)}>
                  {getStatusLabel(session.status)}
                </Badge>
              </div>
              <CardTitle className="text-xl">{session.question}</CardTitle>
              <CardDescription className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(session.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                  ({formatDistanceToNow(new Date(session.createdAt), { addSuffix: true, locale: ja })})
                </span>
                {session.modelName && <span>Model: {session.modelName}</span>}
                {session.processingTimeMs && (
                  <span>{(session.processingTimeMs / 1000).toFixed(1)}s</span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/ai/${session.type === 'ask' ? 'ask' : 'deep-research'}?continue=${session.id}`}>
                <Button variant="outline" size="sm">
                  <MessageCirclePlus className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Conversation History */}
      {session.conversationHistory && session.conversationHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Conversation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.conversationHistory.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/ai/session/${item.id}`}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                  <span className="text-sm line-clamp-1 flex-1">{item.question}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ja })}
                  </span>
                </Link>
              ))}
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <span className="text-xs text-muted-foreground w-6">
                  {session.conversationHistory.length + 1}.
                </span>
                <span className="text-sm line-clamp-1 flex-1 font-medium">{session.question}</span>
                <Badge variant="secondary" className="text-xs">Current</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response */}
      {session.responseText && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Response</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {session.responseText}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {session.errorMessage && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{session.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Related Bookmarks */}
      {session.relatedBookmarks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Related Bookmarks ({session.relatedBookmarks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {session.relatedBookmarks.map((bookmark, index) => (
                <div key={bookmark.id}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline flex items-center gap-1 min-w-0"
                      >
                        <span className="line-clamp-1">{bookmark.entry.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">{bookmark.entry.domain}</p>
                    {bookmark.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {bookmark.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
