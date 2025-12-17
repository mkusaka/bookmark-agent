'use server';

import { createGeminiClient } from '@/lib/gemini/client';

export type GeminiDocument = {
  name: string;
  displayName: string | null;
  mimeType: string | null;
  createTime: string | null;
  customMetadata: {
    key: string;
    value: string | number | string[] | null;
  }[];
};

export type ListGeminiDocumentsResult =
  | {
      success: true;
      documents: GeminiDocument[];
      storeName: string;
      nextPageToken: string | null;
      pageSize: number;
    }
  | { success: false; error: string };

const PAGE_SIZE = 20;

export async function listGeminiStoreDocuments(
  pageToken?: string
): Promise<ListGeminiDocumentsResult> {
  const fileSearchStoreName = process.env.GEMINI_FILE_SEARCH_STORE_NAME;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!fileSearchStoreName || !apiKey) {
    return {
      success: false,
      error: 'GEMINI_API_KEY and GEMINI_FILE_SEARCH_STORE_NAME are required',
    };
  }

  try {
    const ai = createGeminiClient();

    const pager = await ai.fileSearchStores.documents.list({
      parent: fileSearchStoreName,
      config: {
        pageSize: PAGE_SIZE,
        ...(pageToken ? { pageToken } : {}),
      },
    });

    // Get the current page (getter, not a method)
    const currentPage = pager.page;
    const documents: GeminiDocument[] = [];

    for (const doc of currentPage) {
      const customMetadata: GeminiDocument['customMetadata'] = [];
      if (doc.customMetadata) {
        for (const meta of doc.customMetadata) {
          if (meta.key) {
            customMetadata.push({
              key: meta.key,
              value:
                meta.stringValue ??
                meta.numericValue ??
                meta.stringListValue?.values ??
                null,
            });
          }
        }
      }

      documents.push({
        name: doc.name ?? '',
        displayName: doc.displayName ?? null,
        mimeType: doc.mimeType ?? null,
        createTime: doc.createTime ?? null,
        customMetadata,
      });
    }

    // pager.params contains the pageToken for the NEXT page request
    // After the first page is loaded, params.config.pageToken is set for the next page
    const nextPageToken = pager.params.config?.pageToken ?? null;

    return {
      success: true,
      documents,
      storeName: fileSearchStoreName,
      nextPageToken,
      pageSize: PAGE_SIZE,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}
