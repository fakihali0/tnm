import { useEffect } from 'react';
import { useNotifications } from './useNotifications';
import { useJournalStore } from '@/store/auth';
import { useRealTradingAlerts } from './useRealTradingAlerts';

export function useTradingAlerts() {
  const { addNotification, settings } = useNotifications();
  const { summary } = useJournalStore();
  const { triggerManualRiskCheck, triggerManualSync } = useRealTradingAlerts();

  useEffect(() => {
    if (!summary) return;

    // Risk alert for low win rate
    if (settings.riskAlerts && summary.winRate < 30) {
      addNotification({
        type: 'risk',
        title: 'Low Win Rate Alert',
        message: `Win rate: ${summary.winRate.toFixed(1)}%. Review your strategy.`,
        priority: 'medium'
      });
    }

    // Milestone alert for new profit record
    if (settings.milestoneAlerts && summary.netPL > 0) {
      const previousBest = localStorage.getItem('bestProfit');
      if (!previousBest || summary.netPL > parseFloat(previousBest)) {
        localStorage.setItem('bestProfit', summary.netPL.toString());
        addNotification({
          type: 'milestone',
          title: 'New Profit Record!',
          message: `Congratulations! New best profit: $${summary.netPL.toFixed(2)}`,
          priority: 'medium'
        });
      }
    }

    // Performance alert for winning streak
    const winStreak = getWinStreak();
    if (settings.performanceAlerts && winStreak >= 5) {
      addNotification({
        type: 'performance',
        title: 'Hot Streak!',
        message: `You're on a ${winStreak} trade winning streak. Great job!`,
        priority: 'low'
      });
    }
  }, [summary, settings, addNotification]);

  // Helper function to calculate win streak (simplified)
  function getWinStreak(): number {
    const trades = useJournalStore.getState().trades;
    let streak = 0;
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].pnl && trades[i].pnl! > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  return {
    triggerRiskAlert: (message: string) => {
      if (settings.riskAlerts) {
        addNotification({
          type: 'risk',
          title: 'Risk Alert',
          message,
          priority: 'high'
        });
      }
    },
    triggerMilestoneAlert: (title: string, message: string) => {
      if (settings.milestoneAlerts) {
        addNotification({
          type: 'milestone',
          title,
          message,
          priority: 'medium'
        });
      }
    },
    triggerSystemAlert: (message: string) => {
      if (settings.systemAlerts) {
        addNotification({
          type: 'system',
          title: 'System Notification',
          message,
          priority: 'low'
        });
      }
    },
    // Real trading functions
    triggerManualRiskCheck,
    triggerManualSync
  };
}