import type { Bookmark } from './bookmark';

export type AiSessionType = 'ask' | 'deep-research';
export type AiSessionStatus = 'pending' | 'streaming' | 'completed' | 'failed' | 'cancelled';

export interface AiSession {
  id: string;
  type: AiSessionType;
  question: string;
  responseText: string | null;
  status: AiSessionStatus;
  modelName: string | null;
  externalInteractionId: string | null;
  processingTimeMs: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  parentSessionId: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiSessionWithBookmarks extends AiSession {
  relatedBookmarks: Bookmark[];
  conversationHistory?: Array<{
    id: string;
    question: string;
    createdAt: Date;
  }>;
}

export interface AiSessionFilters {
  type?: AiSessionType;
  status?: AiSessionStatus[];
  searchQuery?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export interface AiSessionSort {
  field: 'createdAt';
  order: 'asc' | 'desc';
}

export interface AiSessionPaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
}
