'use client';

import Link from 'next/link';

export function BookmarkSearchHeader() {
  return (
    <h2 className="text-2xl font-semibold tracking-tight">
      <Link href="/search" className="hover:underline cursor-pointer">
        Bookmark Search
      </Link>
    </h2>
  );
}