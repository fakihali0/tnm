import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getScrollBehavior } from "@/utils/scroll";

const navItems = [
  { id: "overview", label: "Overview" },
  { id: "deposit", label: "Deposit" },
  { id: "withdrawal", label: "Withdrawal" },
  { id: "fees", label: "Fees & Limits" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "faqs", label: "FAQs" }
];

export function StickySubNav() {
  const [activeSection, setActiveSection] = useState("overview");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = 600; // Approximate hero height
      setIsVisible(window.scrollY > heroHeight);

      // Update active section based on scroll position
      const sections = navItems.map(item => document.getElementById(item.id));
      const currentSection = sections.find(section => {
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 112; // Account for header (64px) + sub-nav (48px)
      window.scrollTo({
        top: offsetTop,
        behavior: getScrollBehavior()
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b">
      <div className="container">
        <nav className="flex items-center gap-1 py-2 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                activeSection === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}