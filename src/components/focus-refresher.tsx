'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function FocusRefresher() {
  const router = useRouter();
  const lastRefreshTime = useRef<number>(Date.now());
  const minimumInterval = 5000; // 5秒以内の連続リフレッシュを防ぐ

  useEffect(() => {
    const handleRefresh = () => {
      const now = Date.now();
      // 連続したリフレッシュを防ぐため、最小間隔をチェック
      if (now - lastRefreshTime.current > minimumInterval) {
        router.refresh();
        lastRefreshTime.current = now;
        console.log('Page refreshed due to focus/visibility change');
      }
    };

    const handleFocus = () => {
      handleRefresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefresh();
      }
    };

    // window にフォーカスが戻ってきたとき
    window.addEventListener('focus', handleFocus);

    // タブの可視性が戻ったとき（バックグラウンド → フォアグラウンド）
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  return null;
}