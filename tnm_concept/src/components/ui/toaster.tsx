import * as React from "react";

import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

type Direction = "ltr" | "rtl";

const getDocumentDirection = (): Direction => {
  if (typeof document === "undefined") {
    return "ltr";
  }

  return document.documentElement.dir === "rtl" ? "rtl" : "ltr";
};

export function Toaster() {
  const { toasts } = useToast();

  const [direction, setDirection] = React.useState<Direction>(() => getDocumentDirection());

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleDirectionChange = () => {
      setDirection(getDocumentDirection());
    };

    handleDirectionChange();

    const observer = new MutationObserver(handleDirectionChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    });

    return () => observer.disconnect();
  }, []);

  const swipeDirection = direction === "rtl" ? "left" : "right";

  return (
    <ToastProvider swipeDirection={swipeDirection}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const toastProps = {
          ...props,
          dir: props.dir ?? direction,
        };

        return (
          <Toast key={id} {...toastProps}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport dir={direction} />
    </ToastProvider>
  );
}
