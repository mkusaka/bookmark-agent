export function normalizeDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Build normalized domain: protocol + hostname + port (if non-standard)
    let normalized = `${urlObj.protocol}//${urlObj.hostname}`;
    
    // Add port if it's non-standard
    if (urlObj.port && 
        !((urlObj.protocol === 'http:' && urlObj.port === '80') ||
          (urlObj.protocol === 'https:' && urlObj.port === '443'))) {
      normalized += `:${urlObj.port}`;
    }
    
    return normalized;
  } catch (error) {
    // If URL parsing fails, return the original string
    console.error('Failed to normalize domain:', error);
    return url;
  }
}

// Helper function to extract domain name only (for backwards compatibility)
export function extractDomainName(url: string): string {
  try {
    return new URL(url).hostname;
  } catch (error) {
    console.error('Failed to extract domain:', error);
    return url;
  }
}