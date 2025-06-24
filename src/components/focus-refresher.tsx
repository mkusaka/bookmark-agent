'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationPending } from '@/contexts/navigation-context';

export function FocusRefresher() {
  const router = useRouter();
  const { setIsPending } = useNavigationPending();
  const lastRefreshTime = useRef<number>(Date.now());
  const minimumInterval = 5000; // 5秒以内の連続リフレッシュを防ぐ

  useEffect(() => {
    const handleRefresh = async () => {
      const now = Date.now();
      // 連続したリフレッシュを防ぐため、最小間隔をチェック
      if (now - lastRefreshTime.current > minimumInterval) {
        setIsPending(true);
        router.refresh();
        lastRefreshTime.current = now;
        console.log('Page refreshed due to focus/visibility change');
        
        // Give some time for the refresh to complete
        setTimeout(() => {
          setIsPending(false);
        }, 1000);
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
  }, [router, setIsPending]);

  return null;
}