import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GeminiDocument } from '@/app/actions/gemini-store-actions';

interface GeminiStoreDocumentListProps {
  documents: GeminiDocument[];
}

export function GeminiStoreDocumentList({
  documents,
}: GeminiStoreDocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No documents in the File Store
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        {documents.length} documents
      </div>
      <div className="grid gap-4">
        {documents.map((doc) => (
          <Card key={doc.name}>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                {doc.displayName || '(no name)'}
              </CardTitle>
              <CardDescription className="font-mono text-xs break-all">
                {doc.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {doc.mimeType && <Badge variant="outline">{doc.mimeType}</Badge>}
                {doc.createTime && (
                  <span>
                    Created: {new Date(doc.createTime).toLocaleString('ja-JP')}
                  </span>
                )}
              </div>
              {doc.customMetadata.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Custom Metadata
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    {doc.customMetadata.map((meta) => (
                      <div key={meta.key} className="contents">
                        <dt className="font-medium text-muted-foreground">
                          {meta.key}
                        </dt>
                        <dd className="break-all">
                          {formatMetadataValue(meta.value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatMetadataValue(
  value: string | number | string[] | null
): string {
  if (value === null) return '(null)';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
