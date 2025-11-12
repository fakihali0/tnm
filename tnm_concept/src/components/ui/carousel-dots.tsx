import * as React from "react";
import { cn } from "@/lib/utils";
import { useCarousel } from "./carousel";

const CarouselDots = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    totalSlides: number;
  }
>(({ className, totalSlides, ...props }, ref) => {
  const { api } = useCarousel();
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const scrollTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  return (
    <div
      ref={ref}
      className={cn("flex justify-center gap-2 mt-4", className)}
      {...props}
    >
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          onClick={() => scrollTo(index)}
          className={cn(
            "group relative flex items-center justify-center rounded-full touch-target touch-feedback no-tap-highlight",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          aria-label={`Go to slide ${index + 1}`}
          aria-current={selectedIndex === index ? "true" : undefined}
          type="button"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-200",
              selectedIndex === index
                ? "scale-125 bg-primary"
                : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50 group-focus-visible:bg-muted-foreground/50"
            )}
          />
        </button>
      ))}
    </div>
  );
});
CarouselDots.displayName = "CarouselDots";

export { CarouselDots };