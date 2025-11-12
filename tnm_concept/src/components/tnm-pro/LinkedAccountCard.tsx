import React from 'react';
import { useTranslation } from 'react-i18next';
import { LinkedAccount } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { useRTL } from '@/hooks/useRTL';

interface LinkedAccountCardProps {
  account: LinkedAccount;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const LinkedAccountCard: React.FC<LinkedAccountCardProps> = ({
  account,
  isSelected = false,
  onSelect,
}) => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const equityChange = account.equity - account.balance;
  const equityPercentage = account.balance > 0 ? (equityChange / account.balance) * 100 : 0;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={onSelect}
      dir={rtl.dir}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t('accountCard.account', { platform: account.platform })}
          </CardTitle>
          <Badge variant={isSelected ? 'default' : 'secondary'}>
            {account.platform}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <div>{t('accountCard.labels.login')}: {account.login}</div>
          <div>{t('accountCard.labels.server')}: {account.server}</div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              {t('accountCard.labels.balance')}
            </div>
            <div className="text-xl font-semibold">
              {formatCurrency(account.balance)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              {t('accountCard.labels.equity')}
            </div>
            <div className="text-xl font-semibold flex items-center gap-2">
              {formatCurrency(account.equity)}
              {equityChange !== 0 && (
                <div className={`flex items-center text-sm ${
                  equityChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {equityChange > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {equityPercentage.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('accountCard.labels.margin')}:</span>
            <div className="font-medium">{formatCurrency(account.margin)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">{t('accountCard.labels.freeMargin')}:</span>
            <div className="font-medium">{formatCurrency(account.freeMargin)}</div>
          </div>
        </div>
        
        {account.leverage && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">{t('accountCard.labels.leverage')}:</span>
            <span className="ms-2 font-medium">1:{account.leverage}</span>
          </div>
        )}
        
        <div className="mt-3 text-xs text-muted-foreground">
          {t('accountCard.labels.connected')}: {new Date(account.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};