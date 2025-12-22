import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Beaker, Clock, Bookmark, ChevronRight } from 'lucide-react';
import type { AiSessionWithBookmarks } from '@/types/ai-session';

interface AiSessionCardProps {
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

export function AiSessionCard({ session }: AiSessionCardProps) {
  const TypeIcon = session.type === 'ask' ? MessageSquare : Beaker;
  const typeLabel = session.type === 'ask' ? 'Ask' : 'Deep Research';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Badge variant="outline" className="shrink-0">{typeLabel}</Badge>
            <Badge variant={getStatusBadgeVariant(session.status)} className="shrink-0">
              {getStatusLabel(session.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true, locale: ja })}
          </div>
        </div>
        <CardTitle className="text-base line-clamp-2 mt-2">{session.question}</CardTitle>
        {session.modelName && (
          <CardDescription className="text-xs">{session.modelName}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {session.responseText && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {session.responseText.slice(0, 200)}
            {session.responseText.length > 200 && '...'}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {session.relatedBookmarks.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Bookmark className="h-3 w-3" />
                {session.relatedBookmarks.length}
              </span>
            )}
            {session.processingTimeMs && (
              <span className="text-xs text-muted-foreground">
                {(session.processingTimeMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <Link href={`/ai/session/${session.id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              View
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
