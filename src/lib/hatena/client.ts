import { HatenaBookmarkResponse } from './types';

export class HatenaBookmarkClient {
  private baseUrl = 'https://b.hatena.ne.jp/api/users';

  async fetchUserBookmarks(
    username: string,
    page?: number
  ): Promise<HatenaBookmarkResponse> {
    const url = page 
      ? `${this.baseUrl}/${username}/bookmarks?page=${page}`
      : `${this.baseUrl}/${username}/bookmarks`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkAgent/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
    }

    return response.json();
  }

  async fetchAllUserBookmarks(
    username: string,
    maxPages: number = 10
  ): Promise<HatenaBookmarkResponse[]> {
    const results: HatenaBookmarkResponse[] = [];
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage && currentPage <= maxPages) {
      try {
        const response = await this.fetchUserBookmarks(username, currentPage === 1 ? undefined : currentPage);
        results.push(response);

        // Check if there's a next page
        hasNextPage = !!response.pager.next;
        currentPage++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error);
        break;
      }
    }

    return results;
  }
}