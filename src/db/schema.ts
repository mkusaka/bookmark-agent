import { pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations, sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  hatenaId: text('hatena_id').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


// Bookmarks table
export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  comment: text('comment').notNull(),
  description: text('description').notNull(),
  url: text('url').notNull(),
  domain: text('domain').notNull(),
  bookmarkedAt: timestamp('bookmarked_at').notNull(),
  bookmarkUrl: text('bookmark_url').notNull(),
  markdownContent: text('markdown_content'),
  markdownFetchedAt: timestamp('markdown_fetched_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  // Fields migrated from entries table
  title: text('title').notNull(),
  canonicalUrl: text('canonical_url').notNull(),
  rootUrl: text('root_url').notNull(),
  summary: text('summary').notNull(),
  normalizedDomain: text('normalized_domain').notNull(),
}, (table) => [
  index('bookmarks_user_idx').on(table.userId),
  index('bookmarks_bookmarked_at_idx').on(table.bookmarkedAt),
  index('bookmarks_comment_trgm_idx').using('gin', sql`${table.comment} gin_trgm_ops`),
  index('bookmarks_description_trgm_idx').using('gin', sql`${table.description} gin_trgm_ops`),
  uniqueIndex('bookmarks_user_url_unique').on(table.userId, table.url),
  // New indexes for migrated fields
  index('bookmarks_normalized_domain_idx').on(table.normalizedDomain),
  index('bookmarks_title_trgm_idx').using('gin', sql`${table.title} gin_trgm_ops`),
  index('bookmarks_summary_trgm_idx').using('gin', sql`${table.summary} gin_trgm_ops`),
  // Performance optimization indexes
  index('bookmarks_url_trgm_idx').using('gin', sql`${table.url} gin_trgm_ops`),
  index('bookmarks_markdown_content_trgm_idx').using('gin', sql`${table.markdownContent} gin_trgm_ops`),
  index('bookmarks_title_idx').on(table.title),
  index('bookmarks_user_bookmarked_at_idx').on(table.userId, table.bookmarkedAt.desc()),
  index('bookmarks_bookmarked_at_brin_idx').using('brin', table.bookmarkedAt),
]);

// Tags table
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: text('label').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('tags_label_idx').on(table.label),
]);

// Bookmark-Tags join table
export const bookmarkTags = pgTable('bookmark_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookmarkId: uuid('bookmark_id').notNull().references(() => bookmarks.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('bookmark_tags_bookmark_idx').on(table.bookmarkId),
  index('bookmark_tags_tag_idx').on(table.tagId),
  index('bookmark_tags_user_idx').on(table.userId),
  uniqueIndex('bookmark_tags_unique').on(table.bookmarkId, table.tagId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookmarks: many(bookmarks),
  bookmarkTags: many(bookmarkTags),
}));


export const bookmarksRelations = relations(bookmarks, ({ one, many }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  bookmarkTags: many(bookmarkTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  bookmarkTags: many(bookmarkTags),
}));

export const bookmarkTagsRelations = relations(bookmarkTags, ({ one }) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkTags.bookmarkId],
    references: [bookmarks.id],
  }),
  tag: one(tags, {
    fields: [bookmarkTags.tagId],
    references: [tags.id],
  }),
  user: one(users, {
    fields: [bookmarkTags.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);


export const insertBookmarkSchema = createInsertSchema(bookmarks);
export const selectBookmarkSchema = createSelectSchema(bookmarks);

export const insertTagSchema = createInsertSchema(tags);
export const selectTagSchema = createSelectSchema(tags);

export const insertBookmarkTagSchema = createInsertSchema(bookmarkTags);
export const selectBookmarkTagSchema = createSelectSchema(bookmarkTags);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;


export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type BookmarkTag = typeof bookmarkTags.$inferSelect;
export type NewBookmarkTag = typeof bookmarkTags.$inferInsert;
