interface CloudflareMarkdownResponse {
  result: string;
  success: boolean;
  errors?: Array<{ message: string }>;
}

export async function fetchMarkdownFromCloudflare(url: string): Promise<string | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
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
      return null;
    }

    const data: CloudflareMarkdownResponse = await response.json();

    if (!data.success || !data.result) {
      return null;
    }

    return data.result;
  } catch {
    return null;
  }
}
