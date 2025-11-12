import React, { Suspense } from 'react';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

// Lazy load markdown renderer to reduce initial bundle (~41KB savings)
const ReactMarkdown = React.lazy(() => import('react-markdown'));

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <Suspense fallback={
      <div className={cn(
        "prose prose-sm dark:prose-invert max-w-none animate-pulse",
        className
      )}>
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-full mb-2"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    }>
      <div className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:text-foreground",
        "prose-h1:text-xl prose-h1:mb-2 prose-h1:mt-0",
        "prose-h2:text-lg prose-h2:mb-2 prose-h2:mt-0",
        "prose-h3:text-base prose-h3:mb-1 prose-h3:mt-0",
        "prose-p:text-sm prose-p:leading-relaxed prose-p:my-2",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-em:text-foreground",
        "prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4",
        "prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4",
        "prose-li:text-sm prose-li:my-0.5",
        "prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded-lg prose-pre:my-2",
        "prose-blockquote:border-l-primary prose-blockquote:italic prose-blockquote:pl-4 prose-blockquote:my-2",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-table:text-sm prose-table:my-2",
        "prose-th:bg-muted prose-th:p-2 prose-th:font-semibold",
        "prose-td:p-2 prose-td:border prose-td:border-border",
        className
      )}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </Suspense>
  );
}
