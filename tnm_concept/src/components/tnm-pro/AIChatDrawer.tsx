import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { AIChatAssistant } from "./AIChatAssistant";
import { useIsMobile } from "@/hooks/use-mobile";

interface AIChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIChatDrawer({ open, onOpenChange }: AIChatDrawerProps) {
  const { t, i18n } = useTranslation("tnm-ai");
  const isMobile = useIsMobile();
  const isRTL = i18n.dir() === 'rtl';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isRTL ? "left" : "right"}
        className="w-full sm:w-[500px] p-0 flex flex-col overflow-hidden"
      >
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            {t('navigation.aiHub', 'AI Assistant')}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          <AIChatAssistant />
        </div>
      </SheetContent>
    </Sheet>
  );
}
