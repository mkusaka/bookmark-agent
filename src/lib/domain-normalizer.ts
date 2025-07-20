export function normalizeDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Build normalized domain: hostname + port (if non-standard) + first path segment
    let normalized = urlObj.hostname;
    
    // Add port if it's non-standard
    if (urlObj.port && 
        !((urlObj.protocol === 'http:' && urlObj.port === '80') ||
          (urlObj.protocol === 'https:' && urlObj.port === '443'))) {
      normalized += `:${urlObj.port}`;
    }
    
    // Add first path segment if exists (e.g., /username for github.com/username)
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
    if (pathSegments.length > 0) {
      normalized += `/${pathSegments[0]}`;
    }
    
    return normalized;
  } catch {
    // If URL parsing fails, return the original string
    // This is expected behavior for invalid URLs
    return url;
  }
}

// Helper function to extract domain name only (for backwards compatibility)
export function extractDomainName(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    // Return original URL if extraction fails
    return url;
  }
}