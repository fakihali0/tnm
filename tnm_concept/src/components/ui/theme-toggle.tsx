import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToggleSize = "sm" | "mobile";

interface ThemeToggleProps {
  size?: ToggleSize;
  className?: string;
}

export function ThemeToggle({ size = "sm", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const isMobileSize = size === "mobile";

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "px-0 flex-shrink-0",
        isMobileSize ? "h-11 w-11 min-h-[44px] min-w-[44px] touch-target p-0" : "h-9 w-9",
        className,
      )}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}