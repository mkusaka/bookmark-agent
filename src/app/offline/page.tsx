import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="relative">
        <WifiOff className="size-16 text-muted-foreground" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold">オフラインです</h1>
      <p className="mt-2 text-center text-muted-foreground">
        インターネット接続がありません。
        <br />
        接続が回復したら、自動的にリロードされます。
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        キャッシュされたコンテンツは引き続き利用可能です
      </p>
    </div>
  );
}