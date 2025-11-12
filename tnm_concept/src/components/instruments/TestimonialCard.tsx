import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { SPACING } from "@/styles/spacing";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  rating: number;
}

export function TestimonialCard({ quote, author, role, rating }: TestimonialCardProps) {
  return (
    <Card className="h-full">
      <CardContent className={`${SPACING.padding.card} ${SPACING.stack.comfortable}`}>
        <div className={`flex items-center ${SPACING.gap.iconButton}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`${SPACING.icon.sm} ${
                i < rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'
              }`}
            />
          ))}
        </div>
        
        <div className="relative">
          <Quote className={`${SPACING.icon.lg} text-primary/20 absolute -top-2 -left-1`} />
          <p className="text-sm text-muted-foreground italic pl-6 leading-relaxed">
            {quote}
          </p>
        </div>
        
        <div className="pt-2 border-t">
          <div className="font-medium text-sm">{author}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </CardContent>
    </Card>
  );
}