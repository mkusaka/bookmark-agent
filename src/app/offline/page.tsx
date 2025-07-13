"use client";

import { WifiOff, RefreshCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-md space-y-8 text-center">
        {/* Animated Icon */}
        <div className="relative mx-auto size-24">
          <div className="absolute inset-0 animate-ping rounded-full bg-muted opacity-25" />
          <div className="relative flex h-full w-full items-center justify-center rounded-full bg-muted">
            <WifiOff className="size-12 text-muted-foreground" />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">オフラインです</h1>
          <p className="text-lg text-muted-foreground">
            インターネット接続が確認できません
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-lg border bg-card p-6 text-left shadow-sm">
          <h2 className="mb-3 font-semibold">現在の状況</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 flex-shrink-0 rounded-full bg-orange-500" />
              <span>ネットワーク接続が切断されています</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 flex-shrink-0 rounded-full bg-green-500" />
              <span>キャッシュされたページは引き続き閲覧可能です</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 flex-shrink-0 rounded-full bg-blue-500" />
              <span>接続が回復次第、自動的に同期されます</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="default"
            size="lg"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            ページを再読み込み
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            前のページに戻る
          </Button>
        </div>

        {/* Additional Help */}
        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <p className="font-medium">接続を確認するには：</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>• Wi-Fiまたはモバイルデータが有効か確認</li>
            <li>• 機内モードがオフになっているか確認</li>
            <li>• ルーターの再起動を試す</li>
          </ul>
        </div>

        {/* Home Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <Home className="size-4" />
          ホームに戻る（キャッシュ版）
        </Link>
      </div>
    </div>
  );
}