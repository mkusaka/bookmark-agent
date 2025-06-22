export interface HatenaBookmarkResponse {
  pager: Pager;
  item: Item;
}

export interface Pager {
  next?: Next;
  pages: Page[];
}

export interface Next {
  label: string;
  xhr_path: string;
  page_path: string;
}

export interface Page {
  label: string;
  page_path?: string;
}

export interface Item {
  bookmarks: HatenaBookmark[];
}

export interface HatenaBookmark {
  comment: string;
  location_id: string;
  should_nofollow: string;
  created: string;
  comment_expanded: string;
  status: string;
  entry: Entry;
  user: HatenaUser;
  url: string;
  tags: string[];
}

export interface Entry {
  image?: string;
  category: Category;
  total_bookmarks_with_user_postfix: string;
  title: string;
  total_bookmarks: number;
  total_comments: number;
  summary: string;
  public_attributes: Record<string, unknown>;
  created_at: string;
  popular_tags: string[];
  root_url: string;
  summary_with_keyword_links: string;
  canonical_url: string;
}

export interface Category {
  title: string;
  path: string;
  top_page_path: string;
}

export interface HatenaUser {
  country: string;
  lang: string;
  name: string;
  status: number;
  image: UserImage;
  tz: string;
}

export interface UserImage {
  large_thumbnail_url: string;
  image_url: string;
  small_thumbnail_url: string;
}