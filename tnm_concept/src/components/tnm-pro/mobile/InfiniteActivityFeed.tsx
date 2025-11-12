import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  type: "trade" | "deposit" | "withdrawal" | "alert";
  symbol?: string;
  action?: "buy" | "sell";
  amount: number;
  timestamp: Date;
  profit?: number;
  status?: "pending" | "completed" | "failed";
}

interface InfiniteActivityFeedProps {
  initialItems?: ActivityItem[];
  onLoadMore?: () => Promise<ActivityItem[]>;
}

export function InfiniteActivityFeed({ 
  initialItems = [], 
  onLoadMore 
}: InfiniteActivityFeedProps) {
  const { t } = useTranslation("tnm-ai");
  const [items, setItems] = useState<ActivityItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && onLoadMore) {
          setIsLoading(true);
          try {
            const newItems = await onLoadMore();
            if (newItems.length === 0) {
              setHasMore(false);
            } else {
              setItems((prev) => [...prev, ...newItems]);
            }
          } catch (error) {
            console.error("Failed to load more items:", error);
          } finally {
            setIsLoading(false);
          }
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  const getActivityIcon = (item: ActivityItem) => {
    switch (item.type) {
      case "trade":
        return item.action === "buy" ? TrendingUp : TrendingDown;
      case "deposit":
      case "withdrawal":
        return DollarSign;
      case "alert":
        return AlertCircle;
      default:
        return DollarSign;
    }
  };

  const getActivityColor = (item: ActivityItem) => {
    if (item.type === "trade") {
      return item.action === "buy" ? "text-green-500" : "text-red-500";
    }
    if (item.type === "deposit") return "text-blue-500";
    if (item.type === "withdrawal") return "text-orange-500";
    return "text-muted-foreground";
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t("activity.timeAgo.justNow");
    if (minutes < 60) return t("activity.timeAgo.minutesAgo", { count: minutes });
    if (hours < 24) return t("activity.timeAgo.hoursAgo", { count: hours });
    return t("activity.timeAgo.daysAgo", { count: days });
  };

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t("activity.recentActivity")}
        </h2>
      </div>

      {/* Activity items */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const Icon = getActivityIcon(item);
          const colorClass = getActivityColor(item);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-xl bg-background/50 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {item.type === "trade" && (
                          <span>
                            {item.action === "buy" ? t("activity.types.bought") : t("activity.types.sold")} {item.symbol}
                          </span>
                        )}
                        {item.type === "deposit" && t("activity.types.deposit")}
                        {item.type === "withdrawal" && t("activity.types.withdrawal")}
                        {item.type === "alert" && t("activity.types.priceAlert")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatTimestamp(item.timestamp)}
                      </div>
                    </div>

                    {/* Amount/Profit */}
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        ${item.amount.toFixed(2)}
                      </div>
                      {item.profit !== undefined && (
                        <div className={`text-xs font-medium ${
                          item.profit >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          {item.profit >= 0 ? "+" : ""}${item.profit.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Intersection observer target */}
        <div ref={observerRef} className="h-4" />

        {/* End of feed */}
        {!hasMore && items.length > 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {t("emptyStates.noMoreActivity")}
          </div>
        )}
      </div>
    </div>
  );
}
