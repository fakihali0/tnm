import { useAccessibilityTranslation } from "@/hooks/useTranslationValidation";

interface SkipToContentProps {
  targetId?: string;
}

export function SkipToContent({ targetId = "main-content" }: SkipToContentProps) {
  const { skipToContent } = useAccessibilityTranslation();

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 rounded-md z-[9999] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {skipToContent()}
    </a>
  );
}
