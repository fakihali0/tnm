import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { getScrollBehavior } from "@/utils/scroll";
import { SPACING } from "@/styles/spacing";

interface StickySubNavProps {
  sections: Array<{ id: string; label: string }>;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export function StickySubNav({ sections, activeSection, onNavigate }: StickySubNavProps) {
  const { t } = useTranslation(['common','translation']);
  const [isSticky, setIsSticky] = useState(false);
  const rafRef = useRef<number>();
  const lastActiveRef = useRef(activeSection);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        setIsSticky(scrollTop > 200);
        
        // Update active section based on scroll position
        for (const section of sections) {
          const element = document.getElementById(section.id);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
              if (lastActiveRef.current !== section.id) {
                lastActiveRef.current = section.id;
                onNavigate(section.id);
              }
              break;
            }
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [sections, onNavigate]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 180; // Account for header + sub-nav + filter bar
      window.scrollTo({
        top: offsetTop,
        behavior: getScrollBehavior()
      });
    }
    lastActiveRef.current = sectionId;
    onNavigate(sectionId);
  };

  return (
    <div className={`
      sticky top-16 left-0 right-0 transition-shadow duration-200 z-30 bg-background/95 backdrop-blur border-b
      ${isSticky ? 'shadow-sm' : ''}
    `}>
      <div className="container">
        <div className={`flex items-center ${SPACING.gap.iconButton} py-3 overflow-x-auto`}>
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "ghost"}
              size="sm"
              onClick={() => scrollToSection(section.id)}
              className="whitespace-nowrap transition-colors"
            >
              {section.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}