'use client';

interface BookmarkTitleProps {
  title?: string;
  url: string;
}

export function BookmarkTitle({ title, url }: BookmarkTitleProps) {
  const displayText = title || url;
  
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary hover:underline block break-words whitespace-normal"
    >
      {displayText}
    </a>
  );
}