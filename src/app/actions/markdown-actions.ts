'use server';

interface CloudflareMarkdownResponse {
  result: string;
  success: boolean;
  errors?: Array<{ message: string }>;
}

export async function fetchMarkdownContent(url: string): Promise<string | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    console.error('Cloudflare credentials not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/markdown`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ url }),
      }
    );

    if (!response.ok) {
      console.error('Cloudflare API error:', response.status, response.statusText);
      return null;
    }

    const data: CloudflareMarkdownResponse = await response.json();

    if (!data.success || !data.result) {
      console.error('Cloudflare API returned error:', data.errors);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching markdown:', error);
    return null;
  }
}